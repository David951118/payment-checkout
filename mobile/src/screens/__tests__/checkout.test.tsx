import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { CheckoutScreen } from '../CheckoutScreen';
import { createCheckout } from '../../api/backend-client';
import { tokenizeCard } from '../../api/gateway-client';
import {
  mockNavigation,
  productFixture,
  renderWithProviders,
  stateWithProducts,
  transactionFixture,
} from '../../testing/render';

jest.mock('../../api/backend-client', () => ({
  ...jest.requireActual('../../api/backend-client'),
  getProducts: jest.fn(),
  createCheckout: jest.fn(),
  getTransaction: jest.fn(),
}));
jest.mock('../../api/gateway-client', () => ({
  ...jest.requireActual('../../api/gateway-client'),
  tokenizeCard: jest.fn(),
}));

const mockedCreateCheckout = createCheckout as jest.MockedFunction<
  typeof createCheckout
>;
const mockedTokenize = tokenizeCard as jest.MockedFunction<typeof tokenizeCard>;

const readyState = {
  ...stateWithProducts(),
  checkout: {
    productId: productFixture.id,
    quantity: 1,
    installments: 1,
    customerEmail: 'a@b.co',
    cardToken: null,
  },
};

function fillCardAndTokenize() {
  fireEvent.changeText(screen.getByTestId('card-number'), '4242424242424242');
  fireEvent.changeText(screen.getByTestId('card-expiry'), '1229');
  fireEvent.changeText(screen.getByTestId('card-cvc'), '123');
  fireEvent.changeText(screen.getByTestId('card-holder'), 'JOHN DOE');
  fireEvent.changeText(screen.getByTestId('card-email'), 'a@b.co');
  fireEvent.press(screen.getByTestId('card-submit'));
}

describe('CheckoutScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the order and opens the card backdrop', () => {
    renderWithProviders(
      <CheckoutScreen navigation={mockNavigation()} route={{} as never} />,
      readyState,
    );

    expect(screen.getByText('Wireless Headphones')).toBeTruthy();
    fireEvent.press(screen.getByTestId('open-card-form'));
    expect(screen.getByText('Datos de tu tarjeta')).toBeTruthy();
  });

  it('shows an empty state without a selected product', () => {
    renderWithProviders(
      <CheckoutScreen navigation={mockNavigation()} route={{} as never} />,
    );
    expect(screen.getByTestId('checkout-empty')).toBeTruthy();
  });

  it('happy path: tokenize -> summary -> pay -> status screen', async () => {
    mockedTokenize.mockResolvedValue('tok_test_9');
    mockedCreateCheckout.mockResolvedValue(transactionFixture);
    const navigation = mockNavigation();
    const { store } = renderWithProviders(
      <CheckoutScreen navigation={navigation} route={{} as never} />,
      readyState,
    );

    fireEvent.press(screen.getByTestId('open-card-form'));
    fillCardAndTokenize();

    // Summary backdrop appears after tokenization
    expect(await screen.findByTestId('payment-summary')).toBeTruthy();
    expect(screen.getByText('•••• 4242')).toBeTruthy();

    fireEvent.press(screen.getByTestId('summary-pay'));

    await waitFor(() =>
      expect(
        (navigation as never as { reset: jest.Mock }).reset,
      ).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'TransactionStatus' }],
      }),
    );
    expect(mockedCreateCheckout).toHaveBeenCalledWith({
      productId: 'p-1',
      quantity: 1,
      customerEmail: 'a@b.co',
      cardToken: 'tok_test_9',
      installments: 1,
    });
    expect(store.getState().transaction.current?.status).toBe('APPROVED');
  });

  it('unhappy path: backend rejection shows an error toast and stays', async () => {
    mockedTokenize.mockResolvedValue('tok_test_9');
    mockedCreateCheckout.mockRejectedValue(new Error('Fondos insuficientes'));
    const navigation = mockNavigation();
    renderWithProviders(
      <CheckoutScreen navigation={navigation} route={{} as never} />,
      readyState,
    );

    fireEvent.press(screen.getByTestId('open-card-form'));
    fillCardAndTokenize();
    fireEvent.press(await screen.findByTestId('summary-pay'));

    expect(await screen.findByText('Fondos insuficientes')).toBeTruthy();
    expect(
      (navigation as never as { reset: jest.Mock }).reset,
    ).not.toHaveBeenCalled();
  });

  it('unhappy path: tokenization failure shows a toast and keeps the form', async () => {
    mockedTokenize.mockRejectedValue(new Error('Número inválido'));
    renderWithProviders(
      <CheckoutScreen navigation={mockNavigation()} route={{} as never} />,
      readyState,
    );

    fireEvent.press(screen.getByTestId('open-card-form'));
    fillCardAndTokenize();

    expect(await screen.findByText('Número inválido')).toBeTruthy();
    expect(screen.queryByTestId('payment-summary')).toBeNull();
  });
});
