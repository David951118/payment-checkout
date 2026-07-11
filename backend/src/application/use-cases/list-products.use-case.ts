import { Product } from '../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../../domain/ports/product-repository.port';

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepositoryPort) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}
