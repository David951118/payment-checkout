export interface Product {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  stock: number;
  imageUrl: string;
}

export type TransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'VOIDED'
  | 'ERROR';

export interface TransactionSummary {
  id: string;
  reference: string;
  amountInCents: number;
  currency: string;
  status: TransactionStatus;
  productId: string;
  quantity: number;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export type CardBrand = 'VISA' | 'MASTERCARD' | 'UNKNOWN';
