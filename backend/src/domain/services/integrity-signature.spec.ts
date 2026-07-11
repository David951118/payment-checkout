import { computeIntegritySignature } from './integrity-signature';

describe('computeIntegritySignature', () => {
  it('matches SHA256(reference + amountInCents + currency + secret), no separators', () => {
    // Pre-computed: sha256("ref-123450000COPtest_secret")
    expect(
      computeIntegritySignature('ref-123', 450000, 'COP', 'test_secret'),
    ).toBe('b9e2c8f50ea8acc8ac24fe98bedc7a9b9af4296299affab5d647b85f613a627d');
  });

  it('matches a second known vector', () => {
    // Pre-computed: sha256("sk8-438_example2490000COPprod_integrity_example")
    expect(
      computeIntegritySignature(
        'sk8-438_example',
        2490000,
        'COP',
        'prod_integrity_example',
      ),
    ).toBe('9db6937fde01a06aa56b63d9957fc1352cb6a8328eebf06244ce3d59c87d981a');
  });

  it('produces 64-char lowercase hex and changes with any input', () => {
    const base = computeIntegritySignature('r', 1, 'COP', 's');
    expect(base).toMatch(/^[0-9a-f]{64}$/);
    expect(computeIntegritySignature('r2', 1, 'COP', 's')).not.toBe(base);
    expect(computeIntegritySignature('r', 2, 'COP', 's')).not.toBe(base);
    expect(computeIntegritySignature('r', 1, 'USD', 's')).not.toBe(base);
    expect(computeIntegritySignature('r', 1, 'COP', 's2')).not.toBe(base);
  });
});
