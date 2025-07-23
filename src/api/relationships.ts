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

export interface RelationshipScoredItem {
  score: number;
  source: 'synastry' | 'composite' | 'synastryHousePlacement' | 'compositeHousePlacement';
  type: 'aspect' | 'housePlacement';
  reason: string;
  description: string;
  aspect?: string;
  orb?: number;
  pairKey?: string;
  planet1Sign?: string;
  planet2Sign?: string;
  planet1House?: number;
  planet2House?: number;
  planet?: string;
  house?: number;
  direction?: string;
  category?: string;
  clusterWeight?: number;
}

export interface TensionFlowData {
  supportDensity: number;
  challengeDensity: number;
  polarityRatio: number;
  quadrant: string;
  totalAspects: number;
  supportAspects: number;
  challengeAspects: number;
  keystoneAspects?: Array<{
    nodes: string[];
    betweenness: number;
    score: number;
    edgeType: 'support' | 'challenge' | 'neutral';
    aspectType: string;
    description: string;
  }>;
  networkMetrics?: {
    totalPossibleConnections: number;
    actualConnections: number;
    connectionDensity: number;
    averageScore: number;
  };
}

export interface ClusterScoreAnalysis {
  scoredItems: RelationshipScoredItem[];
  analysis: string;
}

export interface RelationshipAnalysisResponse {
  // Core scoring data
  scores?: {
    [category: string]: {
      overall: number;
      synastry: number;
      composite: number;
      synastryHousePlacements: number;
      compositeHousePlacements: number;
    };
  };

  // Score analysis with scored items
  scoreAnalysis?: {
    [category: string]: {
      scoredItems: RelationshipScoredItem[];
      analysis: string;
    };
  };

  // Category-specific tension flow analysis
  categoryTensionFlowAnalysis?: {
    [category: string]: TensionFlowData;
  };

  // Cluster-based analysis
  clusterAnalysis?: {
    Heart: ClusterScoreAnalysis;
    Body: ClusterScoreAnalysis;
    Mind: ClusterScoreAnalysis;
    Life: ClusterScoreAnalysis;
    Soul: ClusterScoreAnalysis;
  } | null;

  // Holistic overview
  holisticOverview?: {
    topStrengths: RelationshipScoredItem[];
    keyChallenges: RelationshipScoredItem[];
    overview: string;
  } | null;

  // Profile analysis
  profileAnalysis?: {
    profileResult: {
      tier: string;
      profile: string;
      clusterScores: Record<string, number>;
      statistics: {
        avg: number;
        high: number;
        low: number;
        spread: number;
        stdev: number;
        dominantClusters: string[];
        laggingClusters: string[];
      };
      uniformity: string;
      explanation: string;
      confidence: number;
    };
    rawCategoryScores: Record<string, number>;
    generatedAt: string;
    version: string;
  } | null;

  // Tension flow analysis
  tensionFlowAnalysis?: {
    supportDensity: number;
    challengeDensity: number;
    polarityRatio: number;
    quadrant: string;
    totalAspects: number;
    supportAspects: number;
    challengeAspects: number;
    keystoneAspects: any[];
    networkMetrics: any;
    insight: {
      quadrant: string;
      polarityRatio: number;
      description: string;
      recommendations: string[];
    };
  } | null;

  // Category analysis (7 detailed category analyses)
  analysis?: {
    [category: string]: {
      relevantPosition: string;
      panels: {
        synastry: string;
        composite: string;
        fullAnalysis: string;
      };
      generatedAt: string;
    };
  };

  // Debug information
  debug?: {
    inputSummary: {
      compositeChartId: string;
      userAId: string;
      userBId: string;
      userAName: string;
      userBName: string;
    };
    patterns: {
      totalItems: number;
      topStrengthsCount: number;
      keyChallengesCount: number;
    };
    categoryDistribution: {
      strongestCategories: Array<{
        category: string;
        score: number;
      }>;
      weakestCategories: Array<{
        category: string;
        score: number;
      }>;
      averageScore: number;
    };
    clusterItemCounts: Record<string, number>;
    tensionFlow: {
      quadrant: string;
      supportDensity: number;
      challengeDensity: number;
      keystoneAspectsCount: number;
    };
  };

  // Chart data from the composite chart document
  synastryAspects?: SynastryAspect[];
  synastryHousePlacements?: SynastryHousePlacements;
  compositeChart?: CompositeChart;
  userA_name?: string;
  userB_name?: string;
}

// Enhanced API Response Structure (matches frontend CompositeDashboard_v4)
export interface EnhancedRelationshipAnalysisResponse {
  success: boolean;
  compositeChartId: string;
  scores: {
    OVERALL_ATTRACTION_CHEMISTRY: number;
    EMOTIONAL_SECURITY_CONNECTION: number;
    SEX_AND_INTIMACY: number;
    COMMUNICATION_AND_MENTAL_CONNECTION: number;
    COMMITMENT_LONG_TERM_POTENTIAL: number;
    KARMIC_LESSONS_GROWTH: number;
    PRACTICAL_GROWTH_SHARED_GOALS: number;
  };
  scoreAnalysis: {
    [category: string]: {
      scoredItems: RelationshipScoredItem[];
      analysis: string;
    };
  };
  categoryTensionFlowAnalysis: {
    [category: string]: TensionFlowData;
  };
  clusterAnalysis: {
    Heart: ClusterScoreAnalysis;
    Body: ClusterScoreAnalysis;
    Mind: ClusterScoreAnalysis;
    Life: ClusterScoreAnalysis;
    Soul: ClusterScoreAnalysis;
  };
  holisticOverview: string;
  tensionFlowAnalysis: {
    supportDensity: number;
    challengeDensity: number;
    polarityRatio: number;
    quadrant: string;
    insight: {
      quadrant: string;
      description: string;
      recommendations: string[];
    };
  };
}

// Frontend-style workflow status response structure
export interface RelationshipWorkflowStatusResponse {
  success: boolean;
  workflowStatus: {
    status: 'not_started' | 'running' | 'paused_after_scores' | 'completed' | 'error' | 'failed';
    progress?: {
      percentage: number;
      processRelationshipAnalysis?: {
        status: 'completed' | 'running';
        completed: number;
        total: number;
      };
    };
    stepFunctions?: {
      executionArn: string;
    };
  };
  analysisData?: RelationshipAnalysisResponse;
  workflowBreakdown?: {
    needsGeneration: string[];
    needsVectorization: string[];
    completed: string[];
  };
}

// Step Functions workflow start response
export interface RelationshipWorkflowStartResponse {
  success: boolean;
  workflowId?: string;
  message?: string;
  error?: string;
}

// Simplified interfaces for the hook
export interface RelationshipWorkflowStatus {
  workflowId: string;
  compositeChartId: string;
  status: 'running' | 'completed' | 'error' | 'paused' | 'unknown';
  progress: {
    percentage: number;
    currentPhase: string;
    currentStep?: string;
  };
  isCompleted: boolean;
  completed?: boolean;
  error?: string;
  analysisData?: RelationshipAnalysisResponse;
}

export interface VectorizationStatus {
  categories: {
    OVERALL_ATTRACTION_CHEMISTRY: boolean;
    EMOTIONAL_SECURITY_CONNECTION: boolean;
    SEX_AND_INTIMACY: boolean;
    COMMUNICATION_AND_MENTAL_CONNECTION: boolean;
    COMMITMENT_LONG_TERM_POTENTIAL: boolean;
    KARMIC_LESSONS_GROWTH: boolean;
    PRACTICAL_GROWTH_SHARED_GOALS: boolean;
  };
  relationshipAnalysis: boolean;
}

export const relationshipsApi = {
  // Legacy methods (keep for backward compatibility)
  createRelationship: async (request: RelationshipCreateRequest): Promise<RelationshipResponse> => {
    return apiClient.post<RelationshipResponse>('/createRelationship', request);
  },

  createCompositeChart: async (request: CompositeChartRequest): Promise<{ compositeChartId: string }> => {
    return apiClient.post<{ compositeChartId: string }>('/saveCompositeChartProfile', request);
  },

  getRelationshipScore: async (request: RelationshipScoreRequest): Promise<RelationshipScore> => {
    return apiClient.post<RelationshipScore>('/getRelationshipScore', request);
  },

  getUserRelationships: async (userId: string): Promise<RelationshipResponse[]> => {
    return apiClient.post<RelationshipResponse[]>('/getUserRelationships', { userId });
  },

  deleteRelationship: async (relationshipId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/relationships/${relationshipId}`);
  },

  getUserCompositeCharts: async (ownerUserId: string): Promise<UserCompositeChart[]> => {
    return apiClient.post<UserCompositeChart[]>('/getUserCompositeCharts', { ownerUserId });
  },


  // ===== FRONTEND-PROVEN METHODS =====

  // Enhanced Direct API - Primary workflow (2-5 seconds)
  // Used for immediate relationship creation with full analysis
  enhancedRelationshipAnalysis: async (
    userIdA: string,
    userIdB: string
  ): Promise<EnhancedRelationshipAnalysisResponse> => {
    return apiClient.post<EnhancedRelationshipAnalysisResponse>('/enhanced-relationship-analysis', {
      userIdA,
      userIdB,
    });
  },

  // Fetch existing relationship analysis data
  fetchRelationshipAnalysis: async (compositeChartId: string): Promise<RelationshipAnalysisResponse> => {
    return apiClient.post<RelationshipAnalysisResponse>('/fetchRelationshipAnalysis', {
      compositeChartId,
    });
  },

  // Step Functions Workflow Methods (exactly matching frontend)

  // Start relationship workflow - Preview mode (scores only)
  // Frontend: await startRelationshipWorkflow(userA._id, userB._id, compositeChart._id, false)
  startRelationshipWorkflow: async (
    userIdA: string,
    userIdB: string,
    compositeChartId: string,
    immediate: boolean
  ): Promise<RelationshipWorkflowStartResponse> => {
    return apiClient.post<RelationshipWorkflowStartResponse>('/workflow/relationship/start', {
      userIdA,
      userIdB,
      compositeChartId,
      immediate,
    });
  },

  // Start full relationship analysis from existing relationship
  // Frontend: await startFullRelationshipAnalysis(compositeChart._id)
  startFullRelationshipAnalysis: async (
    compositeChartId: string
  ): Promise<RelationshipWorkflowStartResponse> => {
    return apiClient.post<RelationshipWorkflowStartResponse>('/workflow/relationship/start', {
      compositeChartId,
      immediate: true,
    });
  },

  // Get relationship workflow status (used for polling)
  // Frontend: await getRelationshipWorkflowStatus(compositeChart._id)
  getRelationshipWorkflowStatus: async (
    compositeChartId: string
  ): Promise<RelationshipWorkflowStatusResponse> => {
    return apiClient.post<RelationshipWorkflowStatusResponse>('/workflow/relationship/status', {
      compositeChartId,
    });
  },

  // Resume paused relationship workflow
  // Frontend: await resumeRelationshipWorkflow(compositeChart._id)
  resumeRelationshipWorkflow: async (
    compositeChartId: string
  ): Promise<RelationshipWorkflowStartResponse> => {
    return apiClient.post<RelationshipWorkflowStartResponse>('/workflow/relationship/resume', {
      compositeChartId,
    });
  },

  // Chat API for relationship analysis
  // Frontend: await chatForUserRelationship(userA._id, compositeChart._id, message)
  chatForUserRelationship: async (
    userId: string,
    compositeChartId: string,
    message: string
  ): Promise<string> => {
    return apiClient.post<string>('/chatForUserRelationship', {
      userId,
      compositeChartId,
      message,
    });
  },

  // Fetch user chat relationship analysis history
  // Frontend: await fetchUserChatRelationshipAnalysis(userA._id, compositeChart._id)
  fetchUserChatRelationshipAnalysis: async (
    userId: string,
    compositeChartId: string
  ): Promise<{
    success: boolean;
    chatHistory: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  }> => {
    return apiClient.post<{
      success: boolean;
      chatHistory: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
    }>('/fetchUserChatRelationshipAnalysis', {
      userId,
      compositeChartId,
    });
  },
};
