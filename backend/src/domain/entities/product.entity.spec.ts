import { Product } from './product.entity';

const makeProduct = (stock = 5) =>
  new Product({
    id: 'p-1',
    name: 'Sneakers',
    description: 'Classic white sneakers',
    priceInCents: 250000,
    stock,
    imageUrl: 'https://example.com/sneakers.jpg',
  });

describe('Product', () => {
  it('exposes its properties', () => {
    const product = makeProduct();
    expect(product.id).toBe('p-1');
    expect(product.priceInCents).toBe(250000);
    expect(product.stock).toBe(5);
  });

  describe('hasStock', () => {
    it.each([
      [1, true],
      [5, true],
      [6, false],
      [0, false],
      [-1, false],
    ])('quantity %i → %s', (quantity, expected) => {
      expect(makeProduct(5).hasStock(quantity)).toBe(expected);
    });
  });

  it('computes total price for a quantity', () => {
    expect(makeProduct().totalPriceInCents(3)).toBe(750000);
  });
});
