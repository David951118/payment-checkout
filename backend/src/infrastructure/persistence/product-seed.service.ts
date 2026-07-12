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
  {
    name: 'Gaming Mouse',
    description: 'Wireless gaming mouse, 26K DPI sensor and 90h battery.',
    priceInCents: 21990000,
    stock: 15,
    imageUrl: 'https://picsum.photos/seed/mouse/600/400',
  },
  {
    name: '4K Webcam',
    description:
      '4K webcam with autofocus, HDR and dual noise-cancelling mics.',
    priceInCents: 34550000,
    stock: 9,
    imageUrl: 'https://picsum.photos/seed/webcam/600/400',
  },
  {
    name: 'Laptop Stand',
    description: 'Adjustable aluminium laptop stand, fits 10" to 17".',
    priceInCents: 8470000,
    stock: 25,
    imageUrl: 'https://picsum.photos/seed/stand/600/400',
  },
  {
    name: 'Noise-Cancelling Earbuds',
    description: 'In-ear ANC earbuds with wireless charging case.',
    priceInCents: 26930000,
    stock: 18,
    imageUrl: 'https://picsum.photos/seed/earbuds/600/400',
  },
  {
    name: 'Smart Bulb Kit',
    description: 'Kit of 3 RGB smart bulbs, app and voice controlled.',
    priceInCents: 11890000,
    stock: 40,
    imageUrl: 'https://picsum.photos/seed/bulbs/600/400',
  },
  {
    name: 'External SSD 1TB',
    description: 'Portable NVMe SSD, 1050 MB/s over USB-C, shock resistant.',
    priceInCents: 45990000,
    stock: 11,
    imageUrl: 'https://picsum.photos/seed/ssd/600/400',
  },
  {
    name: 'Phone Tripod',
    description: 'Extendable tripod with Bluetooth remote shutter.',
    priceInCents: 6250000,
    stock: 35,
    imageUrl: 'https://picsum.photos/seed/tripod/600/400',
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
