import { useCallback, useEffect, useRef } from 'react';
import { relationshipsApi } from '../api';
import { useRelationshipAppStore } from '../store';

const LOG_TAG = '[useRelationshipHistory]';
const HISTORY_REQUEST_WATCHDOG_MS = 15000;

function debugLog(...args: unknown[]) {
  if (__DEV__) {
    console.log(LOG_TAG, ...args);
  }
}

export function useRelationshipHistory(autoLoad: boolean = true) {
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const isHistoryLoading = useRelationshipAppStore((state) => state.isHistoryLoading);
  const historyError = useRelationshipAppStore((state) => state.historyError);
  const hasFetchedHistory = useRelationshipAppStore((state) => state.hasFetchedHistory);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);
  const activeRequestIdRef = useRef(0);

  const refreshHistory = useCallback(
    async (force: boolean = false) => {
      debugLog('refreshHistory called', {
        force,
        isLocalUxMode,
        selfProfileId,
        isHistoryLoading,
        historyLength: relationshipHistory.length,
      });

      if (isLocalUxMode || !selfProfileId) {
        debugLog('refreshHistory early-return: missing selfProfileId or local UX mode');
        return;
      }

      if (!force && (isHistoryLoading || relationshipHistory.length > 0)) {
        debugLog('refreshHistory early-return: already loading or history present', {
          isHistoryLoading,
          historyLength: relationshipHistory.length,
        });
        return;
      }

      debugLog('refreshHistory proceeding → POST /getUserCompositeCharts', {
        ownerUserId: selfProfileId,
      });

      setRelationshipHistory({
        relationshipHistory: force ? relationshipHistory : [],
        isHistoryLoading: true,
        historyError: null,
      });

      const requestId = activeRequestIdRef.current + 1;
      activeRequestIdRef.current = requestId;
      let didTimeout = false;
      const watchdog = setTimeout(() => {
        if (activeRequestIdRef.current !== requestId) {
          return;
        }

        didTimeout = true;
        debugLog('refreshHistory watchdog timeout', {
          ownerUserId: selfProfileId,
          timeoutMs: HISTORY_REQUEST_WATCHDOG_MS,
        });
        setRelationshipHistory({
          relationshipHistory: [],
          isHistoryLoading: false,
          historyError: 'Loading relationships took too long. Pull to refresh and try again.',
          hasFetchedHistory: false,
        });
      }, HISTORY_REQUEST_WATCHDOG_MS);

      const startedAt = Date.now();
      try {
        const charts = await relationshipsApi.getUserCompositeCharts(selfProfileId);
        clearTimeout(watchdog);
        if (didTimeout || activeRequestIdRef.current !== requestId) {
          debugLog('refreshHistory success ignored: stale request', {
            requestId,
            activeRequestId: activeRequestIdRef.current,
            didTimeout,
          });
          return;
        }
        const durationMs = Date.now() - startedAt;
        debugLog('refreshHistory success', {
          durationMs,
          count: Array.isArray(charts) ? charts.length : 'non-array',
          sampleIds: Array.isArray(charts) ? charts.slice(0, 3).map((chart) => chart?._id) : null,
        });
        setRelationshipHistory({
          relationshipHistory: charts,
          isHistoryLoading: false,
          historyError: null,
          hasFetchedHistory: true,
        });
      } catch (error) {
        clearTimeout(watchdog);
        if (didTimeout || activeRequestIdRef.current !== requestId) {
          debugLog('refreshHistory error ignored: stale request', {
            requestId,
            activeRequestId: activeRequestIdRef.current,
            didTimeout,
          });
          return;
        }
        const durationMs = Date.now() - startedAt;
        debugLog('refreshHistory error', {
          durationMs,
          message: error instanceof Error ? error.message : String(error),
          error,
        });
        setRelationshipHistory({
          relationshipHistory: [],
          isHistoryLoading: false,
          historyError:
            error instanceof Error ? error.message : 'Could not load relationship history.',
          hasFetchedHistory: true,
        });
      } finally {
        clearTimeout(watchdog);
      }
    },
    [
      isHistoryLoading,
      isLocalUxMode,
      relationshipHistory,
      selfProfileId,
      setRelationshipHistory,
    ]
  );

  useEffect(() => {
    return () => {
      activeRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    debugLog('effect fire', {
      autoLoad,
      selfProfileId,
      isLocalUxMode,
      isHistoryLoading,
      historyError,
      hasFetchedHistory,
      historyLength: relationshipHistory.length,
    });

    if (!autoLoad) {
      return;
    }

    if (
      hasFetchedHistory ||
      relationshipHistory.length > 0 ||
      isHistoryLoading ||
      historyError
    ) {
      debugLog('effect skip: guard matched', {
        hasFetchedHistory,
        historyLength: relationshipHistory.length,
        isHistoryLoading,
        historyError,
      });
      return;
    }

    refreshHistory().catch(() => undefined);
  }, [
    autoLoad,
    hasFetchedHistory,
    historyError,
    isHistoryLoading,
    isLocalUxMode,
    refreshHistory,
    relationshipHistory.length,
    selfProfileId,
  ]);

  return {
    relationshipHistory,
    isHistoryLoading,
    historyError,
    refreshHistory,
  };
}
