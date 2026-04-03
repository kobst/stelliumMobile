import { useCallback, useEffect } from 'react';
import { relationshipsApi } from '../api';
import {
  RelationshipAnalysisResponse,
  RelationshipWorkflowStatusResponse,
} from '../../../shared/api/relationships';
import { useRelationshipAppStore } from '../store';

const TERMINAL_STATUSES = new Set([
  'completed',
  'completed_with_failures',
  'failed',
  'paused_after_scores',
] as const);

export function useRelationshipAnalysisWorkflow(compositeChartId?: string | null) {
  const workflowStatus = useRelationshipAppStore((state) => state.workflowStatus);
  const workflowPhase = useRelationshipAppStore((state) => state.workflowPhase);
  const workflowError = useRelationshipAppStore((state) => state.workflowError);
  const fullAnalysis = useRelationshipAppStore((state) => state.fullAnalysis);
  const setWorkflowState = useRelationshipAppStore((state) => state.setWorkflowState);
  const setFullAnalysis = useRelationshipAppStore((state) => state.setFullAnalysis);

  const loadFullAnalysis = useCallback(
    async (targetCompositeChartId: string): Promise<RelationshipAnalysisResponse> => {
      const response = await relationshipsApi.fetchRelationshipAnalysis(targetCompositeChartId);
      setFullAnalysis(response);
      return response;
    },
    [setFullAnalysis]
  );

  const refreshWorkflowStatus = useCallback(
    async (targetCompositeChartId: string): Promise<RelationshipWorkflowStatusResponse> => {
      const response = await relationshipsApi.getRelationshipWorkflowStatus(targetCompositeChartId);
      setWorkflowState({
        workflowStatus: response,
        workflowPhase: TERMINAL_STATUSES.has(response.status)
          ? response.status === 'failed'
            ? 'error'
            : 'completed'
          : 'polling',
        workflowError: response.status === 'failed' ? response.message : null,
      });

      if (response.status === 'completed' || response.status === 'completed_with_failures') {
        await loadFullAnalysis(targetCompositeChartId);
      }

      return response;
    },
    [loadFullAnalysis, setWorkflowState]
  );

  const startFullAnalysis = useCallback(async () => {
    if (!compositeChartId) {
      setWorkflowState({
        workflowPhase: 'error',
        workflowError: 'A relationship preview must exist before unlocking full analysis.',
      });
      return;
    }

    try {
      setWorkflowState({
        workflowPhase: 'starting',
        workflowError: null,
      });

      const response = await relationshipsApi.startFullRelationshipAnalysis(compositeChartId);

      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to start full analysis.');
      }

      await refreshWorkflowStatus(compositeChartId);
    } catch (error) {
      setWorkflowState({
        workflowPhase: 'error',
        workflowError:
          error instanceof Error ? error.message : 'Failed to start full relationship analysis.',
      });
    }
  }, [compositeChartId, refreshWorkflowStatus, setWorkflowState]);

  useEffect(() => {
    if (!compositeChartId || workflowPhase !== 'polling') {
      return;
    }

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const response = await relationshipsApi.getRelationshipWorkflowStatus(compositeChartId);

        if (cancelled) {
          return;
        }

        setWorkflowState({
          workflowStatus: response,
          workflowPhase: TERMINAL_STATUSES.has(response.status)
            ? response.status === 'failed'
              ? 'error'
              : 'completed'
            : 'polling',
          workflowError: response.status === 'failed' ? response.message : null,
        });

        if (response.status === 'completed' || response.status === 'completed_with_failures') {
          await loadFullAnalysis(compositeChartId);
        }
      } catch (error) {
        if (!cancelled) {
          setWorkflowState({
            workflowPhase: 'error',
            workflowError:
              error instanceof Error ? error.message : 'Workflow polling failed.',
          });
        }
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [compositeChartId, loadFullAnalysis, setWorkflowState, workflowPhase]);

  return {
    workflowStatus,
    workflowPhase,
    workflowError,
    fullAnalysis,
    startFullAnalysis,
    refreshWorkflowStatus,
    loadFullAnalysis,
    isStarting: workflowPhase === 'starting',
    isPolling: workflowPhase === 'polling',
    isCompleted: workflowPhase === 'completed',
    hasFailed: workflowPhase === 'error',
  };
}
