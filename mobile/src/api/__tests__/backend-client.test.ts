import {
  ApiError,
  createCheckout,
  getProducts,
  getTransaction,
} from '../backend-client';
import { ENV } from '../../config/env';

function mockFetchOnce(body: unknown, status = 200) {
  return jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

afterEach(() => jest.restoreAllMocks());

describe('backend client', () => {
  it('getProducts GETs /products', async () => {
    const spy = mockFetchOnce([{ id: 'p-1' }]);
    const products = await getProducts();
    expect(spy).toHaveBeenCalledWith(
      `${ENV.BACKEND_URL}/products`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(products).toEqual([{ id: 'p-1' }]);
  });

  it('createCheckout POSTs the payload (token, never PAN)', async () => {
    const spy = mockFetchOnce({ id: 'tx-1', status: 'APPROVED' });
    const payload = {
      productId: 'p-1',
      quantity: 1,
      customerEmail: 'a@b.co',
      cardToken: 'tok_1',
      installments: 1,
    };

    await createCheckout(payload);

    const init = spy.mock.calls[0][1]!;
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it('getTransaction GETs /transactions/:id', async () => {
    const spy = mockFetchOnce({ id: 'tx-1', status: 'PENDING' });
    const tx = await getTransaction('tx-1');
    expect(spy).toHaveBeenCalledWith(
      `${ENV.BACKEND_URL}/transactions/tx-1`,
      expect.anything(),
    );
    expect(tx.status).toBe('PENDING');
  });

  it('surfaces backend error messages with status code', async () => {
    mockFetchOnce(
      { statusCode: 409, message: 'Insufficient stock for product "p-1"' },
      409,
    );
    await expect(
      createCheckout({
        productId: 'p-1',
        quantity: 99,
        customerEmail: 'a@b.co',
        cardToken: 'tok_1',
        installments: 1,
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 409,
      message: expect.stringContaining('Insufficient stock'),
    });
  });

  it('takes the first message when validation returns an array', async () => {
    mockFetchOnce(
      { statusCode: 400, message: ['quantity must be an integer'] },
      400,
    );
    await expect(getProducts()).rejects.toThrow('quantity must be an integer');
  });

  it('handles non-JSON error bodies gracefully', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error('not json')),
    } as unknown as Response);
    await expect(getProducts()).rejects.toThrow('Error 502');
  });

  it('wraps network failures in a friendly ApiError', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('down'));
    await expect(getProducts()).rejects.toThrow(ApiError);
    await expect(getProducts()).rejects.toThrow(
      'No se pudo conectar con el servidor',
    );
  });
});
