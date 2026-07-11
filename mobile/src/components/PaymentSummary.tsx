import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { colors, radius, spacing, typography } from '../theme';
import { formatCop } from '../utils/currency';
import { BrandLogo } from './BrandLogo';
import { PrimaryButton } from './PrimaryButton';

interface PaymentSummaryProps {
  onPay: () => void;
  paying: boolean;
}

/** Screen 6 (backdrop content): final review + pay button. */
export function PaymentSummary({ onPay, paying }: PaymentSummaryProps) {
  const checkout = useAppSelector(state => state.checkout);
  const card = useAppSelector(state => state.card);
  const product = useAppSelector(state =>
    state.products.items.find(item => item.id === state.checkout.productId),
  );

  if (!product) {
    return (
      <Text style={typography.body} testID="summary-empty">
        No hay un producto seleccionado.
      </Text>
    );
  }

  const total = product.priceInCents * checkout.quantity;

  return (
    <View testID="payment-summary">
      <View style={styles.block}>
        <Row label="Producto" value={product.name} />
        <Row label="Cantidad" value={String(checkout.quantity)} />
        <Row label="Precio unitario" value={formatCop(product.priceInCents)} />
        <Row label="Cuotas" value={String(checkout.installments)} />
        <Row label="Correo" value={checkout.customerEmail} />
      </View>

      <View style={[styles.block, styles.cardBlock]}>
        <BrandLogo brand={card.brand} />
        <View style={styles.cardInfo}>
          <Text style={typography.subtitle}>•••• {card.lastFour}</Text>
          <Text style={typography.caption}>{card.holder}</Text>
        </View>
      </View>

      <View style={styles.totalRow}>
        <Text style={typography.subtitle}>Total a pagar</Text>
        <Text style={styles.total} testID="summary-total">
          {formatCop(total)}
        </Text>
      </View>

      <PrimaryButton
        testID="summary-pay"
        label={`Pagar ${formatCop(total)}`}
        onPress={onPay}
        loading={paying}
      />
      {paying ? (
        <Text style={styles.processing} testID="summary-processing">
          Procesando tu pago, esto puede tardar unos segundos…
        </Text>
      ) : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={typography.caption}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  rowValue: {
    ...typography.body,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  cardBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    marginLeft: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  total: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  processing: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
