# Payment Checkout

Full-stack credit-card checkout: **React Native (bare)** mobile app + **NestJS**
backend with hexagonal architecture, integrated with a Colombian payment gateway
(sandbox mode).

## Monorepo layout

```
/mobile     React Native 0.86 (CLI, TypeScript) — no Expo
/backend    NestJS 11 (TypeScript) — hexagonal architecture (ports & adapters)
/postman    Postman collection for the backend API
/docs       Manuals (Spanish): user guide, technical guide, production runbook
```

## Documentation

- [Manual de uso](docs/manual-de-uso.md) — how to use the app, test cards,
  transaction states.
- [Manual técnico](docs/manual-tecnico.md) — architecture, payment flow,
  security model, testing.
- [Paso a producción](docs/paso-a-produccion.md) — deploying the backend
  (Render blueprint included as `render.yaml`) and pointing the app at it.

## Requirements

- Node.js ≥ 20
- Docker + Docker Compose (backend + PostgreSQL)
- JDK 17 + Android SDK (mobile builds)

## Backend — run with Docker Compose

```bash
cp backend/.env.example backend/.env   # fill in your sandbox credentials
docker compose up -d --build
curl http://localhost:3000/products    # seeded products
```

The compose file starts PostgreSQL 16 and the API on port 3000. On boot the
backend runs a seed of 12 products (skipped if products already exist).

To run it without Docker: `cd backend && npm ci && npm run start:dev`
(needs a local PostgreSQL matching `backend/.env`).

### REST API

| Method | Path                | Description                                      |
| ------ | ------------------- | ------------------------------------------------ |
| GET    | `/products`         | List products with stock                         |
| POST   | `/checkout`         | Create a payment (tokenized card) and process it |
| GET    | `/transactions/:id` | Transaction status (re-polls gateway if pending) |

Import `postman/payment-checkout-api.postman_collection.json` into Postman to
try them (includes example responses; `baseUrl` defaults to `http://localhost:3000`).

## Mobile — run on Android

```bash
cd mobile
npm ci
cp src/config/env.example.ts src/config/env.ts   # fill in gateway PUBLIC key
npm start            # Metro
npm run android      # build + install on emulator/device
```

`env.ts` only holds the backend URL, the gateway sandbox URL, the gateway
**public** key and the local encryption key — private keys and the integrity
secret never reach the device.

### Release APK

A locally built release APK (`gradlew assembleRelease`) is committed at
[`mobile/apk/app-release.apk`](mobile/apk/app-release.apk). It embeds the JS
bundle, so it runs without Metro; it expects the backend at `10.0.2.2:3000`
(Android emulator → host).

### Sandbox test cards

| Card                  | Result   |
| --------------------- | -------- |
| `4242 4242 4242 4242` | APPROVED |
| `4111 1111 1111 1111` | DECLINED |
| any other valid PAN   | ERROR    |

Any future expiry and any 3-digit CVC work in sandbox.

## Payment flow (async, long polling)

1. The app validates the card (Luhn), detects VISA/MasterCard by BIN and
   tokenizes it directly against the gateway using the **public** key. Only
   `{ token, installments, customerEmail, productId, quantity }` is sent to
   the backend — never the PAN.
2. The backend creates its own `PENDING` transaction, fetches the merchant
   `acceptance_token`, generates a unique `reference` and computes the
   integrity signature (`SHA256(reference + amount + currency + secret)`) —
   always server-side.
3. The backend creates the gateway transaction (private key) and long-polls
   its status until `APPROVED | DECLINED | VOIDED | ERROR` (bounded retries;
   on timeout the transaction stays `PENDING` and `GET /transactions/:id`
   re-polls the gateway on demand).
4. On `APPROVED` the product stock is decremented and the result returns to
   the app, which shows the final status screen.

## Tests & coverage

Run `npx jest --coverage` inside `backend/` or `mobile/`. Latest local run:

| Project | Suites | Tests | Statements | Branches | Functions | Lines |
| ------- | ------ | ----- | ---------- | -------- | --------- | ----- |
| backend | 12     | 77    | 98.0%      | 87.1%    | 91.0%     | 98.6% |
| mobile  | 19     | 128   | 96.6%      | 92.9%    | 93.3%     | 96.7% |

Backend tests cover the domain, the use cases and the infrastructure (gateway
adapter with mocked HTTP, repositories, controllers). Mobile tests use React
Native Testing Library for every screen and component, plus the store, the
encrypted persistence transform and the API clients.

The full flow was also verified end-to-end on an Android emulator against the
dockerized backend and the real sandbox: APPROVED with stock decrement,
DECLINED with stock intact, and email preloaded from encrypted storage on the
second purchase.

## Architecture notes

### Backend — hexagonal (ports & adapters)

```
src/
  domain/           entities (Product, Transaction), errors, pure services
                    (integrity signature, reference generator)
  application/      use cases: ListProducts, CreateCheckout, GetTransactionStatus
                    + ports: ProductRepositoryPort, TransactionRepositoryPort,
                    PaymentGatewayPort
  infrastructure/   TypeORM repositories, HTTP gateway adapter, REST
                    controllers/DTOs, product seed, domain-error filter
```

- The application layer depends only on ports; adapters are wired via Nest DI.
- The integrity signature is computed in the gateway adapter using a pure
  domain utility — the secret never enters the application layer.
- Gateway failures surface as an `ERROR` transaction returned to the client
  (toast in the app), not as a 500.

### Mobile

- **Redux Toolkit** (Flux) with typed hooks; slices: `products`, `checkout`,
  `card`, `transaction`.
- **redux-persist + AES transform**: only `checkout` and `transaction` are
  persisted, encrypted at rest. The PAN is never stored — only the card token
  and display metadata (brand, last4). The UI mounts behind a `PersistGate`,
  so an interrupted payment is restored after a kill.
- 7 screens (Splash → Home → Product → Checkout → Card form → Summary →
  Status) with Material-style backdrops for the card form and payment summary,
  responsive down to iPhone SE, error toasts for every unhappy path.
- The customer email is asked once and preloaded (encrypted) on later
  purchases; installments are selectable (default 1).
