import { Inject, Injectable } from '@nestjs/common';
import { TransactionStatus } from '../../domain/entities/transaction.entity';
import { PaymentGatewayError } from '../../domain/errors/domain.errors';
import {
  GatewayCardTransactionRequest,
  GatewayTransaction,
  PaymentGatewayPort,
} from '../../domain/ports/payment-gateway.port';
import { computeIntegritySignature } from '../../domain/services/integrity-signature';
import { GATEWAY_CONFIG } from './gateway.config';
import type { GatewayConfig } from './gateway.config';

interface MerchantResponse {
  data: {
    presigned_acceptance: { acceptance_token: string };
  };
}

interface GatewayTransactionResponse {
  data: {
    id: string;
    status: string;
  };
}

/**
 * HTTP adapter to the payment gateway. Owns the gateway credentials and
 * computes the integrity signature — secrets never leave this layer.
 */
@Injectable()
export class HttpPaymentGatewayAdapter implements PaymentGatewayPort {
  constructor(@Inject(GATEWAY_CONFIG) private readonly config: GatewayConfig) {}

  async fetchAcceptanceToken(): Promise<string> {
    const body = await this.request<MerchantResponse>(
      `/merchants/${this.config.publicKey}`,
    );
    const token = body.data?.presigned_acceptance?.acceptance_token;
    if (!token) {
      throw new PaymentGatewayError(
        'merchant response missing acceptance token',
      );
    }
    return token;
  }

  async createCardTransaction(
    request: GatewayCardTransactionRequest,
  ): Promise<GatewayTransaction> {
    const signature = computeIntegritySignature(
      request.reference,
      request.amountInCents,
      request.currency,
      this.config.integritySecret,
    );

    const body = await this.request<GatewayTransactionResponse>(
      '/transactions',
      {
        method: 'POST',
        auth: this.config.privateKey,
        payload: {
          acceptance_token: request.acceptanceToken,
          amount_in_cents: request.amountInCents,
          currency: request.currency,
          customer_email: request.customerEmail,
          reference: request.reference,
          signature,
          payment_method: {
            type: 'CARD',
            token: request.cardToken,
            installments: request.installments,
          },
        },
      },
    );
    return this.toGatewayTransaction(body);
  }

  async fetchTransaction(
    gatewayTransactionId: string,
  ): Promise<GatewayTransaction> {
    const body = await this.request<GatewayTransactionResponse>(
      `/transactions/${gatewayTransactionId}`,
      { auth: this.config.privateKey },
    );
    return this.toGatewayTransaction(body);
  }

  private toGatewayTransaction(
    body: GatewayTransactionResponse,
  ): GatewayTransaction {
    const { id, status } = body.data ?? {};
    if (!id || !status) {
      throw new PaymentGatewayError('malformed transaction response');
    }
    return { id, status: mapStatus(status) };
  }

  private async request<T>(
    path: string,
    options: { method?: string; auth?: string; payload?: unknown } = {},
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.auth ? { Authorization: `Bearer ${options.auth}` } : {}),
        },
        body: options.payload ? JSON.stringify(options.payload) : undefined,
      });
    } catch (cause) {
      throw new PaymentGatewayError(`network failure calling ${path}`, cause);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new PaymentGatewayError(
        `HTTP ${response.status} calling ${path}: ${detail.slice(0, 300)}`,
      );
    }
    return (await response.json()) as T;
  }
}

function mapStatus(status: string): TransactionStatus {
  switch (status) {
    case 'APPROVED':
      return TransactionStatus.APPROVED;
    case 'DECLINED':
      return TransactionStatus.DECLINED;
    case 'VOIDED':
      return TransactionStatus.VOIDED;
    case 'ERROR':
      return TransactionStatus.ERROR;
    case 'PENDING':
      return TransactionStatus.PENDING;
    default:
      return TransactionStatus.ERROR;
  }
}
