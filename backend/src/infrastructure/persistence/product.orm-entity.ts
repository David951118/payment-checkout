import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class ProductOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'int' })
  priceInCents!: number;

  @Column({ type: 'int' })
  stock!: number;

  @Column()
  imageUrl!: string;
}
