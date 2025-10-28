/**
 * Credit Flow Manager
 *
 * Orchestrates the user journey when they run out of credits.
 * Decides whether to show Superwall subscription paywall or custom credit purchase screen.
 */

import { Alert } from 'react-native';
import { superwallService } from './SuperwallService';
import { navigate } from '../navigation/navigationService';
import { SubscriptionTier } from '../types';
import { CREDIT_PACKS } from '../config/subscriptionConfig';

export interface CreditFlowOptions {
  currentTier: SubscriptionTier;
  currentCredits: number;
  requiredCredits: number;
  source: string; // Where the user was when they ran out (e.g., 'chart_generation', 'ask_stellium')
}

class CreditFlowManager {
  /**
   * Main decision point for handling insufficient credits
   */
  async handleInsufficientCredits(options: CreditFlowOptions): Promise<void> {
    const { currentTier, currentCredits, requiredCredits, source } = options;
    const shortfall = requiredCredits - currentCredits;

    console.log('[CreditFlowManager] Handling insufficient credits:', {
      currentTier,
      currentCredits,
      requiredCredits,
      shortfall,
      source,
    });

    // STRATEGY 1: Free users → Always show subscription upgrade paywall
    if (currentTier === 'free') {
      await this.showSubscriptionUpgradeForFreeUser(source);
      return;
    }

    // STRATEGY 2: Premium users → Smart routing based on usage pattern
    if (currentTier === 'premium') {
      await this.handlePremiumUserShortfall(shortfall, source);
      return;
    }

    // STRATEGY 3: Pro users → Direct to credit packs (unlikely to need more)
    if (currentTier === 'pro') {
      await this.handleProUserShortfall(shortfall, source);
      return;
    }
  }

  /**
   * Free users: Show Superwall paywall to convert to paid subscription
   */
  private async showSubscriptionUpgradeForFreeUser(source: string): Promise<void> {
    console.log('[CreditFlowManager] Showing subscription paywall for free user');

    // Use Superwall to show compelling subscription offer
    await superwallService.presentPaywall('credits_depleted_free_user', {
      source,
      message: 'Upgrade to Premium for 200 credits per month!',
    });
  }

  /**
   * Premium users: Show options based on shortfall size
   */
  private async handlePremiumUserShortfall(shortfall: number, source: string): Promise<void> {
    // Small shortfall (≤20 credits) → Direct to small pack purchase
    if (shortfall <= 20) {
      console.log('[CreditFlowManager] Small shortfall - directing to credit packs');
      navigate('CreditPurchase', {
        recommendedPack: 'small',
        source,
      });
      return;
    }

    // Medium shortfall (21-100 credits) → Show choice: buy pack or upgrade to Pro
    if (shortfall <= 100) {
      console.log('[CreditFlowManager] Medium shortfall - showing options');
      this.showPremiumUserOptions(shortfall, source);
      return;
    }

    // Large shortfall (>100 credits) → Suggest Pro upgrade
    console.log('[CreditFlowManager] Large shortfall - suggesting Pro upgrade');
    this.suggestProUpgrade(source);
  }

  /**
   * Pro users: Direct to credit packs (they already have max tier)
   */
  private async handleProUserShortfall(shortfall: number, source: string): Promise<void> {
    console.log('[CreditFlowManager] Pro user needs credits - directing to packs');

    // Recommend pack based on shortfall
    const recommendedPack = shortfall <= 20 ? 'small' : shortfall <= 100 ? 'medium' : 'large';

    navigate('CreditPurchase', {
      recommendedPack,
      source,
    });
  }

  /**
   * Show Premium users a choice between buying credits or upgrading to Pro
   */
  private showPremiumUserOptions(shortfall: number, source: string): void {
    const recommendedPack = shortfall <= 100 ? 'medium' : 'large';
    const packInfo = CREDIT_PACKS.find(p => p.id === recommendedPack);

    Alert.alert(
      'Need More Credits?',
      `You need ${shortfall} more credits.\n\nOptions:\n• Buy ${packInfo?.credits} credits for $${packInfo?.price}\n• Upgrade to Pro (1000 credits/month)`,
      [
        {
          text: 'Buy Credits',
          onPress: () => navigate('CreditPurchase', { recommendedPack, source }),
        },
        {
          text: 'Upgrade to Pro',
          onPress: () => superwallService.presentPaywall('tier_upgrade_pro', { source }),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }

  /**
   * Suggest Pro upgrade for Premium users with high usage
   */
  private async suggestProUpgrade(source: string): Promise<void> {
    Alert.alert(
      'Consider Pro Plan',
      'You\'re using a lot of credits! Pro includes 1000 credits/month - much better value.',
      [
        {
          text: 'View Pro Plan',
          onPress: () => superwallService.presentPaywall('tier_upgrade_pro', { source }),
        },
        {
          text: 'Buy Credits Instead',
          onPress: () => navigate('CreditPurchase', { source }),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }

  /**
   * Show paywall when user manually clicks "Upgrade" button
   */
  async showUpgradePaywall(source: string = 'manual'): Promise<void> {
    await superwallService.presentPaywall('upgrade_prompt', { source });
  }

  /**
   * Navigate directly to credit purchase screen
   */
  navigateToCreditPurchase(source: string = 'manual'): void {
    navigate('CreditPurchase', { source });
  }
}

export const creditFlowManager = new CreditFlowManager();
