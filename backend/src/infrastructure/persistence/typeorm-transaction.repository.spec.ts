import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionStatus,
} from '../../domain/entities/transaction.entity';
import { TransactionOrmEntity } from './transaction.orm-entity';
import { TypeOrmTransactionRepository } from './typeorm-transaction.repository';

const domainTx = Transaction.createPending({
  id: 'tx-1',
  reference: 'PC-1-abc',
  amountInCents: 250000,
  currency: 'COP',
  productId: 'p-1',
  quantity: 1,
  customerEmail: 'buyer@example.com',
  now: new Date('2026-07-10T10:00:00Z'),
});

describe('TypeOrmTransactionRepository', () => {
  it('save persists the row and returns the mapped domain transaction', async () => {
    const ormRepo = {
      save: jest
        .fn()
        .mockImplementation((r: TransactionOrmEntity) => Promise.resolve(r)),
    } as unknown as Repository<TransactionOrmEntity>;
    const sut = new TypeOrmTransactionRepository(ormRepo);

    const saved = await sut.save(domainTx);

    expect(ormRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tx-1',
        reference: 'PC-1-abc',
        status: TransactionStatus.PENDING,
        gatewayTransactionId: null,
      }),
    );
    expect(saved).toBeInstanceOf(Transaction);
    expect(saved.toProps()).toEqual(domainTx.toProps());
  });

  it('findById maps the stored row back to the domain', async () => {
    const ormRepo = {
      findOneBy: jest.fn().mockResolvedValue({
        ...domainTx.toProps(),
        status: TransactionStatus.APPROVED,
        gatewayTransactionId: 'gw-9',
      }),
    } as unknown as Repository<TransactionOrmEntity>;
    const sut = new TypeOrmTransactionRepository(ormRepo);

    const found = await sut.findById('tx-1');

    expect(found?.status).toBe(TransactionStatus.APPROVED);
    expect(found?.gatewayTransactionId).toBe('gw-9');
  });

  it('findById returns null when missing', async () => {
    const ormRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
    } as unknown as Repository<TransactionOrmEntity>;
    const sut = new TypeOrmTransactionRepository(ormRepo);
    await expect(sut.findById('missing')).resolves.toBeNull();
  });
});
