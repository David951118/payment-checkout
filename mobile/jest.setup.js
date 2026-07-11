/* eslint-env jest */
// Official AsyncStorage in-memory mock (exposed at the /jest export path).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

// SafeAreaProvider renders no children in jest until native insets arrive;
// the library ships an official mock with static metrics.
jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock.default ?? mock;
});
