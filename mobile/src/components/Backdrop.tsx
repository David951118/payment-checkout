import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface BackdropProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Blocks the scrim/close button while a payment is in flight. */
  dismissable?: boolean;
}

/**
 * Material-style backdrop: a scrimmed back layer with an animated front
 * sheet (rounded top corners + drag handle) sliding from the bottom.
 */
export function Backdrop({
  visible,
  title,
  onClose,
  children,
  dismissable = true,
}: BackdropProps) {
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    } else {
      translateY.setValue(height);
    }
  }, [visible, height, translateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissable ? onClose : () => {}}>
      <View style={styles.scrim}>
        <Pressable
          testID="backdrop-scrim"
          style={StyleSheet.absoluteFill}
          onPress={dismissable ? onClose : undefined}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.avoider}
          pointerEvents="box-none">
          <Animated.View
            testID="backdrop-sheet"
            style={[
              styles.sheet,
              { maxHeight: height * 0.88, transform: [{ translateY }] },
            ]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={typography.title}>{title}</Text>
              {dismissable ? (
                <Pressable
                  testID="backdrop-close"
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                  onPress={onClose}
                  hitSlop={12}>
                  <Text style={styles.close}>✕</Text>
                </Pressable>
              ) : null}
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  avoider: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  close: {
    fontSize: 18,
    color: colors.muted,
    padding: spacing.xs,
  },
});
