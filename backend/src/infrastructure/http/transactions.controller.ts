import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { GetTransactionStatusUseCase } from '../../application/use-cases/get-transaction-status.use-case';
import { toTransactionResponse } from './dto/responses';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly getTransactionStatus: GetTransactionStatusUseCase,
  ) {}

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const transaction = await this.getTransactionStatus.execute(id);
    return toTransactionResponse(transaction);
  }
}
