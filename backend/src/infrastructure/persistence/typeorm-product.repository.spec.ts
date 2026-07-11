import { Repository } from 'typeorm';
import { InsufficientStockError } from '../../domain/errors/domain.errors';
import { ProductOrmEntity } from './product.orm-entity';
import { TypeOrmProductRepository } from './typeorm-product.repository';

const row: ProductOrmEntity = {
  id: 'p-1',
  name: 'Sneakers',
  description: 'Classic white sneakers',
  priceInCents: 250000,
  stock: 10,
  imageUrl: 'https://example.com/sneakers.jpg',
};

function makeSut(overrides: Partial<Repository<ProductOrmEntity>> = {}) {
  const ormRepo = {
    find: jest.fn().mockResolvedValue([row]),
    findOneBy: jest.fn().mockResolvedValue(row),
    createQueryBuilder: jest.fn(),
    ...overrides,
  } as unknown as Repository<ProductOrmEntity>;
  return { sut: new TypeOrmProductRepository(ormRepo), ormRepo };
}

function mockUpdateChain(affected: number) {
  const chain = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected }),
  };
  return chain;
}

describe('TypeOrmProductRepository', () => {
  it('findAll maps rows to domain products ordered by name', async () => {
    const { sut, ormRepo } = makeSut();
    const products = await sut.findAll();

    expect(ormRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('p-1');
    expect(products[0].hasStock(10)).toBe(true);
  });

  it('findById returns null when missing', async () => {
    const { sut } = makeSut({
      findOneBy: jest.fn().mockResolvedValue(null),
    });
    await expect(sut.findById('missing')).resolves.toBeNull();
  });

  it('findById maps the row to a domain product', async () => {
    const { sut } = makeSut();
    const product = await sut.findById('p-1');
    expect(product?.priceInCents).toBe(250000);
  });

  describe('decrementStock', () => {
    it('runs an atomic conditional UPDATE', async () => {
      const chain = mockUpdateChain(1);
      const { sut } = makeSut({
        createQueryBuilder: jest.fn().mockReturnValue(chain),
      });

      await sut.decrementStock('p-1', 2);

      expect(chain.where).toHaveBeenCalledWith(
        'id = :id AND stock >= :quantity',
        { id: 'p-1', quantity: 2 },
      );
    });

    it('throws InsufficientStockError when no row was affected', async () => {
      const chain = mockUpdateChain(0);
      const { sut } = makeSut({
        createQueryBuilder: jest.fn().mockReturnValue(chain),
        findOneBy: jest.fn().mockResolvedValue({ ...row, stock: 1 }),
      });

      await expect(sut.decrementStock('p-1', 5)).rejects.toThrow(
        InsufficientStockError,
      );
    });
  });
});
