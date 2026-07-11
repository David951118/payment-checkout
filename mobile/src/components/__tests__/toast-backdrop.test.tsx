import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Button, Text } from 'react-native';
import { Backdrop } from '../Backdrop';
import { ToastProvider, useToast } from '../Toast';

function ToastTrigger() {
  const { showToast } = useToast();
  return <Button title="show" onPress={() => showToast('fallo el pago')} />;
}

describe('Toast', () => {
  it('shows the message and auto-hides', () => {
    jest.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.press(screen.getByText('show'));
    expect(screen.getByTestId('toast')).toBeTruthy();
    expect(screen.getByText('fallo el pago')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3600);
    });
    expect(screen.queryByTestId('toast')).toBeNull();
    jest.useRealTimers();
  });
});

describe('Backdrop', () => {
  it('renders its content and close button when visible', () => {
    const onClose = jest.fn();
    render(
      <Backdrop visible title="Datos de tu tarjeta" onClose={onClose}>
        <Text>contenido</Text>
      </Backdrop>,
    );
    expect(screen.getByText('Datos de tu tarjeta')).toBeTruthy();
    expect(screen.getByText('contenido')).toBeTruthy();

    fireEvent.press(screen.getByTestId('backdrop-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes from the scrim when dismissable', () => {
    const onClose = jest.fn();
    render(
      <Backdrop visible title="t" onClose={onClose}>
        <Text>x</Text>
      </Backdrop>,
    );
    fireEvent.press(screen.getByTestId('backdrop-scrim'));
    expect(onClose).toHaveBeenCalled();
  });

  it('blocks closing while not dismissable (payment in flight)', () => {
    const onClose = jest.fn();
    render(
      <Backdrop visible title="t" onClose={onClose} dismissable={false}>
        <Text>x</Text>
      </Backdrop>,
    );
    expect(screen.queryByTestId('backdrop-close')).toBeNull();
    fireEvent.press(screen.getByTestId('backdrop-scrim'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
