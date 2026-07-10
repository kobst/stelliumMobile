import type { AsyncStatus } from '../../../shared/api/onboarding';

export const CELEB_POLL_INTERVAL_MS = 2500;
// Cap combined matches+annotations polling at ~2 minutes; past that the
// backend job is treated as failed so the reveal screen stops the skeleton.
export const MAX_CELEB_POLL_ATTEMPTS = 48;

export const CELEB_POLL_TIMEOUT_MESSAGE =
  'Timed out waiting for celebrity matches.';

export function resolveTimedOutCelebStatuses(
  matches: AsyncStatus | null,
  annotations: AsyncStatus | null,
): { celebMatchesStatus: AsyncStatus; celebAnnotationsStatus: AsyncStatus } {
  const timeOut = (status: AsyncStatus | null): AsyncStatus =>
    status?.status === 'completed'
      ? status
      : {
          ...status,
          status: 'failed',
          error: CELEB_POLL_TIMEOUT_MESSAGE,
        };

  return {
    celebMatchesStatus: timeOut(matches),
    celebAnnotationsStatus: timeOut(annotations),
  };
}
