import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useRelationshipAnalysisWorkflow } from '../RelationshipApp/src/hooks/useRelationshipAnalysisWorkflow';
import { useRelationshipAppStore } from '../RelationshipApp/src/store';

jest.mock('../RelationshipApp/src/api', () => ({
  relationshipsApi: {
    startFullRelationshipAnalysis: jest.fn(),
    getRelationshipWorkflowStatus: jest.fn(),
    fetchRelationshipAnalysis: jest.fn(),
    resumeRelationshipWorkflow: jest.fn(),
  },
}));

const { relationshipsApi } = jest.requireMock('../RelationshipApp/src/api') as {
  relationshipsApi: {
    startFullRelationshipAnalysis: jest.Mock;
    getRelationshipWorkflowStatus: jest.Mock;
    fetchRelationshipAnalysis: jest.Mock;
    resumeRelationshipWorkflow: jest.Mock;
  };
};

function workflowStatusResponse(
  overrides: Partial<{
    workflowId: string;
    compositeChartId: string;
    status: string;
    completed: boolean;
    phase: string;
    message: string;
  }> = {}
) {
  return {
    success: true,
    workflowId: 'wf_1',
    compositeChartId: 'rel_123',
    status: 'in_progress',
    completed: false,
    phase: 'running',
    stepFunctionStatus: 'RUNNING',
    executionArn: 'arn:test',
    message: 'Running',
    ...overrides,
  };
}

function resetRelationshipAppStore() {
  useRelationshipAppStore.setState({
    authStatus: 'booting',
    bootstrapStatus: 'idle',
    firebaseUid: null,
    firebaseEmail: null,
    bootstrapError: null,
    profile: null,
    isLocalUxMode: false,
    hasCompletedSelfProfile: false,
    selfProfileId: null,
    selfProfileDomain: 'relationship-app',
    activeTargetType: null,
    activeTargetSubject: null,
    activeRelationshipId: null,
    previewAnalysis: null,
    fullAnalysis: null,
    workflowStatus: null,
    workflowPhase: 'idle',
    workflowError: null,
    relationshipHistory: [],
    isHistoryLoading: false,
    historyError: null,
  });
}

describe('relationship app analysis workflow hook', () => {
  let hookValue: ReturnType<typeof useRelationshipAnalysisWorkflow> | null = null;
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  const Harness: React.FC<{ compositeChartId?: string | null }> = ({ compositeChartId }) => {
    hookValue = useRelationshipAnalysisWorkflow(compositeChartId);
    return null;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    hookValue = null;
    renderer = null;
  });

  afterEach(() => {
    act(() => {
      renderer?.unmount();
      resetRelationshipAppStore();
    });
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('sets an error when full analysis is started without an active relationship', async () => {
    await act(async () => {
      resetRelationshipAppStore();
      renderer = ReactTestRenderer.create(<Harness compositeChartId={null} />);
    });

    await act(async () => {
      await hookValue?.startFullAnalysis();
    });

    const state = useRelationshipAppStore.getState();
    expect(state.workflowPhase).toBe('error');
    expect(state.workflowError).toBe(
      'A relationship preview must exist before unlocking full analysis.'
    );
  });

  test('starts full analysis and loads completed report data immediately when the workflow completes', async () => {
    relationshipsApi.startFullRelationshipAnalysis.mockResolvedValue({
      success: true,
      workflowId: 'wf_1',
    });
    relationshipsApi.getRelationshipWorkflowStatus.mockResolvedValue({
      success: true,
      workflowId: 'wf_1',
      compositeChartId: 'rel_123',
      status: 'completed',
      completed: true,
      phase: 'complete',
      stepFunctionStatus: 'SUCCEEDED',
      executionArn: 'arn:test',
      message: 'Complete',
    });
    relationshipsApi.fetchRelationshipAnalysis.mockResolvedValue({
      holisticOverview: 'Deep report ready',
      completeAnalysis: {
        Harmony: {
          synastry: {
            supportPanel: 'Support',
            challengePanel: 'Challenge',
            synthesisPanel: 'Synthesis',
          },
          composite: {
            supportPanel: 'Support',
            challengePanel: 'Challenge',
            synthesisPanel: 'Synthesis',
          },
        },
      },
    });

    await act(async () => {
      resetRelationshipAppStore();
      renderer = ReactTestRenderer.create(<Harness compositeChartId="rel_123" />);
    });

    await act(async () => {
      await hookValue?.startFullAnalysis();
    });

    expect(relationshipsApi.startFullRelationshipAnalysis).toHaveBeenCalledWith('rel_123');
    expect(relationshipsApi.getRelationshipWorkflowStatus).toHaveBeenCalledWith('rel_123');
    expect(relationshipsApi.fetchRelationshipAnalysis).toHaveBeenCalledWith('rel_123');

    const state = useRelationshipAppStore.getState();
    expect(state.workflowPhase).toBe('completed');
    expect(state.workflowStatus?.status).toBe('completed');
    expect(state.fullAnalysis?.holisticOverview).toBe('Deep report ready');
  });

  test('polls until a running workflow completes and then loads the full report', async () => {
    relationshipsApi.getRelationshipWorkflowStatus
      .mockResolvedValueOnce({
        success: true,
        workflowId: 'wf_2',
        compositeChartId: 'rel_456',
        status: 'in_progress',
        completed: false,
        phase: 'running',
        stepFunctionStatus: 'RUNNING',
        executionArn: 'arn:test',
        message: 'Running',
      })
      .mockResolvedValueOnce({
        success: true,
        workflowId: 'wf_2',
        compositeChartId: 'rel_456',
        status: 'completed',
        completed: true,
        phase: 'complete',
        stepFunctionStatus: 'SUCCEEDED',
        executionArn: 'arn:test',
        message: 'Complete',
      });
    relationshipsApi.fetchRelationshipAnalysis.mockResolvedValue({
      holisticOverview: 'Completed after polling',
    });

    await act(async () => {
      resetRelationshipAppStore();
      renderer = ReactTestRenderer.create(<Harness compositeChartId="rel_456" />);
    });

    await act(async () => {
      await hookValue?.refreshWorkflowStatus('rel_456');
    });

    expect(useRelationshipAppStore.getState().workflowPhase).toBe('polling');

    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect(relationshipsApi.fetchRelationshipAnalysis).toHaveBeenCalledWith('rel_456');
    expect(useRelationshipAppStore.getState().workflowPhase).toBe('completed');
    expect(useRelationshipAppStore.getState().fullAnalysis?.holisticOverview).toBe(
      'Completed after polling'
    );
  });

  test('resumes a paused workflow and keeps polling until it completes', async () => {
    relationshipsApi.getRelationshipWorkflowStatus
      .mockResolvedValueOnce(
        workflowStatusResponse({
          compositeChartId: 'rel_paused',
          status: 'paused',
          phase: 'paused',
          message: 'Paused',
        })
      )
      .mockResolvedValueOnce(
        workflowStatusResponse({
          compositeChartId: 'rel_paused',
          status: 'completed',
          completed: true,
          phase: 'complete',
          message: 'Complete',
        })
      );
    relationshipsApi.resumeRelationshipWorkflow.mockResolvedValue({ success: true });
    relationshipsApi.fetchRelationshipAnalysis.mockResolvedValue({
      holisticOverview: 'Resumed and completed',
    });

    await act(async () => {
      resetRelationshipAppStore();
      renderer = ReactTestRenderer.create(<Harness compositeChartId="rel_paused" />);
    });

    await act(async () => {
      useRelationshipAppStore.getState().setWorkflowState({
        workflowPhase: 'polling',
        workflowStatus: null,
        workflowError: null,
      });
    });

    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(relationshipsApi.resumeRelationshipWorkflow).toHaveBeenCalledTimes(1);
    expect(relationshipsApi.resumeRelationshipWorkflow).toHaveBeenCalledWith('rel_paused');
    expect(useRelationshipAppStore.getState().workflowPhase).toBe('polling');

    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useRelationshipAppStore.getState().workflowPhase).toBe('completed');
    expect(useRelationshipAppStore.getState().fullAnalysis?.holisticOverview).toBe(
      'Resumed and completed'
    );
  });

  test('stops polling with an error when a workflow stays paused after a resume request', async () => {
    relationshipsApi.getRelationshipWorkflowStatus.mockResolvedValue(
      workflowStatusResponse({
        compositeChartId: 'rel_stuck',
        status: 'paused',
        phase: 'paused',
        message: 'Paused',
      })
    );
    relationshipsApi.resumeRelationshipWorkflow.mockResolvedValue({ success: true });

    await act(async () => {
      resetRelationshipAppStore();
      renderer = ReactTestRenderer.create(<Harness compositeChartId="rel_stuck" />);
    });

    await act(async () => {
      useRelationshipAppStore.getState().setWorkflowState({
        workflowPhase: 'polling',
        workflowStatus: null,
        workflowError: null,
      });
    });

    // 1 resume poll + MAX_PAUSED_POLLS_AFTER_RESUME (5) paused polls
    for (let i = 0; i < 6; i += 1) {
      await act(async () => {
        jest.advanceTimersByTime(3000);
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    expect(relationshipsApi.resumeRelationshipWorkflow).toHaveBeenCalledTimes(1);
    expect(useRelationshipAppStore.getState().workflowPhase).toBe('error');
    expect(useRelationshipAppStore.getState().workflowError).toBe(
      'The analysis is paused and could not be resumed. Please try unlocking again.'
    );
  });

  test('stores workflow polling errors in relationship-app state', async () => {
    relationshipsApi.getRelationshipWorkflowStatus.mockRejectedValue(new Error('Network dropped'));

    await act(async () => {
      resetRelationshipAppStore();
      renderer = ReactTestRenderer.create(<Harness compositeChartId="rel_789" />);
    });

    await act(async () => {
      useRelationshipAppStore.getState().setWorkflowState({
        workflowPhase: 'polling',
        workflowStatus: null,
        workflowError: null,
      });
    });

    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useRelationshipAppStore.getState().workflowPhase).toBe('error');
    expect(useRelationshipAppStore.getState().workflowError).toBe('Network dropped');
  });

  test('completes full analysis locally without backend calls in local ux mode', async () => {
    await act(async () => {
      resetRelationshipAppStore();
      useRelationshipAppStore.setState({
        isLocalUxMode: true,
        activeRelationshipId: 'local-rel-1',
        previewAnalysis: {
          success: true,
          compositeChartId: 'local-rel-1',
          userA: { id: 'self_1', name: 'Alex Rivera' },
          userB: { id: 'guest_1', name: 'Taylor Smith' },
          clusters: {
            Harmony: { score: 80, rawScore: 8, supportPct: 70, challengePct: 30, heatPct: 60, activityPct: 65, sparkElements: 2, quadrant: 'Easy-going', keystoneAspects: [] },
            Passion: { score: 75, rawScore: 7.5, supportPct: 65, challengePct: 35, heatPct: 78, activityPct: 70, sparkElements: 3, quadrant: 'Dynamic', keystoneAspects: [] },
            Connection: { score: 78, rawScore: 7.8, supportPct: 71, challengePct: 29, heatPct: 62, activityPct: 72, sparkElements: 2, quadrant: 'Easy-going', keystoneAspects: [] },
            Stability: { score: 68, rawScore: 6.8, supportPct: 56, challengePct: 44, heatPct: 48, activityPct: 58, sparkElements: 1, quadrant: 'Dynamic', keystoneAspects: [] },
            Growth: { score: 74, rawScore: 7.4, supportPct: 60, challengePct: 40, heatPct: 64, activityPct: 69, sparkElements: 2, quadrant: 'Dynamic', keystoneAspects: [] },
          },
          overall: {
            score: 76,
            formula: 'Local UX demo score',
            dominantCluster: 'Harmony',
            challengeCluster: 'Stability',
            profile: 'Strong attraction with steady emotional support',
            tier: 'Flourishing',
            strengthClusters: ['Harmony', 'Connection'],
            growthClusters: ['Stability'],
            quadrantAnalytics: { distribution: {}, entropy: 1.1, dominantQuadrant: 'Dynamic', uniformity: 'Moderate' },
            keystoneAspects: [],
          },
          scoredItems: [],
          initialOverview: 'Demo preview',
          tensionFlowAnalysis: {
            supportDensity: 0.7,
            challengeDensity: 0.3,
            polarityRatio: 2.3,
            quadrant: 'Dynamic',
            totalAspects: 12,
            supportAspects: 8,
            challengeAspects: 4,
            keystoneAspects: [],
            insight: { quadrant: 'Dynamic', description: 'Demo', recommendations: [] },
          },
          compositeChart: { planets: [], houses: [], aspects: [], houseSystem: 'placidus', hasAccurateBirthTimes: true },
          synastryAspects: [],
          synastryHousePlacements: { AinB: [], BinA: [] },
          status: 'scores_calculated',
          metadata: {
            processingTime: 'local',
            clustersAnalyzed: 5,
            totalScoredItems: 12,
            workflowType: 'direct-cluster-scoring',
            version: 'local-demo',
            isCelebrityRelationship: false,
            initialOverviewGenerated: true,
          },
        } as any,
      });
      renderer = ReactTestRenderer.create(<Harness compositeChartId="local-rel-1" />);
    });

    await act(async () => {
      await hookValue?.startFullAnalysis();
    });

    await act(async () => {
      jest.advanceTimersByTime(700);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(relationshipsApi.startFullRelationshipAnalysis).not.toHaveBeenCalled();
    expect(useRelationshipAppStore.getState().workflowPhase).toBe('completed');
    expect(useRelationshipAppStore.getState().fullAnalysis?.holisticOverview).toContain('This full read suggests');
  });
});
