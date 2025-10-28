/**
 * Credit Service - Dual-Credit System
 *
 * Manages user credit balance with two types:
 * 1. Monthly Credits - Reset each month (use first)
 * 2. Pack Credits - Never expire (use after monthly exhausted)
 *
 * Fetches from backend, caches locally, and updates on purchases.
 */

import { subscriptionsApi } from '../api/subscriptions';

/**
 * Credit Balance Interface - NEW Dual-Credit Schema
 */
export interface CreditBalance {
  total: number;              // monthlyRemaining + packBalance
  monthlyAllotment: number;   // Tier limit (10/200/1000)
  monthlyRemaining: number;   // Current monthly balance
  packBalance: number;        // Purchased non-expiring credits
  tier: 'free' | 'premium' | 'pro';
  lastUpdated: Date;
}

/**
 * Credit Costs for Actions
 */
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
   * Parses NEW dual-credit schema
   */
  async fetchBalance(userId: string): Promise<CreditBalance> {
    try {
      console.log('[CreditService] Fetching credit balance for user:', userId);

      const response = await subscriptionsApi.getSubscriptionStatus(userId);

      if (!response?.subscription) {
        throw new Error('No subscription data in response');
      }

      const { subscription } = response;

      // Parse new dual-credit schema
      const monthlyAllotment = subscription.monthlyAllotment || 10;
      const monthlyRemaining = subscription.monthlyRemaining || 0;
      const packBalance = subscription.packBalance || 0;
      const total = monthlyRemaining + packBalance;

      this.balance = {
        total,
        monthlyAllotment,
        monthlyRemaining,
        packBalance,
        tier: subscription.tier || 'free',
        lastUpdated: new Date(),
      };

      console.log('[CreditService] Balance fetched:', {
        total: this.balance.total,
        monthly: `${this.balance.monthlyRemaining}/${this.balance.monthlyAllotment}`,
        pack: this.balance.packBalance,
        tier: this.balance.tier,
      });

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
   * Uses TOTAL credits (monthly + pack)
   */
  hasEnoughCredits(action: CreditAction): boolean {
    if (!this.balance) {
      console.warn('[CreditService] No balance cached, assuming insufficient credits');
      return false;
    }

    const cost = CREDIT_COSTS[action];
    const hasEnough = this.balance.total >= cost;

    console.log('[CreditService] Credit check:', {
      action,
      cost,
      totalAvailable: this.balance.total,
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
   * Update local balance with new values
   */
  private updateBalance(updates: Partial<CreditBalance>): void {
    if (!this.balance) return;

    this.balance = {
      ...this.balance,
      ...updates,
      total: (updates.monthlyRemaining ?? this.balance.monthlyRemaining) +
             (updates.packBalance ?? this.balance.packBalance),
      lastUpdated: new Date(),
    };

    this.notifyListeners();
  }

  /**
   * Deduct credits optimistically (will be confirmed by backend)
   *
   * Priority: Monthly credits first, then pack credits
   */
  deductCreditsOptimistically(action: CreditAction): void {
    if (!this.balance) {
      console.warn('[CreditService] Cannot deduct credits, no balance cached');
      return;
    }

    const cost = CREDIT_COSTS[action];
    let remaining = cost;

    // 1. Deduct from monthly first
    const monthlyDeduction = Math.min(this.balance.monthlyRemaining, remaining);
    const newMonthly = this.balance.monthlyRemaining - monthlyDeduction;
    remaining -= monthlyDeduction;

    // 2. Deduct remainder from pack
    const packDeduction = remaining;
    const newPack = Math.max(0, this.balance.packBalance - packDeduction);

    console.log('[CreditService] Optimistic deduction:', {
      action,
      cost,
      monthlyDeduction,
      packDeduction,
      oldBalance: { monthly: this.balance.monthlyRemaining, pack: this.balance.packBalance },
      newBalance: { monthly: newMonthly, pack: newPack },
      newTotal: newMonthly + newPack,
    });

    this.updateBalance({
      monthlyRemaining: newMonthly,
      packBalance: newPack,
    });
  }

  /**
   * Add credits optimistically (after purchase)
   * Purchased credits ALWAYS go to pack balance
   */
  addCreditsOptimistically(amount: number): void {
    if (!this.balance) {
      console.warn('[CreditService] Cannot add credits, no balance cached');
      return;
    }

    const newPackBalance = this.balance.packBalance + amount;

    console.log('[CreditService] Optimistic addition:', {
      amount,
      oldPackBalance: this.balance.packBalance,
      newPackBalance,
      newTotal: this.balance.monthlyRemaining + newPackBalance,
    });

    this.updateBalance({
      packBalance: newPackBalance,
    });
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
   * Get formatted balance string with breakdown
   */
  getFormattedBalance(): string {
    if (!this.balance) return '--';

    // Show breakdown if pack credits exist
    if (this.balance.packBalance > 0) {
      return `${this.balance.total} (${this.balance.monthlyRemaining} monthly + ${this.balance.packBalance} pack)`;
    }

    return this.balance.total.toString();
  }

  /**
   * Get simple total as string
   */
  getTotalString(): string {
    if (!this.balance) return '--';
    return this.balance.total.toString();
  }

  /**
   * Check if balance is low (less than cost of cheapest action)
   */
  isBalanceLow(): boolean {
    if (!this.balance) return true;
    return this.balance.total < CREDIT_COSTS.askStelliumQuestion;
  }

  /**
   * Check if monthly credits are depleted (even if pack credits exist)
   */
  isMonthlyDepleted(): boolean {
    if (!this.balance) return true;
    return this.balance.monthlyRemaining === 0;
  }

  /**
   * Get balance status color based on total
   */
  getBalanceStatusColor(): string {
    if (!this.balance) return '#9CA3AF'; // gray

    if (this.balance.total === 0) return '#EF4444'; // red
    if (this.balance.total < 10) return '#F59E0B'; // amber
    return '#10B981'; // green
  }

  /**
   * Get monthly progress percentage (for progress bars)
   */
  getMonthlyProgress(): number {
    if (!this.balance) return 0;
    if (this.balance.monthlyAllotment === 0) return 0;
    return (this.balance.monthlyRemaining / this.balance.monthlyAllotment) * 100;
  }
}

// Singleton instance
export const creditService = new CreditService();
