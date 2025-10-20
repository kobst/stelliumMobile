/**
 * Superwall Service
 *
 * Handles all Superwall SDK interactions including:
 * - SDK initialization
 * - Paywall presentation
 * - Event tracking
 * - Purchase handling (delegates to RevenueCat)
 */

import Superwall from '@superwall/react-native-superwall';
import Config from 'react-native-config';
import { revenueCatService } from './RevenueCatService';
import { PAYWALL_EVENTS, PaywallEvent } from '../config/subscriptionConfig';
import { useStore } from '../store';

class SuperwallService {
  private isConfigured = false;

  /**
   * Initialize Superwall SDK
   * Call this on app startup
   */
  async configure(userId: string): Promise<void> {
    if (this.isConfigured) {
      console.log('[Superwall] Already configured');
      return;
    }

    try {
      const apiKey = Config.SUPERWALL_API_KEY;

      if (!apiKey || apiKey === 'your_superwall_dev_api_key_here' || apiKey === 'your_superwall_prod_api_key_here') {
        console.warn('[Superwall] API key not configured, skipping initialization');
        return;
      }

      // Configure Superwall with RevenueCat as purchase controller
      await Superwall.configure({
        apiKey,
        purchaseController: 'revenueCat',
      });

      // Set up event handlers first
      await this.setupEventHandlers();

      // Identify user
      await this.identifyUser(userId);

      this.isConfigured = true;
      console.log('[Superwall] Successfully configured');
    } catch (error) {
      console.error('[Superwall] Configuration failed:', error);
      throw error;
    }
  }

  /**
   * Reset configuration (call on logout)
   */
  async reset(): Promise<void> {
    if (this.isConfigured) {
      await Superwall.shared.reset();
      this.isConfigured = false;
      console.log('[Superwall] Configuration reset');
    }
  }

  /**
   * Identify user with Superwall
   */
  async identifyUser(userId: string): Promise<void> {
    try {
      await Superwall.shared.identify({ userId });
      console.log('[Superwall] User identified:', userId);
    } catch (error) {
      console.error('[Superwall] Failed to identify user:', error);
    }
  }

  /**
   * Set up event handlers for paywall lifecycle
   */
  private async setupEventHandlers(): Promise<void> {
    try {
      // Handle paywall presentations
      await Superwall.shared.setDelegate({
        // Called when paywall is about to be presented
        paywallWillPresent: (paywallInfo) => {
          console.log('[Superwall] Paywall will present:', paywallInfo);
        },

        // Called when paywall is presented
        paywallDidPresent: (paywallInfo) => {
          console.log('[Superwall] Paywall presented:', paywallInfo);
        },

        // Called when paywall is dismissed
        paywallDidDismiss: (paywallInfo) => {
          console.log('[Superwall] Paywall dismissed:', paywallInfo);
        },

        // Called when subscription status changes
        subscriptionStatusDidChange: (status) => {
          console.log('[Superwall] Subscription status changed:', status);
          // Sync with backend
          revenueCatService.syncCustomerInfo();
        },
      });
    } catch (error) {
      console.error('[Superwall] Failed to set delegate:', error);
    }
  }

  /**
   * Present a paywall for a specific event
   */
  async presentPaywall(event: PaywallEvent, params?: Record<string, any>): Promise<void> {
    try {
      if (!this.isConfigured) {
        console.warn('[Superwall] SDK not configured, cannot present paywall');
        return;
      }

      console.log('[Superwall] Presenting paywall for placement:', event, params);

      // Register the placement with Superwall
      await Superwall.shared.register({
        placement: event,
        params: params || {},
      });

      // Superwall will automatically show the appropriate paywall
      // based on your dashboard configuration
    } catch (error) {
      console.error('[Superwall] Failed to present paywall:', error);
      throw error;
    }
  }

  /**
   * Present paywall when chart limit is reached
   */
  async showChartLimitPaywall(currentCount: number, limit: number): Promise<void> {
    await this.presentPaywall(PAYWALL_EVENTS.CHART_LIMIT_REACHED, {
      current_count: currentCount,
      limit,
      feature: 'Quick Charts',
    });
  }

  /**
   * Present paywall when relationship limit is reached
   */
  async showRelationshipLimitPaywall(currentCount: number, limit: number): Promise<void> {
    await this.presentPaywall(PAYWALL_EVENTS.RELATIONSHIP_LIMIT_REACHED, {
      current_count: currentCount,
      limit,
      feature: 'Quick Matches',
    });
  }

  /**
   * Present paywall when chat limit is reached
   */
  async showChatLimitPaywall(currentCount: number, limit: number): Promise<void> {
    await this.presentPaywall(PAYWALL_EVENTS.CHAT_LIMIT_REACHED, {
      current_count: currentCount,
      limit,
      feature: 'AI Chat',
    });
  }

  /**
   * Present paywall when report limit is reached
   */
  async showReportLimitPaywall(currentCount: number, limit: number): Promise<void> {
    await this.presentPaywall(PAYWALL_EVENTS.REPORT_LIMIT_REACHED, {
      current_count: currentCount,
      limit,
      feature: 'Reports',
    });
  }

  /**
   * Present paywall when locked horoscope is accessed
   */
  async showHoroscopeLockedPaywall(horoscopeType: 'daily' | 'monthly'): Promise<void> {
    await this.presentPaywall(PAYWALL_EVENTS.HOROSCOPE_LOCKED, {
      horoscope_type: horoscopeType,
      feature: `${horoscopeType.charAt(0).toUpperCase() + horoscopeType.slice(1)} Horoscope`,
    });
  }

  /**
   * Present general upgrade paywall
   */
  async showUpgradePaywall(source?: string): Promise<void> {
    await this.presentPaywall(PAYWALL_EVENTS.UPGRADE_PROMPT, {
      source: source || 'general',
    });
  }

  /**
   * Present paywall from settings screen
   */
  async showSettingsUpgradePaywall(): Promise<void> {
    await this.presentPaywall(PAYWALL_EVENTS.SETTINGS_UPGRADE, {
      source: 'settings',
    });
  }

  /**
   * Dismiss any currently presented paywall
   */
  async dismissPaywall(): Promise<void> {
    try {
      if (!this.isConfigured) {
        return;
      }

      await Superwall.shared.dismiss();
      console.log('[Superwall] Paywall dismissed');
    } catch (error) {
      console.error('[Superwall] Failed to dismiss paywall:', error);
    }
  }

  /**
   * Track a custom event (for analytics and triggering paywalls)
   */
  async trackEvent(eventName: string, params?: Record<string, any>): Promise<void> {
    try {
      if (!this.isConfigured) {
        console.warn('[Superwall] SDK not configured, cannot track event');
        return;
      }

      console.log('[Superwall] Tracking event:', eventName, params);
      await Superwall.shared.register({
        placement: eventName,
        params: params || {},
      });
    } catch (error) {
      console.error('[Superwall] Failed to track event:', error);
    }
  }

  /**
   * Set user attributes for targeting
   */
  async setUserAttributes(attributes: Record<string, any>): Promise<void> {
    try {
      if (!this.isConfigured) {
        console.warn('[Superwall] SDK not configured, cannot set user attributes');
        return;
      }

      console.log('[Superwall] Setting user attributes:', attributes);
      await Superwall.shared.setUserAttributes(attributes);
    } catch (error) {
      console.error('[Superwall] Failed to set user attributes:', error);
    }
  }

  /**
   * Update user attributes from subscription state
   */
  async updateUserAttributesFromStore(): Promise<void> {
    try {
      const { userSubscription, usageMetrics } = useStore.getState();

      if (!userSubscription) {
        return;
      }

      const attributes: Record<string, any> = {
        subscription_tier: userSubscription.tier,
        subscription_status: userSubscription.status,
      };

      if (usageMetrics) {
        attributes.charts_used = usageMetrics.quickChartsUsed;
        attributes.matches_used = usageMetrics.quickMatchesUsed;
        attributes.reports_used = usageMetrics.reportsUsed;
        attributes.chat_questions_used = usageMetrics.chatQuestionsUsed;
      }

      await this.setUserAttributes(attributes);
    } catch (error) {
      console.error('[Superwall] Failed to update user attributes from store:', error);
    }
  }

  /**
   * Get paywall presentation result
   * Use this to check if a paywall will be shown before presenting
   */
  async getPaywallPresentationResult(event: PaywallEvent): Promise<{
    willPresent: boolean;
  }> {
    try {
      if (!this.isConfigured) {
        return { willPresent: false };
      }

      // This is a placeholder - actual implementation depends on Superwall SDK version
      // Some versions have a method to check if paywall will present
      // For now, we'll assume it will present
      return { willPresent: true };
    } catch (error) {
      console.error('[Superwall] Failed to get presentation result:', error);
      return { willPresent: false };
    }
  }

  /**
   * Check if Superwall is ready
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const superwallService = new SuperwallService();
