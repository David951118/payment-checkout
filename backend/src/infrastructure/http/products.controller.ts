import { Controller, Get } from '@nestjs/common';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { toProductResponse } from './dto/responses';

@Controller('products')
export class ProductsController {
  constructor(private readonly listProducts: ListProductsUseCase) {}

  @Get()
  async findAll() {
    const products = await this.listProducts.execute();
    return products.map(toProductResponse);
  }
}
