import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { TransactionStatus } from '../../domain/entities/transaction.entity';

@Entity('transactions')
export class TransactionOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column()
  reference!: string;

  @Column({ type: 'int' })
  amountInCents!: number;

  @Column({ length: 3 })
  currency!: string;

  @Column({ type: 'varchar', length: 16 })
  status!: TransactionStatus;

  @Column()
  productId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column()
  customerEmail!: string;

  @Column({ type: 'varchar', nullable: true })
  gatewayTransactionId!: string | null;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;
}
