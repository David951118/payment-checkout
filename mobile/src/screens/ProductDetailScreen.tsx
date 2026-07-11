import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { QuantityStepper } from '../components/QuantityStepper';
import type { ScreenProps } from '../navigation/types';
import { selectProduct, setQuantity } from '../store/slices/checkout.slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { colors, radius, spacing, typography } from '../theme';
import { formatCop } from '../utils/currency';

/** Screen 3. Product selection: quantity (1..stock) and total. */
export function ProductDetailScreen({
  navigation,
  route,
}: ScreenProps<'ProductDetail'>) {
  const dispatch = useAppDispatch();
  const product = useAppSelector(state =>
    state.products.items.find(item => item.id === route.params.productId),
  );
  const [quantity, setLocalQuantity] = useState(1);

  if (!product) {
    return (
      <View style={styles.missing} testID="product-missing">
        <Text style={typography.subtitle}>Producto no disponible</Text>
        <PrimaryButton
          label="Volver"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  const total = product.priceInCents * quantity;

  const continueToCheckout = () => {
    dispatch(selectProduct(product.id));
    dispatch(setQuantity(quantity));
    navigation.navigate('Checkout');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={typography.title}>{product.name}</Text>
        <Text style={styles.price}>{formatCop(product.priceInCents)}</Text>
        <Text style={styles.description}>{product.description}</Text>
        <Text style={typography.caption}>
          {product.stock} unidades disponibles
        </Text>

        <View style={styles.quantityRow}>
          <Text style={typography.subtitle}>Cantidad</Text>
          <QuantityStepper
            value={quantity}
            max={product.stock}
            onChange={setLocalQuantity}
          />
        </View>
      </ScrollView>

      {/* Anchored bottom bar — stays inside bounds on small screens */}
      <View style={styles.footer}>
        <View>
          <Text style={typography.caption}>Total</Text>
          <Text style={styles.total} testID="detail-total">
            {formatCop(total)}
          </Text>
        </View>
        <PrimaryButton
          testID="detail-continue"
          label="Continuar"
          style={styles.continue}
          onPress={continueToCheckout}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: radius.lg,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  total: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  continue: {
    flex: 1,
    marginLeft: spacing.md,
    maxWidth: 220,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
