/**
 * useCreditBalance Hook
 *
 * React hook for managing credit balance in components.
 * Automatically fetches balance, subscribes to updates, and provides helper functions.
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
  }, [balance?.credits]); // Re-check when balance changes

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
    balance,
    loading,
    error,
    refreshBalance,
    hasEnoughCredits,
    getCost,
    deductCredits,
    addCredits,
    // Helper values
    credits: balance?.credits ?? 0,
    monthlyCredits: balance?.monthlyCredits ?? 0,
    tier: balance?.tier ?? 'free',
    isBalanceLow: creditService.isBalanceLow(),
    formattedBalance: creditService.getFormattedBalance(),
    statusColor: creditService.getBalanceStatusColor(),
  };
}
