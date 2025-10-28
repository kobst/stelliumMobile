import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRelationshipWorkflow } from '../../hooks/useRelationshipWorkflow';
import { useStore } from '../../store';
import { useTheme } from '../../theme';
import { useCreditsGate } from '../../hooks/useCreditsGate';

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
  const { colors } = useTheme();

  // Store state (minimal, only for scores and completion)
  const { relationshipWorkflowState } = useStore();

  // Credits gate hook
  const { checkAndProceed, isChecking, canAfford } = useCreditsGate();

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

  const getButtonText = (): string => {
    if (isChecking) {
      return 'Checking credits...';
    }
    if (isAnalysisInProgress) {
      return 'Analysis in Progress...';
    }
    return 'Complete Full Analysis (15 credits)';
  };

  const isButtonDisabled = (): boolean => {
    return !compositeChartId || isAnalysisInProgress || isChecking;
  };

  useEffect(() => {
    // Handle completion
    if (workflowComplete || relationshipWorkflowState.completed) {
      onAnalysisComplete?.(analysisData);
    }
  }, [workflowComplete, relationshipWorkflowState.completed, onAnalysisComplete, analysisData]);

  const handleStartAnalysis = async () => {
    if (!compositeChartId || isAnalysisInProgress) {return;}

    // Check credits and proceed with analysis
    const allowed = await checkAndProceed({
      action: 'fullRelationshipReport',
      source: 'relationship_analysis_tab',
      onProceed: async () => {
        try {
          await startFullRelationshipAnalysis(compositeChartId);
        } catch (err) {
          console.error('Failed to start relationship analysis:', err);
          throw err; // Re-throw to let credit gate handle it
        }
      },
    });

    if (!allowed) {
      console.log('CompleteRelationshipAnalysisButton - User did not have enough credits or cancelled paywall');
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
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CompleteRelationshipAnalysisButton;
