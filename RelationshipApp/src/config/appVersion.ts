// App version label sourced from the native binary (MARKETING_VERSION /
// versionName). react-native-device-info is lazy-required (crashReporting
// pattern) so the app still runs before `npm install` + `pod install` have
// picked up the native dependency.

import { relationshipAppEnv } from './env';

interface DeviceInfoModule {
  getVersion: () => string;
  getBuildNumber: () => string;
}

let deviceInfo: DeviceInfoModule | null = null;
try {
  const mod = require('react-native-device-info');
  deviceInfo = mod?.default ?? mod;
} catch {
  // Not installed; the label falls back to the app name.
}

export function getAppVersionLabel(): string {
  const envSuffix = relationshipAppEnv.env === 'production' ? '' : ' (dev)';
  if (!deviceInfo) {
    return `Iris${envSuffix}`;
  }
  try {
    const version = deviceInfo.getVersion();
    const build = deviceInfo.getBuildNumber();
    return `Iris v${version} (${build})${envSuffix}`;
  } catch {
    return `Iris${envSuffix}`;
  }
}
