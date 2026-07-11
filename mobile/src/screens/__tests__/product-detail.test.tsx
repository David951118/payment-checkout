import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';
import { ProductDetailScreen } from '../ProductDetailScreen';
import {
  mockNavigation,
  renderWithProviders,
  stateWithProducts,
} from '../../testing/render';

const route = { params: { productId: 'p-1' } } as never;

describe('ProductDetailScreen', () => {
  it('renders product info and computes the total by quantity', () => {
    const navigation = mockNavigation();
    renderWithProviders(
      <ProductDetailScreen navigation={navigation} route={route} />,
      stateWithProducts(),
    );

    expect(screen.getByText('Wireless Headphones')).toBeTruthy();
    expect(screen.getByTestId('detail-total')).toHaveTextContent('$ 389.900');

    fireEvent.press(screen.getByTestId('stepper-increment'));
    expect(screen.getByTestId('detail-total')).toHaveTextContent('$ 779.800');
  });

  it('caps the quantity at the available stock', () => {
    const navigation = mockNavigation();
    renderWithProviders(
      <ProductDetailScreen navigation={navigation} route={route} />,
      stateWithProducts(), // stock 5
    );

    const increment = screen.getByTestId('stepper-increment');
    for (let i = 0; i < 10; i++) {
      fireEvent.press(increment);
    }
    expect(screen.getByTestId('stepper-value')).toHaveTextContent('5');
  });

  it('stores the selection and continues to Checkout', () => {
    const navigation = mockNavigation();
    const { store } = renderWithProviders(
      <ProductDetailScreen navigation={navigation} route={route} />,
      stateWithProducts(),
    );

    fireEvent.press(screen.getByTestId('stepper-increment'));
    fireEvent.press(screen.getByTestId('detail-continue'));

    expect(store.getState().checkout).toMatchObject({
      productId: 'p-1',
      quantity: 2,
    });
    expect(
      (navigation as never as { navigate: jest.Mock }).navigate,
    ).toHaveBeenCalledWith('Checkout');
  });

  it('shows a fallback when the product no longer exists', () => {
    const navigation = mockNavigation();
    renderWithProviders(
      <ProductDetailScreen
        navigation={navigation}
        route={{ params: { productId: 'missing' } } as never}
      />,
      stateWithProducts(),
    );
    expect(screen.getByTestId('product-missing')).toBeTruthy();
  });
});
