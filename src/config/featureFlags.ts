/**
 * Feature Flags Configuration
 *
 * Centralized management of feature flags for the Stellium app.
 * Toggle features on/off for testing, gradual rollouts, or A/B testing.
 */

export interface FeatureFlags {
  // Navigation features
  enableCelebrityTab: boolean;

  // Add more feature flags here as needed
  // enableNewHoroscopeUI: boolean;
  // enableBetaFeatures: boolean;
}

/**
 * Default feature flag values
 * Set to true to enable a feature, false to disable
 */
export const FEATURE_FLAGS: FeatureFlags = {
  enableCelebrityTab: false, // Set to false to hide Celebrity tab from bottom navigation
};

/**
 * Helper function to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[feature];
}
