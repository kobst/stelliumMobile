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
    return relationshipApiClient.post<EnhancedRelationshipAnalysisResponse>(
      '/enhanced-relationship-analysis',
      {
        userIdA,
        userIdB,
        ownerUserId,
        celebRelationship,
      }
    );
  },

  startFullRelationshipAnalysis: async (
    compositeChartId: string,
    immediate: boolean = true
  ): Promise<RelationshipWorkflowStartResponse> => {
    return relationshipApiClient.post<RelationshipWorkflowStartResponse>(
      '/workflow/relationship/start',
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
    return relationshipApiClient.post<UserCompositeChart[]>('/getUserCompositeCharts', {
      ownerUserId,
    });
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
