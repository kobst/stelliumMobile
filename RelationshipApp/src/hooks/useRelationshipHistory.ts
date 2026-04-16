import { useCallback, useEffect } from 'react';
import { relationshipsApi } from '../api';
import { useRelationshipAppStore } from '../store';

export function useRelationshipHistory(autoLoad: boolean = true) {
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const isHistoryLoading = useRelationshipAppStore((state) => state.isHistoryLoading);
  const historyError = useRelationshipAppStore((state) => state.historyError);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);

  const refreshHistory = useCallback(
    async (force: boolean = false) => {
      if (isLocalUxMode || !selfProfileId) {
        return;
      }

      if (!force && (isHistoryLoading || relationshipHistory.length > 0)) {
        return;
      }

      setRelationshipHistory({
        relationshipHistory: force ? relationshipHistory : [],
        isHistoryLoading: true,
        historyError: null,
      });

      try {
        const charts = await relationshipsApi.getUserCompositeCharts(selfProfileId);
        setRelationshipHistory({
          relationshipHistory: charts,
          isHistoryLoading: false,
          historyError: null,
        });
      } catch (error) {
        setRelationshipHistory({
          relationshipHistory: [],
          isHistoryLoading: false,
          historyError:
            error instanceof Error ? error.message : 'Could not load relationship history.',
        });
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
    if (!autoLoad) {
      return;
    }

    if (relationshipHistory.length > 0 || isHistoryLoading || historyError) {
      return;
    }

    refreshHistory().catch(() => undefined);
  }, [autoLoad, historyError, isHistoryLoading, refreshHistory, relationshipHistory.length]);

  return {
    relationshipHistory,
    isHistoryLoading,
    historyError,
    refreshHistory,
  };
}
