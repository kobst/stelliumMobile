import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../../theme';

interface PatternData {
  elements?: Array<{
    name: string;
    planets: string[];
    count: number;
    percentage: number;
  }>;
  modalities?: Array<{
    name: string;
    planets: string[];
    count: number;
    percentage: number;
  }>;
  quadrants?: Array<{
    name: string;
    planets: string[];
    count: number;
    percentage: number;
  }>;
  planets?: Array<{
    name: string;
    percentage: number;
  }>;
  patterns?: any;
  interpretation?: string;
}

interface PatternCardProps {
  title: string;
  data: PatternData;
  type: 'elements' | 'modalities' | 'quadrants' | 'patterns' | 'planetary';
}

const PatternCard: React.FC<PatternCardProps> = ({ title, data, type }) => {
  const { colors } = useTheme();
  const getElementColor = (name: string) => {
    switch (name) {
      case 'Fire': return '#FF6B6B';
      case 'Earth': return '#4ECDC4';
      case 'Air': return '#45B7D1';
      case 'Water': return '#96CEB4';
      default: return '#8b5cf6';
    }
  };

  const getModalityColor = (name: string) => {
    switch (name) {
      case 'Cardinal': return '#FF6384';
      case 'Fixed': return '#36A2EB';
      case 'Mutable': return '#FFCE56';
      default: return '#8b5cf6';
    }
  };

  const getQuadrantColor = (name: string) => {
    return '#36A2EB';
  };

  const getColor = (name: string) => {
    switch (type) {
      case 'elements': return getElementColor(name);
      case 'modalities': return getModalityColor(name);
      case 'quadrants': return getQuadrantColor(name);
      default: return '#8b5cf6';
    }
  };

  const renderDistributionBars = () => {
    let items: Array<{ name: string; percentage: number; planets?: string[] }> = [];

    if (type === 'elements' && data.elements) {
      items = data.elements;
    } else if (type === 'modalities' && data.modalities) {
      items = data.modalities;
    } else if (type === 'quadrants' && data.quadrants) {
      items = data.quadrants;
    } else if (type === 'planetary' && data.planets) {
      items = data.planets.map(p => ({ name: p.name, percentage: p.percentage }));
    }

    if (!Array.isArray(items) || items.length === 0) {return null;}

    const maxPercentage = Math.max(...items.map(item => item.percentage || 0));

    return (
      <View style={styles.distributionContainer}>
        {items.map((item, index) => (
          <View key={item.name} style={styles.distributionItem}>
            <View style={styles.distributionHeader}>
              <Text style={[styles.categoryName, { color: colors.onSurface }]}>{item.name}</Text>
              <Text style={[styles.percentageText, { color: colors.onSurface }]}>{item.percentage}%</Text>
            </View>

            {/* Progress bar */}
            <View style={[styles.progressBarContainer, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${(item.percentage / maxPercentage) * 100}%`,
                    backgroundColor: getColor(item.name),
                  },
                ]}
              />
            </View>

            {/* Planet tags for non-planetary types */}
            {item.planets && (
              <View style={styles.planetTags}>
                {item.planets.map(planet => (
                  <View key={planet} style={[styles.planetTag, { backgroundColor: colors.primaryContainer }]}>
                    <Text style={[styles.planetTagText, { color: colors.onPrimaryContainer }]}>{planet}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderPatterns = () => {
    if (type !== 'patterns' || !data.patterns) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>No patterns data available</Text>
        </View>
      );
    }

    // Handle both array and object patterns data
    let patternsArray = [];
    if (Array.isArray(data.patterns)) {
      patternsArray = data.patterns;
    } else if (data.patterns.patterns && Array.isArray(data.patterns.patterns)) {
      patternsArray = data.patterns.patterns;
    } else if (typeof data.patterns === 'object') {
      // Handle legacy format with descriptions
      if (data.patterns.descriptions && Array.isArray(data.patterns.descriptions)) {
        patternsArray = data.patterns.descriptions.map((desc: string, index: number) => ({
          type: 'general',
          description: desc,
          id: index,
        }));
      }
    }

    if (patternsArray.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>No significant patterns detected</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.patternsContainer} showsVerticalScrollIndicator={false}>
        {patternsArray.map((pattern: any, index: number) => (
          <View key={pattern.id || index} style={[styles.patternItem, { backgroundColor: colors.surfaceVariant }]}>
            <View style={styles.patternHeader}>
              <Text style={[styles.patternType, { color: colors.primary }]}>
                {pattern.type ? pattern.type.replace('_', ' ').toUpperCase() : 'PATTERN'}
              </Text>
            </View>
            <Text style={[styles.patternDescription, { color: colors.onSurface }]}>
              {pattern.description || pattern}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  const getCardIcon = () => {
    switch (type) {
      case 'elements': return '🔥💨🌍💧';
      case 'modalities': return '♈♉♊';
      case 'quadrants': return '🧭';
      case 'patterns': return '✨';
      case 'planetary': return '🪐';
      default: return '⭐';
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={styles.icon}>{getCardIcon()}</Text>
        <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
      </View>

      <View style={styles.content}>
        {type === 'patterns' ? renderPatterns() : renderDistributionBars()}
      </View>

      {data.interpretation && (
        <View style={[styles.interpretationSection, { borderTopColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.interpretationTitle, { color: colors.primary }]}>Interpretation</Text>
          <Text style={[styles.interpretationText, { color: colors.onSurface }]}>{data.interpretation}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    padding: 16,
  },
  distributionContainer: {
    gap: 12,
  },
  distributionItem: {
    marginBottom: 12,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  planetTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  planetTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planetTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  patternsContainer: {
    maxHeight: 200,
  },
  patternItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  patternHeader: {
    marginBottom: 8,
  },
  patternType: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  patternDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
  },
  interpretationSection: {
    padding: 16,
    borderTopWidth: 1,
  },
  interpretationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  interpretationText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default PatternCard;
