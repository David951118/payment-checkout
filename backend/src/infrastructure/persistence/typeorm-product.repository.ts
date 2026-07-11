import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../domain/entities/product.entity';
import { InsufficientStockError } from '../../domain/errors/domain.errors';
import { ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { ProductOrmEntity } from './product.orm-entity';

@Injectable()
export class TypeOrmProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.repository.find({ order: { name: 'ASC' } });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.repository.findOneBy({ id });
    return row ? toDomain(row) : null;
  }

  async decrementStock(id: string, quantity: number): Promise<void> {
    // Atomic guard: the WHERE clause prevents the stock from going negative
    // under concurrent checkouts.
    const result = await this.repository
      .createQueryBuilder()
      .update(ProductOrmEntity)
      .set({ stock: () => `stock - ${Number(quantity)}` })
      .where('id = :id AND stock >= :quantity', { id, quantity })
      .execute();

    if (!result.affected) {
      const current = await this.repository.findOneBy({ id });
      throw new InsufficientStockError(id, quantity, current?.stock ?? 0);
    }
  }
}

function toDomain(row: ProductOrmEntity): Product {
  return new Product({
    id: row.id,
    name: row.name,
    description: row.description,
    priceInCents: row.priceInCents,
    stock: row.stock,
    imageUrl: row.imageUrl,
  });
}
