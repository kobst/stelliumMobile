import { apiClient } from './client';
import { User } from '../types';

export interface AnalysisWorkflowResponse {
  workflowId: string;
  status: string;
  isCompleted: boolean;
  progress?: number;
}

export interface ChartAnalysisResponse {
  overview: string;
  fullAnalysis: any;
  topics: any;
  planets: any[];
  houses: any[];
  aspects: any[];
  elements: any;
  modalities: any;
  quadrants: any;
  patterns: any;
}

export interface PlanetOverviewRequest {
  planetName: string;
  birthData: any;
}

export const chartsApi = {
  // Get short overview of birth chart
  getShortOverview: async (birthData: any): Promise<{ overview: string }> => {
    return apiClient.post<{ overview: string }>('/getShortOverview', { birthData });
  },

  // Get planet-specific overview
  getPlanetOverview: async (
    planetName: string,
    birthData: any
  ): Promise<{ analysis: string }> => {
    return apiClient.post<{ analysis: string }>('/getShortOverviewPlanet', {
      planetName,
      birthData,
    });
  },

  // Get full birth chart analysis
  getFullBirthChartAnalysis: async (user: User): Promise<ChartAnalysisResponse> => {
    return apiClient.post<ChartAnalysisResponse>('/getBirthChartAnalysis', { user });
  },

  // Fetch existing analysis
  fetchAnalysis: async (userId: string): Promise<ChartAnalysisResponse> => {
    return apiClient.post<ChartAnalysisResponse>('/fetchAnalysis', { userId });
  },

  // Start full analysis workflow
  startFullAnalysis: async (userId: string): Promise<AnalysisWorkflowResponse> => {
    return apiClient.post<AnalysisWorkflowResponse>('/analysis/start-full', { userId });
  },

  // Poll analysis status
  pollAnalysisStatus: async (workflowId: string): Promise<AnalysisWorkflowResponse> => {
    return apiClient.post<AnalysisWorkflowResponse>('/analysis/full-status', { workflowId });
  },

  // Get completed analysis data
  getCompleteAnalysisData: async (workflowId: string): Promise<ChartAnalysisResponse> => {
    return apiClient.post<ChartAnalysisResponse>('/analysis/complete-data', { workflowId });
  },

  // Generate topic analysis
  generateTopicAnalysis: async (userId: string): Promise<any> => {
    const topics = [
      'PERSONALITY_IDENTITY',
      'EMOTIONAL_FOUNDATIONS_HOME',
      'RELATIONSHIPS_SOCIAL',
      'CAREER_PURPOSE_PUBLIC_IMAGE',
      'UNCONSCIOUS_SPIRITUALITY',
      'COMMUNICATION_BELIEFS',
    ];

    const results: any = {};
    
    for (const topic of topics) {
      const response = await apiClient.post('/getSubtopicAnalysis', {
        userId,
        broadTopic: topic,
      });
      results[topic] = response;
    }

    return {
      success: true,
      message: 'Topic analysis completed successfully',
      results,
    };
  },

  // Process and vectorize basic analysis
  processBasicAnalysis: async (userId: string): Promise<{ success: boolean }> => {
    let section = 'overview';
    let index = 0;
    let isComplete = false;

    while (!isComplete) {
      const response = await apiClient.post<any>('/processBasicAnalysis', {
        userId,
        section,
        index,
      });

      if (!response.success) {
        throw new Error(response.error || 'Vectorization failed');
      }

      section = response.nextSection;
      index = response.nextIndex;
      isComplete = response.isComplete;
    }

    return { success: true };
  },

  // Process and vectorize topic analysis
  processTopicAnalysis: async (userId: string): Promise<{ success: boolean }> => {
    let currentTopic: string | null = null;
    let currentSubtopic: string | null = null;
    let isComplete = false;

    while (!isComplete) {
      const response = await apiClient.post<any>('/processTopicAnalysis', {
        userId,
        topic: currentTopic,
        subtopic: currentSubtopic,
      });

      if (!response.success) {
        throw new Error(response.error || 'Vectorization failed');
      }

      isComplete = response.isComplete;
      currentTopic = response.nextTopic;
      currentSubtopic = response.nextSubtopic;
    }

    return { success: true };
  },
};