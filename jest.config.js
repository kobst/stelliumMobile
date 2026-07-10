module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@react-native-firebase|@react-native-google-signin|@invertase|react-native-config|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-reanimated|react-native-purchases|react-native-image-picker|react-native-blob-util)/)',
  ],
};
