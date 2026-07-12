# Payment Checkout — Backend

NestJS 11 (TypeScript) API with hexagonal architecture (ports & adapters):
`domain / application / infrastructure`. PostgreSQL via TypeORM.

See the [root README](../README.md) for how to run it (Docker Compose),
the API reference, the payment flow and the architecture notes.

## Quick commands

```bash
npm ci
npm run start:dev      # local dev (needs PostgreSQL from ../docker-compose.yml or your own)
npx jest --coverage    # tests + coverage
npm run lint
```

Environment: copy `.env.example` → `.env` and fill in the sandbox credentials.
Secrets live only here — never in the mobile app, never committed.
