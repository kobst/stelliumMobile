import { useCallback, useEffect } from 'react';
import { relationshipsApi } from '../api';
import { createLocalFullAnalysis, createLocalHistoryEntry } from '../mocks/demoData';
import {
  RelationshipAnalysisResponse,
  RelationshipWorkflowStatusResponse,
} from '../../../shared/api/relationships';
import { useRelationshipAppStore } from '../store';
import { isInsufficientCreditsError } from '../api/paywall';

const FULL_ANALYSIS_COST_CREDITS = 50;

const TERMINAL_STATUSES = new Set<RelationshipWorkflowStatusResponse['status']>([
  'completed',
  'completed_with_failures',
  'failed',
  'paused_after_scores',
]);

export function useRelationshipAnalysisWorkflow(compositeChartId?: string | null) {
  const workflowStatus = useRelationshipAppStore((state) => state.workflowStatus);
  const workflowPhase = useRelationshipAppStore((state) => state.workflowPhase);
  const workflowError = useRelationshipAppStore((state) => state.workflowError);
  const fullAnalysis = useRelationshipAppStore((state) => state.fullAnalysis);
  const previewAnalysis = useRelationshipAppStore((state) => state.previewAnalysis);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const setWorkflowState = useRelationshipAppStore((state) => state.setWorkflowState);
  const setFullAnalysis = useRelationshipAppStore((state) => state.setFullAnalysis);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);

  const loadFullAnalysis = useCallback(
    async (targetCompositeChartId: string): Promise<RelationshipAnalysisResponse> => {
      if (isLocalUxMode && previewAnalysis) {
        const response = createLocalFullAnalysis(previewAnalysis);
        setFullAnalysis(response);
        setRelationshipHistory({
          relationshipHistory: [
            createLocalHistoryEntry({ preview: previewAnalysis, fullAnalysis: response }),
            ...relationshipHistory.filter((item) => item._id !== targetCompositeChartId),
          ],
        });
        return response;
      }

      const response = await relationshipsApi.fetchRelationshipAnalysis(targetCompositeChartId);
      setFullAnalysis(response);
      return response;
    },
    [isLocalUxMode, previewAnalysis, relationshipHistory, setFullAnalysis, setRelationshipHistory]
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
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[useRelationshipAnalysisWorkflow] startFullAnalysis enter', {
        compositeChartId,
        isLocalUxMode,
        hasPreviewAnalysis: Boolean(previewAnalysis),
      });
    }
    if (!compositeChartId) {
      setWorkflowState({
        workflowPhase: 'error',
        workflowError: 'A relationship preview must exist before unlocking full analysis.',
      });
      return;
    }

    try {
      if (isLocalUxMode && compositeChartId && previewAnalysis) {
        setWorkflowState({
          workflowPhase: 'starting',
          workflowError: null,
        });

        setTimeout(() => {
          setWorkflowState({
            workflowStatus: {
              success: true,
              workflowId: 'local-workflow',
              compositeChartId,
              status: 'completed',
              completed: true,
              phase: 'complete',
              stepFunctionStatus: 'LOCAL_DEMO',
              executionArn: 'local-demo',
              message: 'Full analysis ready.',
            },
            workflowPhase: 'completed',
            workflowError: null,
          });
          const response = createLocalFullAnalysis(previewAnalysis);
          setFullAnalysis(response);
          setRelationshipHistory({
            relationshipHistory: [
              createLocalHistoryEntry({ preview: previewAnalysis, fullAnalysis: response }),
              ...relationshipHistory.filter((item) => item._id !== compositeChartId),
            ],
          });
        }, 600);
        return;
      }

      setWorkflowState({
        workflowPhase: 'starting',
        workflowError: null,
      });

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[useRelationshipAnalysisWorkflow] startFullRelationshipAnalysis request', {
          compositeChartId,
        });
      }
      const response = await relationshipsApi.startFullRelationshipAnalysis(compositeChartId);
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[useRelationshipAnalysisWorkflow] startFullRelationshipAnalysis response', {
          success: response?.success,
          status: (response as any)?.status,
          message: (response as any)?.message,
          error: (response as any)?.error,
          keys: response ? Object.keys(response as object) : null,
        });
      }

      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to start full analysis.');
      }

      await refreshWorkflowStatus(compositeChartId);
    } catch (error) {
      if (isInsufficientCreditsError(error)) {
        const state = useRelationshipAppStore.getState();
        state.showPaywall({
          label: 'start the full relationship analysis',
          missingCredits: Math.max(
            FULL_ANALYSIS_COST_CREDITS - (state.credits?.purchased ?? 0),
            1
          ),
        });
        setWorkflowState({ workflowPhase: 'idle', workflowError: null });
        return;
      }
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[useRelationshipAnalysisWorkflow] startFullAnalysis caught error', {
          compositeChartId,
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : undefined,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      setWorkflowState({
        workflowPhase: 'error',
        workflowError:
          error instanceof Error ? error.message : 'Failed to start full relationship analysis.',
      });
    }
  }, [compositeChartId, isLocalUxMode, previewAnalysis, refreshWorkflowStatus, relationshipHistory, setFullAnalysis, setRelationshipHistory, setWorkflowState]);

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
