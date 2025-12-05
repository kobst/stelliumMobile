/**
 * Subscription Configuration
 *
 * Defines all subscription plans, credit costs, features, and pricing for the Stellium app.
 * Updated to use credit-based system instead of individual feature limits.
 */

import Config from 'react-native-config';

// Determine if we're in production based on environment
const isProduction = Config.ENV === 'production';

// Product ID prefix based on environment
const PRODUCT_PREFIX = isProduction ? 'com.stelliumapp' : 'com.stelliumapp.dev';

export type SubscriptionTier = 'free' | 'premium' | 'pro';

/**
 * Credit costs for each action type
 */
export const CREDIT_COSTS = {
  quickChartOverview: 10,
  fullNatalReport: 75,
  relationshipOverview: 10,
  fullRelationshipReport: 60,
  askStelliumQuestion: 1,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/**
 * Monthly credit allotments per tier
 */
export const TIER_CREDITS: Record<SubscriptionTier, number> = {
  free: 10,
  premium: 200,
  pro: 1000,
};

/**
 * A-la-carte credit pack configurations
 */
export interface CreditPack {
  id: string;
  credits: number;
  price: number;
  priceDisplay: string;
  revenueCatProductId: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'small',
    credits: 75,
    price: 9.99,
    priceDisplay: '$9.99',
    revenueCatProductId: `${PRODUCT_PREFIX}.credits.small`,
  },
  {
    id: 'medium',
    credits: 200,
    price: 24.99,
    priceDisplay: '$24.99',
    revenueCatProductId: `${PRODUCT_PREFIX}.credits.medium`,
  },
  {
    id: 'large',
    credits: 500,
    price: 49.99,
    priceDisplay: '$49.99',
    revenueCatProductId: `${PRODUCT_PREFIX}.credits.large`,
  },
];

export interface SubscriptionPlanConfig {
  id: SubscriptionTier;
  name: string;
  displayName: string;
  price: number;
  priceDisplay: string;
  billingPeriod: 'month' | 'year';

  // Monthly credit allotment
  monthlyCredits: number;

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
    monthlyCredits: 10,
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
      '10 Credits per Month',
      'Weekly horoscope (personalized)',
      'Quick Chart Overview: 10 credits',
      'Full Natal Report: 75 credits',
      'Relationship Overview: 10 credits',
      'Full Relationship Report: 60 credits',
      'Ask Stellium: 1 credit/question',
    ],
  },

  premium: {
    id: 'premium',
    name: 'PREMIUM',
    displayName: 'Premium Plan',
    price: 19.99,
    priceDisplay: '$19.99/month',
    billingPeriod: 'month',
    monthlyCredits: 200,
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
    revenueCatProductId: `${PRODUCT_PREFIX}.premium.monthly`,
    superwallPaywallId: 'premium_paywall',
    description: [
      '200 Credits per Month',
      'Daily + Weekly + Monthly horoscopes',
      'Quick Chart Overview: 10 credits',
      'Full Natal Report: 75 credits',
      'Relationship Overview: 10 credits',
      'Full Relationship Report: 60 credits',
      'Ask Stellium: 1 credit/question',
    ],
  },

  pro: {
    id: 'pro',
    name: 'PRO',
    displayName: 'Pro Plan',
    price: 49.99,
    priceDisplay: '$49.99/month',
    billingPeriod: 'month',
    monthlyCredits: 1000,
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
    revenueCatProductId: `${PRODUCT_PREFIX}.pro.monthly`,
    superwallPaywallId: 'pro_paywall',
    description: [
      '1000 Credits per Month',
      'Effectively Unlimited Use',
      'All Premium Features',
      'Perfect for astrologers & professionals',
    ],
  },
};

/**
 * Helper function to get credit cost for an action
 */
export function getCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action];
}

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
