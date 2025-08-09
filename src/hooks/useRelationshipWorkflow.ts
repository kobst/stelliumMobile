import { useState, useEffect, useCallback } from 'react';
import {
  relationshipsApi,
  RelationshipAnalysisResponse,
  RelationshipWorkflowStatusResponse,
  RelationshipWorkflowStartResponse,
} from '../api';
import { useStore } from '../store';

export interface UseRelationshipWorkflowReturn {
  // Data states
  analysisData: RelationshipAnalysisResponse | null;
  workflowStatus: RelationshipWorkflowStatusResponse | null;
  loading: boolean;
  error: string | null;

  // Workflow states (simple, like birth chart)
  isStartingAnalysis: boolean;
  isPolling: boolean;
  connectionError: boolean;
  retryCount: number;

  // Workflow control methods
  startFullRelationshipAnalysis: (compositeChartId: string) => Promise<void>;
  checkWorkflowStatus: (compositeChartId: string) => Promise<void>;

  // Data methods
  loadExistingAnalysis: (compositeChartId: string) => Promise<void>;
  initializeCompositeChartData: (compositeChart: any) => Promise<void>;

  // Utility methods
  clearError: () => void;

  // Computed states
  isWorkflowRunning: boolean;
  workflowComplete: boolean;
  workflowError: boolean;
  computeWorkflowProgress: () => number;
  getCurrentStepDescription: () => string;
}

// Simple component-level polling (matching birth chart pattern)
export const useRelationshipWorkflow = (compositeChartId?: string): UseRelationshipWorkflowReturn => {
  console.log('🏗️ useRelationshipWorkflow hook initialized for:', compositeChartId);
  console.log('📍 Hook initialization - timestamp:', new Date().toISOString());

  // Data states
  const [analysisData, setAnalysisData] = useState<RelationshipAnalysisResponse | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<RelationshipWorkflowStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workflow states (simple like birth chart)
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Store integration (minimal, only for scores)
  const {
    relationshipWorkflowState,
    setRelationshipWorkflowState,
  } = useStore();

  const clearError = () => setError(null);

  // Update analysis data from workflow response - V3 simplified
  const updateAnalysisFromWorkflow = useCallback((analysisData: RelationshipAnalysisResponse) => {
    console.log('Updating V3 analysis from workflow:', analysisData);

    // Handle V3 analysis data
    if (analysisData.v2Analysis) {
      // Extract cluster scores for store compatibility
      const clusterScores: { [key: string]: number } = {};
      Object.entries(analysisData.v2Analysis.clusters).forEach(([clusterName, clusterData]) => {
        clusterScores[clusterName] = Math.round(clusterData.score * 100);
      });

      setRelationshipWorkflowState({
        hasScores: true,
        scores: clusterScores,
        v3Analysis: analysisData.v2Analysis,
        v3Metrics: analysisData.v2Metrics,
        startedFromCreation: true,
        isPaused: workflowStatus?.workflowStatus?.status === 'paused_after_scores',
      });
    }

    setAnalysisData(analysisData);
  }, [setRelationshipWorkflowState, workflowStatus?.workflowStatus?.status]);

  // Initialize composite chart data - V3 simplified
  const initializeCompositeChartData = useCallback(async (compositeChart: any) => {
    try {
      if (!compositeChart || !compositeChart._id) {
        console.log('No composite chart available yet for initialization');
        return;
      }

      // Check if we have immediate V3 data
      if (compositeChart.v2Analysis) {
        console.log('Found immediate V3 analysis:', compositeChart.v2Analysis);

        const clusterScores: { [key: string]: number } = {};
        Object.entries(compositeChart.v2Analysis.clusters).forEach(([clusterName, clusterData]: [string, any]) => {
          clusterScores[clusterName] = Math.round(clusterData.score * 100);
        });

        setRelationshipWorkflowState({
          hasScores: true,
          scores: clusterScores,
          v3Analysis: compositeChart.v2Analysis,
          v3Metrics: compositeChart.v2Metrics,
          startedFromCreation: true,
          isPaused: false,
        });
      }

      // Fetch relationship analysis data
      const fetchedData = await relationshipsApi.fetchRelationshipAnalysis(compositeChart._id);
      console.log('V3 fetchedData: ', fetchedData);

      if (fetchedData) {
        setAnalysisData(fetchedData);
        updateAnalysisFromWorkflow(fetchedData);
      }
    } catch (error) {
      console.error('Error initializing V3 composite chart data:', error);
    }
  }, [setRelationshipWorkflowState, updateAnalysisFromWorkflow]);

  // Load existing analysis
  const loadExistingAnalysis = useCallback(async (targetCompositeChartId: string) => {
    if (!targetCompositeChartId) {return;}

    try {
      const response = await relationshipsApi.fetchRelationshipAnalysis(targetCompositeChartId);
      setAnalysisData(response);

      if (response) {
        updateAnalysisFromWorkflow(response);
      }
    } catch (err) {
      console.error('Failed to load existing analysis:', err);
    }
  }, [updateAnalysisFromWorkflow]);

  // Simple status check function
  const checkWorkflowStatus = useCallback(async (targetCompositeChartId: string) => {
    if (!targetCompositeChartId) {
      console.log('⚠️ No chartId provided for status check');
      return;
    }

    try {
      console.log('Checking workflow status for:', targetCompositeChartId);
      const response = await relationshipsApi.getRelationshipWorkflowStatus(targetCompositeChartId);
      console.log('Status check response:', response);

      if (response.success) {
        setWorkflowStatus(response);
        setConnectionError(false);
        setRetryCount(0);

        if (response.analysisData) {
          updateAnalysisFromWorkflow(response.analysisData);
        }

        // Update store state with V3 analysis data
        const v3Analysis = response.analysisData?.v2Analysis;
        
        if (v3Analysis) {
          const clusterScores: { [key: string]: number } = {};
          Object.entries(v3Analysis.clusters).forEach(([clusterName, clusterData]) => {
            clusterScores[clusterName] = Math.round(clusterData.score * 100);
          });

          setRelationshipWorkflowState({
            isPaused: response.workflowStatus?.status === 'paused_after_scores',
            hasScores: true,
            scores: clusterScores,
            v3Analysis: v3Analysis,
            v3Metrics: response.analysisData?.v2Metrics,
            startedFromCreation: true,
          });
        }
      }
    } catch (error) {
      console.error('Error checking workflow status:', error);
      setConnectionError(true);
      const errorMessage = error instanceof Error ? error.message : 'Status check failed';
      setError(errorMessage);
    }
  }, [setRelationshipWorkflowState, updateAnalysisFromWorkflow]);

  // Start full analysis workflow (simple like birth chart)
  const startFullRelationshipAnalysis = useCallback(async (targetCompositeChartId: string) => {
    if (!targetCompositeChartId || loading) {return;}

    try {
      setIsStartingAnalysis(true);
      setError(null);

      console.log('Starting full relationship analysis workflow for:', targetCompositeChartId);

      const startResponse = await relationshipsApi.startFullRelationshipAnalysis(targetCompositeChartId);
      console.log('Start full analysis response:', startResponse);

      if (startResponse.success) {
        console.log('Workflow started successfully, beginning simple polling');

        // Start simple component-level polling (like birth chart)
        setIsPolling(true);

        // Track active polling in store to survive remounts
        setRelationshipWorkflowState({
          isPollingActive: true,
          activeCompositeChartId: targetCompositeChartId,
          completed: false, // Reset completion when starting new workflow
        });

        const pollInterval = setInterval(async () => {
          try {
            console.log('📡 Polling status for:', targetCompositeChartId);
            const response = await relationshipsApi.getRelationshipWorkflowStatus(targetCompositeChartId);
            console.log('📊 Poll response:', response.workflowStatus?.status);

            if (response.success) {
              setWorkflowStatus(response);
              setIsStartingAnalysis(false);
              setConnectionError(false);
              setRetryCount(0);

              // Update analysis data if available
              if (response.analysisData) {
                updateAnalysisFromWorkflow(response.analysisData);
              }

              // Check if workflow is complete
              if (response.workflowStatus?.status === 'completed' ||
                  response.workflowStatus?.status === 'error') {
                console.log('🛑 Polling: Workflow finished with status:', response.workflowStatus?.status);

                // IMPORTANT: Set final workflow status before stopping polling
                setWorkflowStatus(response);

                clearInterval(pollInterval);
                setIsPolling(false);
                setIsStartingAnalysis(false);

                if (response.workflowStatus?.status === 'completed') {
                  setRelationshipWorkflowState({
                    completed: true,
                    isPaused: false,
                    isPollingActive: false, // Stop tracking active polling
                    activeCompositeChartId: null,
                  });

                  // Store completion status to survive remounts
                  console.log('✅ Setting completion status in store for:', targetCompositeChartId);
                } else {
                  // For errors, also stop tracking active polling
                  setRelationshipWorkflowState({
                    isPollingActive: false,
                    activeCompositeChartId: null,
                  });
                }
              }
            }
          } catch (error) {
            console.error('❌ Error in polling interval:', error);
            const newRetryCount = retryCount + 1;
            setRetryCount(newRetryCount);
            setConnectionError(true);

            // Enhanced error recovery
            if (newRetryCount >= 5) {
              console.log('🛑 Too many polling errors, stopping polling');
              clearInterval(pollInterval);
              setIsPolling(false);
              setError('Workflow polling failed after multiple retries');
            }
          }
        }, 3000);

        // Auto-cleanup after 10 minutes
        setTimeout(() => {
          console.log('⏰ Polling timeout reached');
          clearInterval(pollInterval);
          setIsPolling(false);

          if (isStartingAnalysis) {
            setError('Analysis workflow timeout');
            setIsStartingAnalysis(false);
          }
        }, 600000);

      } else {
        setIsStartingAnalysis(false);
        setError('Failed to start workflow');
      }
    } catch (error) {
      console.error('Error starting full analysis workflow:', error);
      setIsStartingAnalysis(false);
      setError('Failed to start analysis workflow');
    }
  }, [loading, retryCount, updateAnalysisFromWorkflow, setRelationshipWorkflowState, isStartingAnalysis]);

  // Computed states
  const isWorkflowRunning = workflowStatus?.workflowStatus?.status === 'running';
  const workflowComplete = workflowStatus?.workflowStatus?.status === 'completed';
  const workflowError = workflowStatus?.workflowStatus?.status === 'error';

  // Progress calculation
  const computeWorkflowProgress = useCallback(() => {
    if (!workflowStatus?.workflowStatus?.progress) {return 0;}
    return workflowStatus.workflowStatus.progress.percentage || 0;
  }, [workflowStatus?.workflowStatus?.progress]);

  // Get current step description
  const getCurrentStepDescription = useCallback(() => {
    if (!workflowStatus) {return '';}

    const progress = computeWorkflowProgress();

    if (progress < 15) {return 'Initializing relationship analysis...';}
    if (progress < 30) {return 'Analyzing synastry aspects...';}
    if (progress < 45) {return 'Computing composite chart...';}
    if (progress < 60) {return 'Generating compatibility scores...';}
    if (progress < 75) {return 'Creating detailed category analysis...';}
    if (progress < 90) {return 'Processing holistic overview...';}
    if (progress < 95) {return 'Finalizing vectorization...';}
    return 'Complete!';
  }, [workflowStatus, computeWorkflowProgress]);

  return {
    // Data states
    analysisData,
    workflowStatus,
    loading,
    error,

    // Workflow states
    isStartingAnalysis,
    isPolling,
    connectionError,
    retryCount,

    // Workflow control methods
    startFullRelationshipAnalysis,
    checkWorkflowStatus,

    // Data methods
    loadExistingAnalysis,
    initializeCompositeChartData,

    // Utility methods
    clearError,

    // Computed states
    isWorkflowRunning,
    workflowComplete,
    workflowError,
    computeWorkflowProgress,
    getCurrentStepDescription,
  };
};
