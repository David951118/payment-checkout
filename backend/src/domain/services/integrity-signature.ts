import { createHash } from 'node:crypto';

/**
 * Integrity signature required by the gateway when creating a transaction:
 * SHA256(reference + amountInCents + currency + integritySecret)
 * — concatenated with no separators, in that exact order.
 */
export function computeIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
): string {
  const payload = `${reference}${amountInCents}${currency}${integritySecret}`;
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
