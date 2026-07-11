import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { BrandLogo } from '../BrandLogo';
import { PrimaryButton } from '../PrimaryButton';
import { ProductCard } from '../ProductCard';
import { QuantityStepper } from '../QuantityStepper';
import { productFixture } from '../../testing/render';

describe('PrimaryButton', () => {
  it('fires onPress', () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Pagar" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalled();
  });

  it('blocks presses when disabled or loading', () => {
    const onPress = jest.fn();
    render(
      <PrimaryButton label="Pagar" onPress={onPress} disabled testID="btn" />,
    );
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner instead of the label while loading', () => {
    render(
      <PrimaryButton label="Pagar" onPress={jest.fn()} loading testID="btn" />,
    );
    expect(screen.queryByText('Pagar')).toBeNull();
  });
});

describe('QuantityStepper', () => {
  it('increments and decrements within bounds', () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={2} max={5} onChange={onChange} />);
    fireEvent.press(screen.getByTestId('stepper-increment'));
    expect(onChange).toHaveBeenCalledWith(3);
    fireEvent.press(screen.getByTestId('stepper-decrement'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('does not go below min or above max', () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={1} max={1} onChange={onChange} />);
    fireEvent.press(screen.getByTestId('stepper-decrement'));
    fireEvent.press(screen.getByTestId('stepper-increment'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('BrandLogo', () => {
  it.each([
    ['VISA', 'brand-visa'],
    ['MASTERCARD', 'brand-mastercard'],
    ['UNKNOWN', 'brand-unknown'],
  ] as const)('renders the %s badge', (brand, testID) => {
    render(<BrandLogo brand={brand} />);
    expect(screen.getByTestId(testID)).toBeTruthy();
  });
});

describe('ProductCard', () => {
  it('shows name, price and stock and handles the press', () => {
    const onPress = jest.fn();
    render(<ProductCard product={productFixture} onPress={onPress} />);
    expect(screen.getByText('Wireless Headphones')).toBeTruthy();
    expect(screen.getByText('$ 389.900')).toBeTruthy();
    expect(screen.getByText('Stock: 5')).toBeTruthy();

    fireEvent.press(screen.getByTestId('product-card-p-1'));
    expect(onPress).toHaveBeenCalledWith(productFixture);
  });

  it('marks out-of-stock products and blocks the press', () => {
    const onPress = jest.fn();
    render(
      <ProductCard
        product={{ ...productFixture, stock: 0 }}
        onPress={onPress}
      />,
    );
    expect(screen.getByText('Agotado')).toBeTruthy();
    fireEvent.press(screen.getByTestId('product-card-p-1'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
