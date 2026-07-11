import { formatCop } from '../currency';

describe('formatCop', () => {
  it.each([
    [28550000, '$ 285.500'],
    [38990000, '$ 389.900'],
    [100, '$ 1'],
    [0, '$ 0'],
    [123456789000, '$ 1.234.567.890'],
  ])('%i cents -> %s', (cents, formatted) => {
    expect(formatCop(cents)).toBe(formatted);
  });
});
