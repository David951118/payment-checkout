import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Backdrop } from '../components/Backdrop';
import { CardForm } from '../components/CardForm';
import { PaymentSummary } from '../components/PaymentSummary';
import { PrimaryButton } from '../components/PrimaryButton';
import { useToast } from '../components/Toast';
import type { ScreenProps } from '../navigation/types';
import { submitCheckout } from '../store/slices/transaction.slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { formatCop } from '../utils/currency';

type BackdropStep = 'none' | 'card' | 'summary';

/**
 * Screen 4. Order overview with the "Pagar con tarjeta" button that opens
 * the Material backdrop asking for card data (screen 5), then the payment
 * summary backdrop (screen 6).
 */
export function CheckoutScreen({ navigation }: ScreenProps<'Checkout'>) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const checkout = useAppSelector(state => state.checkout);
  const submitting = useAppSelector(state => state.transaction.submitting);
  const product = useAppSelector(state =>
    state.products.items.find(item => item.id === state.checkout.productId),
  );
  const [step, setStep] = useState<BackdropStep>('none');

  if (!product) {
    return (
      <View style={styles.missing} testID="checkout-empty">
        <Text style={typography.subtitle}>No hay un producto seleccionado</Text>
        <PrimaryButton
          label="Ir a la tienda"
          style={styles.missingButton}
          onPress={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  const total = product.priceInCents * checkout.quantity;

  const pay = async () => {
    if (!checkout.cardToken || !checkout.productId) {
      showToast('Completa primero los datos de tu tarjeta');
      return;
    }
    const result = await dispatch(
      submitCheckout({
        productId: checkout.productId,
        quantity: checkout.quantity,
        customerEmail: checkout.customerEmail,
        cardToken: checkout.cardToken,
        installments: checkout.installments,
      }),
    );

    if (submitCheckout.fulfilled.match(result)) {
      setStep('none');
      navigation.reset({ index: 0, routes: [{ name: 'TransactionStatus' }] });
    } else {
      showToast((result.payload as string) ?? 'El pago no pudo procesarse');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={typography.subtitle}>{product.name}</Text>
          <Text style={typography.caption}>
            Cantidad: {checkout.quantity}
          </Text>
          <Text style={styles.price}>{formatCop(total)}</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <PrimaryButton
          testID="open-card-form"
          label="Pagar con tarjeta"
          onPress={() => setStep('card')}
        />
      </View>

      <Backdrop
        visible={step === 'card'}
        title="Datos de tu tarjeta"
        onClose={() => setStep('none')}>
        <CardForm
          onTokenized={() => setStep('summary')}
          onError={message => showToast(message)}
        />
      </Backdrop>

      <Backdrop
        visible={step === 'summary'}
        title="Resumen de pago"
        onClose={() => setStep('card')}
        dismissable={!submitting}>
        <PaymentSummary
          paying={submitting}
          onPay={() => {
            void pay();
          }}
        />
      </Backdrop>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  image: {
    width: 110,
    height: 110,
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: 'auto',
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  missingButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
