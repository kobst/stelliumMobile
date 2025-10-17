import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { relationshipsApi } from '../../api/relationships';

interface RelationshipAnalysisTypeIndicatorProps {
  compositeChartId: string;
}

const RelationshipAnalysisTypeIndicator: React.FC<RelationshipAnalysisTypeIndicatorProps> = ({
  compositeChartId,
}) => {
  const { colors } = useTheme();
  const [detectedLevel, setDetectedLevel] = useState<'overview' | 'complete' | null>(null);

  // Fetch the actual analysis status by checking if full analysis exists
  useEffect(() => {
    if (!compositeChartId) {
      setDetectedLevel(null);
      return;
    }

    // Check if full analysis exists by fetching the analysis document
    const checkAnalysisStatus = async () => {
      try {
        const response = await relationshipsApi.fetchRelationshipAnalysis(compositeChartId);

        // Check if completeAnalysis exists (indicates full 360° relationship analysis complete)
        // This is the actual data structure for complete analysis
        const hasCompleteAnalysis = Boolean(
          response.completeAnalysis &&
          Object.keys(response.completeAnalysis).length > 0
        );

        if (hasCompleteAnalysis) {
          setDetectedLevel('complete');
        } else {
          // Has analysis document but no complete analysis = scores only
          setDetectedLevel('overview');
        }
      } catch (err) {
        // No analysis document exists or fetch failed
        setDetectedLevel('overview');
      }
    };

    checkAnalysisStatus();
  }, [compositeChartId]);

  const level = detectedLevel || 'overview';

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
          text: 'Scores & Overview',
          icon: '📈',
          color: colors.onSurfaceVariant,
        };
      default:
        return {
          text: 'Scores & Overview',
          icon: '📈',
          color: colors.onSurfaceVariant,
        };
    }
  };

  const { text, icon, color } = getDisplayInfo();

  return (
    <View style={styles.container}>
      <Text style={[styles.indicator, { color }]}>
        {icon} {text}
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

export default RelationshipAnalysisTypeIndicator;
