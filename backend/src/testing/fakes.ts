import { Product, ProductProps } from '../domain/entities/product.entity';
import {
  Transaction,
  TransactionStatus,
} from '../domain/entities/transaction.entity';
import { InsufficientStockError } from '../domain/errors/domain.errors';
import {
  GatewayCardTransactionRequest,
  GatewayTransaction,
  PaymentGatewayPort,
} from '../domain/ports/payment-gateway.port';
import { ProductRepositoryPort } from '../domain/ports/product-repository.port';
import { TransactionRepositoryPort } from '../domain/ports/transaction-repository.port';

export class InMemoryProductRepository implements ProductRepositoryPort {
  private readonly products = new Map<string, Product>();
  readonly decrementCalls: Array<{ id: string; quantity: number }> = [];

  seed(...products: Product[]): void {
    for (const product of products) {
      this.products.set(product.id, product);
    }
  }

  findAll(): Promise<Product[]> {
    return Promise.resolve([...this.products.values()]);
  }

  findById(id: string): Promise<Product | null> {
    return Promise.resolve(this.products.get(id) ?? null);
  }

  decrementStock(id: string, quantity: number): Promise<void> {
    const product = this.products.get(id);
    if (!product || product.stock < quantity) {
      throw new InsufficientStockError(id, quantity, product?.stock ?? 0);
    }
    this.decrementCalls.push({ id, quantity });
    this.products.set(
      id,
      new Product({
        id: product.id,
        name: product.name,
        description: product.description,
        priceInCents: product.priceInCents,
        stock: product.stock - quantity,
        imageUrl: product.imageUrl,
      }),
    );
    return Promise.resolve();
  }
}

export class InMemoryTransactionRepository implements TransactionRepositoryPort {
  private readonly transactions = new Map<string, Transaction>();
  saveCount = 0;

  save(transaction: Transaction): Promise<Transaction> {
    this.saveCount += 1;
    const stored = new Transaction(transaction.toProps());
    this.transactions.set(stored.id, stored);
    return Promise.resolve(stored);
  }

  findById(id: string): Promise<Transaction | null> {
    const stored = this.transactions.get(id);
    return Promise.resolve(stored ? new Transaction(stored.toProps()) : null);
  }
}

interface FakeGatewayBehavior {
  createStatus?: TransactionStatus;
  /** Statuses returned by successive fetchTransaction calls (last one repeats). */
  pollStatuses?: TransactionStatus[];
  failCreate?: boolean;
  failAcceptanceToken?: boolean;
  /** Number of leading fetchTransaction calls that throw before succeeding. */
  failPollsBeforeSuccess?: number;
}

export class FakePaymentGateway implements PaymentGatewayPort {
  readonly createRequests: GatewayCardTransactionRequest[] = [];
  fetchCount = 0;

  constructor(private readonly behavior: FakeGatewayBehavior = {}) {}

  fetchAcceptanceToken(): Promise<string> {
    if (this.behavior.failAcceptanceToken) {
      return Promise.reject(new Error('acceptance token unavailable'));
    }
    return Promise.resolve('acceptance-token-123');
  }

  createCardTransaction(
    request: GatewayCardTransactionRequest,
  ): Promise<GatewayTransaction> {
    if (this.behavior.failCreate) {
      return Promise.reject(new Error('gateway create failed'));
    }
    this.createRequests.push(request);
    return Promise.resolve({
      id: 'gw-tx-1',
      status: this.behavior.createStatus ?? TransactionStatus.PENDING,
    });
  }

  fetchTransaction(gatewayTransactionId: string): Promise<GatewayTransaction> {
    this.fetchCount += 1;
    const failing = this.behavior.failPollsBeforeSuccess ?? 0;
    if (this.fetchCount <= failing) {
      return Promise.reject(new Error('gateway poll failed'));
    }
    const statuses = this.behavior.pollStatuses ?? [TransactionStatus.PENDING];
    const index = Math.min(this.fetchCount - failing, statuses.length) - 1;
    return Promise.resolve({
      id: gatewayTransactionId,
      status: statuses[index],
    });
  }
}

export const makeProduct = (overrides: Partial<ProductProps> = {}): Product =>
  new Product({
    id: 'p-1',
    name: 'Sneakers',
    description: 'Classic white sneakers',
    priceInCents: 250000,
    stock: 10,
    imageUrl: 'https://example.com/sneakers.jpg',
    ...overrides,
  });
