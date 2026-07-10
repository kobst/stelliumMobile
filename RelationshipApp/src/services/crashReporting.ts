// Firebase Crashlytics wrapper. The module is lazy-required (same pattern as
// the optional sign-in modules in SignInScreen) so the app still runs before
// `npm install` + `pod install` have picked up the native dependency.

interface CrashlyticsModule {
  getCrashlytics: () => unknown;
  log: (instance: unknown, message: string) => void;
  recordError: (instance: unknown, error: Error, jsErrorName?: string) => void;
}

let crashlyticsModule: CrashlyticsModule | null = null;
try {
  crashlyticsModule = require('@react-native-firebase/crashlytics');
} catch {
  // Crashlytics not installed; crash reporting disabled.
}

export function isCrashReportingAvailable(): boolean {
  return crashlyticsModule !== null;
}

export function recordError(error: Error, context?: string): void {
  if (!crashlyticsModule) {
    return;
  }
  try {
    const instance = crashlyticsModule.getCrashlytics();
    if (context) {
      crashlyticsModule.log(instance, context);
    }
    crashlyticsModule.recordError(instance, error);
  } catch {
    // Crash reporting must never crash the app.
  }
}
