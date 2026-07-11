import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateCheckoutUseCase } from './application/use-cases/create-checkout.use-case';
import { GetTransactionStatusUseCase } from './application/use-cases/get-transaction-status.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import {
  PAYMENT_GATEWAY,
  PaymentGatewayPort,
} from './domain/ports/payment-gateway.port';
import {
  PRODUCT_REPOSITORY,
  ProductRepositoryPort,
} from './domain/ports/product-repository.port';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepositoryPort,
} from './domain/ports/transaction-repository.port';
import { GATEWAY_CONFIG } from './infrastructure/gateway/gateway.config';
import { HttpPaymentGatewayAdapter } from './infrastructure/gateway/http-payment-gateway.adapter';
import { CheckoutController } from './infrastructure/http/checkout.controller';
import { ProductsController } from './infrastructure/http/products.controller';
import { TransactionsController } from './infrastructure/http/transactions.controller';
import { ProductSeedService } from './infrastructure/persistence/product-seed.service';
import { ProductOrmEntity } from './infrastructure/persistence/product.orm-entity';
import { TransactionOrmEntity } from './infrastructure/persistence/transaction.orm-entity';
import { TypeOrmProductRepository } from './infrastructure/persistence/typeorm-product.repository';
import { TypeOrmTransactionRepository } from './infrastructure/persistence/typeorm-transaction.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'payment_checkout'),
        entities: [ProductOrmEntity, TransactionOrmEntity],
        // Challenge trade-off: schema sync instead of migrations.
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([ProductOrmEntity, TransactionOrmEntity]),
  ],
  controllers: [ProductsController, CheckoutController, TransactionsController],
  providers: [
    ProductSeedService,
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    { provide: TRANSACTION_REPOSITORY, useClass: TypeOrmTransactionRepository },
    {
      provide: GATEWAY_CONFIG,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseUrl: config.get<string>('GATEWAY_BASE_URL', ''),
        publicKey: config.get<string>('GATEWAY_PUBLIC_KEY', ''),
        privateKey: config.get<string>('GATEWAY_PRIVATE_KEY', ''),
        integritySecret: config.get<string>('GATEWAY_INTEGRITY_SECRET', ''),
      }),
    },
    { provide: PAYMENT_GATEWAY, useClass: HttpPaymentGatewayAdapter },
    {
      provide: ListProductsUseCase,
      inject: [PRODUCT_REPOSITORY],
      useFactory: (products: ProductRepositoryPort) =>
        new ListProductsUseCase(products),
    },
    {
      provide: CreateCheckoutUseCase,
      inject: [
        PRODUCT_REPOSITORY,
        TRANSACTION_REPOSITORY,
        PAYMENT_GATEWAY,
        ConfigService,
      ],
      useFactory: (
        products: ProductRepositoryPort,
        transactions: TransactionRepositoryPort,
        gateway: PaymentGatewayPort,
        config: ConfigService,
      ) =>
        new CreateCheckoutUseCase(products, transactions, gateway, {
          pollIntervalMs: config.get<number>('GATEWAY_POLL_INTERVAL_MS', 1500),
          pollTimeoutMs: config.get<number>('GATEWAY_POLL_TIMEOUT_MS', 60000),
        }),
    },
    {
      provide: GetTransactionStatusUseCase,
      inject: [TRANSACTION_REPOSITORY, PAYMENT_GATEWAY],
      useFactory: (
        transactions: TransactionRepositoryPort,
        gateway: PaymentGatewayPort,
      ) => new GetTransactionStatusUseCase(transactions, gateway),
    },
  ],
})
export class AppModule {}
