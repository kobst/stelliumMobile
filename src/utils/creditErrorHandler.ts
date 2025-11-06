/**
 * Credit Error Handler
 *
 * Handles API errors related to insufficient credits.
 * Delegates to CreditFlowManager to show appropriate paywall/screen.
 */

import { ApiError } from '../api/client';
import { creditFlowManager } from '../services/CreditFlowManager';
import { useStore } from '../store';

export interface InsufficientCreditsError {
  error: 'INSUFFICIENT_CREDITS';
  required: number;
  available: number;
  action: string;
}

/**
 * Check if an error is an insufficient credits error
 */
export function isInsufficientCreditsError(error: any): error is InsufficientCreditsError {
  return (
    error?.error === 'INSUFFICIENT_CREDITS' ||
    (error instanceof ApiError && error.status === 402)
  );
}

/**
 * Handle insufficient credits error
 * Uses CreditFlowManager to show appropriate screen (Superwall or credit purchase)
 */
export async function handleInsufficientCredits(
  error: InsufficientCreditsError | ApiError,
  source?: string
): Promise<void> {
  // Extract error details
  let errorDetails: InsufficientCreditsError;

  if (error instanceof ApiError) {
    // Parse from API error
    try {
      const parsed = JSON.parse(error.code || '{}');
      errorDetails = {
        error: 'INSUFFICIENT_CREDITS',
        required: parsed.required || 0,
        available: parsed.available || 0,
        action: parsed.action || 'unknown',
      };
    } catch {
      console.error('[CreditErrorHandler] Failed to parse API error');
      return;
    }
  } else {
    errorDetails = error;
  }

  const { required, available, action } = errorDetails;

  console.log('[CreditErrorHandler] Handling insufficient credits:', {
    required,
    available,
    action,
    source,
  });

  // Get current subscription tier from store
  const { userSubscription } = useStore.getState();
  const currentTier = userSubscription?.tier || 'free';

  // Note: The 'available' value from the backend error already represents
  // the total credits (monthlyRemaining + packBalance) in the new dual-credit system.
  // The backend calculates this before returning the error.
  await creditFlowManager.handleInsufficientCredits({
    currentTier,
    currentCredits: available, // This is 'total' from dual-credit system
    requiredCredits: required,
    source: source || action,
  });
}
