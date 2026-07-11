import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '../domain/types';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { formatCop } from '../utils/currency';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const outOfStock = product.stock <= 0;
  return (
    <Pressable
      testID={`product-card-${product.id}`}
      accessibilityRole="button"
      accessibilityLabel={product.name}
      disabled={outOfStock}
      onPress={() => onPress(product)}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        outOfStock && styles.outOfStock,
      ]}>
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatCop(product.priceInCents)}</Text>
        <Text style={[typography.caption, outOfStock && styles.stockOut]}>
          {outOfStock ? 'Agotado' : `Stock: ${product.stock}`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    margin: spacing.xs + 2,
    ...shadow.card,
  },
  pressed: {
    opacity: 0.85,
  },
  outOfStock: {
    opacity: 0.55,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 2,
    backgroundColor: colors.border,
  },
  info: {
    padding: spacing.sm + 2,
  },
  name: {
    ...typography.subtitle,
    fontSize: 14,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: 2,
  },
  stockOut: {
    color: colors.danger,
    fontWeight: '600',
  },
});
