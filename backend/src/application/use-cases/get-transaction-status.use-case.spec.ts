import {
  Transaction,
  TransactionStatus,
} from '../../domain/entities/transaction.entity';
import { TransactionNotFoundError } from '../../domain/errors/domain.errors';
import {
  FakePaymentGateway,
  InMemoryTransactionRepository,
} from '../../testing/fakes';
import { GetTransactionStatusUseCase } from './get-transaction-status.use-case';

function makeTransaction(
  status: TransactionStatus,
  gatewayTransactionId: string | null = 'gw-tx-1',
): Transaction {
  return new Transaction({
    id: 'tx-1',
    reference: 'PC-1-abc',
    amountInCents: 250000,
    currency: 'COP',
    status,
    productId: 'p-1',
    quantity: 1,
    customerEmail: 'buyer@example.com',
    gatewayTransactionId,
    createdAt: new Date('2026-07-10T10:00:00Z'),
    updatedAt: new Date('2026-07-10T10:00:00Z'),
  });
}

describe('GetTransactionStatusUseCase', () => {
  it('throws when the transaction does not exist', async () => {
    const useCase = new GetTransactionStatusUseCase(
      new InMemoryTransactionRepository(),
      new FakePaymentGateway(),
    );
    await expect(useCase.execute('missing')).rejects.toThrow(
      TransactionNotFoundError,
    );
  });

  it('returns a final transaction without querying the gateway', async () => {
    const repo = new InMemoryTransactionRepository();
    await repo.save(makeTransaction(TransactionStatus.APPROVED));
    const gateway = new FakePaymentGateway();
    const useCase = new GetTransactionStatusUseCase(repo, gateway);

    const result = await useCase.execute('tx-1');

    expect(result.status).toBe(TransactionStatus.APPROVED);
    expect(gateway.fetchCount).toBe(0);
  });

  it('returns a PENDING transaction without gateway id as-is', async () => {
    const repo = new InMemoryTransactionRepository();
    await repo.save(makeTransaction(TransactionStatus.PENDING, null));
    const gateway = new FakePaymentGateway();
    const useCase = new GetTransactionStatusUseCase(repo, gateway);

    const result = await useCase.execute('tx-1');

    expect(result.status).toBe(TransactionStatus.PENDING);
    expect(gateway.fetchCount).toBe(0);
  });

  it('refreshes a PENDING transaction whose gateway status became final', async () => {
    const repo = new InMemoryTransactionRepository();
    await repo.save(makeTransaction(TransactionStatus.PENDING));
    const gateway = new FakePaymentGateway({
      pollStatuses: [TransactionStatus.APPROVED],
    });
    const useCase = new GetTransactionStatusUseCase(repo, gateway);

    const result = await useCase.execute('tx-1');

    expect(result.status).toBe(TransactionStatus.APPROVED);
    expect((await repo.findById('tx-1'))?.status).toBe(
      TransactionStatus.APPROVED,
    );
  });

  it('keeps PENDING when the gateway still reports a non-final status', async () => {
    const repo = new InMemoryTransactionRepository();
    await repo.save(makeTransaction(TransactionStatus.PENDING));
    const gateway = new FakePaymentGateway({
      pollStatuses: [TransactionStatus.PENDING],
    });
    const useCase = new GetTransactionStatusUseCase(repo, gateway);

    const result = await useCase.execute('tx-1');

    expect(result.status).toBe(TransactionStatus.PENDING);
    expect((await repo.findById('tx-1'))?.status).toBe(
      TransactionStatus.PENDING,
    );
  });

  it('returns the stored state when the gateway query fails', async () => {
    const repo = new InMemoryTransactionRepository();
    await repo.save(makeTransaction(TransactionStatus.PENDING));
    const gateway = new FakePaymentGateway({ failPollsBeforeSuccess: 99 });
    const useCase = new GetTransactionStatusUseCase(repo, gateway);

    const result = await useCase.execute('tx-1');

    expect(result.status).toBe(TransactionStatus.PENDING);
  });
});
