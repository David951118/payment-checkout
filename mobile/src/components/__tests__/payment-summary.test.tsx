import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';
import { PaymentSummary } from '../PaymentSummary';
import {
  productFixture,
  renderWithProviders,
  stateWithProducts,
} from '../../testing/render';

const fullState = {
  ...stateWithProducts(),
  checkout: {
    productId: productFixture.id,
    quantity: 2,
    installments: 6,
    customerEmail: 'a@b.co',
    cardToken: 'tok_1',
  },
  card: { brand: 'VISA' as const, lastFour: '4242', holder: 'JOHN DOE' },
};

describe('PaymentSummary', () => {
  it('shows product, quantity, installments, card and total', () => {
    renderWithProviders(
      <PaymentSummary onPay={jest.fn()} paying={false} />,
      fullState,
    );

    expect(screen.getByText('Wireless Headphones')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
    expect(screen.getByText('a@b.co')).toBeTruthy();
    expect(screen.getByText('•••• 4242')).toBeTruthy();
    expect(screen.getByTestId('summary-total')).toHaveTextContent('$ 779.800'); // 389.900 × 2
  });

  it('fires onPay', () => {
    const onPay = jest.fn();
    renderWithProviders(
      <PaymentSummary onPay={onPay} paying={false} />,
      fullState,
    );
    fireEvent.press(screen.getByTestId('summary-pay'));
    expect(onPay).toHaveBeenCalled();
  });

  it('shows the processing hint while paying', () => {
    renderWithProviders(<PaymentSummary onPay={jest.fn()} paying />, fullState);
    expect(screen.getByTestId('summary-processing')).toBeTruthy();
  });

  it('renders an empty state without a selected product', () => {
    renderWithProviders(<PaymentSummary onPay={jest.fn()} paying={false} />);
    expect(screen.getByTestId('summary-empty')).toBeTruthy();
  });
});
