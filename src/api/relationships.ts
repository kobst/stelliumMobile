import { apiClient } from './client';

// V3 Relationship Analysis Types
export interface V3ClusterScore {
  score: number; // 0-1 normalized percentile
  analysis: string;
}

export interface V3Clusters {
  Harmony: V3ClusterScore;
  Passion: V3ClusterScore;
  Connection: V3ClusterScore;
  Growth: V3ClusterScore;
  Stability: V3ClusterScore;
}

export interface KeystoneAspect {
  description: string;
  score: number;
  category: string;
  isKeystone: true;
  impact: 'high' | 'medium' | 'low';
}

export interface CategoryData {
  category: string;
  cluster: string;
  score: number;
  valence: -1 | 0 | 1; // challenge, neutral, support
  weight: number;
  intensity: number;
  centrality: number;
  isKeystone: boolean;
  keystoneRank?: number; // 1-5 if keystone
  spark?: boolean;
  sparkType?: 'sexual' | 'transformative' | 'intellectual' | 'emotional' | 'power';
  starRating: number; // 0-5
}

export interface ConsolidatedScoredItem {
  id: string;
  source: 'synastry' | 'composite' | 'synastryHousePlacement' | 'compositeHousePlacement';
  type: 'aspect' | 'housePlacement';
  description: string;
  aspect?: string;
  orb?: number;
  planet1?: string;
  planet2?: string;
  planet1Sign?: string;
  planet2Sign?: string;
  pairKey?: string;
  code?: string;
  categoryData: CategoryData[];
  overallCentrality: number;
  isOverallKeystone: boolean;
  maxStarRating: number;
}

export interface V3Analysis {
  clusters: V3Clusters;
  tier: string;
  profile: string;
  keystoneAspects: KeystoneAspect[];
  initialOverview: string;
  consolidatedScoredItems: ConsolidatedScoredItem[];
  version: 'v3.0';
}

export interface V3Metrics {
  [category: string]: {
    supportPct: number;
    challengePct: number;
    heatPct: number;
    activityPct: number;
    quadrant: 'Easy-going' | 'Dynamic' | 'Hot-button' | 'Flat';
  };
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
// V3 Analysis Data
  v2Analysis?: V3Analysis;
  v2Metrics?: V3Metrics;
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

// Step Functions Full Analysis Types
export interface CategoryAnalysisPanel {
  relevantPosition: string;
  panels: {
    synastry: string;
    composite: string;
    partnerPerspectives: string;
  };
  v3MetricsInterpretation: string;
  generatedAt: string;
}

export interface FullAnalysisData {
  analysis: {
    OVERALL_ATTRACTION_CHEMISTRY: CategoryAnalysisPanel;
    EMOTIONAL_SECURITY_CONNECTION: CategoryAnalysisPanel;
    SEX_AND_INTIMACY: CategoryAnalysisPanel;
    COMMUNICATION_AND_MENTAL_CONNECTION: CategoryAnalysisPanel;
    COMMITMENT_LONG_TERM_POTENTIAL: CategoryAnalysisPanel;
    KARMIC_LESSONS_GROWTH: CategoryAnalysisPanel;
    PRACTICAL_GROWTH_SHARED_GOALS: CategoryAnalysisPanel;
  };
  vectorizationStatus: {
    categories: {
      [key: string]: boolean;
    };
    isComplete: boolean;
  };
}

// Enhanced Relationship Analysis Response (Workflow 1)
export interface EnhancedRelationshipAnalysisResponse {
  success: boolean;
  compositeChartId: string;
  userA: { id: string; name: string };
  userB: { id: string; name: string };
v2Analysis: V3Analysis; // Despite the name, this is V3 data
  v2Metrics: V3Metrics;
compositeChart: CompositeChart;
  synastryAspects: SynastryAspect[];
  synastryHousePlacements: SynastryHousePlacements;
metadata: {
    processingTime: string;
    clustersAnalyzed: number;
    totalKeystoneAspects: number;
    workflowType: 'v2-enhanced-keystones';
  };
}

// Full Analysis Response (Workflow 2)
export interface RelationshipAnalysisResponse {
  // V3 Analysis from Workflow 1
  v2Analysis?: V3Analysis;
  v2Metrics?: V3Metrics;
// Full Analysis from Workflow 2
  analysis?: FullAnalysisData['analysis'];
  vectorizationStatus?: FullAnalysisData['vectorizationStatus'];
// Chart data
  synastryAspects?: SynastryAspect[];
  synastryHousePlacements?: SynastryHousePlacements;
  compositeChart?: CompositeChart;
  userA_name?: string;
  userB_name?: string;
}


// Workflow Status Response
export interface RelationshipWorkflowStatusResponse {
  success: boolean;
  workflowStatus: {
    status: 'not_started' | 'running' | 'paused_after_scores' | 'completed' | 'error' | 'failed';
    progress?: {
      percentage: number;
      completed: number;
      total: number;
    };
  };
  analysisData?: RelationshipAnalysisResponse;
}

// Workflow Start Response
export interface RelationshipWorkflowStartResponse {
  success: boolean;
  workflowId?: string;
  message?: string;
  error?: string;
}

export const relationshipsApi = {
  // Workflow 1: Enhanced Relationship Analysis with V3 (30-60 seconds)
  enhancedRelationshipAnalysis: async (
    userIdA: string,
    userIdB: string,
    ownerUserId?: string,
    celebRelationship: boolean = false
  ): Promise<EnhancedRelationshipAnalysisResponse> => {
    return apiClient.post<EnhancedRelationshipAnalysisResponse>('/enhanced-relationship-analysis', {
      userIdA,
      userIdB,
      ownerUserId,
      celebRelationship,
    });
  },

  // Workflow 2: Start Step Functions Full Analysis
  startFullRelationshipAnalysis: async (
    compositeChartId: string,
    immediate: boolean = true
  ): Promise<RelationshipWorkflowStartResponse> => {
    return apiClient.post<RelationshipWorkflowStartResponse>('/workflow/relationship/start', {
      compositeChartId,
      immediate,
    });
  },

  // Auto-create relationship and start analysis in one call
  startRelationshipAnalysisWithAutoCreation: async (
    userIdA: string,
    userIdB: string,
    immediate: boolean = true
  ): Promise<RelationshipWorkflowStartResponse> => {
    return apiClient.post<RelationshipWorkflowStartResponse>('/workflow/relationship/start', {
      userIdA,
      userIdB,
      immediate,
    });
  },

  // Get workflow status for polling
  getRelationshipWorkflowStatus: async (
    compositeChartId: string
  ): Promise<RelationshipWorkflowStatusResponse> => {
    return apiClient.post<RelationshipWorkflowStatusResponse>('/workflow/relationship/status', {
      compositeChartId,
    });
  },

  // Resume paused workflow
  resumeRelationshipWorkflow: async (
    compositeChartId: string
  ): Promise<RelationshipWorkflowStartResponse> => {
    return apiClient.post<RelationshipWorkflowStartResponse>('/workflow/relationship/resume', {
      compositeChartId,
    });
  },

  // Fetch existing relationship analysis
  fetchRelationshipAnalysis: async (compositeChartId: string): Promise<RelationshipAnalysisResponse> => {
    return apiClient.post<RelationshipAnalysisResponse>('/fetchRelationshipAnalysis', {
      compositeChartId,
    });
  },

  // User's composite charts list
  getUserCompositeCharts: async (ownerUserId: string): Promise<UserCompositeChart[]> => {
    return apiClient.post<UserCompositeChart[]>('/getUserCompositeCharts', { ownerUserId });
  },

  // Delete relationship
  deleteRelationship: async (relationshipId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/relationships/${relationshipId}`);
  },

  // Chat API for relationship analysis
  chatForUserRelationship: async (
    userId: string,
    compositeChartId: string,
    message: string,
    selectedElements?: ConsolidatedScoredItem[]
  ): Promise<string> => {
    return apiClient.post<string>('/chatForUserRelationship', {
      userId,
      compositeChartId,
      message,
      selectedElements,
    });
  },

  // Fetch chat history
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

  // Enhanced Chat API - Frontend Integration
  
  // Enhanced chat for relationship with element selection support
  enhancedChatForRelationship: async (
    compositeChartId: string,
    requestBody: {
      query?: string;
      selectedElements?: ConsolidatedScoredItem[];
    }
  ): Promise<{
    success: boolean;
    answer: string;
    chatHistoryResult: any;
    analysisId?: string;
    vectorized: boolean;
    mode: 'chat' | 'custom' | 'hybrid';
  }> => {
    return apiClient.post<{
      success: boolean;
      answer: string;
      chatHistoryResult: any;
      analysisId?: string;
      vectorized: boolean;
      mode: 'chat' | 'custom' | 'hybrid';
    }>(`/relationships/${compositeChartId}/enhanced-chat`, requestBody);
  },

  // Fetch enhanced chat history for relationship
  fetchRelationshipEnhancedChatHistory: async (
    compositeChartId: string,
    limit?: number
  ): Promise<{
    success: boolean;
    chatHistory: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
      metadata?: {
        mode?: 'chat' | 'custom' | 'hybrid';
        selectedElements?: ConsolidatedScoredItem[];
        elementCount?: number;
      };
    }>;
    messageCount: number;
  }> => {
    let endpoint = `/relationships/${compositeChartId}/chat-history`;
    if (limit !== undefined) {
      endpoint += `?limit=${limit}`;
    }
    
    console.log('Fetching chat history from endpoint:', endpoint);
    return apiClient.get<{
      success: boolean;
      chatHistory: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
        metadata?: {
          mode?: 'chat' | 'custom' | 'hybrid';
          selectedElements?: ConsolidatedScoredItem[];
          elementCount?: number;
        };
      }>;
      messageCount: number;
    }>(endpoint);
  },
};
