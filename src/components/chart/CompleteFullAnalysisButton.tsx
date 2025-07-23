import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useChart } from '../../hooks/useChart';
import { useStore } from '../../store';
import { useTheme } from '../../theme';

interface CompleteFullAnalysisButtonProps {
  userId?: string;
  onAnalysisComplete?: () => void;
}

interface ProgressState {
  workflowId?: string;
  progress?: number;
  currentPhase?: string;
  isCompleted?: boolean;
  status?: string;
}

const CompleteFullAnalysisButton: React.FC<CompleteFullAnalysisButtonProps> = ({
  userId,
  onAnalysisComplete,
}) => {
  const { colors } = useTheme();
  const { userData, activeUserContext, creationWorkflowState } = useStore();
  const { 
    startAnalysisWorkflow, 
    workflowState, 
    loading: chartLoading, 
    error,
    loadFullAnalysis 
  } = useChart(userId);
  
  const [workflowStarted, setWorkflowStarted] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState>({});

  // Track workflow progress - use store state for cross-tab synchronization
  useEffect(() => {
    const activeWorkflowState = workflowState || creationWorkflowState;
    console.log('CompleteFullAnalysisButton - activeWorkflowState updated:', activeWorkflowState);
    
    if (activeWorkflowState && activeWorkflowState.workflowId) {
      const progressPercentage = activeWorkflowState.progress?.percentage || activeWorkflowState.progress || 0;
      const isCompleted = activeWorkflowState.completed || activeWorkflowState.isCompleted;
      
      const newProgressState = {
        workflowId: activeWorkflowState.workflowId,
        progress: progressPercentage,
        currentPhase: activeWorkflowState.progress?.currentPhase || `Analyzing... (${progressPercentage}%)`,
        isCompleted: isCompleted,
        status: activeWorkflowState.status,
      };
      console.log('CompleteFullAnalysisButton - setting progress state:', newProgressState);
      setProgressState(newProgressState);

      // Set workflow started if there's an active workflow
      if (progressPercentage >= 0 && !isCompleted) {
        setWorkflowStarted(true);
      }


      // Handle completion
      if (isCompleted) {
        console.log('CompleteFullAnalysisButton - workflow completed, refreshing analysis');
        setWorkflowStarted(false);
        // Refresh analysis data
        loadFullAnalysis();
        // Notify parent component
        onAnalysisComplete?.();
      }
    }
  }, [workflowState, creationWorkflowState, loadFullAnalysis, onAnalysisComplete]);

  const getPhaseDescription = (progress: number): string => {
    if (progress < 20) return "Initializing analysis...";
    if (progress < 40) return "Analyzing planetary positions...";
    if (progress < 60) return "Computing aspect patterns...";
    if (progress < 80) return "Generating interpretations...";
    if (progress < 95) return "Finalizing analysis...";
    return "Complete!";
  };

  const handleStartAnalysis = async () => {
    // Use the specific userId for the chart being viewed, fallback to activeUserContext, then userData
    const targetUserId = userId || activeUserContext?.id || userData?.id;
    console.log('CompleteFullAnalysisButton - starting analysis for userId:', targetUserId);
    
    if (!targetUserId || workflowStarted || chartLoading) return;

    try {
      setWorkflowStarted(true);
      console.log('CompleteFullAnalysisButton - calling startAnalysisWorkflow');
      await startAnalysisWorkflow();
      console.log('CompleteFullAnalysisButton - startAnalysisWorkflow completed');
    } catch (err) {
      setWorkflowStarted(false);
      console.error('CompleteFullAnalysisButton - Failed to start analysis workflow:', err);
    }
  };

  const getButtonText = (): string => {
    if (chartLoading || workflowStarted) {
      if (progressState.progress && progressState.progress > 0) {
        return "Analysis in Progress...";
      }
      return "Starting Analysis...";
    }
    return "Complete Full Analysis";
  };

  const isButtonDisabled = (): boolean => {
    const targetUserId = userId || activeUserContext?.id || userData?.id;
    return chartLoading || 
           !targetUserId || 
           workflowStarted || 
           (progressState.progress !== undefined && progressState.progress > 0 && !progressState.isCompleted);
  };


  // Don't show anything if already completed
  if (progressState.isCompleted) {
    return null;
  }

  // Show inline loading state when analysis is in progress
  if (workflowStarted && progressState.progress !== undefined && progressState.progress > 0) {
    return (
      <View style={styles.inlineLoadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        <Text style={[styles.inlineLoadingTitle, { color: colors.onSurface }]}>Generating Your Detailed Analysis</Text>
        <Text style={[styles.inlineLoadingSubtitle, { color: colors.onSurfaceVariant }]}>
          We're creating your comprehensive 360° life analysis with insights across all major life areas.
        </Text>
        <Text style={[styles.inlineLoadingTime, { color: colors.onSurfaceVariant }]}>
          This typically takes 1-2 minutes...
        </Text>
        {progressState.progress > 0 && (
          <View style={[styles.progressContainer, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.progressText, { color: colors.primary }]}>
              {Math.round(progressState.progress)}% Complete
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.inlineErrorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={[styles.errorTitle, { color: colors.error }]}>Analysis Failed</Text>
        <Text style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
          We encountered an error generating your analysis. Please try again.
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.error }]}
          onPress={handleStartAnalysis}
        >
          <Text style={[styles.retryButtonText, { color: colors.onError }]}>Retry Analysis</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default state - show the button
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.primary },
        isButtonDisabled() && [styles.buttonDisabled, { backgroundColor: colors.onSurfaceVariant }],
      ]}
      onPress={handleStartAnalysis}
      disabled={isButtonDisabled()}
    >
      <Text style={[
        styles.buttonText,
        { color: colors.onPrimary },
        isButtonDisabled() && { color: colors.onSurface },
      ]}>
        {getButtonText()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Inline loading state
  inlineLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  spinner: {
    marginBottom: 16,
  },
  inlineLoadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  inlineLoadingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  inlineLoadingTime: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Inline error state
  inlineErrorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CompleteFullAnalysisButton;