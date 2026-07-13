import { ENV } from '../config/env';

export class TokenizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenizationError';
  }
}

export interface CardInput {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

interface TokenResponse {
  data?: { id?: string };
  error?: { messages?: Record<string, string[]> };
}

/**
 * Tokenizes the card directly against the gateway using the PUBLIC key.
 * The resulting token is the only card artifact that ever reaches our
 * backend or the persisted state — never the PAN.
 */
export async function tokenizeCard(card: CardInput): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${ENV.GATEWAY_BASE_URL.replace(/\/+$/, '')}/tokens/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ENV.GATEWAY_PUBLIC_KEY}`,
      },
      body: JSON.stringify({
        number: card.number.replace(/\s/g, ''),
        cvc: card.cvc,
        exp_month: card.expMonth,
        exp_year: card.expYear,
        card_holder: card.cardHolder,
      }),
    });
  } catch {
    throw new TokenizationError('No se pudo conectar con la pasarela');
  }

  const body = (await response.json().catch(() => null)) as TokenResponse | null;

  if (!response.ok || !body?.data?.id) {
    const firstMessage = body?.error?.messages
      ? Object.values(body.error.messages)[0]?.[0]
      : undefined;
    throw new TokenizationError(
      firstMessage ?? 'La tarjeta no pudo ser validada',
    );
  }
  return body.data.id;
}
