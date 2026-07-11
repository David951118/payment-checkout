import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CardBrand } from '../domain/types';

/**
 * Franchise badge rendered with pure styles (no image assets → instant load).
 * VISA: blue wordmark. MasterCard: the two overlapping circles.
 */
export function BrandLogo({ brand }: { brand: CardBrand }) {
  if (brand === 'VISA') {
    return (
      <View testID="brand-visa" style={[styles.badge, styles.visaBadge]}>
        <Text style={styles.visaText}>VISA</Text>
      </View>
    );
  }
  if (brand === 'MASTERCARD') {
    return (
      <View testID="brand-mastercard" style={[styles.badge, styles.mcBadge]}>
        <View style={styles.mcRed} />
        <View style={styles.mcOrange} />
      </View>
    );
  }
  return <View testID="brand-unknown" style={[styles.badge, styles.empty]} />;
}

const styles = StyleSheet.create({
  badge: {
    width: 46,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visaBadge: {
    backgroundColor: '#1A1F71',
  },
  visaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  mcBadge: {
    backgroundColor: '#000000',
    flexDirection: 'row',
  },
  mcRed: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EB001B',
    marginRight: -7,
  },
  mcOrange: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F79E1B',
    opacity: 0.9,
  },
  empty: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
});
