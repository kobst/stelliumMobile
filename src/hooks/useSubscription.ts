/**
 * useSubscription Hook
 *
 * Provides subscription-related functionality to components:
 * - Feature gating
 * - Usage tracking
 * - Limit checking
 * - Paywall triggering
 */

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { subscriptionsApi } from '../api/subscriptions';
import { superwallService } from '../services/SuperwallService';
import {
  SUBSCRIPTION_PLANS,
  UsageMetric,
  FeatureKey,
  isWithinLimit,
  isUnlimited,
} from '../config/subscriptionConfig';
import { SubscriptionTier } from '../types';

export interface UseSubscriptionResult {
  // Current state
  tier: SubscriptionTier;
  isLoading: boolean;
  error: string | null;

  // Feature checks
  hasFeature: (feature: FeatureKey) => boolean;
  canPerformAction: (metric: UsageMetric) => boolean;

  // Usage tracking
  trackUsage: (metric: UsageMetric, increment?: number) => Promise<boolean>;
  getUsage: (metric: UsageMetric) => {
    used: number;
    limit: number | 'unlimited';
    remaining: number | 'unlimited';
    percentage: number;
  };

  // Paywall triggers
  showUpgradePaywall: (source?: string) => Promise<void>;
  showLimitReachedPaywall: (metric: UsageMetric) => Promise<void>;

  // Subscription management
  refreshSubscription: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionResult {
  const {
    userId,
    userSubscription,
    usageMetrics,
    entitlements,
    updateSubscriptionData,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current tier (default to free)
  const tier: SubscriptionTier = userSubscription?.tier || 'free';

  /**
   * Check if user has access to a specific feature
   */
  const hasFeature = useCallback(
    (feature: FeatureKey): boolean => {
      if (!entitlements) {
        // Fall back to plan config if entitlements not loaded
        return SUBSCRIPTION_PLANS[tier].features[feature];
      }

      // Map feature keys to entitlement fields
      const featureMap: Record<FeatureKey, keyof typeof entitlements> = {
        weeklyHoroscope: 'canAccessWeeklyHoroscope',
        dailyHoroscope: 'canAccessDailyHoroscope',
        monthlyHoroscope: 'canAccessMonthlyHoroscope',
        natalReport: 'canGenerateNatalReport',
        compatibilityReport: 'canGenerateCompatibilityReport',
        quickCharts: 'canCreateQuickCharts',
        quickMatches: 'canCreateQuickMatches',
        transitChat: 'canUseTransitChat',
        chartChat: 'canUseChartChat',
        relationshipChat: 'canUseRelationshipChat',
        unlimitedActions: 'hasUnlimitedCharts', // Pro feature
      };

      const entitlementKey = featureMap[feature];
      return entitlements[entitlementKey] === true;
    },
    [tier, entitlements]
  );

  /**
   * Check if user can perform an action (based on usage limits)
   */
  const canPerformAction = useCallback(
    (metric: UsageMetric): boolean => {
      if (!usageMetrics || !entitlements) {
        return false;
      }

      const limit = entitlements[`${metric}Limit` as keyof typeof entitlements];

      if (isUnlimited(limit as any)) {
        return true;
      }

      const currentUsage = usageMetrics[`${metric}Used` as keyof typeof usageMetrics] as number;

      return isWithinLimit(currentUsage, limit as number);
    },
    [usageMetrics, entitlements]
  );

  /**
   * Get usage statistics for a metric
   */
  const getUsage = useCallback(
    (metric: UsageMetric) => {
      if (!usageMetrics || !entitlements) {
        return {
          used: 0,
          limit: 0,
          remaining: 0,
          percentage: 0,
        };
      }

      const used = usageMetrics[`${metric}Used` as keyof typeof usageMetrics] as number;
      const limit = entitlements[`${metric}Limit` as keyof typeof entitlements];

      if (isUnlimited(limit as any)) {
        return {
          used,
          limit: 'unlimited' as const,
          remaining: 'unlimited' as const,
          percentage: 0,
        };
      }

      const limitNum = limit as number;
      const remaining = Math.max(0, limitNum - used);
      const percentage = limitNum > 0 ? (used / limitNum) * 100 : 0;

      return {
        used,
        limit: limitNum,
        remaining,
        percentage,
      };
    },
    [usageMetrics, entitlements]
  );

  /**
   * Track usage for a metric
   * Returns true if action was allowed, false if limit reached
   */
  const trackUsage = useCallback(
    async (metric: UsageMetric, increment: number = 1): Promise<boolean> => {
      if (!userId) {
        console.error('[useSubscription] No user ID available');
        return false;
      }

      // Check if action is allowed
      if (!canPerformAction(metric)) {
        console.log('[useSubscription] Action not allowed, limit reached for:', metric);
        await showLimitReachedPaywall(metric);
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Update usage via API
        const response = await subscriptionsApi.updateUsageMetric(userId, {
          metric,
          increment,
        });

        // Update store
        updateSubscriptionData({
          usage: response.usage,
        });

        // If limit reached after this action, optionally show paywall
        if (response.limitReached) {
          console.log('[useSubscription] Limit reached after action:', metric);
          // Don't block the action, but could show a warning banner
        }

        return true;
      } catch (err: any) {
        console.error('[useSubscription] Failed to track usage:', err);
        setError(err.message || 'Failed to track usage');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, canPerformAction, updateSubscriptionData]
  );

  /**
   * Show upgrade paywall
   */
  const showUpgradePaywall = useCallback(
    async (source?: string): Promise<void> => {
      try {
        await superwallService.showUpgradePaywall(source);
      } catch (err: any) {
        console.error('[useSubscription] Failed to show upgrade paywall:', err);
        setError(err.message || 'Failed to show paywall');
      }
    },
    []
  );

  /**
   * Show paywall when limit is reached for a specific metric
   */
  const showLimitReachedPaywall = useCallback(
    async (metric: UsageMetric): Promise<void> => {
      const usage = getUsage(metric);

      try {
        switch (metric) {
          case 'quickCharts':
            await superwallService.showChartLimitPaywall(
              usage.used,
              usage.limit as number
            );
            break;
          case 'quickMatches':
            await superwallService.showRelationshipLimitPaywall(
              usage.used,
              usage.limit as number
            );
            break;
          case 'reports':
            await superwallService.showReportLimitPaywall(
              usage.used,
              usage.limit as number
            );
            break;
          case 'chatQuestions':
            await superwallService.showChatLimitPaywall(
              usage.used,
              usage.limit as number
            );
            break;
        }
      } catch (err: any) {
        console.error('[useSubscription] Failed to show limit paywall:', err);
        setError(err.message || 'Failed to show paywall');
      }
    },
    [getUsage]
  );

  /**
   * Refresh subscription data from backend
   */
  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!userId) {
      console.error('[useSubscription] No user ID available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await subscriptionsApi.getSubscriptionStatus(userId);

      updateSubscriptionData({
        subscription: response.subscription,
        usage: response.usage,
        entitlements: response.entitlements,
      });

      // Update Superwall user attributes
      await superwallService.updateUserAttributesFromStore();
    } catch (err: any) {
      console.error('[useSubscription] Failed to refresh subscription:', err);
      setError(err.message || 'Failed to refresh subscription');
    } finally {
      setIsLoading(false);
    }
  }, [userId, updateSubscriptionData]);

  // Auto-refresh subscription on mount if not loaded
  useEffect(() => {
    if (userId && !userSubscription) {
      refreshSubscription();
    }
  }, [userId, userSubscription, refreshSubscription]);

  return {
    tier,
    isLoading,
    error,
    hasFeature,
    canPerformAction,
    trackUsage,
    getUsage,
    showUpgradePaywall,
    showLimitReachedPaywall,
    refreshSubscription,
  };
}
