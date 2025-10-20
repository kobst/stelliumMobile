/**
 * RevenueCat Service
 *
 * Handles all RevenueCat SDK interactions including:
 * - SDK initialization
 * - Fetching offerings and products
 * - Processing purchases
 * - Restoring purchases
 * - Syncing with backend
 */

import Purchases, {
  PurchasesOfferings,
  PurchasesPackage,
  CustomerInfo,
  PurchasesStoreProduct,
  LOG_LEVEL,
} from 'react-native-purchases';
import Config from 'react-native-config';
import { subscriptionsApi } from '../api/subscriptions';
import { useStore } from '../store';
import { SubscriptionTier } from '../types';

class RevenueCatService {
  private isConfigured = false;

  /**
   * Initialize RevenueCat SDK
   * Call this on app startup with the user's ID
   */
  async configure(userId: string): Promise<void> {
    if (this.isConfigured) {
      console.log('[RevenueCat] Already configured');
      return;
    }

    try {
      const apiKey = Config.REVENUECAT_API_KEY;

      if (!apiKey || apiKey === 'your_revenuecat_dev_api_key_here' || apiKey === 'your_revenuecat_prod_api_key_here') {
        console.warn('[RevenueCat] API key not configured, skipping initialization');
        return;
      }

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure SDK with API key
      await Purchases.configure({
        apiKey,
        appUserID: userId, // Use our backend user ID
      });

      this.isConfigured = true;
      console.log('[RevenueCat] Successfully configured for user:', userId);

      // Set up listener for customer info updates
      this.setupCustomerInfoListener();

      // Fetch initial customer info
      await this.syncCustomerInfo();
    } catch (error) {
      console.error('[RevenueCat] Configuration failed:', error);
      throw error;
    }
  }

  /**
   * Reset configuration (call on logout)
   */
  reset(): void {
    this.isConfigured = false;
    console.log('[RevenueCat] Configuration reset');
  }

  /**
   * Set up listener for customer info updates
   * Updates store when RevenueCat detects changes
   */
  private setupCustomerInfoListener(): void {
    Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      console.log('[RevenueCat] Customer info updated:', customerInfo);
      this.handleCustomerInfoUpdate(customerInfo);
    });
  }

  /**
   * Handle customer info updates from RevenueCat
   */
  private async handleCustomerInfoUpdate(customerInfo: CustomerInfo): Promise<void> {
    try {
      const entitlements = customerInfo.entitlements.active;
      const hasActiveEntitlement = Object.keys(entitlements).length > 0;

      if (hasActiveEntitlement) {
        // User has an active subscription, sync with backend
        const entitlementId = Object.keys(entitlements)[0];
        const entitlement = entitlements[entitlementId];

        await this.syncPurchaseWithBackend(customerInfo, entitlementId);
      } else {
        // No active subscription, ensure user is on free tier
        console.log('[RevenueCat] No active entitlements, user should be on free tier');
      }
    } catch (error) {
      console.error('[RevenueCat] Failed to handle customer info update:', error);
    }
  }

  /**
   * Get available offerings from RevenueCat
   */
  async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      if (!this.isConfigured) {
        console.warn('[RevenueCat] SDK not configured');
        return null;
      }

      const offerings = await Purchases.getOfferings();
      console.log('[RevenueCat] Fetched offerings:', offerings);
      return offerings;
    } catch (error) {
      console.error('[RevenueCat] Failed to get offerings:', error);
      return null;
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      if (!this.isConfigured) {
        console.warn('[RevenueCat] SDK not configured');
        return null;
      }

      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Purchase a package
   */
  async purchasePackage(
    packageToPurchase: PurchasesPackage
  ): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      if (!this.isConfigured) {
        return {
          success: false,
          error: 'RevenueCat SDK not configured',
        };
      }

      console.log('[RevenueCat] Initiating purchase:', packageToPurchase.identifier);

      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(
        packageToPurchase
      );

      console.log('[RevenueCat] Purchase successful:', productIdentifier);

      // Sync purchase with backend
      const entitlementId = Object.keys(customerInfo.entitlements.active)[0];
      await this.syncPurchaseWithBackend(customerInfo, entitlementId);

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error('[RevenueCat] Purchase failed:', error);

      // Check if user cancelled
      if (error.userCancelled) {
        return {
          success: false,
          error: 'Purchase cancelled',
        };
      }

      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      if (!this.isConfigured) {
        return {
          success: false,
          error: 'RevenueCat SDK not configured',
        };
      }

      console.log('[RevenueCat] Restoring purchases...');

      const customerInfo = await Purchases.restorePurchases();

      console.log('[RevenueCat] Purchases restored:', customerInfo);

      // Sync with backend
      const entitlements = customerInfo.entitlements.active;
      if (Object.keys(entitlements).length > 0) {
        const entitlementId = Object.keys(entitlements)[0];
        await this.syncPurchaseWithBackend(customerInfo, entitlementId);
      }

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error('[RevenueCat] Restore failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore purchases',
      };
    }
  }

  /**
   * Sync purchase with backend
   */
  private async syncPurchaseWithBackend(
    customerInfo: CustomerInfo,
    entitlementId: string
  ): Promise<void> {
    try {
      const { userId } = useStore.getState();

      if (!userId) {
        console.error('[RevenueCat] No user ID available for sync');
        return;
      }

      const entitlement = customerInfo.entitlements.active[entitlementId];

      if (!entitlement) {
        console.error('[RevenueCat] Entitlement not found:', entitlementId);
        return;
      }

      // Determine product ID from entitlement
      const productId = entitlement.productIdentifier;

      console.log('[RevenueCat] Syncing purchase with backend:', {
        userId,
        productId,
        entitlementId,
      });

      const response = await subscriptionsApi.syncRevenueCatPurchase(userId, {
        revenueCatCustomerId: customerInfo.originalAppUserId,
        productId,
        entitlementId,
        purchaseDate: entitlement.latestPurchaseDate || new Date().toISOString(),
        expirationDate: entitlement.expirationDate || undefined,
      });

      console.log('[RevenueCat] Backend sync successful:', response);

      // Update store with new subscription info
      const { updateSubscriptionData } = useStore.getState();
      updateSubscriptionData({
        subscription: response.subscription,
      });
    } catch (error) {
      console.error('[RevenueCat] Failed to sync with backend:', error);
      // Don't throw - let the purchase succeed even if backend sync fails
      // Backend will eventually sync via webhooks
    }
  }

  /**
   * Sync customer info with backend (without purchase)
   */
  async syncCustomerInfo(): Promise<void> {
    try {
      if (!this.isConfigured) {
        console.warn('[RevenueCat] SDK not configured');
        return;
      }

      const customerInfo = await this.getCustomerInfo();

      if (!customerInfo) {
        console.warn('[RevenueCat] No customer info available');
        return;
      }

      const entitlements = customerInfo.entitlements.active;
      const hasActiveEntitlement = Object.keys(entitlements).length > 0;

      if (hasActiveEntitlement) {
        const entitlementId = Object.keys(entitlements)[0];
        await this.syncPurchaseWithBackend(customerInfo, entitlementId);
      }
    } catch (error) {
      console.error('[RevenueCat] Failed to sync customer info:', error);
    }
  }

  /**
   * Map RevenueCat product ID to subscription tier
   */
  mapProductIdToTier(productId: string): SubscriptionTier {
    if (productId.includes('premium')) {
      return 'premium';
    } else if (productId.includes('pro')) {
      return 'pro';
    }
    return 'free';
  }

  /**
   * Check if user has active entitlement
   */
  async hasActiveEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();

      if (!customerInfo) {
        return false;
      }

      return customerInfo.entitlements.active[entitlementId] !== undefined;
    } catch (error) {
      console.error('[RevenueCat] Failed to check entitlement:', error);
      return false;
    }
  }

  /**
   * Get active subscription tier from RevenueCat
   */
  async getActiveTier(): Promise<SubscriptionTier> {
    try {
      const customerInfo = await this.getCustomerInfo();

      if (!customerInfo) {
        return 'free';
      }

      const entitlements = customerInfo.entitlements.active;

      if (Object.keys(entitlements).length === 0) {
        return 'free';
      }

      const entitlementId = Object.keys(entitlements)[0];
      const entitlement = entitlements[entitlementId];

      return this.mapProductIdToTier(entitlement.productIdentifier);
    } catch (error) {
      console.error('[RevenueCat] Failed to get active tier:', error);
      return 'free';
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();
