import { Body, Controller, Post } from '@nestjs/common';
import { CreateCheckoutUseCase } from '../../application/use-cases/create-checkout.use-case';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { toTransactionResponse } from './dto/responses';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly createCheckout: CreateCheckoutUseCase) {}

  @Post()
  async create(@Body() dto: CreateCheckoutDto) {
    const transaction = await this.createCheckout.execute({
      productId: dto.productId,
      quantity: dto.quantity,
      customerEmail: dto.customerEmail,
      cardToken: dto.cardToken,
      installments: dto.installments,
    });
    return toTransactionResponse(transaction);
  }
}
