import { TransactionStatus } from '../entities/transaction.entity';

export const PAYMENT_GATEWAY = Symbol('PaymentGatewayPort');

export interface GatewayCardTransactionRequest {
  acceptanceToken: string;
  amountInCents: number;
  currency: string;
  customerEmail: string;
  reference: string;
  cardToken: string;
  installments: number;
}

export interface GatewayTransaction {
  id: string;
  status: TransactionStatus;
}

/**
 * Port to the external payment gateway. The adapter owns the gateway
 * credentials (private key, integrity secret) and computes the integrity
 * signature itself — secrets never cross into the application layer.
 */
export interface PaymentGatewayPort {
  fetchAcceptanceToken(): Promise<string>;
  createCardTransaction(
    request: GatewayCardTransactionRequest,
  ): Promise<GatewayTransaction>;
  fetchTransaction(gatewayTransactionId: string): Promise<GatewayTransaction>;
}
