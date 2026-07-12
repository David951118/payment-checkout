import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProductCard } from '../components/ProductCard';
import { useToast } from '../components/Toast';
import type { Product } from '../domain/types';
import type { ScreenProps } from '../navigation/types';
import { fetchProducts } from '../store/slices/products.slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { colors, radius, spacing, typography } from '../theme';

/** Screen 2. Product catalog with price, image and live stock. */
export function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { items, loading, error } = useAppSelector(state => state.products);
  const { showToast } = useToast();

  // Refetch on every focus: stock changes after each purchase.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void dispatch(fetchProducts());
    });
    return unsubscribe;
  }, [navigation, dispatch]);

  useEffect(() => {
    if (error) {
      showToast(error);
    }
  }, [error, showToast]);

  const openProduct = useCallback(
    (product: Product) =>
      navigation.navigate('ProductDetail', { productId: product.id }),
    [navigation],
  );

  let content: React.ReactNode;
  if (loading && items.length === 0) {
    content = (
      <View style={styles.center} testID="home-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  } else if (error && items.length === 0) {
    content = (
      <View style={styles.center} testID="home-error">
        <Text style={styles.errorTitle}>No pudimos cargar los productos</Text>
        <Text style={typography.caption}>{error}</Text>
        <PrimaryButton
          label="Reintentar"
          style={styles.retry}
          onPress={() => {
            void dispatch(fetchProducts());
          }}
        />
      </View>
    );
  } else {
    content = (
      <FlatList
        testID="home-list"
        data={items}
        numColumns={2}
        keyExtractor={product => product.id}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.column}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              void dispatch(fetchProducts());
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={openProduct} />
        )}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.heroGlow} />
        <View style={styles.heroGlowSmall} />
        <Text style={styles.brand} accessibilityRole="header">
          tiendaprueba<Text style={styles.brandAccent}>.com</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          Elige un producto para comprar
        </Text>
      </View>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md + spacing.xs,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl + 4,
    borderBottomRightRadius: radius.xl + 4,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(0, 212, 138, 0.16)',
    top: -70,
    right: -45,
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    bottom: -45,
    left: -25,
  },
  brand: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  brandAccent: {
    color: colors.accent,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  list: {
    padding: spacing.sm + 2,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  column: {
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  retry: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
