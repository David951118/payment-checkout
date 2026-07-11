import { randomUUID } from 'node:crypto';

/**
 * Unique, human-recognizable transaction reference,
 * e.g. `PC-1720650000000-9f8a7b6c`.
 */
export function generateReference(now: Date = new Date()): string {
  const suffix = randomUUID().split('-')[0];
  return `PC-${now.getTime()}-${suffix}`;
}
