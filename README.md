# Payment Checkout

Full-stack credit-card checkout: **React Native (bare)** mobile app + **NestJS**
backend with hexagonal architecture, integrated with a Colombian payment gateway
(sandbox mode).

> 🚧 Work in progress — built in phases. This README is completed as phases land.

## Monorepo layout

```
/mobile    React Native 0.86 (CLI, TypeScript) — no Expo
/backend   NestJS 11 (TypeScript) — hexagonal architecture (ports & adapters)
```

## Requirements

- Node.js ≥ 20
- Docker + Docker Compose (backend + PostgreSQL)
- JDK 17 + Android SDK (mobile builds)

## Quick start

_To be completed in later phases:_

- [ ] Backend: run with Docker Compose
- [ ] Mobile: run on Android/iOS
- [ ] Tests & coverage reports (backend / mobile)
- [ ] Architecture notes
- [ ] Release APK

## Environment

Copy `backend/.env.example` → `backend/.env` and fill in the sandbox credentials.
Secrets live **only** in the backend; the mobile app only knows the gateway public
key and the backend URL.
