import { apiClient } from './client';

// New 5-Cluster Relationship Analysis Types
export interface KeystoneAspect {
  description: string;
  score: number;
  cluster: string;
  isKeystone: true;
  impact: 'high' | 'medium' | 'low';
}

export interface ClusterContribution {
  cluster: 'Harmony' | 'Passion' | 'Connection' | 'Stability' | 'Growth';
  score: number;           // Raw score value
  weight: number;          // Weight/importance
  intensity: number;       // Intensity multiplier
  valence: 1 | -1 | 0;    // Positive, negative, or neutral
  centrality: number;      // Network centrality metric
  spark: boolean;          // Whether this creates a "spark"
  sparkType?: 'sexual' | 'emotional' | 'transformative' | 'karmic';
  isKeystone: boolean;     // Is this a keystone aspect for this cluster
  keystoneRank?: number;   // Ranking among keystones
  starRating: 0 | 1 | 2 | 3 | 4 | 5; // Visual rating
}

export interface ClusterScoredItem {
  id: string;
  source: 'synastry' | 'composite' | 'synastryHousePlacement' | 'compositeHousePlacement';
  type: 'aspect' | 'housePlacement';
  description: string;

  // Multiple cluster contributions per item
  clusterContributions: ClusterContribution[];

  // Astrological details (conditional - only when meaningful)
  aspect?: string;
  orb?: number;
  planet1?: string;
  planet2?: string;
  planet1Sign?: string;
  planet2Sign?: string;
  planet1House?: number;
  planet2House?: number;
  pairKey?: string;
  planet?: string;
  house?: number;
  sign?: string;
  direction?: 'A->B' | 'B->A' | 'composite';

  // Metadata
  code: string;
  overallCentrality: number;
  maxStarRating: number;
}

export interface ClusterMetrics {
  score: number;                        // Normalized score (0-100)
  rawScore: number;                     // Raw score before normalization
  supportPct: number;                   // Positive contribution percentage
  challengePct: number;                 // Negative contribution percentage
  heatPct: number;                      // Average intensity percentage
  activityPct: number;                  // Connection activity percentage
  sparkElements: number;                // Count of spark-type connections
  quadrant: 'Easy-going' | 'Dynamic' | 'Hot-button' | 'Flat';
  keystoneAspects: KeystoneAspect[];    // Top 5 most impactful aspects for this cluster
}

export interface OverallAnalysis {
  score: number;                    // Weighted overall score (0-100)
  formula: string;                  // Weight formula description
  dominantCluster: string;          // Highest scoring cluster
  challengeCluster: string;         // Lowest scoring cluster
  profile: string;                  // e.g., "Harmonious with Dynamic Passion"
  tier: string;                     // Thriving, Flourishing, Emerging, Building, Developing
  strengthClusters: string[];       // Clusters above 70
  growthClusters: string[];         // Clusters below 50
  quadrantAnalytics: {
    distribution: Record<string, number>;  // Quadrant counts
    entropy: number;                // Complexity measure (0-2+)
    dominantQuadrant: string;       // Most common quadrant
    uniformity: string;             // 'Uniform'|'Moderate'|'Varied'|'Highly Varied'
  };
  keystoneAspects: KeystoneAspect[];
}

export interface ClusterAnalysis {
  synastry: {
    supportPanel: string;
    challengePanel: string;
    synthesisPanel: string;
  };
  composite: {
    supportPanel: string;
    challengePanel: string;
    synthesisPanel: string;
  };
  generatedAt: any;
  panelFormat: string;
  workflowType: string;
}

export interface ClusterScoring {
  clusters: {
    Harmony: ClusterMetrics;
    Passion: ClusterMetrics;
    Connection: ClusterMetrics;
    Stability: ClusterMetrics;
    Growth: ClusterMetrics;
  };
  overall: OverallAnalysis;
  scoredItems: ClusterScoredItem[];
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

export interface RelationshipAnalysisStatus {
  level: 'complete' | 'scores' | 'none';
  tier?: string;
  profile?: string;
  clusterScores?: {
    Harmony: number;
    Passion: number;
    Connection: number;
    Growth: number;
    Stability: number;
  };
  hasClusterAnalysis?: boolean;
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
  // New 5-Cluster Analysis Data
  clusterScoring?: ClusterScoring;
  completeAnalysis?: Record<string, ClusterAnalysis>;
  initialOverview?: string;
  relationshipAnalysisStatus?: RelationshipAnalysisStatus;
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

// Tension Flow Analysis
export interface TensionFlowAnalysis {
  supportDensity: number;             // Network support strength
  challengeDensity: number;           // Network challenge intensity
  polarityRatio: number;              // Support/Challenge ratio
  quadrant: string;                   // Relationship quadrant type
  totalAspects: number;
  supportAspects: number;
  challengeAspects: number;
  keystoneAspects: any[];
  insight: {
    quadrant: string;
    description: string;
    recommendations: string[];
  };
}

// Enhanced Relationship Analysis Response (New 5-Cluster System)
export interface EnhancedRelationshipAnalysisResponse {
  success: boolean;
  compositeChartId: string;
  userA: { id: string; name: string };
  userB: { id: string; name: string };

  // 5-Cluster Direct Scoring Results (NEW: Top-level structure)
  clusters: {
    Harmony: ClusterMetrics;
    Passion: ClusterMetrics;
    Connection: ClusterMetrics;
    Stability: ClusterMetrics;
    Growth: ClusterMetrics;
  };
  overall: OverallAnalysis;
  scoredItems: ClusterScoredItem[];

  // Initial AI-generated overview
  initialOverview: string | null;

  // Optional: Complete analysis (if already generated)
  completeAnalysis?: Record<string, ClusterAnalysis>;

  // Network-based Tension Flow Analysis
  tensionFlowAnalysis: TensionFlowAnalysis;

  // Raw astrological data
  compositeChart: CompositeChart;
  synastryAspects: SynastryAspect[];
  synastryHousePlacements: SynastryHousePlacements;

  // Status for Step Functions integration
  status: 'scores_calculated';

  // Metadata
  metadata: {
    processingTime: string;
    clustersAnalyzed: number;
    totalScoredItems: number;
    workflowType: 'direct-cluster-scoring';
    version: string;
    isCelebrityRelationship: boolean;
    initialOverviewGenerated: boolean;
  };
}

// Full Analysis Response (Updated for Cluster System)
export interface RelationshipAnalysisResponse {
  // NEW: Unified response structure (same as workflow status)
  clusterAnalysis?: {
    clusters: {
      Harmony: ClusterMetrics;
      Passion: ClusterMetrics;
      Connection: ClusterMetrics;
      Stability: ClusterMetrics;
      Growth: ClusterMetrics;
    };
  };
  overall?: OverallAnalysis;
  completeAnalysis?: Record<string, ClusterAnalysis>;
  holisticOverview?: string;
  initialOverview?: string;

  // Legacy cluster scoring (for backward compatibility)
  clusterScoring?: ClusterScoring;

  // Tension Flow Analysis
  tensionFlowAnalysis?: TensionFlowAnalysis;

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
  workflowId: string;
  compositeChartId: string;
  status: 'in_progress' | 'completed' | 'completed_with_failures' | 'failed' | 'paused_after_scores' | 'unknown';
  completed: boolean;
  phase: 'running' | 'complete' | 'paused';
  stepFunctionStatus: string;
  startedAt?: string;
  completedAt?: string;
  executionArn: string;
  message: string;
}

// Workflow Start Response
export interface RelationshipWorkflowStartResponse {
  success: boolean;
  workflowId?: string;
  message?: string;
  error?: string;
}

export const relationshipsApi = {
  // Primary: Enhanced Relationship Analysis with 5-Cluster Scoring (2-5 seconds)
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

  // Secondary: Start Step Functions Full Analysis for Complete Cluster Analysis
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

  // Fetch existing relationship analysis (updated for cluster system)
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

  // Chat API for relationship analysis (legacy - maintained for compatibility)
  chatForUserRelationship: async (
    userId: string,
    compositeChartId: string,
    message: string,
    selectedElements?: ClusterScoredItem[]
  ): Promise<string> => {
    return apiClient.post<string>('/chatForUserRelationship', {
      userId,
      compositeChartId,
      message,
      selectedElements,
    });
  },

  // Fetch chat history (legacy - maintained for compatibility)
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

  // Enhanced Chat API with Cluster-Aware Scored Items
  enhancedChatForRelationship: async (
    compositeChartId: string,
    requestBody: { query?: string; scoredItems?: ClusterScoredItem[] }
  ): Promise<{
    success: boolean;
    analysis?: string;
    answer?: string; // Temporary compatibility field
    referencedCodes?: string[];
    mode?: string;
  }> => {
    return apiClient.post<{
      success: boolean;
      analysis?: string;
      answer?: string; // Temporary compatibility field
      referencedCodes?: string[];
      mode?: string;
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
        selectedElements?: ClusterScoredItem[];
        referencedCodes?: string[];
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
          selectedElements?: ClusterScoredItem[];
          referencedCodes?: string[];
          elementCount?: number;
        };
      }>;
      messageCount: number;
    }>(endpoint);
  },
};
