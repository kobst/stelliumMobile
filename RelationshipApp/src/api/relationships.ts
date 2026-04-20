import { relationshipApiClient } from '../../../shared/api/relationshipClient';
import type {
  ClusterScoredItem,
  EnhancedRelationshipAnalysisResponse,
  RelationshipAnalysisResponse,
  RelationshipWorkflowStartResponse,
  RelationshipWorkflowStatusResponse,
  UserCompositeChart,
} from '../../../shared/api/relationships';

export const relationshipsApi = {
  enhancedRelationshipAnalysis: async (
    userIdA: string,
    userIdB: string,
    ownerUserId?: string,
    celebRelationship: boolean = false
  ): Promise<EnhancedRelationshipAnalysisResponse> => {
    const payload = { userIdA, userIdB, ownerUserId, celebRelationship };
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[relationshipsApi.enhancedRelationshipAnalysis] request', {
        userIdA,
        userIdB,
        ownerUserId,
        celebRelationship,
        userIdAType: typeof userIdA,
        userIdBType: typeof userIdB,
        userIdAEmpty: !userIdA || userIdA === '',
        userIdBEmpty: !userIdB || userIdB === '',
        payload,
      });
    }
    try {
      const result = await relationshipApiClient.post<EnhancedRelationshipAnalysisResponse>(
        '/relationship-app/enhanced-relationship-analysis',
        payload
      );
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[relationshipsApi.enhancedRelationshipAnalysis] success', {
          compositeChartId: result?.compositeChartId,
        });
      }
      return result;
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[relationshipsApi.enhancedRelationshipAnalysis] error', {
          userIdA,
          userIdB,
          ownerUserId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    }
  },

  startFullRelationshipAnalysis: async (
    compositeChartId: string,
    immediate: boolean = true
  ): Promise<RelationshipWorkflowStartResponse> => {
    return relationshipApiClient.post<RelationshipWorkflowStartResponse>(
      '/relationship-app/workflow/relationship/start',
      {
        compositeChartId,
        immediate,
      }
    );
  },

  getRelationshipWorkflowStatus: async (
    compositeChartId: string
  ): Promise<RelationshipWorkflowStatusResponse> => {
    return relationshipApiClient.post<RelationshipWorkflowStatusResponse>(
      '/workflow/relationship/status',
      {
        compositeChartId,
      }
    );
  },

  fetchRelationshipAnalysis: async (
    compositeChartId: string
  ): Promise<RelationshipAnalysisResponse> => {
    return relationshipApiClient.post<RelationshipAnalysisResponse>(
      '/fetchRelationshipAnalysis',
      {
        compositeChartId,
      }
    );
  },

  getUserCompositeCharts: async (ownerUserId: string): Promise<UserCompositeChart[]> => {
    const startedAt = Date.now();
    if (__DEV__) {
      console.log('[relationshipsApi.getUserCompositeCharts] request', { ownerUserId });
    }
    try {
      const result = await relationshipApiClient.post<UserCompositeChart[]>(
        '/getUserCompositeCharts',
        { ownerUserId }
      );
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[relationshipsApi.getUserCompositeCharts] response', {
          ownerUserId,
          durationMs: Date.now() - startedAt,
          isArray: Array.isArray(result),
          count: Array.isArray(result) ? result.length : null,
        });
        if (Array.isArray(result) && result.length > 0) {
          const sample = result[0];
          const status = sample?.relationshipAnalysisStatus;
          // eslint-disable-next-line no-console
          console.log('[relationshipsApi.getUserCompositeCharts] sample[0] archetype shape', {
            id: sample?._id,
            statusKeys: status ? Object.keys(status) : null,
            statusOverallKeys: status?.overall ? Object.keys(status.overall) : null,
            statusSummaryLabel: status?.overall?.summary?.label,
            statusOverallProfile: status?.overall?.profile,
            statusFlatProfile: status?.profile,
            clusterScoringOverallProfile: sample?.clusterScoring?.overall?.profile,
          });
        }
      }
      return result;
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[relationshipsApi.getUserCompositeCharts] error', {
          ownerUserId,
          durationMs: Date.now() - startedAt,
          message: error instanceof Error ? error.message : String(error),
          error,
        });
      }
      throw error;
    }
  },

  chatForUserRelationship: async (
    userId: string,
    compositeChartId: string,
    message: string,
    selectedElements?: ClusterScoredItem[]
  ): Promise<string> => {
    return relationshipApiClient.post<string>('/chatForUserRelationship', {
      userId,
      compositeChartId,
      message,
      selectedElements,
    });
  },
};
