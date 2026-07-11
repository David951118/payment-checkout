import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { CardForm } from '../CardForm';
import { renderWithProviders } from '../../testing/render';
import { tokenizeCard } from '../../api/gateway-client';

jest.mock('../../api/gateway-client', () => ({
  tokenizeCard: jest.fn(),
}));

const mockedTokenize = tokenizeCard as jest.MockedFunction<typeof tokenizeCard>;

function fillValidCard() {
  fireEvent.changeText(screen.getByTestId('card-number'), '4242424242424242');
  fireEvent.changeText(screen.getByTestId('card-expiry'), '1229');
  fireEvent.changeText(screen.getByTestId('card-cvc'), '123');
  fireEvent.changeText(screen.getByTestId('card-holder'), 'JOHN DOE');
  fireEvent.changeText(screen.getByTestId('card-email'), 'a@b.co');
}

describe('CardForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('formats the number and shows the VISA logo from the BIN', () => {
    renderWithProviders(<CardForm onTokenized={jest.fn()} onError={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId('card-number'), '4242424242424242');
    expect(screen.getByTestId('card-number').props.value).toBe(
      '4242 4242 4242 4242',
    );
    expect(screen.getByTestId('brand-visa')).toBeTruthy();
  });

  it('shows the MasterCard logo for a 5-series BIN', () => {
    renderWithProviders(<CardForm onTokenized={jest.fn()} onError={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId('card-number'), '5555555555554444');
    expect(screen.getByTestId('brand-mastercard')).toBeTruthy();
  });

  it('flags a Luhn-invalid number on blur and keeps submit disabled', () => {
    renderWithProviders(<CardForm onTokenized={jest.fn()} onError={jest.fn()} />);
    const input = screen.getByTestId('card-number');
    fireEvent.changeText(input, '4242424242424241');
    fireEvent(input, 'blur');
    expect(screen.getByTestId('error-number')).toBeTruthy();
    expect(
      screen.getByTestId('card-submit').props.accessibilityState.disabled,
    ).toBe(true);
  });

  it.each([
    ['card-expiry', '1220', 'error-expiry'],
    ['card-cvc', '12', 'error-cvc'],
    ['card-holder', 'JD', 'error-holder'],
    ['card-email', 'no-email', 'error-email'],
  ])('validates %s', (testID, value, errorID) => {
    renderWithProviders(<CardForm onTokenized={jest.fn()} onError={jest.fn()} />);
    const input = screen.getByTestId(testID);
    fireEvent.changeText(input, value);
    fireEvent(input, 'blur');
    expect(screen.getByTestId(errorID)).toBeTruthy();
  });

  it('prefills the remembered email', () => {
    renderWithProviders(
      <CardForm onTokenized={jest.fn()} onError={jest.fn()} />,
      {
        checkout: {
          productId: null,
          quantity: 1,
          installments: 1,
          customerEmail: 'guardado@b.co',
          cardToken: null,
        },
      },
    );
    expect(screen.getByTestId('card-email').props.value).toBe('guardado@b.co');
  });

  it('tokenizes and stores ONLY the token + display metadata', async () => {
    mockedTokenize.mockResolvedValue('tok_test_9');
    const onTokenized = jest.fn();
    const { store } = renderWithProviders(
      <CardForm onTokenized={onTokenized} onError={jest.fn()} />,
    );

    fillValidCard();
    fireEvent.press(screen.getByTestId('installments-6'));
    fireEvent.press(screen.getByTestId('card-submit'));

    await waitFor(() => expect(onTokenized).toHaveBeenCalled());

    expect(mockedTokenize).toHaveBeenCalledWith({
      number: '4242 4242 4242 4242',
      cvc: '123',
      expMonth: '12',
      expYear: '29',
      cardHolder: 'JOHN DOE',
    });

    const state = store.getState();
    expect(state.checkout.cardToken).toBe('tok_test_9');
    expect(state.checkout.installments).toBe(6);
    expect(state.checkout.customerEmail).toBe('a@b.co');
    expect(state.card).toEqual({
      brand: 'VISA',
      lastFour: '4242',
      holder: 'JOHN DOE',
    });
    // The PAN never lands in the store, in any slice.
    expect(JSON.stringify(state)).not.toContain('4242424242424242');
  });

  it('surfaces tokenization failures through onError', async () => {
    mockedTokenize.mockRejectedValue(new Error('Número inválido'));
    const onError = jest.fn();
    renderWithProviders(<CardForm onTokenized={jest.fn()} onError={onError} />);

    fillValidCard();
    fireEvent.press(screen.getByTestId('card-submit'));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('Número inválido'),
    );
  });
});
