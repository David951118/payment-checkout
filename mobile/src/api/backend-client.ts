import { ENV } from '../config/env';
import type { Product, TransactionSummary } from '../domain/types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface CheckoutRequest {
  productId: string;
  quantity: number;
  customerEmail: string;
  cardToken: string;
  installments: number;
}

// Tolerate a trailing slash in the configured URL: `base//products`
// would 404 on the server's router.
const BASE_URL = ENV.BACKEND_URL.replace(/\/+$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor');
  }

  const body = (await response.json().catch(() => null)) as
    | (T & { message?: string | string[] })
    | null;

  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body?.message[0]
      : body?.message;
    throw new ApiError(message ?? `Error ${response.status}`, response.status);
  }
  if (body === null) {
    throw new ApiError('Respuesta inválida del servidor');
  }
  return body;
}

export function getProducts(): Promise<Product[]> {
  return request<Product[]>('/products');
}

export function createCheckout(
  payload: CheckoutRequest,
): Promise<TransactionSummary> {
  return request<TransactionSummary>('/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getTransaction(id: string): Promise<TransactionSummary> {
  return request<TransactionSummary>(`/transactions/${id}`);
}
