import { apiClient } from './client';
import { User } from '../types';

export interface RelationshipCreateRequest {
  userA: User;
  userB: User;
}

export interface RelationshipResponse {
  id: string;
  userA: User;
  userB: User;
  synastryAspects: any[];
  compositeBirthChart: any;
  createdAt: string;
}

export interface RelationshipScoreRequest {
  synastryAspects: any[];
  compositeChart: any;
  userA: User;
  userB: User;
  compositeChartId: string;
}

export interface RelationshipScore {
  OVERALL_ATTRACTION_CHEMISTRY: { score: number; analysis: string };
  EMOTIONAL_SECURITY_CONNECTION: { score: number; analysis: string };
  COMMUNICATION_LEARNING: { score: number; analysis: string };
  VALUES_GOALS_DIRECTION: { score: number; analysis: string };
  INTIMACY_SEXUALITY: { score: number; analysis: string };
  LONG_TERM_STABILITY: { score: number; analysis: string };
  SPIRITUAL_GROWTH: { score: number; analysis: string };
}

export interface CompositeChartRequest {
  userAId: string;
  userBId: string;
  userAName: string;
  userBName: string;
  userA_dateOfBirth: any;
  userB_dateOfBirth: any;
  synastryAspects: any[];
  compositeBirthChart: any;
}

export interface RelationshipWorkflowResponse {
  workflowId: string;
  status: string;
  isCompleted: boolean;
  progress?: number;
}

export const relationshipsApi = {
  // Create relationship between two users
  createRelationship: async (request: RelationshipCreateRequest): Promise<RelationshipResponse> => {
    return apiClient.post<RelationshipResponse>('/createRelationship', request);
  },

  // Create composite chart profile
  createCompositeChart: async (request: CompositeChartRequest): Promise<{ compositeChartId: string }> => {
    return apiClient.post<{ compositeChartId: string }>('/saveCompositeChartProfile', request);
  },

  // Get relationship compatibility scores
  getRelationshipScore: async (request: RelationshipScoreRequest): Promise<RelationshipScore> => {
    return apiClient.post<RelationshipScore>('/getRelationshipScore', request);
  },

  // Enhanced relationship analysis
  getEnhancedRelationshipAnalysis: async (
    userA: User,
    userB: User
  ): Promise<{ analysis: any; scores: RelationshipScore }> => {
    return apiClient.post<{ analysis: any; scores: RelationshipScore }>(
      '/enhanced-relationship-analysis',
      { userA, userB }
    );
  },

  // Start relationship analysis workflow
  startRelationshipWorkflow: async (
    userA: User,
    userB: User
  ): Promise<RelationshipWorkflowResponse> => {
    return apiClient.post<RelationshipWorkflowResponse>('/workflow/relationship/start', {
      userA,
      userB,
    });
  },

  // Poll relationship analysis status
  pollRelationshipStatus: async (workflowId: string): Promise<RelationshipWorkflowResponse> => {
    return apiClient.post<RelationshipWorkflowResponse>('/workflow/relationship/status', {
      workflowId,
    });
  },

  // Generate relationship analysis
  generateRelationshipAnalysis: async (
    compositeChartId: string
  ): Promise<{ analysis: any }> => {
    return apiClient.post<{ analysis: any }>('/generateRelationshipAnalysis', {
      compositeChartId,
    });
  },

  // Fetch relationship analysis
  fetchRelationshipAnalysis: async (
    compositeChartId: string
  ): Promise<{ analysis: any }> => {
    return apiClient.post<{ analysis: any }>('/fetchRelationshipAnalysis', {
      compositeChartId,
    });
  },

  // Process and vectorize relationship analysis
  processRelationshipAnalysis: async (
    compositeChartId: string
  ): Promise<{ success: boolean }> => {
    let currentCategory: string | null = null;
    let isComplete = false;

    while (!isComplete) {
      const response = await apiClient.post<any>('/processRelationshipAnalysis', {
        compositeChartId,
        category: currentCategory,
      });

      if (!response.success) {
        throw new Error(response.error || 'Relationship analysis processing failed');
      }

      isComplete = response.isComplete;
      currentCategory = response.nextCategory;
    }

    return { success: true };
  },

  // Get all relationships for a user
  getUserRelationships: async (userId: string): Promise<RelationshipResponse[]> => {
    return apiClient.post<RelationshipResponse[]>('/getUserRelationships', { userId });
  },

  // Delete relationship
  deleteRelationship: async (relationshipId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/relationships/${relationshipId}`);
  },
};