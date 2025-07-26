import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRelationshipWorkflow } from '../../hooks/useRelationshipWorkflow';
import { useStore } from '../../store';

interface CompleteRelationshipAnalysisButtonProps {
  compositeChartId: string;
  onAnalysisComplete?: () => void;
  hideParentContent?: boolean;
  hasAnalysisData?: boolean;
}

const CompleteRelationshipAnalysisButton: React.FC<CompleteRelationshipAnalysisButtonProps> = ({
  compositeChartId,
  onAnalysisComplete,
  hasAnalysisData = false,
}) => {
  // Store state (minimal, only for scores and completion)
  const { relationshipWorkflowState } = useStore();

  // Hook state
  const {
    error,
    isStartingAnalysis,
    isPolling,
    isWorkflowRunning,
    workflowComplete,
    workflowError,
    computeWorkflowProgress,
    startFullRelationshipAnalysis,
  } = useRelationshipWorkflow(compositeChartId);

  // Check if polling is active (local or store state)
  const isStorePollingActive = relationshipWorkflowState.isPollingActive &&
                              relationshipWorkflowState.activeCompositeChartId === compositeChartId;
  const isAnalysisInProgress = isStartingAnalysis || isPolling || isWorkflowRunning || isStorePollingActive;

  useEffect(() => {
    // Handle completion
    if (workflowComplete || relationshipWorkflowState.completed) {
      onAnalysisComplete?.();
    }
  }, [workflowComplete, relationshipWorkflowState.completed, onAnalysisComplete]);

  const handleStartAnalysis = async () => {
    if (!compositeChartId || isAnalysisInProgress) {return;}

    try {
      await startFullRelationshipAnalysis(compositeChartId);
    } catch (err) {
      console.error('Failed to start relationship analysis:', err);
    }
  };

  // Don't show anything if already completed AND we have analysis data
  if ((workflowComplete || relationshipWorkflowState.completed) && hasAnalysisData) {
    return null;
  }

  // Show loading state when analysis is in progress
  if (isAnalysisInProgress) {
    const progress = computeWorkflowProgress();

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" style={styles.spinner} />
        <Text style={styles.loadingTitle}>Generating Your Detailed Analysis</Text>
        <Text style={styles.loadingSubtitle}>
          We're creating your comprehensive compatibility report with insights across all 7 relationship dimensions.
        </Text>
        <Text style={styles.loadingTime}>
          This typically takes 1-2 minutes. You can navigate away and come back - we'll notify you when it's ready.
        </Text>
        {progress > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {Math.round(progress)}% Complete
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Show error state
  if (workflowError || error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorText}>
          We encountered an error generating your analysis. Please try again.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleStartAnalysis}
        >
          <Text style={styles.retryButtonText}>Retry Analysis</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default state - show the button
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleStartAnalysis}
      disabled={isAnalysisInProgress}
    >
      <Text style={styles.buttonText}>Complete Full Analysis</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading state
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  loadingTime: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  progressContainer: {
    marginTop: 20,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
  },

  // Error state
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CompleteRelationshipAnalysisButton;
