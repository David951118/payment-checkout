import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { TransactionStatusScreen } from '../TransactionStatusScreen';
import { getTransaction } from '../../api/backend-client';
import {
  mockNavigation,
  renderWithProviders,
  transactionFixture,
} from '../../testing/render';

jest.mock('../../api/backend-client', () => ({
  ...jest.requireActual('../../api/backend-client'),
  getProducts: jest.fn(),
  createCheckout: jest.fn(),
  getTransaction: jest.fn(),
}));

const mockedGetTransaction = getTransaction as jest.MockedFunction<
  typeof getTransaction
>;

function stateWith(status: 'APPROVED' | 'DECLINED' | 'ERROR' | 'PENDING') {
  return {
    transaction: {
      current: { ...transactionFixture, status },
      submitting: false,
      error: null,
    },
  };
}

describe('TransactionStatusScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['APPROVED', '¡Pago aprobado!'],
    ['DECLINED', 'Pago rechazado'],
    ['ERROR', 'Algo salió mal'],
  ] as const)('renders the %s outcome', (status, title) => {
    renderWithProviders(
      <TransactionStatusScreen
        navigation={mockNavigation()}
        route={{} as never}
      />,
      stateWith(status),
    );
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText('PC-1-abc')).toBeTruthy();
    expect(screen.getByText('$ 389.900')).toBeTruthy();
  });

  it('keeps polling a PENDING transaction until it turns final', async () => {
    jest.useFakeTimers();
    mockedGetTransaction.mockResolvedValue(transactionFixture); // APPROVED
    renderWithProviders(
      <TransactionStatusScreen
        navigation={mockNavigation()}
        route={{} as never}
      />,
      stateWith('PENDING'),
    );

    expect(screen.getByText('Procesando pago')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3100);
    });
    jest.useRealTimers();

    await waitFor(() =>
      expect(screen.getByText('¡Pago aprobado!')).toBeTruthy(),
    );
    expect(mockedGetTransaction).toHaveBeenCalledWith('tx-1');
  });

  it('volver al inicio clears the payment but keeps the email', () => {
    const navigation = mockNavigation();
    const { store } = renderWithProviders(
      <TransactionStatusScreen navigation={navigation} route={{} as never} />,
      {
        ...stateWith('APPROVED'),
        checkout: {
          productId: 'p-1',
          quantity: 2,
          installments: 6,
          customerEmail: 'a@b.co',
          cardToken: 'tok_1',
        },
        card: { brand: 'VISA', lastFour: '4242', holder: 'JOHN DOE' },
      },
    );

    fireEvent.press(screen.getByTestId('status-home'));

    const state = store.getState();
    expect(state.transaction.current).toBeNull();
    expect(state.checkout.cardToken).toBeNull();
    expect(state.checkout.customerEmail).toBe('a@b.co'); // remembered
    expect(state.card.lastFour).toBe('');
    expect(
      (navigation as never as { reset: jest.Mock }).reset,
    ).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });

  it('shows a fallback when there is no transaction', () => {
    renderWithProviders(
      <TransactionStatusScreen
        navigation={mockNavigation()}
        route={{} as never}
      />,
    );
    expect(screen.getByTestId('status-missing')).toBeTruthy();
  });
});
