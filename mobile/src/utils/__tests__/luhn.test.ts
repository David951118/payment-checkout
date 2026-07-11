import { isValidLuhn } from '../luhn';

describe('isValidLuhn', () => {
  it.each([
    '4242424242424242', // sandbox APPROVED
    '4111111111111111', // sandbox DECLINED
    '5555555555554444', // mastercard test number
    '4242 4242 4242 4242', // with spaces
  ])('accepts valid number %s', number => {
    expect(isValidLuhn(number)).toBe(true);
  });

  it.each([
    ['4242424242424241', 'wrong check digit'],
    ['1234567890123456', 'random digits'],
    ['424242', 'too short'],
    ['42424242424242424242', 'too long'],
    ['abcd efgh ijkl mnop', 'letters'],
    ['', 'empty'],
  ])('rejects %s (%s)', number => {
    expect(isValidLuhn(number)).toBe(false);
  });
});
