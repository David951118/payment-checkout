import type { CardBrand } from '../domain/types';

/**
 * Detects the card franchise from the BIN.
 * VISA: leading 4. MasterCard: 51-55 or the 2221-2720 range.
 */
export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/[\s-]/g, '');
  if (/^4/.test(digits)) {
    return 'VISA';
  }
  if (/^5[1-5]/.test(digits)) {
    return 'MASTERCARD';
  }
  const firstFour = Number(digits.slice(0, 4));
  if (digits.length >= 4 && firstFour >= 2221 && firstFour <= 2720) {
    return 'MASTERCARD';
  }
  return 'UNKNOWN';
}

/** "4242424242424242" -> "4242 4242 4242 4242" (input formatting). */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

/** "1229" or "12/29" -> "12/29" (input formatting). */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export interface Expiry {
  month: string;
  year: string;
}

/**
 * Parses "MM/YY" and validates it is a real month not in the past.
 * `now` is injectable for tests.
 */
export function parseExpiry(value: string, now: Date = new Date()): Expiry | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const [, month, year] = match;
  const monthNumber = Number(month);
  if (monthNumber < 1 || monthNumber > 12) {
    return null;
  }
  const expires = new Date(2000 + Number(year), monthNumber, 1); // first day after expiry month
  if (expires <= now) {
    return null;
  }
  return { month, year };
}

export function lastFour(cardNumber: string): string {
  return cardNumber.replace(/\D/g, '').slice(-4);
}
