/**
 * Credit Service
 *
 * Manages user credit balance and transactions.
 * Fetches from backend, caches locally, and updates on purchases.
 */

import { subscriptionsApi } from '../api/subscriptions';

export interface CreditBalance {
  credits: number;
  monthlyCredits: number;
  tier: 'free' | 'premium' | 'pro';
  lastUpdated: Date;
}

export interface CreditCost {
  quickChartOverview: number;
  fullNatalReport: number;
  relationshipOverview: number;
  fullRelationshipReport: number;
  askStelliumQuestion: number;
}

export const CREDIT_COSTS: CreditCost = {
  quickChartOverview: 5,
  fullNatalReport: 15,
  relationshipOverview: 5,
  fullRelationshipReport: 15,
  askStelliumQuestion: 1,
};

export type CreditAction = keyof CreditCost;

class CreditService {
  private balance: CreditBalance | null = null;
  private listeners: Set<(balance: CreditBalance) => void> = new Set();

  /**
   * Fetch current credit balance from backend
   */
  async fetchBalance(userId: string): Promise<CreditBalance> {
    try {
      console.log('[CreditService] Fetching credit balance for user:', userId);

      const response = await subscriptionsApi.getSubscriptionStatus(userId);

      if (!response?.subscription) {
        throw new Error('No subscription data in response');
      }

      const { subscription } = response;

      this.balance = {
        credits: subscription.credits || 0,
        monthlyCredits: subscription.monthlyCredits || 10,
        tier: subscription.tier || 'free',
        lastUpdated: new Date(),
      };

      console.log('[CreditService] Balance fetched:', this.balance);

      // Notify listeners
      this.notifyListeners();

      return this.balance;
    } catch (error) {
      console.error('[CreditService] Failed to fetch balance:', error);
      throw error;
    }
  }

  /**
   * Get cached balance (doesn't make API call)
   */
  getCachedBalance(): CreditBalance | null {
    return this.balance;
  }

  /**
   * Check if user has enough credits for an action
   */
  hasEnoughCredits(action: CreditAction): boolean {
    if (!this.balance) {
      console.warn('[CreditService] No balance cached, assuming insufficient credits');
      return false;
    }

    const cost = CREDIT_COSTS[action];
    const hasEnough = this.balance.credits >= cost;

    console.log('[CreditService] Credit check:', {
      action,
      cost,
      currentBalance: this.balance.credits,
      hasEnough,
    });

    return hasEnough;
  }

  /**
   * Get cost for a specific action
   */
  getCost(action: CreditAction): number {
    return CREDIT_COSTS[action];
  }

  /**
   * Refresh balance after purchase or action
   */
  async refreshBalance(userId: string): Promise<void> {
    await this.fetchBalance(userId);
  }

  /**
   * Update local balance (optimistic update before backend confirms)
   */
  updateLocalBalance(credits: number): void {
    if (this.balance) {
      this.balance.credits = credits;
      this.balance.lastUpdated = new Date();
      this.notifyListeners();
    }
  }

  /**
   * Deduct credits optimistically (will be confirmed by backend)
   */
  deductCreditsOptimistically(action: CreditAction): void {
    if (!this.balance) {
      console.warn('[CreditService] Cannot deduct credits, no balance cached');
      return;
    }

    const cost = CREDIT_COSTS[action];
    const newBalance = Math.max(0, this.balance.credits - cost);

    console.log('[CreditService] Optimistic deduction:', {
      action,
      cost,
      oldBalance: this.balance.credits,
      newBalance,
    });

    this.updateLocalBalance(newBalance);
  }

  /**
   * Add credits optimistically (after purchase)
   */
  addCreditsOptimistically(amount: number): void {
    if (!this.balance) {
      console.warn('[CreditService] Cannot add credits, no balance cached');
      return;
    }

    const newBalance = this.balance.credits + amount;

    console.log('[CreditService] Optimistic addition:', {
      amount,
      oldBalance: this.balance.credits,
      newBalance,
    });

    this.updateLocalBalance(newBalance);
  }

  /**
   * Subscribe to balance changes
   */
  addListener(callback: (balance: CreditBalance) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of balance change
   */
  private notifyListeners(): void {
    if (this.balance) {
      this.listeners.forEach(callback => {
        try {
          callback(this.balance!);
        } catch (error) {
          console.error('[CreditService] Listener error:', error);
        }
      });
    }
  }

  /**
   * Clear cached balance (on logout)
   */
  clear(): void {
    console.log('[CreditService] Clearing cached balance');
    this.balance = null;
    this.listeners.clear();
  }

  /**
   * Get formatted balance string
   */
  getFormattedBalance(): string {
    if (!this.balance) return '--';
    return this.balance.credits.toString();
  }

  /**
   * Check if balance is low (less than cost of cheapest action)
   */
  isBalanceLow(): boolean {
    if (!this.balance) return true;
    return this.balance.credits < CREDIT_COSTS.askStelliumQuestion;
  }

  /**
   * Get balance status color
   */
  getBalanceStatusColor(): string {
    if (!this.balance) return '#9CA3AF'; // gray

    if (this.balance.credits === 0) return '#EF4444'; // red
    if (this.balance.credits < 10) return '#F59E0B'; // amber
    return '#10B981'; // green
  }
}

// Singleton instance
export const creditService = new CreditService();
