module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    // Tests run on the example config so a fresh clone (no local env.ts)
    // passes without any setup step.
    '^(.*)/config/env$': '<rootDir>/src/config/env.example.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|react-native-safe-area-context|react-native-screens|@react-native(-community)?|@react-native-async-storage/async-storage|@react-navigation|@reduxjs/toolkit|immer|redux|react-redux|redux-persist)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'App.tsx',
    '!src/config/**', // local env values, nothing to test
    '!src/domain/types.ts', // type-only module
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
