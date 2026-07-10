const fs = require('fs');

function isRemoveConsoleInstalled(): boolean {
  try {
    require('babel-plugin-transform-remove-console');
    return true;
  } catch {
    return false;
  }
}

describe('release console stripping', () => {
  it('configures transform-remove-console for production builds (keeping console.error)', () => {
    const config = require('../babel.config.js');
    const plugins = config.env.production.plugins;
    if (isRemoveConsoleInstalled()) {
      expect(plugins).toEqual([['transform-remove-console', { exclude: ['error'] }]]);
    } else {
      // Graceful pre-install: config must still load with an empty plugin list.
      expect(plugins).toEqual([]);
    }
  });

  it('lists the plugin as a devDependency so release builds strip logs once installed', () => {
    const pkg = require('../package.json');
    expect(pkg.devDependencies['babel-plugin-transform-remove-console']).toBeDefined();
  });

  it('has no un-gated full-payload console logging in the sensitive paths', () => {
    // Paths relative to the repo root, where jest runs.
    const sensitiveFiles = [
      'shared/api/users.ts',
      'RelationshipApp/src/screens/ProfileRevealScreen.tsx',
      'RelationshipApp/src/screens/CreateSelfProfileScreen.tsx',
    ];
    for (const file of sensitiveFiles) {
      const source = fs.readFileSync(file, 'utf8');
      expect(source).not.toMatch(/console\.log/);
      expect(source).not.toMatch(/console\.[a-z]+\([^)]*JSON\.stringify/);
    }
  });
});
