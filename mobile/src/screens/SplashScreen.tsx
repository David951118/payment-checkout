import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { colors, spacing } from '../theme';
import type { ScreenProps } from '../navigation/types';

const SPLASH_MS = 1400;

/**
 * Screen 1. Shows the brand, then routes:
 * - to TransactionStatus if a persisted payment is still in flight
 *   (resilience: the app was killed mid-payment), or
 * - to Home otherwise.
 */
export function SplashScreen({ navigation }: ScreenProps<'Splash'>) {
  const pendingTransaction = useAppSelector(
    state => state.transaction.current,
  );
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      const resume =
        pendingTransaction !== null && pendingTransaction.status === 'PENDING';
      navigation.reset({
        index: 0,
        routes: [{ name: resume ? 'TransactionStatus' : 'Home' }],
      });
    }, SPLASH_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container} testID="splash-screen">
      <Animated.View style={[styles.brand, { opacity }]}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>◈</Text>
        </View>
        <Text style={styles.name}>
          tiendaprueba<Text style={styles.nameAccent}>.com</Text>
        </Text>
        <Text style={styles.tagline}>Pagos con tarjeta, sin fricción</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 44,
    color: colors.primary,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nameAccent: {
    color: colors.accent,
  },
  tagline: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
});
