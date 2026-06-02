import { ApiError } from '../../../shared/api/client';

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
