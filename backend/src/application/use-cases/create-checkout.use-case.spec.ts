import { TransactionStatus } from '../../domain/entities/transaction.entity';
import {
  InsufficientStockError,
  InvalidQuantityError,
  ProductNotFoundError,
} from '../../domain/errors/domain.errors';
import {
  FakePaymentGateway,
  InMemoryProductRepository,
  InMemoryTransactionRepository,
  makeProduct,
} from '../../testing/fakes';
import {
  CreateCheckoutInput,
  CreateCheckoutUseCase,
} from './create-checkout.use-case';

const baseInput: CreateCheckoutInput = {
  productId: 'p-1',
  quantity: 2,
  customerEmail: 'buyer@example.com',
  cardToken: 'tok_test_123',
  installments: 3,
};

function makeSut(gateway: FakePaymentGateway) {
  const products = new InMemoryProductRepository();
  products.seed(makeProduct({ stock: 10 }));
  const transactions = new InMemoryTransactionRepository();

  // Deterministic clock: each now() call advances 1s so the polling
  // deadline (10s) is hit after a bounded number of iterations.
  let clock = 0;
  const useCase = new CreateCheckoutUseCase(products, transactions, gateway, {
    pollIntervalMs: 1,
    pollTimeoutMs: 10_000,
    sleep: () => Promise.resolve(),
    now: () => (clock += 1000),
    idGenerator: () => 'tx-fixed-id',
  });
  return { useCase, products, transactions };
}

describe('CreateCheckoutUseCase', () => {
  it('approves the happy path: creates, polls until APPROVED and decrements stock', async () => {
    const gateway = new FakePaymentGateway({
      pollStatuses: [TransactionStatus.PENDING, TransactionStatus.APPROVED],
    });
    const { useCase, products, transactions } = makeSut(gateway);

    const result = await useCase.execute(baseInput);

    expect(result.status).toBe(TransactionStatus.APPROVED);
    expect(result.gatewayTransactionId).toBe('gw-tx-1');
    expect(result.amountInCents).toBe(500000); // 250000 × 2
    expect(result.currency).toBe('COP');
    expect(result.reference).toMatch(/^PC-\d+-[0-9a-f]{8}$/);

    const stored = await transactions.findById(result.id);
    expect(stored?.status).toBe(TransactionStatus.APPROVED);
    expect((await products.findById('p-1'))?.stock).toBe(8);
    expect(products.decrementCalls).toEqual([{ id: 'p-1', quantity: 2 }]);
  });

  it('sends the card token and installments to the gateway, never a PAN', async () => {
    const gateway = new FakePaymentGateway({
      createStatus: TransactionStatus.APPROVED,
    });
    const { useCase } = makeSut(gateway);

    await useCase.execute(baseInput);

    expect(gateway.createRequests).toHaveLength(1);
    expect(gateway.createRequests[0]).toMatchObject({
      acceptanceToken: 'acceptance-token-123',
      amountInCents: 500000,
      currency: 'COP',
      customerEmail: 'buyer@example.com',
      cardToken: 'tok_test_123',
      installments: 3,
    });
  });

  it('marks DECLINED without touching stock', async () => {
    const gateway = new FakePaymentGateway({
      pollStatuses: [TransactionStatus.DECLINED],
    });
    const { useCase, products } = makeSut(gateway);

    const result = await useCase.execute(baseInput);

    expect(result.status).toBe(TransactionStatus.DECLINED);
    expect((await products.findById('p-1'))?.stock).toBe(10);
    expect(products.decrementCalls).toHaveLength(0);
  });

  it('uses the create response status when it is already final (no polling)', async () => {
    const gateway = new FakePaymentGateway({
      createStatus: TransactionStatus.APPROVED,
    });
    const { useCase } = makeSut(gateway);

    const result = await useCase.execute(baseInput);

    expect(result.status).toBe(TransactionStatus.APPROVED);
    expect(gateway.fetchCount).toBe(0);
  });

  it('returns an ERROR transaction when the gateway create fails', async () => {
    const gateway = new FakePaymentGateway({ failCreate: true });
    const { useCase, products, transactions } = makeSut(gateway);

    const result = await useCase.execute(baseInput);

    expect(result.status).toBe(TransactionStatus.ERROR);
    expect(result.gatewayTransactionId).toBeNull();
    expect((await transactions.findById(result.id))?.status).toBe(
      TransactionStatus.ERROR,
    );
    expect(products.decrementCalls).toHaveLength(0);
  });

  it('returns an ERROR transaction when the acceptance token fetch fails', async () => {
    const gateway = new FakePaymentGateway({ failAcceptanceToken: true });
    const { useCase } = makeSut(gateway);

    const result = await useCase.execute(baseInput);

    expect(result.status).toBe(TransactionStatus.ERROR);
  });

  it('leaves the transaction PENDING when polling times out', async () => {
    const gateway = new FakePaymentGateway({
      pollStatuses: [TransactionStatus.PENDING],
    });
    const { useCase, products, transactions } = makeSut(gateway);

    const result = await useCase.execute(baseInput);

    expect(result.status).toBe(TransactionStatus.PENDING);
    expect(result.gatewayTransactionId).toBe('gw-tx-1');
    expect(gateway.fetchCount).toBeGreaterThan(0);
    expect((await transactions.findById(result.id))?.status).toBe(
      TransactionStatus.PENDING,
    );
    expect(products.decrementCalls).toHaveLength(0);
  });

  it('retries transient poll failures until a final status arrives', async () => {
    const gateway = new FakePaymentGateway({
      failPollsBeforeSuccess: 2,
      pollStatuses: [TransactionStatus.APPROVED],
    });
    const { useCase } = makeSut(gateway);

    const result = await useCase.execute(baseInput);

    expect(result.status).toBe(TransactionStatus.APPROVED);
    expect(gateway.fetchCount).toBe(3);
  });

  it('rejects an unknown product', async () => {
    const gateway = new FakePaymentGateway();
    const { useCase } = makeSut(gateway);

    await expect(
      useCase.execute({ ...baseInput, productId: 'missing' }),
    ).rejects.toThrow(ProductNotFoundError);
    expect(gateway.createRequests).toHaveLength(0);
  });

  it('rejects when there is not enough stock', async () => {
    const gateway = new FakePaymentGateway();
    const { useCase } = makeSut(gateway);

    await expect(
      useCase.execute({ ...baseInput, quantity: 11 }),
    ).rejects.toThrow(InsufficientStockError);
    expect(gateway.createRequests).toHaveLength(0);
  });

  it.each([0, -1, 1.5])('rejects invalid quantity %p', async (quantity) => {
    const gateway = new FakePaymentGateway();
    const { useCase } = makeSut(gateway);

    await expect(useCase.execute({ ...baseInput, quantity })).rejects.toThrow(
      InvalidQuantityError,
    );
  });
});
