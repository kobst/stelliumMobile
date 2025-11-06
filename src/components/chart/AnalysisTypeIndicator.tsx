import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { AnalysisStatus } from '../../types';
import { chartsApi } from '../../api';

interface AnalysisTypeIndicatorProps {
  analysisStatus?: AnalysisStatus;
  fallbackLevel?: 'none' | 'overview' | 'complete';
  userId?: string; // Optional: used to verify if full analysis actually exists
}

const AnalysisTypeIndicator: React.FC<AnalysisTypeIndicatorProps> = ({
  analysisStatus,
  fallbackLevel = 'overview',
  userId,
}) => {
  const { colors } = useTheme();
  const [detectedLevel, setDetectedLevel] = useState<'none' | 'overview' | 'complete' | null>(null);

  // Fetch the actual analysis status by checking if full analysis exists
  useEffect(() => {
    if (!userId) {
      setDetectedLevel(null);
      return;
    }

    // Check if full analysis exists by fetching the analysis document
    const checkAnalysisStatus = async () => {
      try {
        const response = await chartsApi.fetchAnalysis(userId);

        // Check if broadCategoryAnalyses exists (indicates full 360° analysis complete)
        // This is the actual data structure for complete analysis, not a status field
        const hasBroadCategoryAnalyses = Boolean(
          response?.interpretation?.broadCategoryAnalyses &&
          Object.keys(response.interpretation.broadCategoryAnalyses).length > 0
        );

        if (hasBroadCategoryAnalyses) {
          setDetectedLevel('complete');
        } else {
          // Has analysis document but no broad categories = overview only
          setDetectedLevel('overview');
        }
      } catch (err) {
        // No analysis document exists = fall back to analysisStatus or default
        setDetectedLevel(null);
      }
    };

    checkAnalysisStatus();
  }, [userId]);

  const level = detectedLevel || analysisStatus?.level || fallbackLevel;

  const getDisplayInfo = () => {
    switch (level) {
      case 'complete':
        return {
          text: 'Full Analysis',
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
  const showProgress = false; // Never show progress for complete analyses

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

