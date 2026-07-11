import { randomUUID } from 'node:crypto';
import {
  Transaction,
  TransactionStatus,
  isFinalStatus,
} from '../../domain/entities/transaction.entity';
import {
  InsufficientStockError,
  InvalidQuantityError,
  ProductNotFoundError,
} from '../../domain/errors/domain.errors';
import {
  GatewayTransaction,
  PaymentGatewayPort,
} from '../../domain/ports/payment-gateway.port';
import { ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { TransactionRepositoryPort } from '../../domain/ports/transaction-repository.port';
import { generateReference } from '../../domain/services/reference-generator';

export interface CreateCheckoutInput {
  productId: string;
  quantity: number;
  customerEmail: string;
  cardToken: string;
  installments: number;
}

export interface CreateCheckoutOptions {
  /** Milliseconds between gateway status polls. */
  pollIntervalMs?: number;
  /** Give up polling after this long; the transaction stays PENDING. */
  pollTimeoutMs?: number;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  idGenerator?: () => string;
}

const DEFAULTS = {
  pollIntervalMs: 1500,
  pollTimeoutMs: 60_000,
  sleep: (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
  now: () => Date.now(),
  idGenerator: () => randomUUID(),
};

/**
 * Orchestrates the full checkout flow:
 *  1. validate product & stock
 *  2. create internal PENDING transaction
 *  3. fetch gateway acceptance token
 *  4. create the gateway transaction (adapter signs the payload)
 *  5. long-poll the gateway until a final status or timeout
 *  6. persist the outcome; on APPROVED assign the product (decrement stock)
 *
 * Gateway failures are absorbed into an ERROR transaction (returned to the
 * client, not thrown) so the mobile app always receives a transaction result.
 */
export class CreateCheckoutUseCase {
  private readonly opts: Required<CreateCheckoutOptions>;

  constructor(
    private readonly productRepository: ProductRepositoryPort,
    private readonly transactionRepository: TransactionRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    options: CreateCheckoutOptions = {},
  ) {
    this.opts = { ...DEFAULTS, ...options };
  }

  async execute(input: CreateCheckoutInput): Promise<Transaction> {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new InvalidQuantityError(input.quantity);
    }

    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }
    if (!product.hasStock(input.quantity)) {
      throw new InsufficientStockError(
        product.id,
        input.quantity,
        product.stock,
      );
    }

    let transaction = Transaction.createPending({
      id: this.opts.idGenerator(),
      reference: generateReference(new Date(this.opts.now())),
      amountInCents: product.totalPriceInCents(input.quantity),
      currency: 'COP',
      productId: product.id,
      quantity: input.quantity,
      customerEmail: input.customerEmail,
    });
    transaction = await this.transactionRepository.save(transaction);

    let gatewayTransaction: GatewayTransaction;
    try {
      const acceptanceToken = await this.paymentGateway.fetchAcceptanceToken();
      gatewayTransaction = await this.paymentGateway.createCardTransaction({
        acceptanceToken,
        amountInCents: transaction.amountInCents,
        currency: transaction.currency,
        customerEmail: transaction.customerEmail,
        reference: transaction.reference,
        cardToken: input.cardToken,
        installments: input.installments,
      });
    } catch {
      transaction.transitionTo(TransactionStatus.ERROR);
      return this.transactionRepository.save(transaction);
    }

    transaction.attachGatewayTransaction(gatewayTransaction.id);
    transaction = await this.transactionRepository.save(transaction);

    const finalStatus = await this.pollUntilFinal(gatewayTransaction);

    if (finalStatus !== TransactionStatus.PENDING) {
      transaction.transitionTo(finalStatus);
      transaction = await this.transactionRepository.save(transaction);
    }

    if (transaction.status === TransactionStatus.APPROVED) {
      await this.productRepository.decrementStock(
        product.id,
        transaction.quantity,
      );
    }

    return transaction;
  }

  /**
   * Long-polls the gateway until the transaction reaches a final status.
   * On timeout, returns PENDING so the client can keep checking via
   * GET /transactions/:id. Individual poll errors are retried until timeout.
   */
  private async pollUntilFinal(
    gatewayTransaction: GatewayTransaction,
  ): Promise<TransactionStatus> {
    if (isFinalStatus(gatewayTransaction.status)) {
      return gatewayTransaction.status;
    }

    const deadline = this.opts.now() + this.opts.pollTimeoutMs;
    while (this.opts.now() < deadline) {
      await this.opts.sleep(this.opts.pollIntervalMs);
      try {
        const polled = await this.paymentGateway.fetchTransaction(
          gatewayTransaction.id,
        );
        if (isFinalStatus(polled.status)) {
          return polled.status;
        }
      } catch {
        // transient poll failure — retry until the deadline
      }
    }
    return TransactionStatus.PENDING;
  }
}
