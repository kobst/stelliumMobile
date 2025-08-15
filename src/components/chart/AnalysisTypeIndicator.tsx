import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { AnalysisStatus } from '../../types';

interface AnalysisTypeIndicatorProps {
  analysisStatus?: AnalysisStatus;
  fallbackLevel?: 'none' | 'overview' | 'complete';
}

const AnalysisTypeIndicator: React.FC<AnalysisTypeIndicatorProps> = ({
  analysisStatus,
  fallbackLevel = 'overview',
}) => {
  const { colors } = useTheme();

  const level = analysisStatus?.level || fallbackLevel;

  const getDisplayInfo = () => {
    switch (level) {
      case 'complete':
        return {
          text: 'Complete Analysis',
          icon: '📊',
          color: colors.onSurfaceVariant,
        };
      case 'overview':
        return {
          text: 'Overview & Chart',
          icon: '📈',
          color: colors.onSurfaceVariant,
        };
      case 'none':
        return {
          text: 'Basic Chart',
          icon: '📋',
          color: colors.onSurfaceVariant,
        };
      default:
        return {
          text: 'Overview & Chart',
          icon: '📈',
          color: colors.onSurfaceVariant,
        };
    }
  };

  const { text, icon, color } = getDisplayInfo();

  // Show progress for in-progress complete analyses
  const showProgress = analysisStatus &&
    level === 'complete' &&
    analysisStatus.workflowStatus !== 'completed' &&
    analysisStatus.completedTasks > 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.indicator, { color }]}>
        {icon} {text}
        {showProgress && ` (${analysisStatus.completedTasks}/${analysisStatus.totalTasks})`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  indicator: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AnalysisTypeIndicator;

