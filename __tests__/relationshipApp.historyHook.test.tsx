import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useRelationshipHistory } from '../RelationshipApp/src/hooks/useRelationshipHistory';
import { useRelationshipAppStore } from '../RelationshipApp/src/store';

jest.mock('../RelationshipApp/src/api', () => ({
  relationshipsApi: {
    getUserCompositeCharts: jest.fn(),
  },
}));

const { relationshipsApi } = jest.requireMock('../RelationshipApp/src/api') as {
  relationshipsApi: {
    getUserCompositeCharts: jest.Mock;
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
    isLocalUxMode: false,
    hasCompletedSelfProfile: true,
    selfProfileId: 'self_123',
    selfProfileDomain: 'relationship-app',
    selfProfileOverview: null,
    activeTargetType: null,
    activeTargetSubject: null,
    activeRelationshipId: null,
    activePartnerRomanticAssets: null,
    previewAnalysis: null,
    fullAnalysis: null,
    workflowStatus: null,
    workflowPhase: 'idle',
    workflowError: null,
    relationshipHistory: [],
    isHistoryLoading: false,
    historyError: null,
    hasFetchedHistory: false,
    ownedSubjects: [],
    isSubjectsLoading: false,
    subjectsError: null,
    hasFetchedSubjects: false,
  });
}

describe('relationship app history hook', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  const Harness: React.FC = () => {
    useRelationshipHistory(true);
    return null;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
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

  test('clears loading and exposes a retryable error when the relationship request hangs', async () => {
    relationshipsApi.getUserCompositeCharts.mockImplementation(
      () => new Promise(() => undefined)
    );

    await act(async () => {
      resetRelationshipAppStore();
      renderer = ReactTestRenderer.create(<Harness />);
    });

    expect(useRelationshipAppStore.getState().isHistoryLoading).toBe(true);
    expect(relationshipsApi.getUserCompositeCharts).toHaveBeenCalledWith('self_123');

    await act(async () => {
      jest.advanceTimersByTime(15000);
      await Promise.resolve();
    });

    const state = useRelationshipAppStore.getState();
    expect(state.isHistoryLoading).toBe(false);
    expect(state.historyError).toBe(
      'Loading relationships took too long. Pull to refresh and try again.'
    );
    expect(state.hasFetchedHistory).toBe(false);
  });
});
