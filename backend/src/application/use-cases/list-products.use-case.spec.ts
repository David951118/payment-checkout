import { InMemoryProductRepository, makeProduct } from '../../testing/fakes';
import { ListProductsUseCase } from './list-products.use-case';

describe('ListProductsUseCase', () => {
  it('returns every product from the repository', async () => {
    const repo = new InMemoryProductRepository();
    repo.seed(
      makeProduct({ id: 'p-1', name: 'Sneakers' }),
      makeProduct({ id: 'p-2', name: 'Backpack', priceInCents: 180000 }),
    );

    const products = await new ListProductsUseCase(repo).execute();

    expect(products).toHaveLength(2);
    expect(products.map((p) => p.id)).toEqual(['p-1', 'p-2']);
  });

  it('returns an empty list when there are no products', async () => {
    const products = await new ListProductsUseCase(
      new InMemoryProductRepository(),
    ).execute();
    expect(products).toEqual([]);
  });
});
