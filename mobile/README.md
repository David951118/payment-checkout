# Payment Checkout — Mobile

React Native 0.86 (bare CLI, TypeScript). Redux Toolkit + redux-persist with
an AES encryption transform; React Navigation; Material-style backdrops.

See the [root README](../README.md) for the full setup, the payment flow,
sandbox test cards and architecture notes.

## Quick commands

```bash
npm ci
cp src/config/env.example.ts src/config/env.ts   # backend URL + gateway PUBLIC key
npm start              # Metro
npm run android        # build + install (emulator/device)
npx jest --coverage    # tests + coverage
npm run lint
```

A release APK with the JS bundle embedded is committed at
[`apk/app-release.apk`](apk/app-release.apk).
