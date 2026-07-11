/**
 * @format
 */

// Polyfill for crypto.getRandomValues, required by crypto-js (AES salt
// generation) on React Native. Must load before anything imports crypto-js.
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
