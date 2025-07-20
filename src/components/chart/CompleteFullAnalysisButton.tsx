import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useChart } from '../../hooks/useChart';
import { useStore } from '../../store';

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
  const [progressAnimation] = useState(new Animated.Value(0));

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

      // Animate progress bar
      Animated.timing(progressAnimation, {
        toValue: progressPercentage / 100,
        duration: 500,
        useNativeDriver: false,
      }).start();

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
  }, [workflowState, creationWorkflowState, progressAnimation, loadFullAnalysis, onAnalysisComplete]);

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

  const renderProgressBar = () => {
    if (!workflowStarted || progressState.progress === undefined) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View 
            style={[
              styles.progressBarFill,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progressState.progress || 0)}% - {progressState.currentPhase}
        </Text>
      </View>
    );
  };

  const renderCompletionBanner = () => {
    if (!progressState.isCompleted) return null;

    return (
      <View style={styles.completionBanner}>
        <Text style={styles.completionIcon}>🎉</Text>
        <Text style={styles.completionText}>Analysis Complete!</Text>
        <Text style={styles.completionSubtext}>Your full birth chart analysis is now available</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          isButtonDisabled() && styles.buttonDisabled,
        ]}
        onPress={handleStartAnalysis}
        disabled={isButtonDisabled()}
      >
        <Text style={[
          styles.buttonText,
          isButtonDisabled() && styles.buttonTextDisabled,
        ]}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>

      {renderProgressBar()}
      {renderCompletionBanner()}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#6b7280',
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#d1d5db',
  },
  progressContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '80%',
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    color: '#d1d5db',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  completionBanner: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#065f46',
    borderRadius: 8,
    alignItems: 'center',
    width: '90%',
  },
  completionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  completionText: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  completionSubtext: {
    color: '#6ee7b7',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    width: '90%',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CompleteFullAnalysisButton;