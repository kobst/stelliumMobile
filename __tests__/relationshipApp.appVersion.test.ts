type LoadOptions = {
  env?: string;
  deviceInfo?: { getVersion: () => string; getBuildNumber: () => string } | null;
};

// `virtual` is required while react-native-device-info is not installed, but
// once it exists on disk a virtual mock no longer matches the resolved path —
// so only use it when the module is genuinely absent.
let deviceInfoMockOpts: { virtual: true } | undefined;
try {
  require('react-native-device-info/package.json');
  deviceInfoMockOpts = undefined;
} catch {
  deviceInfoMockOpts = { virtual: true };
}

function loadLabel({ env = 'development', deviceInfo = null }: LoadOptions = {}): string {
  let label = '';
  jest.isolateModules(() => {
    jest.doMock('../RelationshipApp/src/config/env', () => ({
      relationshipAppEnv: { env },
    }));
    if (deviceInfo) {
      jest.doMock(
        'react-native-device-info',
        () => ({ __esModule: true, default: deviceInfo }),
        deviceInfoMockOpts
      );
    } else {
      // Simulate the module being absent even when it is installed (CI).
      jest.doMock(
        'react-native-device-info',
        () => {
          throw new Error('react-native-device-info not installed');
        },
        deviceInfoMockOpts
      );
    }
    label = require('../RelationshipApp/src/config/appVersion').getAppVersionLabel();
  });
  return label;
}

afterEach(() => {
  jest.resetModules();
  jest.dontMock('react-native-device-info');
  jest.dontMock('../RelationshipApp/src/config/env');
});

describe('getAppVersionLabel', () => {
  it('derives the label from native version info when device-info is available', () => {
    const label = loadLabel({
      env: 'production',
      deviceInfo: { getVersion: () => '1.2.0', getBuildNumber: () => '34' },
    });
    expect(label).toBe('Iris v1.2.0 (34)');
  });

  it('appends a dev suffix outside production', () => {
    const label = loadLabel({
      env: 'development',
      deviceInfo: { getVersion: () => '1.2.0', getBuildNumber: () => '34' },
    });
    expect(label).toBe('Iris v1.2.0 (34) (dev)');
  });

  it('falls back to the app name when the native module is missing', () => {
    const label = loadLabel({ env: 'production' });
    expect(label).toBe('Iris');
    // No stale hardcoded version may reappear.
    expect(label).not.toContain('v0.1');
  });
});
