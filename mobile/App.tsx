import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ToastProvider } from './src/components/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { persistor, store } from './src/store/app-store';

function App() {
  return (
    <Provider store={store}>
      {/* PersistGate: the UI only mounts after the encrypted state has been
          rehydrated, so an interrupted payment is always restored. */}
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <ToastProvider>
            <StatusBar barStyle="dark-content" />
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </ToastProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
