import { act, screen } from '@testing-library/react-native';
import React from 'react';
import { SplashScreen } from '../SplashScreen';
import {
  mockNavigation,
  renderWithProviders,
  transactionFixture,
} from '../../testing/render';

describe('SplashScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows the brand and routes to Home', () => {
    const navigation = mockNavigation();
    renderWithProviders(
      <SplashScreen navigation={navigation} route={{} as never} />,
    );
    expect(screen.getByTestId('splash-screen')).toBeTruthy();
    expect(screen.getByText('tiendaprueba.com')).toBeTruthy();

    act(() => jest.advanceTimersByTime(1500));
    expect((navigation as never as { reset: jest.Mock }).reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  });

  it('resumes a persisted PENDING payment on TransactionStatus', () => {
    const navigation = mockNavigation();
    renderWithProviders(
      <SplashScreen navigation={navigation} route={{} as never} />,
      {
        transaction: {
          current: { ...transactionFixture, status: 'PENDING' },
          submitting: false,
          error: null,
        },
      },
    );

    act(() => jest.advanceTimersByTime(1500));
    expect((navigation as never as { reset: jest.Mock }).reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'TransactionStatus' }],
    });
  });

  it('goes Home when the persisted transaction is already final', () => {
    const navigation = mockNavigation();
    renderWithProviders(
      <SplashScreen navigation={navigation} route={{} as never} />,
      {
        transaction: {
          current: transactionFixture, // APPROVED
          submitting: false,
          error: null,
        },
      },
    );

    act(() => jest.advanceTimersByTime(1500));
    expect((navigation as never as { reset: jest.Mock }).reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  });
});
