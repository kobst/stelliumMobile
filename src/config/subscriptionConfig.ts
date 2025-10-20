/**
 * Subscription Configuration
 *
 * Defines all subscription plans, limits, features, and pricing for the Stellium app.
 */

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface SubscriptionPlanConfig {
  id: SubscriptionTier;
  name: string;
  displayName: string;
  price: number;
  priceDisplay: string;
  billingPeriod: 'month' | 'year';

  // Usage limits
  limits: {
    quickCharts: number | 'unlimited';
    quickMatches: number | 'unlimited';
    reports: number;
    chatQuestions: number | 'unlimited';
  };

  // Feature entitlements
  features: {
    // Horoscopes
    weeklyHoroscope: boolean;
    dailyHoroscope: boolean;
    monthlyHoroscope: boolean;

    // Reports
    natalReport: boolean;
    compatibilityReport: boolean;

    // Charts
    quickCharts: boolean;
    quickMatches: boolean;

    // Chat
    transitChat: boolean;
    chartChat: boolean;
    relationshipChat: boolean;

    // Misc
    unlimitedActions: boolean;
  };

  // RevenueCat product identifier
  revenueCatProductId: string;

  // Superwall paywall identifier
  superwallPaywallId: string;

  // Description for UI
  description: string[];
}

/**
 * All subscription plan configurations
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlanConfig> = {
  free: {
    id: 'free',
    name: 'FREE',
    displayName: 'Free Plan',
    price: 0,
    priceDisplay: 'Free',
    billingPeriod: 'month',
    limits: {
      quickCharts: 5,
      quickMatches: 5,
      reports: 0,
      chatQuestions: 0,
    },
    features: {
      weeklyHoroscope: true,
      dailyHoroscope: false,
      monthlyHoroscope: false,
      natalReport: false,
      compatibilityReport: false,
      quickCharts: true,
      quickMatches: true,
      transitChat: false,
      chartChat: false,
      relationshipChat: false,
      unlimitedActions: false,
    },
    revenueCatProductId: 'free_plan',
    superwallPaywallId: 'free_upgrade',
    description: [
      'Your Quick Chart (at signup)',
      'Weekly horoscope (personalized)',
      'Any mix of 5 Quick Charts (guests) or Quick Matches (relationships/celebs) per month',
      'No chat. Upgrade for daily/monthly, Reports, and chat.',
    ],
  },

  premium: {
    id: 'premium',
    name: 'PREMIUM',
    displayName: 'Premium Plan',
    price: 20,
    priceDisplay: '$20/month',
    billingPeriod: 'month',
    limits: {
      quickCharts: 10,
      quickMatches: 10,
      reports: 2,
      chatQuestions: 100,
    },
    features: {
      weeklyHoroscope: true,
      dailyHoroscope: true,
      monthlyHoroscope: true,
      natalReport: true,
      compatibilityReport: true,
      quickCharts: true,
      quickMatches: true,
      transitChat: true,
      chartChat: true,
      relationshipChat: true,
      unlimitedActions: false,
    },
    revenueCatProductId: 'premium_monthly',
    superwallPaywallId: 'premium_paywall',
    description: [
      'Your Natal Report included',
      'Daily + Weekly + Monthly horoscopes',
      '2 Reports/mo — Natal or Compatibility (roll for 3 months)',
      '10 Quick Charts or Quick Matches per month',
      '100 AI chat questions per month: Transit Chat + Chart Chat (for anyone with a Natal Report) + Relationship Chat (for any pair with a Compatibility Report)',
    ],
  },

  pro: {
    id: 'pro',
    name: 'PRO',
    displayName: 'Pro Plan',
    price: 49,
    priceDisplay: '$49/month',
    billingPeriod: 'month',
    limits: {
      quickCharts: 'unlimited',
      quickMatches: 'unlimited',
      reports: 10,
      chatQuestions: 'unlimited',
    },
    features: {
      weeklyHoroscope: true,
      dailyHoroscope: true,
      monthlyHoroscope: true,
      natalReport: true,
      compatibilityReport: true,
      quickCharts: true,
      quickMatches: true,
      transitChat: true,
      chartChat: true,
      relationshipChat: true,
      unlimitedActions: true,
    },
    revenueCatProductId: 'pro_monthly',
    superwallPaywallId: 'pro_paywall',
    description: [
      'Everything in Premium',
      '10 Reports/mo (roll for 3 months)',
      'Unlimited Quick actions (Quick Charts & Quick Matches)',
      'Unlimited chat cap',
    ],
  },
};

/**
 * Default plan for new users
 */
export const DEFAULT_PLAN: SubscriptionTier = 'free';

/**
 * Feature keys that can be checked for entitlements
 */
export type FeatureKey = keyof SubscriptionPlanConfig['features'];

/**
 * Usage metric types
 */
export type UsageMetric = 'quickCharts' | 'quickMatches' | 'reports' | 'chatQuestions';

/**
 * Helper function to get plan configuration
 */
export function getPlanConfig(tier: SubscriptionTier): SubscriptionPlanConfig {
  return SUBSCRIPTION_PLANS[tier];
}

/**
 * Helper function to check if a feature is available in a plan
 */
export function hasFeature(tier: SubscriptionTier, feature: FeatureKey): boolean {
  return SUBSCRIPTION_PLANS[tier].features[feature];
}

/**
 * Helper function to get usage limit for a metric
 */
export function getLimit(tier: SubscriptionTier, metric: UsageMetric): number | 'unlimited' {
  return SUBSCRIPTION_PLANS[tier].limits[metric];
}

/**
 * Helper function to check if limit is unlimited
 */
export function isUnlimited(limit: number | 'unlimited'): boolean {
  return limit === 'unlimited';
}

/**
 * Helper function to check if usage is within limit
 */
export function isWithinLimit(
  currentUsage: number,
  limit: number | 'unlimited'
): boolean {
  if (isUnlimited(limit)) {
    return true;
  }
  return currentUsage < (limit as number);
}

/**
 * Superwall paywall event types
 */
export const PAYWALL_EVENTS = {
  CHART_LIMIT_REACHED: 'chart_limit_reached',
  RELATIONSHIP_LIMIT_REACHED: 'relationship_limit_reached',
  CHAT_LIMIT_REACHED: 'chat_limit_reached',
  REPORT_LIMIT_REACHED: 'report_limit_reached',
  HOROSCOPE_LOCKED: 'horoscope_locked',
  UPGRADE_PROMPT: 'upgrade_prompt',
  SETTINGS_UPGRADE: 'settings_upgrade',
} as const;

export type PaywallEvent = typeof PAYWALL_EVENTS[keyof typeof PAYWALL_EVENTS];
