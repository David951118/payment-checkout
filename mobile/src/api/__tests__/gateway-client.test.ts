import { TokenizationError, tokenizeCard } from '../gateway-client';
import { ENV } from '../../config/env';

const card = {
  number: '4242 4242 4242 4242',
  cvc: '123',
  expMonth: '12',
  expYear: '29',
  cardHolder: 'JOHN DOE',
};

function mockFetchOnce(body: unknown, status = 201) {
  return jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

afterEach(() => jest.restoreAllMocks());

describe('tokenizeCard', () => {
  it('POSTs the card with the PUBLIC key and returns the token', async () => {
    const spy = mockFetchOnce({ data: { id: 'tok_stagtest_99' } });

    const token = await tokenizeCard(card);

    expect(token).toBe('tok_stagtest_99');
    expect(spy).toHaveBeenCalledWith(
      `${ENV.GATEWAY_BASE_URL}/tokens/cards`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${ENV.GATEWAY_PUBLIC_KEY}`,
        }),
      }),
    );
    const body = JSON.parse(spy.mock.calls[0][1]!.body as string);
    expect(body).toEqual({
      number: '4242424242424242', // spaces stripped
      cvc: '123',
      exp_month: '12',
      exp_year: '29',
      card_holder: 'JOHN DOE',
    });
  });

  it('surfaces the first gateway validation message', async () => {
    mockFetchOnce(
      { error: { messages: { number: ['Número inválido'] } } },
      422,
    );
    await expect(tokenizeCard(card)).rejects.toThrow('Número inválido');
  });

  it('falls back to a generic message on unexpected payloads', async () => {
    mockFetchOnce({}, 500);
    await expect(tokenizeCard(card)).rejects.toThrow(
      'La tarjeta no pudo ser validada',
    );
  });

  it('wraps network failures', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('down'));
    await expect(tokenizeCard(card)).rejects.toThrow(TokenizationError);
  });
});
