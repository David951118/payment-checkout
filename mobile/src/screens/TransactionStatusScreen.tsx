import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import type { TransactionStatus } from '../domain/types';
import type { ScreenProps } from '../navigation/types';
import { resetCheckout } from '../store/slices/checkout.slice';
import { clearCardMeta } from '../store/slices/card.slice';
import {
  clearTransaction,
  refreshTransaction,
} from '../store/slices/transaction.slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { colors, radius, spacing, typography } from '../theme';
import { formatCop } from '../utils/currency';

const POLL_MS = 3000;

const STATUS_UI: Record<
  TransactionStatus,
  { icon: string; title: string; caption: string; color: string }
> = {
  APPROVED: {
    icon: '✓',
    title: '¡Pago aprobado!',
    caption: 'Tu producto fue asignado y el pago se procesó con éxito.',
    color: colors.success,
  },
  DECLINED: {
    icon: '✕',
    title: 'Pago rechazado',
    caption: 'Tu banco rechazó la transacción. Intenta con otra tarjeta.',
    color: colors.danger,
  },
  VOIDED: {
    icon: '⊘',
    title: 'Pago anulado',
    caption: 'La transacción fue anulada. No se realizó ningún cobro.',
    color: colors.warning,
  },
  ERROR: {
    icon: '!',
    title: 'Algo salió mal',
    caption: 'No pudimos procesar el pago. No se realizó ningún cobro.',
    color: colors.danger,
  },
  PENDING: {
    icon: '…',
    title: 'Procesando pago',
    caption: 'Estamos confirmando tu pago con el banco. Un momento…',
    color: colors.warning,
  },
};

/**
 * Screen 7. Final transaction status. If the transaction is still PENDING
 * (e.g. the app was killed mid-payment and restored from encrypted storage)
 * it keeps polling the backend until a final status arrives.
 */
export function TransactionStatusScreen({
  navigation,
}: ScreenProps<'TransactionStatus'>) {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector(state => state.transaction.current);

  const status: TransactionStatus = transaction?.status ?? 'ERROR';
  const ui = STATUS_UI[status];

  useEffect(() => {
    if (!transaction || transaction.status !== 'PENDING') {
      return;
    }
    const interval = setInterval(() => {
      void dispatch(refreshTransaction(transaction.id));
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [transaction, dispatch]);

  const goHome = () => {
    dispatch(clearTransaction());
    dispatch(clearCardMeta());
    dispatch(resetCheckout()); // keeps the remembered email
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <SafeAreaView style={styles.container} testID="transaction-status">
      <View style={[styles.iconCircle, { backgroundColor: ui.color }]}>
        <Text style={styles.icon}>{ui.icon}</Text>
      </View>
      <Text style={styles.title}>{ui.title}</Text>
      <Text style={styles.caption}>{ui.caption}</Text>

      {transaction ? (
        <View style={styles.details}>
          <Row label="Referencia" value={transaction.reference} />
          <Row label="Monto" value={formatCop(transaction.amountInCents)} />
          <Row label="Estado" value={transaction.status} />
          <Row label="Correo" value={transaction.customerEmail} />
        </View>
      ) : (
        <Text style={typography.caption} testID="status-missing">
          No encontramos información de la transacción.
        </Text>
      )}

      <PrimaryButton
        testID="status-home"
        label="Volver al inicio"
        onPress={goHome}
        style={styles.homeButton}
      />
    </SafeAreaView>
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 44,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  title: {
    ...typography.title,
    fontSize: 24,
    textAlign: 'center',
  },
  caption: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  details: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
  },
  rowValue: {
    ...typography.body,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  homeButton: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
});
