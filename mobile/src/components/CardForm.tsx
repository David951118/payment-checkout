import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { tokenizeCard } from '../api/gateway-client';
import { setCardMeta } from '../store/slices/card.slice';
import {
  setCardToken,
  setCustomerEmail,
  setInstallments,
} from '../store/slices/checkout.slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { colors, radius, spacing, typography } from '../theme';
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  lastFour,
  parseExpiry,
} from '../utils/card';
import { isValidLuhn } from '../utils/luhn';
import { BrandLogo } from './BrandLogo';
import { PrimaryButton } from './PrimaryButton';

const INSTALLMENT_OPTIONS = [1, 3, 6, 12, 24, 36];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CardFormProps {
  onTokenized: () => void;
  onError: (message: string) => void;
}

/**
 * Screen 5 (backdrop content). Validates the card locally (Luhn + BIN brand
 * detection + expiry/CVC), tokenizes against the gateway with the public key
 * and stores ONLY the token + display metadata. The PAN/CVC never leave this
 * component's local state.
 */
export function CardForm({ onTokenized, onError }: CardFormProps) {
  const dispatch = useAppDispatch();
  const rememberedEmail = useAppSelector(
    state => state.checkout.customerEmail,
  );

  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [holder, setHolder] = useState('');
  const [email, setEmail] = useState(rememberedEmail);
  const [installments, setLocalInstallments] = useState(1);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const brand = detectCardBrand(number);
  const numberValid = isValidLuhn(number);
  const expiryParsed = parseExpiry(expiry);
  const cvcValid = /^\d{3,4}$/.test(cvc);
  const holderValid = holder.trim().length >= 3;
  const emailValid = EMAIL_REGEX.test(email);

  const formValid = useMemo(
    () =>
      numberValid &&
      expiryParsed !== null &&
      cvcValid &&
      holderValid &&
      emailValid,
    [numberValid, expiryParsed, cvcValid, holderValid, emailValid],
  );

  const markTouched = (field: string) =>
    setTouched(previous => ({ ...previous, [field]: true }));

  const showError = (field: string, valid: boolean) =>
    touched[field] === true && !valid;

  const submit = async () => {
    if (!formValid || !expiryParsed) {
      return;
    }
    setSubmitting(true);
    try {
      const token = await tokenizeCard({
        number,
        cvc,
        expMonth: expiryParsed.month,
        expYear: expiryParsed.year,
        cardHolder: holder.trim(),
      });
      dispatch(setCardToken(token));
      dispatch(
        setCardMeta({ brand, lastFour: lastFour(number), holder: holder.trim() }),
      );
      dispatch(setCustomerEmail(email));
      dispatch(setInstallments(installments));
      onTokenized();
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'La tarjeta no pudo ser validada',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text style={styles.label}>Número de tarjeta</Text>
      <View style={styles.numberRow}>
        <TextInput
          testID="card-number"
          style={[
            styles.input,
            styles.numberInput,
            showError('number', numberValid) && styles.inputError,
          ]}
          value={number}
          onChangeText={value => setNumber(formatCardNumber(value))}
          onBlur={() => markTouched('number')}
          keyboardType="number-pad"
          placeholder="4242 4242 4242 4242"
          placeholderTextColor={colors.muted}
          maxLength={23}
        />
        <BrandLogo brand={brand} />
      </View>
      {showError('number', numberValid) ? (
        <Text style={styles.error} testID="error-number">
          Número de tarjeta inválido
        </Text>
      ) : null}

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Vence (MM/AA)</Text>
          <TextInput
            testID="card-expiry"
            style={[
              styles.input,
              showError('expiry', expiryParsed !== null) && styles.inputError,
            ]}
            value={expiry}
            onChangeText={value => setExpiry(formatExpiry(value))}
            onBlur={() => markTouched('expiry')}
            keyboardType="number-pad"
            placeholder="12/29"
            placeholderTextColor={colors.muted}
            maxLength={5}
          />
          {showError('expiry', expiryParsed !== null) ? (
            <Text style={styles.error} testID="error-expiry">
              Fecha inválida
            </Text>
          ) : null}
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>CVC</Text>
          <TextInput
            testID="card-cvc"
            style={[
              styles.input,
              showError('cvc', cvcValid) && styles.inputError,
            ]}
            value={cvc}
            onChangeText={value => setCvc(value.replace(/\D/g, '').slice(0, 4))}
            onBlur={() => markTouched('cvc')}
            keyboardType="number-pad"
            placeholder="123"
            placeholderTextColor={colors.muted}
            secureTextEntry
            maxLength={4}
          />
          {showError('cvc', cvcValid) ? (
            <Text style={styles.error} testID="error-cvc">
              CVC inválido
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.label}>Titular</Text>
      <TextInput
        testID="card-holder"
        style={[
          styles.input,
          showError('holder', holderValid) && styles.inputError,
        ]}
        value={holder}
        onChangeText={setHolder}
        onBlur={() => markTouched('holder')}
        placeholder="Como aparece en la tarjeta"
        placeholderTextColor={colors.muted}
        autoCapitalize="characters"
      />
      {showError('holder', holderValid) ? (
        <Text style={styles.error} testID="error-holder">
          Nombre del titular requerido
        </Text>
      ) : null}

      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput
        testID="card-email"
        style={[
          styles.input,
          showError('email', emailValid) && styles.inputError,
        ]}
        value={email}
        onChangeText={setEmail}
        onBlur={() => markTouched('email')}
        placeholder="tucorreo@ejemplo.com"
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {showError('email', emailValid) ? (
        <Text style={styles.error} testID="error-email">
          Correo inválido
        </Text>
      ) : null}

      <Text style={styles.label}>Cuotas</Text>
      <View style={styles.installments}>
        {INSTALLMENT_OPTIONS.map(option => (
          <Pressable
            key={option}
            testID={`installments-${option}`}
            accessibilityRole="button"
            accessibilityState={{ selected: installments === option }}
            onPress={() => setLocalInstallments(option)}
            style={[
              styles.chip,
              installments === option && styles.chipSelected,
            ]}>
            <Text
              style={[
                styles.chipText,
                installments === option && styles.chipTextSelected,
              ]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <PrimaryButton
        testID="card-submit"
        label="Continuar al resumen"
        onPress={() => void submit()}
        disabled={!formValid}
        loading={submitting}
        style={styles.submit}
      />
      <Text style={styles.disclaimer}>
        Tus datos se tokenizan de forma segura; nunca almacenamos el número de
        tu tarjeta.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.sm + 2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  numberInput: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  installments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minWidth: 44,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  chipTextSelected: {
    color: colors.primary,
  },
  submit: {
    marginTop: spacing.lg,
  },
  disclaimer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
