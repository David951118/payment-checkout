export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super(`Product "${productId}" was not found`);
  }
}

export class InsufficientStockError extends DomainError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product "${productId}": requested ${requested}, available ${available}`,
    );
  }
}

export class InvalidQuantityError extends DomainError {
  constructor(quantity: number) {
    super(`Quantity must be a positive integer, got ${quantity}`);
  }
}

export class TransactionNotFoundError extends DomainError {
  constructor(transactionId: string) {
    super(`Transaction "${transactionId}" was not found`);
  }
}

export class PaymentGatewayError extends DomainError {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(`Payment gateway error: ${message}`);
  }
}
