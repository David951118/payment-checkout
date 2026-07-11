import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import App from '../App';

// The native-stack navigator needs native screens; in tests we assert the
// providers wiring (store + PersistGate + toast + navigation container).
jest.mock('../src/navigation/RootNavigator', () => {
  const { Text } = require('react-native');
  return {
    RootNavigator: () => <Text>navigator-ready</Text>,
  };
});

describe('App', () => {
  it('boots providers and renders the navigator after rehydration', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText('navigator-ready')).toBeTruthy(),
    );
  });
});
