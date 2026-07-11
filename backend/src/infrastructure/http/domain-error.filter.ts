import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainError,
  InsufficientStockError,
  InvalidQuantityError,
  PaymentGatewayError,
  ProductNotFoundError,
  TransactionNotFoundError,
} from '../../domain/errors/domain.errors';

const STATUS_BY_ERROR: Array<[new (...args: never[]) => DomainError, number]> =
  [
    [ProductNotFoundError, HttpStatus.NOT_FOUND],
    [TransactionNotFoundError, HttpStatus.NOT_FOUND],
    [InsufficientStockError, HttpStatus.CONFLICT],
    [InvalidQuantityError, HttpStatus.BAD_REQUEST],
    [PaymentGatewayError, HttpStatus.BAD_GATEWAY],
  ];

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      STATUS_BY_ERROR.find(([type]) => exception instanceof type)?.[1] ??
      HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }
}
