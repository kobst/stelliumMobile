import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface AnalysisLoadingViewProps {
  isAnalysisInProgress: boolean;
  workflowState?: {
    message?: string;
    phase?: string;
    startedAt?: string;
  } | null;
}

export const AnalysisLoadingView: React.FC<AnalysisLoadingViewProps> = ({
  isAnalysisInProgress,
  workflowState,
}) => {
  const { colors } = useTheme();

  const getProgressMessage = () => {
    if (isAnalysisInProgress && workflowState?.message) {
      return workflowState.message;
    }
    if (isAnalysisInProgress && workflowState?.phase === 'running') {
      return 'Generating your complete astrological analysis...';
    }
    return 'Loading analysis...';
  };

  const getStatusMessage = () => {
    if (isAnalysisInProgress && workflowState?.startedAt) {
      const startTime = new Date(workflowState.startedAt);
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      return `Analysis started ${timeStr} ago • Phase: ${workflowState.phase || 'processing'}`;
    }
    return null;
  };

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
        {getProgressMessage()}
      </Text>
      {isAnalysisInProgress && (
        <Text style={[styles.timingText, { color: colors.onSurfaceVariant }]}>
          This process should take 5-7 minutes
        </Text>
      )}
      {getStatusMessage() && (
        <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
          {getStatusMessage()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  timingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});