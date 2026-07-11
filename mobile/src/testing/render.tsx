import { render } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';
import { ToastProvider } from '../components/Toast';
import { createStore, RootState } from '../store';

export function renderWithProviders(
  ui: React.ReactElement,
  preloadedState?: Partial<RootState>,
) {
  const store = createStore(preloadedState);
  const utils = render(
    <Provider store={store}>
      <ToastProvider>{ui}</ToastProvider>
    </Provider>,
  );
  return { store, ...utils };
}

/** Navigation prop stub: `focus` listeners fire immediately. */
export function mockNavigation() {
  return {
    navigate: jest.fn(),
    reset: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn((_event: string, callback: () => void) => {
      callback();
      return jest.fn();
    }),
  } as never;
}

export const productFixture = {
  id: 'p-1',
  name: 'Wireless Headphones',
  description: 'Over-ear Bluetooth headphones.',
  priceInCents: 38990000,
  stock: 5,
  imageUrl: 'https://example.com/h.jpg',
};

export const transactionFixture = {
  id: 'tx-1',
  reference: 'PC-1-abc',
  amountInCents: 38990000,
  currency: 'COP',
  status: 'APPROVED' as const,
  productId: 'p-1',
  quantity: 1,
  customerEmail: 'a@b.co',
  createdAt: '2026-07-10T10:00:00Z',
  updatedAt: '2026-07-10T10:00:05Z',
};

export function stateWithProducts(): Partial<RootState> {
  return {
    products: { items: [productFixture], loading: false, error: null },
  };
}
