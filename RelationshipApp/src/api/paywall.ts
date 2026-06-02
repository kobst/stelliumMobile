import { ApiError } from '../../../shared/api/client';
import { useRelationshipAppStore } from '../store';

// The backend gates Iris actions with a machine-readable `code` on a non-2xx
// response (see the relationship credit service / subscriptionErrors). These
// helpers classify those so the UI can react: INSUFFICIENT_CREDITS means buying
// credits or subscribing unblocks the action, while LIMIT_REACHED is a daily
// fair-use cap that resets on its own (buying does not help).

export function isInsufficientCreditsError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'INSUFFICIENT_CREDITS';
}

export function isDailyLimitError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'LIMIT_REACHED';
}

// Mirror the backend costs (constants/irisBilling.ts).
const RELATIONSHIP_OVERVIEW_COST_CREDITS = 10;
const GUEST_SUBJECT_OVERVIEW_COST_CREDITS = 1;

interface PaywallTrigger {
  label: string;
  cost: number;
  onComplete?: () => void;
}

/**
 * If `error` is an insufficient-credits rejection, open the app-wide paywall and
 * return true (caller should stop and skip its generic error handling).
 * Otherwise returns false so the caller handles the error normally.
 */
export function presentPaywallIfInsufficient(error: unknown, trigger: PaywallTrigger): boolean {
  if (!isInsufficientCreditsError(error)) {
    return false;
  }
  const { credits, showPaywall } = useRelationshipAppStore.getState();
  showPaywall({
    label: trigger.label,
    missingCredits: Math.max(trigger.cost - (credits?.purchased ?? 0), 1),
    onComplete: trigger.onComplete,
  });
  return true;
}

/**
 * Convenience for the relationship overview gate (the shared `startRelationshipPreview`
 * flow invoked from the connection/celebrity screens).
 */
export function presentRelationshipOverviewPaywall(error: unknown): boolean {
  return presentPaywallIfInsufficient(error, {
    label: 'create this connection',
    cost: RELATIONSHIP_OVERVIEW_COST_CREDITS,
  });
}

/**
 * Convenience for the guest-subject (add-a-person) gate, charged when creating a
 * person and its romantic overview.
 */
export function presentGuestSubjectPaywall(error: unknown): boolean {
  return presentPaywallIfInsufficient(error, {
    label: 'add this person',
    cost: GUEST_SUBJECT_OVERVIEW_COST_CREDITS,
  });
}

/**
 * Optimistic pre-check before entering a flow that will cost credits, so the
 * user is gated up front instead of after filling out a form. Mirrors the
 * backend rule for non-analysis actions (active subscribers are covered;
 * otherwise the cost must be available in purchased credits). The backend
 * remains the source of truth at submit, so a stale balance just falls back to
 * the gate at the end.
 */
export function ensureCanAffordOrPaywall(cost: number, label: string): boolean {
  const { credits, subscription, showPaywall } = useRelationshipAppStore.getState();
  const subscribed = (subscription?.tier ?? 'free') !== 'free';
  const purchased = credits?.purchased ?? 0;
  if (subscribed || purchased >= cost) {
    return true;
  }
  showPaywall({ label, missingCredits: Math.max(cost - purchased, 1) });
  return false;
}

export function ensureCanAddPersonOrPaywall(): boolean {
  return ensureCanAffordOrPaywall(GUEST_SUBJECT_OVERVIEW_COST_CREDITS, 'add this person');
}
