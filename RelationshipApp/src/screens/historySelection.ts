import { UserCompositeChart } from '../../../shared/api/relationships';
import { RelationshipAnalysisResponse } from '../../../shared/api/relationships';
import { RelationshipWorkflowPhase } from '../store';

export function buildHistorySelectionState(relationship: UserCompositeChart): {
  fullAnalysis: RelationshipAnalysisResponse | null;
  workflowPhase: RelationshipWorkflowPhase;
} {
  const fullAnalysis =
    relationship.completeAnalysis || relationship.clusterScoring || relationship.initialOverview
      ? {
          completeAnalysis: relationship.completeAnalysis,
          clusterScoring: relationship.clusterScoring,
          initialOverview: relationship.initialOverview,
          userA_name: relationship.userA_name,
          userB_name: relationship.userB_name,
        }
      : null;

  const workflowPhase: RelationshipWorkflowPhase =
    relationship.relationshipAnalysisStatus?.level === 'complete' ? 'completed' : 'idle';

  return {
    fullAnalysis,
    workflowPhase,
  };
}
