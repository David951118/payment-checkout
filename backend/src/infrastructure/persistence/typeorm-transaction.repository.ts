import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionRepositoryPort } from '../../domain/ports/transaction-repository.port';
import { TransactionOrmEntity } from './transaction.orm-entity';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepositoryPort {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repository: Repository<TransactionOrmEntity>,
  ) {}

  async save(transaction: Transaction): Promise<Transaction> {
    const row = await this.repository.save(toRow(transaction));
    return toDomain(row);
  }

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? toDomain(row) : null;
  }
}

function toRow(transaction: Transaction): TransactionOrmEntity {
  const props = transaction.toProps();
  const row = new TransactionOrmEntity();
  Object.assign(row, props);
  return row;
}

function toDomain(row: TransactionOrmEntity): Transaction {
  return new Transaction({
    id: row.id,
    reference: row.reference,
    amountInCents: row.amountInCents,
    currency: row.currency,
    status: row.status,
    productId: row.productId,
    quantity: row.quantity,
    customerEmail: row.customerEmail,
    gatewayTransactionId: row.gatewayTransactionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
