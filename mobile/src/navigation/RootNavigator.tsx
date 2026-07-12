import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { TransactionStatusScreen } from '../screens/TransactionStatusScreen';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '800', color: colors.primary },
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'tiendaprueba.com', headerBackVisible: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Producto' }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen
        name="TransactionStatus"
        component={TransactionStatusScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
