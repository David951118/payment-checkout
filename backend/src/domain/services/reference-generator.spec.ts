import { generateReference } from './reference-generator';

describe('generateReference', () => {
  it('embeds the timestamp and a random suffix with the PC- prefix', () => {
    const now = new Date(1720650000000);
    expect(generateReference(now)).toMatch(/^PC-1720650000000-[0-9a-f]{8}$/);
  });

  it('generates unique references', () => {
    const references = new Set(
      Array.from({ length: 200 }, () => generateReference()),
    );
    expect(references.size).toBe(200);
  });
});
