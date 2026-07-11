import { persistStore } from 'redux-persist';
import { createStore } from './index';

/**
 * App-level singletons, kept out of `./index` so importing the store factory
 * (e.g. from tests) never kicks off rehydration timers.
 */
export const store = createStore();
export const persistor = persistStore(store);
