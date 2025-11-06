/**
 * Subscriptions API
 *
 * Handles all subscription-related backend API calls including:
 * - Fetching subscription status
 * - Getting and updating usage metrics
 * - Syncing RevenueCat purchases
 * - Managing entitlements
 */

import {apiClient} from './client';
import {
  UserSubscription,
  UsageMetrics,
  SubscriptionEntitlements,
  SubscriptionTier,
} from '../types';
import {UsageMetric} from '../config/subscriptionConfig';

// ==================== Request/Response Types ====================

export interface GetSubscriptionStatusResponse {
  subscription: UserSubscription;
  usage: UsageMetrics;
  entitlements: SubscriptionEntitlements;
}

export interface GetUsageMetricsResponse {
  usage: UsageMetrics;
}

export interface UpdateUsageRequest {
  metric: UsageMetric;
  increment: number;
}

export interface UpdateUsageResponse {
  usage: UsageMetrics;
  limitReached: boolean;
  remainingCount: number | 'unlimited';
}

export interface SyncRevenueCatPurchaseRequest {
  revenueCatCustomerId: string;
  productId: string;
  entitlementId: string;
  purchaseDate: string;
  expirationDate?: string;
}

export interface SyncRevenueCatPurchaseResponse {
  subscription: UserSubscription;
  synced: boolean;
}

export interface ValidateEntitlementRequest {
  featureName: string;
}

export interface ValidateEntitlementResponse {
  hasAccess: boolean;
  reason?: string;
}

export interface InitializeSubscriptionRequest {
  tier?: SubscriptionTier;
}

export interface InitializeSubscriptionResponse {
  subscription: UserSubscription;
  usage: UsageMetrics;
  entitlements: SubscriptionEntitlements;
}

// ==================== API Functions ====================

/**
 * Get the user's current subscription status, usage metrics, and entitlements
 */
async function getSubscriptionStatus(
  userId: string
): Promise<GetSubscriptionStatusResponse> {
  return apiClient.get<GetSubscriptionStatusResponse>(
    `/users/${userId}/subscription`
  );
}

/**
 * Get the user's current usage metrics
 */
async function getUsageMetrics(
  userId: string
): Promise<GetUsageMetricsResponse> {
  return apiClient.get<GetUsageMetricsResponse>(
    `/users/${userId}/subscription/usage`
  );
}

/**
 * Update a specific usage metric (increment counter)
 * Returns updated usage and whether limit was reached
 */
async function updateUsageMetric(
  userId: string,
  request: UpdateUsageRequest
): Promise<UpdateUsageResponse> {
  return apiClient.post<UpdateUsageResponse>(
    `/users/${userId}/subscription/usage`,
    request
  );
}

/**
 * Reset usage metrics manually (normally happens automatically on subscription anniversary)
 */
async function resetUsageMetrics(userId: string): Promise<GetUsageMetricsResponse> {
  return apiClient.post<GetUsageMetricsResponse>(
    `/users/${userId}/subscription/usage/reset`
  );
}

/**
 * Sync a RevenueCat purchase to the backend
 * Called after successful purchase through RevenueCat
 */
async function syncRevenueCatPurchase(
  userId: string,
  request: SyncRevenueCatPurchaseRequest
): Promise<SyncRevenueCatPurchaseResponse> {
  return apiClient.post<SyncRevenueCatPurchaseResponse>(
    `/users/${userId}/subscription/sync-revenuecat`,
    request
  );
}

/**
 * Validate if user has entitlement for a specific feature
 * Server-side validation for critical features
 */
async function validateEntitlement(
  userId: string,
  request: ValidateEntitlementRequest
): Promise<ValidateEntitlementResponse> {
  return apiClient.post<ValidateEntitlementResponse>(
    `/users/${userId}/subscription/validate`,
    request
  );
}

/**
 * Initialize subscription for a new user
 * Sets up free tier by default
 */
async function initializeSubscription(
  userId: string,
  request?: InitializeSubscriptionRequest
): Promise<InitializeSubscriptionResponse> {
  return apiClient.post<InitializeSubscriptionResponse>(
    `/users/${userId}/subscription/initialize`,
    request || {tier: 'free'}
  );
}

/**
 * Get available subscription plans
 * Returns pricing and feature information from backend
 */
async function getAvailablePlans(): Promise<{
  plans: Array<{
    tier: SubscriptionTier;
    priceMonthly: number;
    priceAnnual?: number;
    features: string[];
  }>;
}> {
  return apiClient.get('/subscription/plans');
}

/**
 * Cancel subscription
 * Marks subscription as cancelled but remains active until expiration
 */
async function cancelSubscription(userId: string): Promise<{
  subscription: UserSubscription;
  cancelled: boolean;
  expiresAt: string;
}> {
  return apiClient.post(`/users/${userId}/subscription/cancel`);
}

/**
 * Reactivate a cancelled subscription
 * Only works if subscription hasn't expired yet
 */
async function reactivateSubscription(userId: string): Promise<{
  subscription: UserSubscription;
  reactivated: boolean;
}> {
  return apiClient.post(`/users/${userId}/subscription/reactivate`);
}

/**
 * Upgrade subscription tier
 * Immediate upgrade, prorated billing
 */
async function upgradeSubscription(
  userId: string,
  newTier: SubscriptionTier
): Promise<{
  subscription: UserSubscription;
  upgraded: boolean;
}> {
  return apiClient.post(`/users/${userId}/subscription/upgrade`, {
    tier: newTier,
  });
}

/**
 * Downgrade subscription tier
 * Takes effect at next billing cycle
 */
async function downgradeSubscription(
  userId: string,
  newTier: SubscriptionTier
): Promise<{
  subscription: UserSubscription;
  downgraded: boolean;
  effectiveDate: string;
}> {
  return apiClient.post(`/users/${userId}/subscription/downgrade`, {
    tier: newTier,
  });
}

// Export all functions as a namespace object
export const subscriptionsApi = {
  getSubscriptionStatus,
  getUsageMetrics,
  updateUsageMetric,
  resetUsageMetrics,
  syncRevenueCatPurchase,
  validateEntitlement,
  initializeSubscription,
  getAvailablePlans,
  cancelSubscription,
  reactivateSubscription,
  upgradeSubscription,
  downgradeSubscription,
};
