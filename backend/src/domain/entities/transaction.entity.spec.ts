import {
  Transaction,
  TransactionStatus,
  isFinalStatus,
} from './transaction.entity';

const makePending = () =>
  Transaction.createPending({
    id: 'tx-1',
    reference: 'PC-1-abc',
    amountInCents: 250000,
    currency: 'COP',
    productId: 'p-1',
    quantity: 1,
    customerEmail: 'buyer@example.com',
    now: new Date('2026-07-10T10:00:00Z'),
  });

describe('isFinalStatus', () => {
  it.each([
    [TransactionStatus.PENDING, false],
    [TransactionStatus.APPROVED, true],
    [TransactionStatus.DECLINED, true],
    [TransactionStatus.VOIDED, true],
    [TransactionStatus.ERROR, true],
  ])('%s → %s', (status, expected) => {
    expect(isFinalStatus(status)).toBe(expected);
  });
});

describe('Transaction', () => {
  it('createPending starts PENDING without a gateway id', () => {
    const tx = makePending();
    expect(tx.status).toBe(TransactionStatus.PENDING);
    expect(tx.gatewayTransactionId).toBeNull();
    expect(tx.isFinal()).toBe(false);
    expect(tx.createdAt).toEqual(new Date('2026-07-10T10:00:00Z'));
    expect(tx.updatedAt).toEqual(tx.createdAt);
  });

  it('attaches the gateway transaction and touches updatedAt', () => {
    const tx = makePending();
    tx.attachGatewayTransaction('gw-99', new Date('2026-07-10T10:01:00Z'));
    expect(tx.gatewayTransactionId).toBe('gw-99');
    expect(tx.updatedAt).toEqual(new Date('2026-07-10T10:01:00Z'));
  });

  it('transitions status and becomes final', () => {
    const tx = makePending();
    tx.transitionTo(
      TransactionStatus.APPROVED,
      new Date('2026-07-10T10:02:00Z'),
    );
    expect(tx.status).toBe(TransactionStatus.APPROVED);
    expect(tx.isFinal()).toBe(true);
    expect(tx.updatedAt).toEqual(new Date('2026-07-10T10:02:00Z'));
  });

  it('round-trips through toProps', () => {
    const tx = makePending();
    tx.attachGatewayTransaction('gw-1');
    const clone = new Transaction(tx.toProps());
    expect(clone.toProps()).toEqual(tx.toProps());
  });
});
