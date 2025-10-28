/**
 * useCreditBalance Hook - Dual-Credit System
 *
 * React hook for managing credit balance in components.
 * Automatically fetches balance, subscribes to updates, and provides helper functions.
 *
 * Returns breakdown of monthly and pack credits.
 */

import { useState, useEffect, useCallback } from 'react';
import { creditService, CreditBalance, CreditAction } from '../services/CreditService';
import { useStore } from '../store';

export function useCreditBalance() {
  const { userData } = useStore();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance on mount and when user changes
  useEffect(() => {
    if (!userData?.id) {
      setBalance(null);
      return;
    }

    const fetchInitialBalance = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedBalance = await creditService.fetchBalance(userData.id);
        setBalance(fetchedBalance);
      } catch (err: any) {
        console.error('[useCreditBalance] Failed to fetch balance:', err);
        setError(err.message || 'Failed to load credit balance');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialBalance();

    // Subscribe to balance changes
    const unsubscribe = creditService.addListener((newBalance) => {
      setBalance(newBalance);
    });

    return () => {
      unsubscribe();
    };
  }, [userData?.id]);

  // Refresh balance manually
  const refreshBalance = useCallback(async () => {
    if (!userData?.id) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedBalance = await creditService.fetchBalance(userData.id);
      setBalance(fetchedBalance);
    } catch (err: any) {
      console.error('[useCreditBalance] Failed to refresh balance:', err);
      setError(err.message || 'Failed to refresh credit balance');
    } finally {
      setLoading(false);
    }
  }, [userData?.id]);

  // Check if user has enough credits for an action
  const hasEnoughCredits = useCallback((action: CreditAction): boolean => {
    return creditService.hasEnoughCredits(action);
  }, [balance?.total]); // Re-check when total changes

  // Get cost for an action
  const getCost = useCallback((action: CreditAction): number => {
    return creditService.getCost(action);
  }, []);

  // Deduct credits optimistically
  const deductCredits = useCallback((action: CreditAction) => {
    creditService.deductCreditsOptimistically(action);
  }, []);

  // Add credits optimistically
  const addCredits = useCallback((amount: number) => {
    creditService.addCreditsOptimistically(amount);
  }, []);

  return {
    // Full balance object
    balance,
    loading,
    error,
    refreshBalance,

    // Actions
    hasEnoughCredits,
    getCost,
    deductCredits,
    addCredits,

    // Dual-Credit Breakdown (NEW)
    total: balance?.total ?? 0,                        // Total available
    monthly: balance?.monthlyRemaining ?? 0,           // Monthly remaining
    pack: balance?.packBalance ?? 0,                   // Pack balance
    monthlyLimit: balance?.monthlyAllotment ?? 0,      // Monthly allotment
    tier: balance?.tier ?? 'free',

    // Helper values
    isBalanceLow: creditService.isBalanceLow(),
    isMonthlyDepleted: creditService.isMonthlyDepleted(),
    monthlyProgress: creditService.getMonthlyProgress(),
    formattedBalance: creditService.getFormattedBalance(),
    totalString: creditService.getTotalString(),
    statusColor: creditService.getBalanceStatusColor(),
  };
}
