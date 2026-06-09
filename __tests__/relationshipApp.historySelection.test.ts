import { buildHistorySelectionState } from '../RelationshipApp/src/screens/historySelection';

describe('relationship app history selection state', () => {
  test('seeds completed workflow and full analysis when a saved relationship has report data', () => {
    const relationship = {
      _id: 'rel_1',
      userA_name: 'Alex',
      userB_name: 'Taylor',
      createdAt: '2026-04-03T00:00:00.000Z',
      completeAnalysis: {
        Harmony: {
          synastry: {
            supportPanel: 'Strong support',
            challengePanel: 'Some friction',
            synthesisPanel: 'Overall balanced',
          },
          composite: {
            supportPanel: 'Shared ease',
            challengePanel: 'Shared tension',
            synthesisPanel: 'Shared growth',
          },
        },
      },
      clusterScoring: {
        clusters: {
          Harmony: { score: 80 },
        },
      },
      initialOverview: 'A strong preview',
      relationshipAnalysisStatus: { level: 'complete' },
    } as any;

    expect(buildHistorySelectionState(relationship)).toEqual({
      fullAnalysis: {
        completeAnalysis: relationship.completeAnalysis,
        clusterScoring: relationship.clusterScoring,
        initialOverview: 'A strong preview',
        userA_name: 'Alex',
        userB_name: 'Taylor',
      },
      workflowPhase: 'completed',
    });
  });

  test('keeps workflow idle and full analysis empty for incomplete history records', () => {
    const relationship = {
      _id: 'rel_2',
      userA_name: 'Alex',
      userB_name: 'Jordan',
      createdAt: '2026-04-03T00:00:00.000Z',
      relationshipAnalysisStatus: { level: 'scores' },
    } as any;

    expect(buildHistorySelectionState(relationship)).toEqual({
      fullAnalysis: null,
      workflowPhase: 'idle',
    });
  });
});
