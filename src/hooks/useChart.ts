import { useState, useEffect, useCallback } from 'react';
import {
  chartsApi,
  ChartAnalysisResponse,
  AnalysisWorkflowResponse,
  ApiError,
} from '../api';
import { useStore } from '../store';

export interface UseChartReturn {
  overview: string | null;
  fullAnalysis: ChartAnalysisResponse | null;
  workflowState: AnalysisWorkflowResponse | null;
  loading: boolean;
  error: string | null;
  hasAnalysisData: boolean;
  loadOverview: () => Promise<void>;
  loadFullAnalysis: () => Promise<void>;
  startAnalysisWorkflow: () => Promise<void>;
  pollWorkflowStatus: (workflowId: string) => Promise<void>;
  getPlanetOverview: (planetName: string) => Promise<string | null>;
  clearError: () => void;
}

export const useChart = (userId?: string): UseChartReturn => {
  const [overview, setOverview] = useState<string | null>(null);
  const [fullAnalysis, setFullAnalysis] = useState<ChartAnalysisResponse | null>(null);
  const [workflowState, setWorkflowState] = useState<AnalysisWorkflowResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    userData,
    setChartData,
    setWorkflowState: setStoreWorkflowState,
    setAnalysisState,
  } = useStore();

  const clearError = () => setError(null);

  const loadOverview = useCallback(async () => {
    // Overview is now loaded as part of fetchAnalysis - no separate API call needed
    // This function is kept for backward compatibility but does nothing
    return;
  }, []);

  const loadFullAnalysis = useCallback(async () => {
    const targetUserId = userId || userData?.id;
    if (!targetUserId) {
      setError('No user ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to fetch existing analysis first
      let response: ChartAnalysisResponse;
      try {
        response = await chartsApi.fetchAnalysis(targetUserId);
      } catch {
        // If no existing analysis, generate new one
        response = await chartsApi.getFullBirthChartAnalysis(userData!);
      }

      setFullAnalysis(response);

      // Extract overview from the response structure
      const basicAnalysis = response.interpretation?.basicAnalysis;
      if (basicAnalysis?.overview) {
        setOverview(basicAnalysis.overview);
      }

      // Update store with chart data
      if (response.planets && response.houses && response.aspects) {
        setChartData(response.planets, response.houses, response.aspects);
      }

      setAnalysisState({
        hasFullAnalysis: true,
        hasOverview: !!basicAnalysis?.overview,
        overviewContent: basicAnalysis?.overview || '',
        analysisContent: response,
      });
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load full analysis';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, userData, setChartData, setAnalysisState]);

  const startAnalysisWorkflow = useCallback(async () => {
    const targetUserId = userId || userData?.id;
    console.log('useChart - startAnalysisWorkflow called for userId:', targetUserId);
    if (!targetUserId) {
      setError('No user ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('useChart - Calling startFullAnalysis API');
      const response = await chartsApi.startFullAnalysis(targetUserId);
      console.log('useChart - startFullAnalysis response:', response);
      setWorkflowState(response);
      setStoreWorkflowState(response);

      // Start polling for status
      if (response.workflowId) {
        console.log('useChart - Starting polling for workflowId:', response.workflowId);
        pollWorkflowStatus(response.workflowId);
      }
    } catch (err) {
      console.error('useChart - startAnalysisWorkflow error:', err);
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to start analysis workflow';
      setError(errorMessage);
      setLoading(false);
    }
  }, [userId, userData?.id, setStoreWorkflowState, pollWorkflowStatus]);

  const pollWorkflowStatus = useCallback(async (workflowId: string) => {
    const targetUserId = userId || userData?.id;
    console.log('useChart - Starting polling for workflowId:', workflowId, 'userId:', targetUserId);
    if (!targetUserId) {
      setError('No user ID available for polling');
      return;
    }

    try {
      const pollInterval = setInterval(async () => {
        try {
          console.log('useChart - Polling status for workflowId:', workflowId, 'userId:', targetUserId);
          const statusResponse = await chartsApi.pollAnalysisStatus(targetUserId, workflowId);
          console.log('useChart - Poll response:', statusResponse);
          setWorkflowState(statusResponse);
          setStoreWorkflowState(statusResponse);

          if (statusResponse.completed) {
            console.log('useChart - Workflow completed, fetching analysis data');
            clearInterval(pollInterval);
            setLoading(false);

            // Fetch completed analysis data
            try {
              const analysisData = await chartsApi.getCompleteAnalysisData(targetUserId, workflowId);
              console.log('useChart - Analysis data received from complete-data:', analysisData);
              setFullAnalysis(analysisData);

              setAnalysisState({
                hasFullAnalysis: true,
                analysisContent: analysisData,
              });
            } catch (completeDataError) {
              console.log('useChart - complete-data failed, trying fetchAnalysis:', completeDataError);
              // Fallback to regular analysis fetch
              try {
                const fallbackData = await chartsApi.fetchAnalysis(targetUserId);
                console.log('useChart - Fallback analysis data received:', fallbackData);
                setFullAnalysis(fallbackData);

                setAnalysisState({
                  hasFullAnalysis: true,
                  analysisContent: fallbackData,
                });
              } catch (fallbackError) {
                console.error('useChart - Both complete-data and fetchAnalysis failed:', fallbackError);
                setError('Failed to fetch completed analysis data');
              }
            }
          }
        } catch (err) {
          console.error('useChart - Polling error:', err);
          clearInterval(pollInterval);
          const errorMessage = err instanceof ApiError ? err.message : 'Workflow polling failed';
          setError(errorMessage);
          setLoading(false);
        }
      }, 3000);

      // Cleanup interval after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (loading) {
          setError('Analysis workflow timeout');
          setLoading(false);
        }
      }, 600000);

    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to start polling';
      setError(errorMessage);
      setLoading(false);
    }
  }, [userId, userData?.id, loading, setStoreWorkflowState, setAnalysisState]);

  const getPlanetOverview = useCallback(async (planetName: string): Promise<string | null> => {
    if (!userData?.birthChart) {
      setError('No birth chart data available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await chartsApi.getPlanetOverview(planetName, userData.birthChart);
      return response.analysis;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to get planet overview';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userData?.birthChart]);

  // Load full analysis on mount if user data is available
  useEffect(() => {
    if (userData?.id && !fullAnalysis && !loading) {
      console.log('useChart - Auto-loading full analysis for user:', userData.id);
      loadFullAnalysis();
    }
  }, [userData?.id, fullAnalysis, loading, loadFullAnalysis]);

  // Check for meaningful analysis data (not just basic overview)
  const hasAnalysisData = Boolean(
    fullAnalysis?.interpretation?.SubtopicAnalysis ||
    fullAnalysis?.interpretation?.basicAnalysis?.planets ||
    fullAnalysis?.interpretation?.basicAnalysis?.dominance
  );

  return {
    overview,
    fullAnalysis,
    workflowState,
    loading,
    error,
    hasAnalysisData,
    loadOverview,
    loadFullAnalysis,
    startAnalysisWorkflow,
    pollWorkflowStatus,
    getPlanetOverview,
    clearError,
  };
};
