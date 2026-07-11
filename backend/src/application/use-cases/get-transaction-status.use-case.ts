import {
  Transaction,
  isFinalStatus,
} from '../../domain/entities/transaction.entity';
import { TransactionNotFoundError } from '../../domain/errors/domain.errors';
import { PaymentGatewayPort } from '../../domain/ports/payment-gateway.port';
import { TransactionRepositoryPort } from '../../domain/ports/transaction-repository.port';

/**
 * Returns the stored transaction. If it is still PENDING but was already
 * created at the gateway, refreshes the status with a single gateway query
 * (covers checkouts whose long polling timed out).
 */
export class GetTransactionStatusUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(transactionId: string): Promise<Transaction> {
    const transaction =
      await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new TransactionNotFoundError(transactionId);
    }

    if (transaction.isFinal() || !transaction.gatewayTransactionId) {
      return transaction;
    }

    try {
      const gatewayTransaction = await this.paymentGateway.fetchTransaction(
        transaction.gatewayTransactionId,
      );
      if (isFinalStatus(gatewayTransaction.status)) {
        transaction.transitionTo(gatewayTransaction.status);
        return this.transactionRepository.save(transaction);
      }
    } catch {
      // gateway unavailable — return the stored (PENDING) state
    }
    return transaction;
  }
}
