/**
 * useCreditsGate Hook
 *
 * Provides credit gating functionality for any action that costs credits.
 * Checks credits before action, handles insufficient credits, and manages deduction.
 *
 * Usage:
 * ```tsx
 * const { checkAndProceed } = useCreditsGate();
 *
 * const handleAction = async () => {
 *   const allowed = await checkAndProceed({
 *     action: 'fullNatalReport',
 *     onProceed: async () => {
 *       // Your API call here
 *       await api.generateReport();
 *     },
 *   });
 * };
 * ```
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import { useCreditBalance } from './useCreditBalance';
import { creditFlowManager } from '../services/CreditFlowManager';
import { useStore } from '../store';
import { CreditAction, CREDIT_COSTS } from '../config/subscriptionConfig';

export interface CreditGateOptions {
  /** The action being performed (determines cost) */
  action: CreditAction;
  /** Function to execute if credits are sufficient */
  onProceed: () => Promise<void>;
  /** Optional source identifier for analytics */
  source?: string;
  /** Optional callback if insufficient credits */
  onInsufficientCredits?: () => void;
  /** Whether to show loading state */
  showLoading?: boolean;
}

export function useCreditsGate() {
  const [isChecking, setIsChecking] = useState(false);
  const {
    total,
    hasEnoughCredits,
    getCost,
    deductCredits,
    refreshBalance,
  } = useCreditBalance();
  const { userSubscription } = useStore();

  /**
   * Check if user has enough credits and proceed with action
   * Returns true if action was allowed, false if blocked by insufficient credits
   */
  const checkAndProceed = async (options: CreditGateOptions): Promise<boolean> => {
    const {
      action,
      onProceed,
      source = 'unknown',
      onInsufficientCredits,
      showLoading = true,
    } = options;

    console.log('[CreditsGate] Checking credits for action:', {
      action,
      source,
      currentCredits: total,
      cost: getCost(action),
    });

    if (showLoading) {
      setIsChecking(true);
    }

    try {
      // Check if user has enough credits
      if (!hasEnoughCredits(action)) {
        console.log('[CreditsGate] Insufficient credits, showing paywall flow');

        // Calculate shortfall
        const cost = getCost(action);
        const shortfall = cost - total;

        // Call optional callback
        if (onInsufficientCredits) {
          onInsufficientCredits();
        }

        // Show appropriate paywall/purchase screen via CreditFlowManager
        await creditFlowManager.handleInsufficientCredits({
          currentTier: userSubscription?.tier || 'free',
          currentCredits: total,
          requiredCredits: cost,
          source,
        });

        return false;
      }

      console.log('[CreditsGate] Credits sufficient, proceeding with action');

      // Deduct credits optimistically (local state)
      deductCredits(action);

      // Execute the action
      await onProceed();

      // Refresh balance from backend to sync
      await refreshBalance();

      console.log('[CreditsGate] Action completed successfully');
      return true;
    } catch (error: any) {
      console.error('[CreditsGate] Action failed:', error);

      // Check if it's a 402 insufficient credits error from backend
      if (error.status === 402 || error.code === 'INSUFFICIENT_CREDITS') {
        console.log('[CreditsGate] Backend returned 402, handling insufficient credits');

        // Refresh balance to get latest from server
        await refreshBalance();

        // Show paywall
        await creditFlowManager.handleInsufficientCredits({
          currentTier: userSubscription?.tier || 'free',
          currentCredits: error.available || total,
          requiredCredits: error.required || getCost(action),
          source,
        });

        return false;
      }

      // Re-throw other errors
      throw error;
    } finally {
      if (showLoading) {
        setIsChecking(false);
      }
    }
  };

  /**
   * Check credits without proceeding (for showing warnings/badges)
   */
  const canAfford = (action: CreditAction): boolean => {
    return hasEnoughCredits(action);
  };

  /**
   * Get formatted message about credit cost
   */
  const getCostMessage = (action: CreditAction): string => {
    const cost = getCost(action);
    const sufficient = hasEnoughCredits(action);

    if (sufficient) {
      return `This costs ${cost} credits`;
    } else {
      const shortfall = cost - total;
      return `Need ${shortfall} more credits (${cost} required, ${total} available)`;
    }
  };

  return {
    checkAndProceed,
    canAfford,
    getCostMessage,
    isChecking,
  };
}
