import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOrmEntity } from './product.orm-entity';

export const SEED_PRODUCTS: Omit<ProductOrmEntity, 'id'>[] = [
  {
    name: 'Wireless Headphones',
    description: 'Over-ear Bluetooth headphones with active noise cancelling.',
    priceInCents: 38990000, // $389.900 COP
    stock: 12,
    imageUrl: 'https://picsum.photos/seed/headphones/600/400',
  },
  {
    name: 'Mechanical Keyboard',
    description: '75% hot-swappable mechanical keyboard, RGB backlight.',
    priceInCents: 28550000,
    stock: 8,
    imageUrl: 'https://picsum.photos/seed/keyboard/600/400',
  },
  {
    name: 'Smart Watch',
    description: 'Fitness tracking, heart-rate monitor and 7-day battery.',
    priceInCents: 52990000,
    stock: 5,
    imageUrl: 'https://picsum.photos/seed/watch/600/400',
  },
  {
    name: 'Portable Speaker',
    description: 'Waterproof Bluetooth speaker with 12h of playback.',
    priceInCents: 17420000,
    stock: 20,
    imageUrl: 'https://picsum.photos/seed/speaker/600/400',
  },
  {
    name: 'USB-C Hub',
    description: '7-in-1 hub: HDMI 4K, 3× USB 3.0, SD, microSD and PD 100W.',
    priceInCents: 9980000,
    stock: 30,
    imageUrl: 'https://picsum.photos/seed/usbhub/600/400',
  },
];

@Injectable()
export class ProductSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductSeedService.name);

  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.repository.count();
    if (count > 0) {
      return;
    }
    await this.repository.save(
      SEED_PRODUCTS.map((seed) => this.repository.create(seed)),
    );
    this.logger.log(`Seeded ${SEED_PRODUCTS.length} products`);
  }
}
