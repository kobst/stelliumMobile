import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

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

    if (!Array.isArray(items) || items.length === 0) return null;

    const maxPercentage = Math.max(...items.map(item => item.percentage || 0));

    return (
      <View style={styles.distributionContainer}>
        {items.map((item, index) => (
          <View key={item.name} style={styles.distributionItem}>
            <View style={styles.distributionHeader}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.percentageText}>{item.percentage}%</Text>
            </View>
            
            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${(item.percentage / maxPercentage) * 100}%`,
                    backgroundColor: getColor(item.name)
                  }
                ]} 
              />
            </View>

            {/* Planet tags for non-planetary types */}
            {item.planets && (
              <View style={styles.planetTags}>
                {item.planets.map(planet => (
                  <View key={planet} style={styles.planetTag}>
                    <Text style={styles.planetTagText}>{planet}</Text>
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
          <Text style={styles.noDataText}>No patterns data available</Text>
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
          id: index
        }));
      }
    }

    if (patternsArray.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No significant patterns detected</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.patternsContainer} showsVerticalScrollIndicator={false}>
        {patternsArray.map((pattern: any, index: number) => (
          <View key={pattern.id || index} style={styles.patternItem}>
            <View style={styles.patternHeader}>
              <Text style={styles.patternType}>
                {pattern.type ? pattern.type.replace('_', ' ').toUpperCase() : 'PATTERN'}
              </Text>
            </View>
            <Text style={styles.patternDescription}>
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
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{getCardIcon()}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.content}>
        {type === 'patterns' ? renderPatterns() : renderDistributionBars()}
      </View>

      {data.interpretation && (
        <View style={styles.interpretationSection}>
          <Text style={styles.interpretationTitle}>Interpretation</Text>
          <Text style={styles.interpretationText}>{data.interpretation}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#a78bfa',
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
    color: '#ffffff',
    flex: 1,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planetTagText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  patternsContainer: {
    maxHeight: 200,
  },
  patternItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#8b5cf6',
    textTransform: 'uppercase',
  },
  patternDescription: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  interpretationSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  interpretationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 8,
  },
  interpretationText: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
});

export default PatternCard;