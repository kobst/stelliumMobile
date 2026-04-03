import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useRelationshipAnalysisWorkflow } from '../RelationshipApp/src/hooks/useRelationshipAnalysisWorkflow';
import { useRelationshipAppStore } from '../RelationshipApp/src/store';

jest.mock('../RelationshipApp/src/api', () => ({
  relationshipsApi: {
    startFullRelationshipAnalysis: jest.fn(),
    getRelationshipWorkflowStatus: jest.fn(),
    fetchRelationshipAnalysis: jest.fn(),
  },
}));

const { relationshipsApi } = jest.requireMock('../RelationshipApp/src/api') as {
  relationshipsApi: {
    startFullRelationshipAnalysis: jest.Mock;
    getRelationshipWorkflowStatus: jest.Mock;
    fetchRelationshipAnalysis: jest.Mock;
  };
};

function resetRelationshipAppStore() {
  useRelationshipAppStore.setState({
    authStatus: 'booting',
    bootstrapStatus: 'idle',
    firebaseUid: null,
    firebaseEmail: null,
    bootstrapError: null,
    profile: null,
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
});
