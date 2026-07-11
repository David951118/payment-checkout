import { Transaction } from '../entities/transaction.entity';

export const TRANSACTION_REPOSITORY = Symbol('TransactionRepositoryPort');

export interface TransactionRepositoryPort {
  /** Inserts or updates (by id) and returns the persisted transaction. */
  save(transaction: Transaction): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
}
