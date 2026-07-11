import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  lastFour,
  parseExpiry,
} from '../card';

describe('detectCardBrand', () => {
  it.each([
    ['4242424242424242', 'VISA'],
    ['4111 1111 1111 1111', 'VISA'],
    ['5555555555554444', 'MASTERCARD'], // 55
    ['5105105105105100', 'MASTERCARD'], // 51
    ['2221000000000009', 'MASTERCARD'], // 2-series low bound
    ['2720999999999999', 'MASTERCARD'], // 2-series high bound
    ['2121000000000000', 'UNKNOWN'], // below 2-series range
    ['378282246310005', 'UNKNOWN'], // amex
    ['6011111111111117', 'UNKNOWN'], // discover
    ['', 'UNKNOWN'],
  ])('%s -> %s', (number, brand) => {
    expect(detectCardBrand(number)).toBe(brand);
  });
});

describe('formatCardNumber', () => {
  it('groups digits in blocks of four', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
  });
  it('strips non-digits and caps at 19 digits', () => {
    expect(formatCardNumber('4242-4242.42ab')).toBe('4242 4242 42');
    expect(formatCardNumber('1'.repeat(30))).toHaveLength(23); // 19 digits + 4 spaces
  });
});

describe('formatExpiry', () => {
  it.each([
    ['1', '1'],
    ['12', '12'],
    ['122', '12/2'],
    ['1229', '12/29'],
    ['12/29', '12/29'],
  ])('%s -> %s', (raw, formatted) => {
    expect(formatExpiry(raw)).toBe(formatted);
  });
});

describe('parseExpiry', () => {
  const now = new Date(2026, 6, 10); // 2026-07-10

  it('accepts a future expiry', () => {
    expect(parseExpiry('12/29', now)).toEqual({ month: '12', year: '29' });
  });

  it('accepts the current month (valid through month end)', () => {
    expect(parseExpiry('07/26', now)).toEqual({ month: '07', year: '26' });
  });

  it.each([
    ['06/26', 'last month'],
    ['12/20', 'past year'],
    ['13/29', 'month out of range'],
    ['00/29', 'month zero'],
    ['1229', 'missing slash'],
    ['1/29', 'single-digit month'],
    ['', 'empty'],
  ])('rejects %s (%s)', value => {
    expect(parseExpiry(value, now)).toBeNull();
  });
});

describe('lastFour', () => {
  it('returns the last four digits ignoring formatting', () => {
    expect(lastFour('4242 4242 4242 4242')).toBe('4242');
    expect(lastFour('5555555555554444')).toBe('4444');
  });
});
