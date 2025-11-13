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
import { SubscriptionStatus } from '@superwall/react-native-superwall';
import Config from 'react-native-config';
import { subscriptionsApi } from '../api/subscriptions';
import { useStore } from '../store';
import { SubscriptionTier } from '../types';
import { superwallService } from './SuperwallService';
import { FEATURE_FLAGS } from '../config/featureFlags';

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

      console.log('[RevenueCat] Starting configuration with API key:', apiKey?.substring(0, 15) + '...');

      // Enable debug logs in development
      if (__DEV__) {
        console.log('[RevenueCat] Setting log level to DEBUG...');
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure SDK with API key
      console.log('[RevenueCat] Calling Purchases.configure with userId:', userId);

      // In development, use StoreKit Configuration file for testing
      if (__DEV__) {
        console.log('[RevenueCat] Development mode - enabling StoreKit2 for local testing');
        await Purchases.configure({
          apiKey,
          appUserID: userId,
          useStoreKit2IfAvailable: true,
        });
      } else {
        await Purchases.configure({
          apiKey,
          appUserID: userId,
        });
      }

      this.isConfigured = true;
      console.log('[RevenueCat] Successfully configured for user:', userId);

      // Set up listener for customer info updates
      console.log('[RevenueCat] Setting up customer info listener...');
      this.setupCustomerInfoListener();

      // Fetch initial customer info
      console.log('[RevenueCat] Fetching initial customer info...');
      await this.syncCustomerInfo();

      // Verify products are available
      console.log('[RevenueCat] Verifying product offerings...');
      const offerings = await this.getOfferings();
      if (offerings?.current) {
        console.log('[RevenueCat] Current offering:', offerings.current.identifier);
        console.log('[RevenueCat] Available packages:', offerings.current.availablePackages.length);
        offerings.current.availablePackages.forEach((pkg) => {
          console.log(`[RevenueCat]   - ${pkg.identifier}: ${pkg.product.identifier} ($${pkg.product.price})`);
        });
      } else {
        console.warn('[RevenueCat] No offerings available! This may cause purchase issues.');
      }

      console.log('[RevenueCat] Configuration complete');
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
      // Feature flag: Force subscription tier for paywall testing
      const forcedTier = FEATURE_FLAGS.forceSubscriptionTier;
      if (forcedTier !== null) {
        const status = forcedTier === 'free'
          ? SubscriptionStatus.Inactive()
          : SubscriptionStatus.Active([]);
        console.log(`[RevenueCat] forceSubscriptionTier=${forcedTier} - setting Superwall status to ${forcedTier === 'free' ? 'Inactive' : 'Active'}`);
        await superwallService.updateSubscriptionStatus(status);
        return;
      }

      const entitlements = customerInfo.entitlements.active;
      const hasActiveEntitlement = Object.keys(entitlements).length > 0;

      // Update Superwall subscription status using factory functions
      const superwallStatus = hasActiveEntitlement
        ? SubscriptionStatus.Active([]) // Superwall doesn't need RevenueCat entitlements
        : SubscriptionStatus.Inactive();

      console.log('[RevenueCat] Updating Superwall subscription status to:', superwallStatus);
      await superwallService.updateSubscriptionStatus(superwallStatus);

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
      console.log('[RevenueCat] purchasePackage called with package:', packageToPurchase.identifier);

      if (!this.isConfigured) {
        console.error('[RevenueCat] SDK not configured, cannot purchase');
        return {
          success: false,
          error: 'RevenueCat SDK not configured',
        };
      }

      console.log('[RevenueCat] Initiating purchase for package:', packageToPurchase.identifier);
      console.log('[RevenueCat] Product identifier:', packageToPurchase.product.identifier);

      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(
        packageToPurchase
      );

      console.log('[RevenueCat] Purchase successful! Product:', productIdentifier);

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
   * Purchase a product by product ID (for consumables like credit packs)
   */
  async purchaseProduct(
    productId: string
  ): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      console.log('[RevenueCat] purchaseProduct called with productId:', productId);

      if (!this.isConfigured) {
        console.error('[RevenueCat] SDK not configured, cannot purchase');
        return {
          success: false,
          error: 'RevenueCat SDK not configured',
        };
      }

      // Get all available products
      console.log('[RevenueCat] Fetching product for:', productId);
      const products = await Purchases.getProducts([productId]);

      if (!products || products.length === 0) {
        console.error('[RevenueCat] Product not found:', productId);
        return {
          success: false,
          error: 'Product not found',
        };
      }

      const product = products[0];
      console.log('[RevenueCat] Product found:', product.identifier, 'Price:', product.priceString);

      // Purchase the product
      console.log('[RevenueCat] Initiating purchase for product:', product.identifier);
      const { customerInfo } = await Purchases.purchaseStoreProduct(product);

      console.log('[RevenueCat] Purchase successful! Product:', product.identifier);
      console.log('[RevenueCat] Customer info:', customerInfo);

      // For consumables, we don't sync via entitlements (they don't create entitlements)
      // Instead, the backend webhook will handle adding credits
      // Just refresh the customer info
      await this.syncCustomerInfo();

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error('[RevenueCat] Purchase failed:', error);

      // Check if user cancelled
      if (error.userCancelled) {
        console.log('[RevenueCat] User cancelled purchase');
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

      // Feature flag: Force subscription tier for paywall testing
      const forcedTier = FEATURE_FLAGS.forceSubscriptionTier;
      if (forcedTier !== null) {
        const status = forcedTier === 'free'
          ? SubscriptionStatus.Inactive()
          : SubscriptionStatus.Active([]);
        console.log(`[RevenueCat] forceSubscriptionTier=${forcedTier} - setting Superwall status to ${forcedTier === 'free' ? 'Inactive' : 'Active'} (sync)`);
        await superwallService.updateSubscriptionStatus(status);
        return;
      }

      const entitlements = customerInfo.entitlements.active;
      const hasActiveEntitlement = Object.keys(entitlements).length > 0;

      // Update Superwall subscription status using factory functions
      const superwallStatus = hasActiveEntitlement
        ? SubscriptionStatus.Active([]) // Superwall doesn't need RevenueCat entitlements
        : SubscriptionStatus.Inactive();

      console.log('[RevenueCat] Syncing - Updating Superwall subscription status to:', superwallStatus);
      await superwallService.updateSubscriptionStatus(superwallStatus);

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
      // Feature flag: Force subscription tier for paywall testing
      const forcedTier = FEATURE_FLAGS.forceSubscriptionTier;
      if (forcedTier !== null) {
        console.log(`[RevenueCat] forceSubscriptionTier=${forcedTier} - returning forced tier`);
        return forcedTier;
      }

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
