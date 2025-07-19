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

export interface UserCompositeChart {
  _id: string;
  userA_name: string;
  userB_name: string;
  userA_dateOfBirth: string;
  userB_dateOfBirth: string;
  createdAt: string;
  synastryAspects?: SynastryAspect[];
  synastryHousePlacements?: SynastryHousePlacements;
  compositeChart?: CompositeChart;
  userA_id?: string;
  userB_id?: string;
  isCelebrityRelationship?: boolean;
  ownerUserId?: string;
  updatedAt?: string;
}

export interface SynastryAspect {
  planet1: string;
  planet1Degree: number;
  planet1Sign: string;
  planet2: string;
  planet2Degree: number;
  planet2Sign: string;
  aspectType: string;
  planet1IsRetro: boolean;
  planet2IsRetro: boolean;
  orb: number;
}

export interface SynastryHousePlacement {
  planet: string;
  planetDegree: number;
  planetSign: string;
  house: number;
  direction: string;
}

export interface SynastryHousePlacements {
  AinB: SynastryHousePlacement[];
  BinA: SynastryHousePlacement[];
}

export interface CompositeChart {
  planets: Array<{
    name: string;
    full_degree: number;
    norm_degree: number;
    sign: string;
    house: number;
  }>;
  houses: Array<{
    house: string;
    degree: number;
    sign: string;
  }>;
  aspects: Array<{
    aspectingPlanet: string;
    aspectingPlanetDegree: number;
    aspectedPlanet: string;
    aspectedPlanetDegree: number;
    aspectType: string;
    orb: number;
  }>;
  houseSystem: string;
  hasAccurateBirthTimes: boolean;
}

export interface RelationshipAnalysisResponse {
  scores?: {
    [key: string]: { score: number; analysis: string };
  };
  holisticOverview?: {
    overview: string;
    topStrengths?: Array<{ name: string; description: string }>;
    keyChallenges?: Array<{ name: string; description: string }>;
  };
  profileAnalysis?: {
    profileResult: {
      tier: string;
      profile: string;
      clusterScores: {
        Heart: number;
        Body: number;
        Mind: number;
        Life: number;
        Soul: number;
      };
    };
  };
  clusterAnalysis?: {
    [key: string]: {
      analysis: string;
      scoredItems: Array<{ score: number; description: string }>;
    };
  };
  tensionFlowAnalysis?: {
    supportDensity: number;
    challengeDensity: number;
    polarityRatio: number;
    quadrant: string;
    totalAspects: number;
    supportAspects: number;
    challengeAspects: number;
    insight?: {
      recommendations: string[];
    };
  };
  categoryAnalysis?: {
    [key: string]: {
      panels?: {
        synastry?: string;
        composite?: string;
        fullAnalysis?: string;
      };
      relevantPosition?: string;
    };
  };
  // Chart data from the composite chart document
  synastryAspects?: SynastryAspect[];
  synastryHousePlacements?: SynastryHousePlacements;
  compositeChart?: CompositeChart;
  userA_name?: string;
  userB_name?: string;
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

  // Get user composite charts (existing relationships)
  getUserCompositeCharts: async (ownerUserId: string): Promise<UserCompositeChart[]> => {
    return apiClient.post<UserCompositeChart[]>('/getUserCompositeCharts', { ownerUserId });
  },

  // Fetch relationship analysis data
  fetchRelationshipAnalysis: async (compositeChartId: string): Promise<RelationshipAnalysisResponse> => {
    return apiClient.post<RelationshipAnalysisResponse>('/fetchRelationshipAnalysis', { compositeChartId });
  },

  // Get composite chart data (includes chart structure)
  getCompositeChart: async (compositeChartId: string): Promise<any> => {
    return apiClient.get<any>(`/composite-charts/${compositeChartId}`);
  },

  // Create relationship directly with enhanced analysis
  createRelationshipDirect: async (userIdA: string, userIdB: string): Promise<{ success: boolean; relationship?: any; error?: string }> => {
    try {
      const response = await apiClient.post<any>('/enhanced-relationship-analysis', {
        userIdA,
        userIdB
      });
      
      // Transform the response to match expected format
      if (response.success) {
        return {
          success: true,
          relationship: {
            compositeChartId: response.compositeChartId,
            userA: response.userA,
            userB: response.userB,
            enhancedAnalysis: response.enhancedAnalysis,
            profileAnalysis: response.profileAnalysis,
            // Include chart data for immediate display
            compositeChart: response.compositeChart,
            synastryAspects: response.synastryAspects,
            synastryHousePlacements: response.synastryHousePlacements,
            metadata: response.metadata
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to create relationship'
        };
      }
    } catch (error: any) {
      console.error('Error creating relationship:', error);
      throw new Error(error.message || 'Failed to create relationship');
    }
  },
};