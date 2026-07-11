import { Product } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = Symbol('ProductRepositoryPort');

export interface ProductRepositoryPort {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  /**
   * Atomically decrements stock. Implementations must guarantee the stock
   * never goes below zero (e.g. `UPDATE ... WHERE stock >= quantity`) and
   * throw InsufficientStockError when the guard fails.
   */
  decrementStock(id: string, quantity: number): Promise<void>;
}
