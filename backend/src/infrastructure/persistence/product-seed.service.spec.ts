import { Repository } from 'typeorm';
import { ProductOrmEntity } from './product.orm-entity';
import { ProductSeedService, SEED_PRODUCTS } from './product-seed.service';

function makeSut(count: number) {
  const ormRepo = {
    count: jest.fn().mockResolvedValue(count),
    create: jest.fn().mockImplementation((seed: object) => seed),
    save: jest.fn().mockResolvedValue([]),
  } as unknown as Repository<ProductOrmEntity>;
  return { sut: new ProductSeedService(ormRepo), ormRepo };
}

describe('ProductSeedService', () => {
  it('seeds a catalog of products with stock when the table is empty', async () => {
    const { sut, ormRepo } = makeSut(0);

    await sut.onApplicationBootstrap();

    expect(ormRepo.save).toHaveBeenCalledTimes(1);
    // Catalog large enough to exercise list scrolling in the mobile app.
    expect(SEED_PRODUCTS.length).toBeGreaterThanOrEqual(10);
    for (const seed of SEED_PRODUCTS) {
      expect(seed.stock).toBeGreaterThan(0);
      expect(seed.priceInCents).toBeGreaterThan(0);
      expect(seed.imageUrl).toMatch(/^https:\/\//);
    }
  });

  it('does nothing when products already exist', async () => {
    const { sut, ormRepo } = makeSut(5);
    await sut.onApplicationBootstrap();
    expect(ormRepo.save).not.toHaveBeenCalled();
  });
});
