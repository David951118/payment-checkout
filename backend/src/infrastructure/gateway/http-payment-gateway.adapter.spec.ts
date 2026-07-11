import { TransactionStatus } from '../../domain/entities/transaction.entity';
import { PaymentGatewayError } from '../../domain/errors/domain.errors';
import { computeIntegritySignature } from '../../domain/services/integrity-signature';
import { HttpPaymentGatewayAdapter } from './http-payment-gateway.adapter';

const config = {
  baseUrl: 'https://sandbox.gateway.test/v1',
  publicKey: 'pub_test_123',
  privateKey: 'prv_test_456',
  integritySecret: 'integrity_test_789',
};

function mockFetchOnce(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  return jest.spyOn(global, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('HttpPaymentGatewayAdapter', () => {
  let adapter: HttpPaymentGatewayAdapter;

  beforeEach(() => {
    adapter = new HttpPaymentGatewayAdapter(config);
    jest.restoreAllMocks();
  });

  describe('fetchAcceptanceToken', () => {
    it('GETs the merchant by public key and extracts the acceptance token', async () => {
      const fetchSpy = mockFetchOnce({
        data: { presigned_acceptance: { acceptance_token: 'acc-token-1' } },
      });

      await expect(adapter.fetchAcceptanceToken()).resolves.toBe('acc-token-1');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://sandbox.gateway.test/v1/merchants/pub_test_123',
        expect.objectContaining({ method: 'GET' }),
      );
      const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
      // Merchant lookup is public — no private key must be sent.
      expect(JSON.stringify(requestInit.headers)).not.toContain('prv_test');
    });

    it('throws when the response has no acceptance token', async () => {
      mockFetchOnce({ data: {} });
      await expect(adapter.fetchAcceptanceToken()).rejects.toThrow(
        PaymentGatewayError,
      );
    });
  });

  describe('createCardTransaction', () => {
    const request = {
      acceptanceToken: 'acc-token-1',
      amountInCents: 500000,
      currency: 'COP',
      customerEmail: 'buyer@example.com',
      reference: 'PC-1-abc',
      cardToken: 'tok_test_1',
      installments: 3,
    };

    it('POSTs the signed payload with the private key as Bearer', async () => {
      const fetchSpy = mockFetchOnce({
        data: { id: 'gw-1', status: 'PENDING' },
      });

      const result = await adapter.createCardTransaction(request);

      expect(result).toEqual({ id: 'gw-1', status: TransactionStatus.PENDING });
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://sandbox.gateway.test/v1/transactions',
        expect.objectContaining({ method: 'POST' }),
      );

      const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(requestInit.headers).toMatchObject({
        Authorization: 'Bearer prv_test_456',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(requestInit.body as string) as Record<
        string,
        unknown
      >;
      expect(body).toMatchObject({
        acceptance_token: 'acc-token-1',
        amount_in_cents: 500000,
        currency: 'COP',
        customer_email: 'buyer@example.com',
        reference: 'PC-1-abc',
        payment_method: {
          type: 'CARD',
          token: 'tok_test_1',
          installments: 3,
        },
      });
      expect(body.signature).toBe(
        computeIntegritySignature(
          'PC-1-abc',
          500000,
          'COP',
          'integrity_test_789',
        ),
      );
      // The raw card number never appears anywhere in the payload.
      expect(requestInit.body as string).not.toMatch(/\d{13,19}/);
    });

    it('wraps non-2xx responses in PaymentGatewayError', async () => {
      mockFetchOnce(
        { error: { type: 'INPUT_VALIDATION_ERROR' } },
        { status: 422 },
      );
      await expect(adapter.createCardTransaction(request)).rejects.toThrow(
        /HTTP 422/,
      );
    });

    it('wraps network failures in PaymentGatewayError', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValueOnce(new TypeError('fetch failed'));
      await expect(adapter.createCardTransaction(request)).rejects.toThrow(
        /network failure/,
      );
    });

    it('throws on a malformed transaction response', async () => {
      mockFetchOnce({ data: { id: 'gw-1' } }); // missing status
      await expect(adapter.createCardTransaction(request)).rejects.toThrow(
        /malformed/,
      );
    });
  });

  describe('fetchTransaction', () => {
    it('GETs the transaction and maps every known status', async () => {
      for (const status of [
        'PENDING',
        'APPROVED',
        'DECLINED',
        'VOIDED',
        'ERROR',
      ]) {
        mockFetchOnce({ data: { id: 'gw-1', status } });
        const result = await adapter.fetchTransaction('gw-1');
        expect(result.status).toBe(status);
      }
    });

    it('maps an unknown gateway status to ERROR', async () => {
      mockFetchOnce({ data: { id: 'gw-1', status: 'SOMETHING_NEW' } });
      const result = await adapter.fetchTransaction('gw-1');
      expect(result.status).toBe(TransactionStatus.ERROR);
    });

    it('authenticates with the private key', async () => {
      const fetchSpy = mockFetchOnce({
        data: { id: 'gw-1', status: 'APPROVED' },
      });
      await adapter.fetchTransaction('gw-1');
      const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(requestInit.headers).toMatchObject({
        Authorization: 'Bearer prv_test_456',
      });
    });
  });
});
