/**
 * Custom hook that returns the effective subscription tier
 * taking into account feature flags for testing
 */

import { useStore } from '../store';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { UserSubscription, SubscriptionTier } from '../types';

export function useEffectiveSubscription(): UserSubscription | null {
  const { userSubscription } = useStore();

  // If forceSubscriptionTier is set, override the tier
  const forcedTier = FEATURE_FLAGS.forceSubscriptionTier;
  if (forcedTier !== null && userSubscription) {
    return {
      ...userSubscription,
      tier: forcedTier as SubscriptionTier,
    };
  }

  return userSubscription;
}

export function useEffectiveTier(): SubscriptionTier {
  const effectiveSubscription = useEffectiveSubscription();
  return effectiveSubscription?.tier || 'free';
}
