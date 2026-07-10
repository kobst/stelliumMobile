import { useCallback, useEffect } from 'react';
import { relationshipsApi } from '../api';
import { createLocalFullAnalysis, createLocalHistoryEntry } from '../mocks/demoData';
import {
  RelationshipAnalysisResponse,
  RelationshipWorkflowStatusResponse,
} from '../../../shared/api/relationships';
import { RelationshipWorkflowPhase, useRelationshipAppStore } from '../store';
import { FULL_ANALYSIS_COST_CREDITS, isInsufficientCreditsError } from '../api/paywall';

type WorkflowStatus = RelationshipWorkflowStatusResponse['status'];

const COMPLETED_STATUSES = new Set<WorkflowStatus>(['completed', 'completed_with_failures']);

const POLL_INTERVAL_MS = 3000;
// Hard stop so a stuck workflow (e.g. persistent 'unknown'/'not_started')
// cannot poll forever: 100 × 3s = 5 minutes.
const MAX_POLL_ATTEMPTS = 100;
// Polls tolerated in 'paused' after a resume request before giving up.
const MAX_PAUSED_POLLS_AFTER_RESUME = 5;

const POLL_TIMEOUT_MESSAGE =
  'The analysis is taking longer than expected. Please try again in a few minutes.';
const PAUSED_RESUME_FAILED_MESSAGE =
  'The analysis is paused and could not be resumed. Please try unlocking again.';

function resolveWorkflowPhase(status: WorkflowStatus): RelationshipWorkflowPhase {
  if (status === 'failed') {
    return 'error';
  }
  if (COMPLETED_STATUSES.has(status)) {
    return 'completed';
  }
  return 'polling';
}

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
        workflowPhase: resolveWorkflowPhase(response.status),
        workflowError: response.status === 'failed' ? response.message : null,
      });

      if (COMPLETED_STATUSES.has(response.status)) {
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
    let pollCount = 0;
    let resumeRequested = false;
    let pausedPollsAfterResume = 0;
    const interval = setInterval(async () => {
      try {
        pollCount += 1;
        if (pollCount > MAX_POLL_ATTEMPTS) {
          setWorkflowState({
            workflowPhase: 'error',
            workflowError: POLL_TIMEOUT_MESSAGE,
          });
          return;
        }

        const response = await relationshipsApi.getRelationshipWorkflowStatus(compositeChartId);

        if (cancelled) {
          return;
        }

        if (response.status === 'paused') {
          // The backend pauses the compact workflow after preview scores;
          // resume it once instead of polling a stalled workflow forever.
          if (!resumeRequested) {
            resumeRequested = true;
            await relationshipsApi.resumeRelationshipWorkflow(compositeChartId);
            if (cancelled) {
              return;
            }
          } else {
            pausedPollsAfterResume += 1;
            if (pausedPollsAfterResume >= MAX_PAUSED_POLLS_AFTER_RESUME) {
              setWorkflowState({
                workflowStatus: response,
                workflowPhase: 'error',
                workflowError: PAUSED_RESUME_FAILED_MESSAGE,
              });
              return;
            }
          }
          setWorkflowState({
            workflowStatus: response,
            workflowPhase: 'polling',
            workflowError: null,
          });
          return;
        }

        setWorkflowState({
          workflowStatus: response,
          workflowPhase: resolveWorkflowPhase(response.status),
          workflowError: response.status === 'failed' ? response.message : null,
        });

        if (COMPLETED_STATUSES.has(response.status)) {
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
    }, POLL_INTERVAL_MS);

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
