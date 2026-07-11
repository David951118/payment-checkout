module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // `void somePromise` marks intentionally fire-and-forget promises.
    'no-void': ['warn', { allowAsStatement: true }],
  },
};
