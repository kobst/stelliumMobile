// Strips console.* from release bundles (Metro sets the babel env to
// "production" when bundling with --dev false). console.error is kept so
// genuine failures still reach the native log. The plugin is optional until
// `npm install` runs; without it release builds simply keep their logs.
function releasePlugins() {
  try {
    require.resolve('babel-plugin-transform-remove-console');
    return [['transform-remove-console', { exclude: ['error'] }]];
  } catch {
    return [];
  }
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    production: {
      plugins: releasePlugins(),
    },
  },
};
