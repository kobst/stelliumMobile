import { useState, useEffect, useCallback } from 'react';
import {
  relationshipsApi,
  RelationshipAnalysisResponse,
  RelationshipWorkflowStatusResponse,
  RelationshipWorkflowStartResponse,
  ClusterScoring,
  ClusterAnalysis,
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


  // Update analysis data from workflow response - Cluster system
  const updateAnalysisFromWorkflow = useCallback((analysisData: RelationshipAnalysisResponse) => {
    console.log('Updating cluster analysis from workflow:', analysisData);

    // Handle cluster scoring data
    if (analysisData.clusterScoring) {
      // Extract cluster scores for store compatibility
      const clusterScores: { [key: string]: number } = {};
      Object.entries(analysisData.clusterScoring.clusters).forEach(([clusterName, clusterData]) => {
        clusterScores[clusterName] = Math.round(clusterData.score);
      });

      setRelationshipWorkflowState({
        hasScores: true,
        scores: clusterScores,
        clusterScoring: analysisData.clusterScoring,
        completeAnalysis: analysisData.completeAnalysis,
        startedFromCreation: true,
        isPaused: workflowStatus?.status === 'paused_after_scores',
      });
    }

    setAnalysisData(analysisData);
  }, [setRelationshipWorkflowState, workflowStatus?.status]);

  // Initialize composite chart data - Cluster system
  const initializeCompositeChartData = useCallback(async (compositeChart: any) => {
    try {
      if (!compositeChart || !compositeChart._id) {
        console.log('No composite chart available yet for initialization');
        return;
      }

      // Check if we have immediate cluster data
      if (compositeChart.clusterScoring) {
        console.log('Found immediate cluster analysis:', compositeChart.clusterScoring);

        const clusterScores: { [key: string]: number } = {};
        Object.entries(compositeChart.clusterScoring.clusters).forEach(([clusterName, clusterData]: [string, any]) => {
          clusterScores[clusterName] = Math.round(clusterData.score);
        });

        setRelationshipWorkflowState({
          hasScores: true,
          scores: clusterScores,
          clusterScoring: compositeChart.clusterScoring,
          completeAnalysis: compositeChart.completeAnalysis,
          startedFromCreation: true,
          isPaused: false,
        });
      }

      // Fetch relationship analysis data
      const fetchedData = await relationshipsApi.fetchRelationshipAnalysis(compositeChart._id);
      console.log('Cluster fetchedData: ', fetchedData);

      if (fetchedData) {
        setAnalysisData(fetchedData);
        updateAnalysisFromWorkflow(fetchedData);
      }
    } catch (error) {
      console.error('Error initializing cluster composite chart data:', error);
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

        // Update store state with cluster analysis data
        const clusterScoring = response.analysisData?.clusterScoring;

        if (clusterScoring) {
          const clusterScores: { [key: string]: number } = {};
          Object.entries(clusterScoring.clusters).forEach(([clusterName, clusterData]) => {
            clusterScores[clusterName] = Math.round(clusterData.score);
          });

          setRelationshipWorkflowState({
            isPaused: response.status === 'paused_after_scores',
            hasScores: true,
            scores: clusterScores,
            clusterScoring: clusterScoring,
            completeAnalysis: response.analysisData?.completeAnalysis,
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

  // Check if polling should be active for this chart on hook initialization
  useEffect(() => {
    if (compositeChartId) {
      // Check if polling is active for this chart
      if (relationshipWorkflowState.isPollingActive &&
          relationshipWorkflowState.activeCompositeChartId === compositeChartId) {
        console.log('🔄 Hook remounted during active polling - checking status for:', compositeChartId);
        checkWorkflowStatus(compositeChartId);
      }
      // Check if workflow was completed for this chart
      else if (relationshipWorkflowState.completedWorkflowStatus &&
               relationshipWorkflowState.completedWorkflowStatus.compositeChartId === compositeChartId) {
        console.log('🎯 Hook remounted after completion - restoring completed status for:', compositeChartId);
        setWorkflowStatus(relationshipWorkflowState.completedWorkflowStatus);
      }
    }
  }, [compositeChartId, relationshipWorkflowState.isPollingActive, relationshipWorkflowState.activeCompositeChartId, relationshipWorkflowState.completedWorkflowStatus, checkWorkflowStatus]);

  // Debug: Track workflowStatus changes
  useEffect(() => {
    console.log('📊 WorkflowStatus state changed to:', workflowStatus?.status, 'for:', compositeChartId);
  }, [workflowStatus?.status, compositeChartId]);

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
            const response = await relationshipsApi.getRelationshipWorkflowStatus(targetCompositeChartId);

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
              if (response.status === 'completed' ||
                  response.status === 'failed') {
                console.log('🎉 Workflow completed! Status:', response.status, 'for:', targetCompositeChartId);

                // IMPORTANT: Set final workflow status before stopping polling
                console.log('📝 Setting final workflow status to completed:', response);
                setWorkflowStatus(response);

                clearInterval(pollInterval);
                setIsPolling(false);
                setIsStartingAnalysis(false);

                if (response.status === 'completed') {
                  setRelationshipWorkflowState({
                    completed: true,
                    isPaused: false,
                    isPollingActive: false, // Stop tracking active polling
                    activeCompositeChartId: null,
                    completedWorkflowStatus: response, // Store completed status for remounts
                  });

                  // Store completion status to survive remounts
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
              clearInterval(pollInterval);
              setIsPolling(false);
              setError('Workflow polling failed after multiple retries');
            }
          }
        }, 3000);

        // Auto-cleanup after 10 minutes
        setTimeout(() => {
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

  // Computed states - also consider store polling state for robustness
  const isWorkflowRunning = workflowStatus?.status === 'in_progress' ||
    (relationshipWorkflowState.isPollingActive && relationshipWorkflowState.activeCompositeChartId === compositeChartId);
  const workflowComplete = workflowStatus?.status === 'completed';
  const workflowError = workflowStatus?.status === 'failed';

  console.log('🟢 Hook computed states - status:', workflowStatus?.status, 'isWorkflowRunning:', isWorkflowRunning, 'storePollingActive:', relationshipWorkflowState.isPollingActive, 'activeChartId:', relationshipWorkflowState.activeCompositeChartId);



  // Progress calculation - simplified since new API doesn't include progress percentage
  const computeWorkflowProgress = useCallback(() => {
    if (!workflowStatus) return 0;
    // Return basic progress based on status
    if (workflowStatus.status === 'completed') return 100;
    if (workflowStatus.status === 'in_progress') return 50;
    return 0;
  }, [workflowStatus]);

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
