import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface RelationshipScoreIndicatorProps {
  clusterScores?: {
    Harmony: number;
    Passion: number;
    Connection: number;
    Growth: number;
    Stability: number;
  };
  level: 'complete' | 'scores' | 'none';
}

const RelationshipScoreIndicator: React.FC<RelationshipScoreIndicatorProps> = ({ clusterScores, level }) => {
  const { colors } = useTheme();

  if (level === 'none' || !clusterScores) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 71) {return '#10B981';} // Green
    if (score >= 41) {return '#F59E0B';} // Amber
    return '#EF4444'; // Red
  };

  const scoreEntries = Object.entries(clusterScores) as [string, number][];

  // Shorten category names for better display
  const formatCategoryName = (category: string): string => {
    switch (category) {
      case 'Connection':
        return 'Connect';
      case 'Stability':
        return 'Stable';
      default:
        return category;
    }
  };

  return (
    <View style={styles.container}>
      {scoreEntries.map(([category, score]) => (
        <View key={category} style={styles.scoreRow}>
          <Text style={[styles.categoryLabel, { color: colors.onSurfaceVariant }]}>
            {formatCategoryName(category)}
          </Text>
          <View style={[styles.progressBarContainer, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${score}%`,
                  backgroundColor: getScoreColor(score),
                },
              ]}
            />
          </View>
          <Text style={[styles.scoreValue, { color: colors.onSurface }]}>
            {score}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    width: 60,
    textAlign: 'left',
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '600',
    width: 28,
    textAlign: 'right',
  },
});

export default RelationshipScoreIndicator;
