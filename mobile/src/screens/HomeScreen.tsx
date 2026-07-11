import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProductCard } from '../components/ProductCard';
import { useToast } from '../components/Toast';
import type { Product } from '../domain/types';
import type { ScreenProps } from '../navigation/types';
import { fetchProducts } from '../store/slices/products.slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { colors, spacing, typography } from '../theme';

/** Screen 2. Product catalog with price, image and live stock. */
export function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const dispatch = useAppDispatch();
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

  if (loading && items.length === 0) {
    return (
      <View style={styles.center} testID="home-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.center} testID="home-error">
        <Text style={styles.errorTitle}>No pudimos cargar los productos</Text>
        <Text style={typography.caption}>{error}</Text>
        <PrimaryButton
          label="Reintentar"
          style={styles.retry}
          onPress={() => void dispatch(fetchProducts())}
        />
      </View>
    );
  }

  return (
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
          onRefresh={() => void dispatch(fetchProducts())}
          tintColor={colors.primary}
        />
      }
      renderItem={({ item }) => (
        <ProductCard product={item} onPress={openProduct} />
      )}
      ListHeaderComponent={
        <Text style={styles.header}>Elige un producto para comprar</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.sm + 2,
    paddingBottom: spacing.xl,
  },
  column: {
    justifyContent: 'space-between',
  },
  header: {
    ...typography.caption,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
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
