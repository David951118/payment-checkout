import { createEncryptTransform } from '../encrypt-transform';

const KEY = 'test-secret-key';

describe('createEncryptTransform', () => {
  const transform = createEncryptTransform(KEY);
  const state = { cardToken: 'tok_test_123', customerEmail: 'a@b.co' };

  it('round-trips state through encrypt/decrypt', () => {
    const encrypted = transform.in(state, 'checkout', {}) as string;
    const decrypted = transform.out(encrypted, 'checkout', {});
    expect(decrypted).toEqual(state);
  });

  it('stores ciphertext, not plaintext', () => {
    const encrypted = transform.in(state, 'checkout', {}) as string;
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toContain('tok_test_123');
    expect(encrypted).not.toContain('a@b.co');
  });

  it('produces undefined (fallback to initial state) for tampered payloads', () => {
    expect(transform.out('not-valid-ciphertext', 'checkout', {})).toBeUndefined();
    expect(transform.out('', 'checkout', {})).toBeUndefined();
  });

  it('produces undefined when decrypting with a different key', () => {
    const encrypted = transform.in(state, 'checkout', {}) as string;
    const other = createEncryptTransform('another-key');
    expect(other.out(encrypted, 'checkout', {})).toBeUndefined();
  });
});
