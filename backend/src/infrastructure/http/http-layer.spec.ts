import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CreateCheckoutUseCase } from '../../application/use-cases/create-checkout.use-case';
import { GetTransactionStatusUseCase } from '../../application/use-cases/get-transaction-status.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import {
  Transaction,
  TransactionStatus,
} from '../../domain/entities/transaction.entity';
import {
  InsufficientStockError,
  PaymentGatewayError,
  ProductNotFoundError,
  TransactionNotFoundError,
} from '../../domain/errors/domain.errors';
import { makeProduct } from '../../testing/fakes';
import { CheckoutController } from './checkout.controller';
import { DomainErrorFilter } from './domain-error.filter';
import { ProductsController } from './products.controller';
import { TransactionsController } from './transactions.controller';

const transaction = Transaction.createPending({
  id: 'tx-1',
  reference: 'PC-1-abc',
  amountInCents: 500000,
  currency: 'COP',
  productId: 'p-1',
  quantity: 2,
  customerEmail: 'buyer@example.com',
  now: new Date('2026-07-10T10:00:00Z'),
});

const PRODUCT_UUID = '0b6c1f9e-51f0-4a5b-9c8d-3a1e2f4b5c6d';
const TX_UUID = '7a1e5c2d-9e2b-4f3a-8b9c-1d2e3f4a5b6c';

const validBody = {
  productId: PRODUCT_UUID,
  quantity: 2,
  customerEmail: 'buyer@example.com',
  cardToken: 'tok_test_1',
  installments: 3,
};

describe('HTTP layer', () => {
  let app: INestApplication;
  const listProducts = { execute: jest.fn() };
  const createCheckout = { execute: jest.fn() };
  const getStatus = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        ProductsController,
        CheckoutController,
        TransactionsController,
      ],
      providers: [
        { provide: ListProductsUseCase, useValue: listProducts },
        { provide: CreateCheckoutUseCase, useValue: createCheckout },
        { provide: GetTransactionStatusUseCase, useValue: getStatus },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new DomainErrorFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  describe('GET /products', () => {
    it('returns the product list', async () => {
      listProducts.execute.mockResolvedValue([makeProduct({ stock: 7 })]);

      const res = await request(app.getHttpServer()).get('/products');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          id: 'p-1',
          name: 'Sneakers',
          description: 'Classic white sneakers',
          priceInCents: 250000,
          stock: 7,
          imageUrl: 'https://example.com/sneakers.jpg',
        },
      ]);
    });
  });

  describe('POST /checkout', () => {
    it('creates a checkout and returns the transaction', async () => {
      createCheckout.execute.mockResolvedValue(transaction);

      const res = await request(app.getHttpServer())
        .post('/checkout')
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: 'tx-1',
        reference: 'PC-1-abc',
        status: TransactionStatus.PENDING,
        amountInCents: 500000,
      });
      expect(createCheckout.execute).toHaveBeenCalledWith(validBody);
    });

    it.each([
      ['missing productId', { ...validBody, productId: undefined }],
      ['non-UUID productId', { ...validBody, productId: 'not-a-uuid' }],
      ['invalid email', { ...validBody, customerEmail: 'not-an-email' }],
      ['zero quantity', { ...validBody, quantity: 0 }],
      ['fractional quantity', { ...validBody, quantity: 1.5 }],
      ['installments over 36', { ...validBody, installments: 48 }],
      ['missing cardToken', { ...validBody, cardToken: '' }],
    ])('rejects %s with 400 before reaching the use case', async (_, body) => {
      const res = await request(app.getHttpServer())
        .post('/checkout')
        .send(body);
      expect(res.status).toBe(400);
      expect(createCheckout.execute).not.toHaveBeenCalled();
    });

    it('strips unknown fields (whitelist) — a PAN never reaches the use case', async () => {
      createCheckout.execute.mockResolvedValue(transaction);

      await request(app.getHttpServer())
        .post('/checkout')
        .send({ ...validBody, cardNumber: '4242424242424242' });

      expect(createCheckout.execute).toHaveBeenCalledWith(validBody);
    });

    it('maps ProductNotFoundError to 404', async () => {
      createCheckout.execute.mockRejectedValue(
        new ProductNotFoundError('missing'),
      );
      const res = await request(app.getHttpServer())
        .post('/checkout')
        .send(validBody);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ProductNotFoundError');
    });

    it('maps InsufficientStockError to 409', async () => {
      createCheckout.execute.mockRejectedValue(
        new InsufficientStockError('p-1', 5, 1),
      );
      const res = await request(app.getHttpServer())
        .post('/checkout')
        .send(validBody);
      expect(res.status).toBe(409);
    });

    it('maps PaymentGatewayError to 502', async () => {
      createCheckout.execute.mockRejectedValue(new PaymentGatewayError('down'));
      const res = await request(app.getHttpServer())
        .post('/checkout')
        .send(validBody);
      expect(res.status).toBe(502);
    });
  });

  describe('GET /transactions/:id', () => {
    it('returns the transaction status', async () => {
      getStatus.execute.mockResolvedValue(transaction);

      const res = await request(app.getHttpServer()).get(
        `/transactions/${TX_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('tx-1');
      expect(getStatus.execute).toHaveBeenCalledWith(TX_UUID);
    });

    it('rejects a malformed id with 400 before reaching the use case', async () => {
      const res = await request(app.getHttpServer()).get(
        '/transactions/not-a-uuid',
      );
      expect(res.status).toBe(400);
      expect(getStatus.execute).not.toHaveBeenCalled();
    });

    it('maps TransactionNotFoundError to 404', async () => {
      getStatus.execute.mockRejectedValue(
        new TransactionNotFoundError(TX_UUID),
      );
      const res = await request(app.getHttpServer()).get(
        `/transactions/${TX_UUID}`,
      );
      expect(res.status).toBe(404);
    });
  });
});
