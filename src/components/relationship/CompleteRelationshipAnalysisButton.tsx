import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRelationshipWorkflow } from '../../hooks/useRelationshipWorkflow';
import { useStore } from '../../store';

interface CompleteRelationshipAnalysisButtonProps {
  compositeChartId: string;
  onAnalysisComplete?: (analysisData?: any) => void;
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
    analysisData,
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
      onAnalysisComplete?.(analysisData);
    }
  }, [workflowComplete, relationshipWorkflowState.completed, onAnalysisComplete, analysisData]);

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

  // Don't show inline loading - let tabs handle loading state consistently
  // When workflow is active, button should be hidden by parent tab

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
