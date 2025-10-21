/**
 * RevenueCat Purchase Controller for Superwall
 *
 * This class implements Superwall's PurchaseController interface
 * to delegate purchases to RevenueCat.
 */

import {
  PurchaseController,
  PurchaseResultPurchased,
  PurchaseResultCancelled,
  PurchaseResultFailed,
  RestorationResult
} from '@superwall/react-native-superwall';
import { revenueCatService } from './RevenueCatService';
import Purchases from 'react-native-purchases';

export class RevenueCatPurchaseController extends PurchaseController {
  /**
   * Purchase a product from the App Store via RevenueCat
   */
  async purchaseFromAppStore(productId: string): Promise<PurchaseResult> {
    try {
      console.log('[RevenueCatPurchaseController] purchaseFromAppStore called with productId:', productId);

      // Get the offerings from RevenueCat
      const offerings = await Purchases.getOfferings();

      if (!offerings.current) {
        console.error('[RevenueCatPurchaseController] No current offering found');
        return new PurchaseResultFailed('No current offering found');
      }

      // Find the package that matches the product ID
      const packageToPurchase = offerings.current.availablePackages.find(
        pkg => pkg.product.identifier === productId
      );

      if (!packageToPurchase) {
        console.error('[RevenueCatPurchaseController] Package not found for product:', productId);
        return new PurchaseResultFailed('Package not found');
      }

      console.log('[RevenueCatPurchaseController] Purchasing package:', packageToPurchase.identifier);

      // Purchase through RevenueCat
      const result = await revenueCatService.purchasePackage(packageToPurchase);

      if (result.success) {
        console.log('[RevenueCatPurchaseController] Purchase successful');
        return new PurchaseResultPurchased();
      } else {
        if (result.error === 'Purchase cancelled') {
          console.log('[RevenueCatPurchaseController] Purchase cancelled by user');
          return new PurchaseResultCancelled();
        }

        console.error('[RevenueCatPurchaseController] Purchase failed:', result.error);
        return new PurchaseResultFailed(result.error || 'Purchase failed');
      }
    } catch (error: any) {
      console.error('[RevenueCatPurchaseController] Purchase error:', error);
      return new PurchaseResultFailed(error?.message || 'Unknown error');
    }
  }

  /**
   * Purchase a product from Google Play (not used on iOS)
   */
  async purchaseFromGooglePlay(
    productId: string,
    basePlanId?: string,
    offerId?: string
  ): Promise<any> {
    console.log('[RevenueCatPurchaseController] purchaseFromGooglePlay called (not implemented for iOS)');
    return new PurchaseResultFailed('Google Play not supported on iOS');
  }

  /**
   * Restore purchases via RevenueCat
   */
  async restorePurchases(): Promise<any> {
    try {
      console.log('[RevenueCatPurchaseController] restorePurchases called');

      const result = await revenueCatService.restorePurchases();

      if (result.success) {
        console.log('[RevenueCatPurchaseController] Restore successful');
        // Return a simple object indicating success - Superwall will handle it
        return { type: 'restored' };
      } else {
        console.error('[RevenueCatPurchaseController] Restore failed:', result.error);
        return { type: 'failed', error: result.error };
      }
    } catch (error: any) {
      console.error('[RevenueCatPurchaseController] Restore error:', error);
      return { type: 'failed', error: error?.message || 'Unknown error' };
    }
  }
}

// Export singleton instance
export const revenueCatPurchaseController = new RevenueCatPurchaseController();
