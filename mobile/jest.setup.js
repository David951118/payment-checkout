/* eslint-env jest */
// Official AsyncStorage in-memory mock (exposed at the /jest export path).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);
