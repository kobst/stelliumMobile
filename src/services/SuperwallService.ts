/**
 * Superwall Service
 *
 * Handles all Superwall SDK interactions including:
 * - SDK initialization
 * - Paywall presentation
 * - Event tracking
 * - Purchase handling (delegates to RevenueCat)
 */

import Superwall, { LogLevel, PaywallPresentationHandler, SubscriptionStatus, InterfaceStyle } from '@superwall/react-native-superwall';
import Config from 'react-native-config';
import { PAYWALL_EVENTS, PaywallEvent } from '../config/subscriptionConfig';
import { useStore } from '../store';
import { revenueCatPurchaseController } from './RevenueCatPurchaseController';
import { ColorSchemeName } from 'react-native';
import { FEATURE_FLAGS } from '../config/featureFlags';

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

      console.log('[Superwall] Starting configuration with API key:', apiKey?.substring(0, 10) + '...');

      if (!apiKey || apiKey === 'your_superwall_dev_api_key_here' || apiKey === 'your_superwall_prod_api_key_here') {
        console.warn('[Superwall] API key not configured, skipping initialization');
        return;
      }

      // Configure Superwall with RevenueCat purchase controller
      console.log('[Superwall] Calling Superwall.configure with RevenueCat purchase controller...');
      await Superwall.configure({
        apiKey,
        purchaseController: revenueCatPurchaseController,
      });
      console.log('[Superwall] Superwall.configure completed with purchase controller');

      // Enable debug logging to help troubleshoot paywall display issues
      console.log('[Superwall] Setting log level to Debug...');
      await Superwall.shared.setLogLevel(LogLevel.Debug);
      console.log('[Superwall] Debug logging enabled');

      // Set up event handlers first
      console.log('[Superwall] Setting up event handlers...');
      await this.setupEventHandlers();
      console.log('[Superwall] Event handlers set up');

      // Identify user
      console.log('[Superwall] Identifying user...');
      await this.identifyUser(userId);

      // Set initial subscription status to INACTIVE
      // This will be updated by RevenueCat when customer info is available
      // Call Superwall directly here since isConfigured is not yet true
      console.log('[Superwall] Setting initial subscription status to INACTIVE...');
      await Superwall.shared.setSubscriptionStatus(SubscriptionStatus.Inactive());
      console.log('[Superwall] Initial subscription status set to INACTIVE');

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
   * Update subscription status
   * Call this whenever the user's subscription status changes
   */
  async updateSubscriptionStatus(status: SubscriptionStatus): Promise<void> {
    try {
      if (!this.isConfigured) {
        console.warn('[Superwall] SDK not configured, cannot update subscription status');
        return;
      }

      console.log('[Superwall] Updating subscription status to:', status);
      await Superwall.shared.setSubscriptionStatus(status);
      console.log('[Superwall] Subscription status updated successfully');
    } catch (error) {
      console.error('[Superwall] Failed to update subscription status:', error);
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
        subscriptionStatusDidChange: (from, to) => {
          console.log('[Superwall] Subscription status changed from:', from, 'to:', to);
          // RevenueCat will automatically sync via its customer info listener
        },

        // Called for all Superwall events (including purchase attempts)
        handleSuperwallEvent: (eventInfo) => {
          console.log('[Superwall] Event:', eventInfo.event, 'Params:', eventInfo.params);
        },

        // Called when user taps custom actions in paywall
        handleCustomPaywallAction: (name) => {
          console.log('[Superwall] Custom paywall action:', name);
        },

        // Called when paywall will open URL
        paywallWillOpenURL: (url) => {
          console.log('[Superwall] Will open URL:', url);
        },

        // Called when paywall will open deep link
        paywallWillOpenDeepLink: (url) => {
          console.log('[Superwall] Will open deep link:', url);
        },

        // Called for log messages
        handleLog: (level, scope, message, info, error) => {
          if (error) {
            console.error(`[Superwall Log] ${level} [${scope}]:`, message, error);
          } else {
            console.log(`[Superwall Log] ${level} [${scope}]:`, message);
          }
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
      console.log('[Superwall] presentPaywall called with event:', event, 'params:', params);
      console.log('[Superwall] isConfigured:', this.isConfigured);

      if (!this.isConfigured) {
        console.warn('[Superwall] SDK not configured, cannot present paywall');
        return;
      }

      console.log('[Superwall] Presenting paywall for placement:', event, params);
      console.log('[Superwall] Calling Superwall.shared.register...');

      // Create a presentation handler to get detailed status
      const handler = new PaywallPresentationHandler();

      handler.onPresent((paywallInfo) => {
        console.log('[Superwall] Handler - onPresent called:', JSON.stringify(paywallInfo));
      });

      handler.onDismiss((paywallInfo, result) => {
        console.log('[Superwall] Handler - onDismiss called:', JSON.stringify({ paywallInfo, result }));
      });

      handler.onError((error) => {
        console.error('[Superwall] Handler - onError called:', error);
      });

      handler.onSkip((reason) => {
        console.warn('[Superwall] Handler - onSkip called with reason:', JSON.stringify(reason));
      });

      // Register the placement with Superwall
      await Superwall.shared.register({
        placement: event,
        params: params || {},
        handler: handler,
      });

      console.log('[Superwall] Register completed successfully');

      // Superwall will automatically show the appropriate paywall
      // based on your dashboard configuration
    } catch (error) {
      console.error('[Superwall] Failed to present paywall:', error);
      console.error('[Superwall] Error details:', JSON.stringify(error));
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

      // Apply feature flag override for subscription tier
      const forcedTier = FEATURE_FLAGS.forceSubscriptionTier;
      const effectiveTier = forcedTier !== null ? forcedTier : userSubscription.tier;

      const attributes: Record<string, any> = {
        subscription_tier: effectiveTier,
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

  /**
   * Set interface style (light/dark) for paywall appearance
   * Call this when app theme changes
   */
  async setInterfaceStyle(colorScheme: ColorSchemeName): Promise<void> {
    try {
      if (!this.isConfigured) {
        console.warn('[Superwall] SDK not configured, cannot set interface style');
        return;
      }

      const style = colorScheme === 'dark' ? InterfaceStyle.Dark : InterfaceStyle.Light;
      console.log('[Superwall] Setting interface style to:', colorScheme, '→', style);
      await Superwall.shared.setInterfaceStyle(style);
      console.log('[Superwall] Interface style updated successfully');
    } catch (error) {
      console.error('[Superwall] Failed to set interface style:', error);
    }
  }
}

// Export singleton instance
export const superwallService = new SuperwallService();
