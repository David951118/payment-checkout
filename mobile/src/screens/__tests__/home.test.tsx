import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { HomeScreen } from '../HomeScreen';
import { getProducts } from '../../api/backend-client';
import {
  mockNavigation,
  productFixture,
  renderWithProviders,
} from '../../testing/render';

jest.mock('../../api/backend-client', () => ({
  getProducts: jest.fn(),
  createCheckout: jest.fn(),
  getTransaction: jest.fn(),
}));

const mockedGetProducts = getProducts as jest.MockedFunction<
  typeof getProducts
>;

describe('HomeScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches on focus and renders the catalog', async () => {
    mockedGetProducts.mockResolvedValue([productFixture]);
    const navigation = mockNavigation();
    renderWithProviders(
      <HomeScreen navigation={navigation} route={{} as never} />,
    );

    expect(await screen.findByText('Wireless Headphones')).toBeTruthy();
    expect(screen.getByText('$ 389.900')).toBeTruthy();
    expect(mockedGetProducts).toHaveBeenCalled();
  });

  it('navigates to the product detail on tap', async () => {
    mockedGetProducts.mockResolvedValue([productFixture]);
    const navigation = mockNavigation();
    renderWithProviders(
      <HomeScreen navigation={navigation} route={{} as never} />,
    );

    fireEvent.press(await screen.findByTestId('product-card-p-1'));
    expect(
      (navigation as never as { navigate: jest.Mock }).navigate,
    ).toHaveBeenCalledWith('ProductDetail', { productId: 'p-1' });
  });

  it('shows the error state with retry and an error toast', async () => {
    mockedGetProducts.mockRejectedValue(new Error('backend caído'));
    const navigation = mockNavigation();
    renderWithProviders(
      <HomeScreen navigation={navigation} route={{} as never} />,
    );

    expect(await screen.findByTestId('home-error')).toBeTruthy();
    expect(screen.getByTestId('toast')).toBeTruthy();

    mockedGetProducts.mockResolvedValue([productFixture]);
    fireEvent.press(screen.getByText('Reintentar'));
    await waitFor(() =>
      expect(screen.getByText('Wireless Headphones')).toBeTruthy(),
    );
  });
});
