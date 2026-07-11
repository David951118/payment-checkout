import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import type { PersistConfig } from 'redux-persist';
import { ENV } from '../config/env';
import { createEncryptTransform } from './encrypt-transform';
import cardReducer from './slices/card.slice';
import checkoutReducer from './slices/checkout.slice';
import productsReducer from './slices/products.slice';
import transactionReducer from './slices/transaction.slice';

const rootReducer = combineReducers({
  products: productsReducer,
  checkout: checkoutReducer,
  card: cardReducer,
  transaction: transactionReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/**
 * Persistence policy (hard rule): ONLY the card token + purchase intent
 * (checkout) and the transaction state are persisted, AES-encrypted.
 * `products` (refetched) and `card` (display metadata) stay in memory.
 */
export const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['checkout', 'transaction'],
  transforms: [createEncryptTransform(ENV.PERSIST_ENCRYPTION_KEY)],
};

export function createStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: persistReducer(persistConfig, rootReducer),
    preloadedState: preloadedState as never,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });
}

export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore['dispatch'];
