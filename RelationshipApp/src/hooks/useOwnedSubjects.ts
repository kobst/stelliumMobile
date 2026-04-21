import { useCallback, useEffect, useRef } from 'react';
import { relationshipUsersApi } from '../../../shared/api/relationshipUsers';
import { useRelationshipAppStore } from '../store';

const LOG_TAG = '[useOwnedSubjects]';
const SUBJECTS_REQUEST_WATCHDOG_MS = 15000;

function debugLog(...args: unknown[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(LOG_TAG, ...args);
  }
}

export function useOwnedSubjects(autoLoad: boolean = true) {
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);
  const ownedSubjects = useRelationshipAppStore((state) => state.ownedSubjects);
  const isSubjectsLoading = useRelationshipAppStore((state) => state.isSubjectsLoading);
  const subjectsError = useRelationshipAppStore((state) => state.subjectsError);
  const hasFetchedSubjects = useRelationshipAppStore((state) => state.hasFetchedSubjects);
  const setOwnedSubjects = useRelationshipAppStore((state) => state.setOwnedSubjects);
  const activeRequestIdRef = useRef(0);

  const refreshSubjects = useCallback(
    async (force: boolean = false) => {
      if (isLocalUxMode || !selfProfileId) {
        debugLog('refreshSubjects skip', {
          isLocalUxMode,
          selfProfileId,
        });
        return;
      }

      if (!force && (isSubjectsLoading || ownedSubjects.length > 0)) {
        debugLog('refreshSubjects early-return: already loading or populated', {
          isSubjectsLoading,
          ownedCount: ownedSubjects.length,
        });
        return;
      }

      setOwnedSubjects({
        ownedSubjects: force ? ownedSubjects : [],
        isSubjectsLoading: true,
        subjectsError: null,
      });

      const requestId = activeRequestIdRef.current + 1;
      activeRequestIdRef.current = requestId;
      let didTimeout = false;
      const watchdog = setTimeout(() => {
        if (activeRequestIdRef.current !== requestId) {
          return;
        }

        didTimeout = true;
        debugLog('refreshSubjects watchdog timeout', {
          ownerUserId: selfProfileId,
          timeoutMs: SUBJECTS_REQUEST_WATCHDOG_MS,
        });
        setOwnedSubjects({
          ownedSubjects: [],
          isSubjectsLoading: false,
          subjectsError: 'Loading people took too long. Pull to refresh and try again.',
          hasFetchedSubjects: false,
        });
      }, SUBJECTS_REQUEST_WATCHDOG_MS);

      const startedAt = Date.now();
      try {
        const subjects = await relationshipUsersApi.getUserSubjects(selfProfileId);
        clearTimeout(watchdog);
        if (didTimeout || activeRequestIdRef.current !== requestId) {
          debugLog('refreshSubjects success ignored: stale request', {
            requestId,
            activeRequestId: activeRequestIdRef.current,
            didTimeout,
          });
          return;
        }
        debugLog('refreshSubjects success', {
          durationMs: Date.now() - startedAt,
          count: subjects.length,
        });
        setOwnedSubjects({
          ownedSubjects: subjects,
          isSubjectsLoading: false,
          subjectsError: null,
          hasFetchedSubjects: true,
        });
      } catch (error) {
        clearTimeout(watchdog);
        if (didTimeout || activeRequestIdRef.current !== requestId) {
          debugLog('refreshSubjects error ignored: stale request', {
            requestId,
            activeRequestId: activeRequestIdRef.current,
            didTimeout,
          });
          return;
        }
        debugLog('refreshSubjects error', {
          durationMs: Date.now() - startedAt,
          message: error instanceof Error ? error.message : String(error),
        });
        setOwnedSubjects({
          ownedSubjects: [],
          isSubjectsLoading: false,
          subjectsError:
            error instanceof Error ? error.message : 'Could not load saved subjects.',
          hasFetchedSubjects: true,
        });
      } finally {
        clearTimeout(watchdog);
      }
    },
    [
      isLocalUxMode,
      isSubjectsLoading,
      ownedSubjects,
      selfProfileId,
      setOwnedSubjects,
    ]
  );

  useEffect(() => {
    return () => {
      activeRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    if (
      hasFetchedSubjects ||
      ownedSubjects.length > 0 ||
      isSubjectsLoading ||
      subjectsError
    ) {
      return;
    }
    refreshSubjects().catch(() => undefined);
  }, [
    autoLoad,
    hasFetchedSubjects,
    isSubjectsLoading,
    ownedSubjects.length,
    refreshSubjects,
    subjectsError,
  ]);

  return {
    ownedSubjects,
    isSubjectsLoading,
    subjectsError,
    hasFetchedSubjects,
    refreshSubjects,
  };
}
