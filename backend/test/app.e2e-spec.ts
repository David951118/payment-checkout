/**
 * Full-stack e2e: real Nest app + real PostgreSQL (docker-compose db service),
 * with only the payment gateway port overridden by a controllable fake.
 *
 * Requires the database to be up:  docker compose up -d db
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransactionStatus } from '../src/domain/entities/transaction.entity';
import {
  GatewayTransaction,
  PAYMENT_GATEWAY,
  PaymentGatewayPort,
} from '../src/domain/ports/payment-gateway.port';
import { DomainErrorFilter } from '../src/infrastructure/http/domain-error.filter';

class ScriptedGateway implements PaymentGatewayPort {
  nextStatus: TransactionStatus = TransactionStatus.APPROVED;

  fetchAcceptanceToken(): Promise<string> {
    return Promise.resolve('acc-token-e2e');
  }

  createCardTransaction(): Promise<GatewayTransaction> {
    return Promise.resolve({ id: `gw-${Date.now()}`, status: this.nextStatus });
  }

  fetchTransaction(id: string): Promise<GatewayTransaction> {
    return Promise.resolve({ id, status: this.nextStatus });
  }
}

describe('Checkout flow (e2e)', () => {
  let app: INestApplication;
  const gateway = new ScriptedGateway();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PAYMENT_GATEWAY)
      .useValue(gateway)
      .compile();

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

  it('GET /products returns the seeded catalog', async () => {
    const res = await request(app.getHttpServer()).get('/products');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    expect(res.body[0]).toMatchObject({
      id: expect.any(String),
      priceInCents: expect.any(Number),
      stock: expect.any(Number),
      imageUrl: expect.stringMatching(/^https:\/\//),
    });
  });

  it('POST /checkout approves a payment and decrements stock', async () => {
    gateway.nextStatus = TransactionStatus.APPROVED;
    const products = await request(app.getHttpServer()).get('/products');
    const product = products.body.find((p: { stock: number }) => p.stock > 0);

    const res = await request(app.getHttpServer()).post('/checkout').send({
      productId: product.id,
      quantity: 1,
      customerEmail: 'e2e@example.com',
      cardToken: 'tok_e2e_approved',
      installments: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.amountInCents).toBe(product.priceInCents);

    const after = await request(app.getHttpServer()).get('/products');
    const updated = after.body.find((p: { id: string }) => p.id === product.id);
    expect(updated.stock).toBe(product.stock - 1);

    const statusRes = await request(app.getHttpServer()).get(
      `/transactions/${res.body.id}`,
    );
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.status).toBe('APPROVED');
  });

  it('POST /checkout surfaces a DECLINED payment without touching stock', async () => {
    gateway.nextStatus = TransactionStatus.DECLINED;
    const products = await request(app.getHttpServer()).get('/products');
    const product = products.body[0];

    const res = await request(app.getHttpServer()).post('/checkout').send({
      productId: product.id,
      quantity: 1,
      customerEmail: 'e2e@example.com',
      cardToken: 'tok_e2e_declined',
      installments: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DECLINED');

    const after = await request(app.getHttpServer()).get('/products');
    expect(
      after.body.find((p: { id: string }) => p.id === product.id).stock,
    ).toBe(product.stock);
  });

  it('GET /transactions/:id returns 404 for unknown ids', async () => {
    const res = await request(app.getHttpServer()).get(
      '/transactions/00000000-0000-0000-0000-000000000000',
    );
    expect(res.status).toBe(404);
  });
});
