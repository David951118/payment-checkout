import { Product } from '../../../domain/entities/product.entity';
import { Transaction } from '../../../domain/entities/transaction.entity';

export function toProductResponse(product: Product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceInCents: product.priceInCents,
    stock: product.stock,
    imageUrl: product.imageUrl,
  };
}

export function toTransactionResponse(transaction: Transaction) {
  const props = transaction.toProps();
  return {
    id: props.id,
    reference: props.reference,
    amountInCents: props.amountInCents,
    currency: props.currency,
    status: props.status,
    productId: props.productId,
    quantity: props.quantity,
    customerEmail: props.customerEmail,
    createdAt: props.createdAt.toISOString(),
    updatedAt: props.updatedAt.toISOString(),
  };
}
