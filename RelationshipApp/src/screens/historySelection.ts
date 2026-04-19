import { UserCompositeChart } from '../../../shared/api/relationships';
import {
  EnhancedRelationshipAnalysisResponse,
  RelationshipAnalysisResponse,
} from '../../../shared/api/relationships';
import { RelationshipWorkflowPhase } from '../store';

export function buildHistorySelectionState(relationship: UserCompositeChart): {
  fullAnalysis: RelationshipAnalysisResponse | null;
  previewAnalysis: EnhancedRelationshipAnalysisResponse | null;
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
    previewAnalysis: buildPreviewFromHistory(relationship),
    workflowPhase,
  };
}

function buildPreviewFromHistory(
  relationship: UserCompositeChart
): EnhancedRelationshipAnalysisResponse | null {
  const status = relationship.relationshipAnalysisStatus;
  const clusterScoring = relationship.clusterScoring;

  const overall =
    clusterScoring?.overall ??
    (status?.overall
      ? {
          score: 0,
          formula: '',
          dominantCluster: '',
          challengeCluster: '',
          profile: status.overall.profile ?? '',
          tier: status.overall.tier ?? '',
          strengthClusters: [],
          growthClusters: [],
          quadrantAnalytics: {
            distribution: {},
            entropy: 0,
            dominantQuadrant: '',
            uniformity: '',
          },
          keystoneAspects: [],
          summary: status.overall.summary,
        }
      : null);

  if (!overall && !clusterScoring) {
    // Nothing to stage — preview screen will show sparse state
    return null;
  }

  const clusterScores = status?.clusterScores;
  const clusters = (clusterScoring?.clusters ??
    (clusterScores
      ? {
          Harmony: fabricateClusterMetrics(clusterScores.Harmony),
          Passion: fabricateClusterMetrics(clusterScores.Passion),
          Connection: fabricateClusterMetrics(clusterScores.Connection),
          Stability: fabricateClusterMetrics(clusterScores.Stability),
          Growth: fabricateClusterMetrics(clusterScores.Growth),
        }
      : {
          Harmony: fabricateClusterMetrics(0),
          Passion: fabricateClusterMetrics(0),
          Connection: fabricateClusterMetrics(0),
          Stability: fabricateClusterMetrics(0),
          Growth: fabricateClusterMetrics(0),
        })) as EnhancedRelationshipAnalysisResponse['clusters'];

  return {
    success: true,
    compositeChartId: relationship._id,
    userA: { id: relationship.userA_id ?? '', name: relationship.userA_name },
    userB: { id: relationship.userB_id ?? '', name: relationship.userB_name },
    clusters,
    overall: (overall ?? {
      score: 0,
      formula: '',
      dominantCluster: '',
      challengeCluster: '',
      profile: '',
      tier: '',
      strengthClusters: [],
      growthClusters: [],
      quadrantAnalytics: {
        distribution: {},
        entropy: 0,
        dominantQuadrant: '',
        uniformity: '',
      },
      keystoneAspects: [],
    }) as EnhancedRelationshipAnalysisResponse['overall'],
    scoredItems: [],
    initialOverview: relationship.initialOverview ?? null,
    tensionFlowAnalysis:
      undefined as unknown as EnhancedRelationshipAnalysisResponse['tensionFlowAnalysis'],
    compositeChart:
      relationship.compositeChart as EnhancedRelationshipAnalysisResponse['compositeChart'],
    synastryAspects: relationship.synastryAspects ?? [],
    synastryHousePlacements:
      (relationship.synastryHousePlacements ??
        {}) as EnhancedRelationshipAnalysisResponse['synastryHousePlacements'],
    status: 'scores_calculated',
    metadata: {
      processingTime: '',
      clustersAnalyzed: 5,
      totalScoredItems: 0,
      workflowType: 'direct-cluster-scoring',
      version: '',
      isCelebrityRelationship: Boolean(relationship.isCelebrityRelationship),
      initialOverviewGenerated: Boolean(relationship.initialOverview),
    },
  };
}

function fabricateClusterMetrics(
  score: number
): EnhancedRelationshipAnalysisResponse['clusters']['Harmony'] {
  return {
    score: Number.isFinite(score) ? score : 0,
    rawScore: 0,
    supportPct: 0,
    challengePct: 0,
    heatPct: 0,
    activityPct: 0,
    sparkElements: 0,
    quadrant: 'Flat',
    keystoneAspects: [],
  };
}
