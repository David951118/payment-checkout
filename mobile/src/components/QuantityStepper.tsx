import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
}: QuantityStepperProps) {
  const decrementDisabled = value <= min;
  const incrementDisabled = value >= max;

  return (
    <View style={styles.container}>
      <Pressable
        testID="stepper-decrement"
        accessibilityRole="button"
        accessibilityLabel="Disminuir cantidad"
        accessibilityState={{ disabled: decrementDisabled }}
        disabled={decrementDisabled}
        onPress={() => onChange(value - 1)}
        style={[styles.button, decrementDisabled && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <Text testID="stepper-value" style={styles.value}>
        {value}
      </Text>
      <Pressable
        testID="stepper-increment"
        accessibilityRole="button"
        accessibilityLabel="Aumentar cantidad"
        accessibilityState={{ disabled: incrementDisabled }}
        disabled={incrementDisabled}
        onPress={() => onChange(value + 1)}
        style={[styles.button, incrementDisabled && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    borderColor: colors.border,
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 20,
    color: colors.text,
    lineHeight: 24,
  },
  value: {
    minWidth: 48,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: spacing.sm,
  },
});
