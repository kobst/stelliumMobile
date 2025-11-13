/**
 * Feature Flags Configuration
 *
 * Centralized management of feature flags for the Stellium app.
 * Toggle features on/off for testing, gradual rollouts, or A/B testing.
 */

export type SubscriptionTierOverride = 'free' | 'premium' | 'pro' | null;

export interface FeatureFlags {
  // Navigation features
  enableCelebrityTab: boolean;

  // Testing features
  // Set to 'free', 'premium', 'pro' to force a specific tier, or null for real subscription status
  forceSubscriptionTier: SubscriptionTierOverride;

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

  // Subscription tier override for testing paywalls
  // Set to 'free' to test free user experience and paywalls
  // Set to 'premium' to test premium user experience
  // Set to 'pro' to test pro user experience
  // Set to null to use real subscription status from RevenueCat/backend
  forceSubscriptionTier: null,
};

/**
 * Helper function to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[feature];
}
