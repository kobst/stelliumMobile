import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { KeystoneAspect } from '../../api/relationships';

interface KeystoneAspectsHighlightProps {
  keystoneAspects: KeystoneAspect[];
  onAspectPress?: (aspect: KeystoneAspect) => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'OVERALL_ATTRACTION_CHEMISTRY': '#E91E63',
  'EMOTIONAL_SECURITY_CONNECTION': '#4CAF50',
  'SEX_AND_INTIMACY': '#F44336',
  'COMMUNICATION_AND_MENTAL_CONNECTION': '#2196F3',
  'COMMITMENT_LONG_TERM_POTENTIAL': '#9C27B0',
  'KARMIC_LESSONS_GROWTH': '#FF9800',
  'PRACTICAL_GROWTH_SHARED_GOALS': '#795548',
};

const IMPACT_EMOJIS = {
  high: '⭐️',
  medium: '✨',
  low: '💫',
};

const getCategoryDisplayName = (category: string): string => {
  const displayNames: { [key: string]: string } = {
    'OVERALL_ATTRACTION_CHEMISTRY': 'Attraction & Chemistry',
    'EMOTIONAL_SECURITY_CONNECTION': 'Emotional Security',
    'SEX_AND_INTIMACY': 'Sex & Intimacy',
    'COMMUNICATION_AND_MENTAL_CONNECTION': 'Communication',
    'COMMITMENT_LONG_TERM_POTENTIAL': 'Long-term Potential',
    'KARMIC_LESSONS_GROWTH': 'Growth & Lessons',
    'PRACTICAL_GROWTH_SHARED_GOALS': 'Shared Goals',
  };
  return displayNames[category] || category;
};

const getScoreColor = (score: number): string => {
  if (score >= 12) return '#4CAF50';
  if (score >= 8) return '#FF9800';
  if (score >= 5) return '#FFC107';
  return '#F44336';
};

const KeystoneAspectsHighlight: React.FC<KeystoneAspectsHighlightProps> = ({
  keystoneAspects,
  onAspectPress,
}) => {
  const { colors } = useTheme();

  if (!keystoneAspects || keystoneAspects.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          No keystone aspects identified
        </Text>
      </View>
    );
  }

  // Sort aspects by score (highest first)
  const sortedAspects = [...keystoneAspects].sort((a, b) => b.score - a.score);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          ⭐️ Keystone Aspects
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          The most influential aspects in your relationship
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.aspectsScroll}>
        {sortedAspects.map((aspect, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.aspectCard,
              { 
                backgroundColor: colors.background,
                borderColor: CATEGORY_COLORS[aspect.category] || colors.primary,
              }
            ]}
            onPress={() => onAspectPress?.(aspect)}
            activeOpacity={0.7}
          >
            <View style={styles.aspectHeader}>
              <Text style={[styles.aspectRank, { color: colors.onSurfaceVariant }]}>
                #{index + 1}
              </Text>
              <Text style={[styles.impactEmoji]}>
                {IMPACT_EMOJIS[aspect.impact]}
              </Text>
            </View>
            
            <Text style={[styles.aspectDescription, { color: colors.onSurface }]}>
              {aspect.description}
            </Text>
            
            <View style={styles.aspectDetails}>
              <View style={[
                styles.categoryChip,
                { backgroundColor: CATEGORY_COLORS[aspect.category] || colors.primary }
              ]}>
                <Text style={[styles.categoryText, { color: 'white' }]}>
                  {getCategoryDisplayName(aspect.category)}
                </Text>
              </View>
              
              <Text style={[styles.aspectScore, { color: getScoreColor(aspect.score) }]}>
                {aspect.score.toFixed(1)}
              </Text>
            </View>
            
            <View style={[
              styles.impactBar,
              { backgroundColor: colors.surfaceVariant }
            ]}>
              <View
                style={[
                  styles.impactFill,
                  {
                    backgroundColor: getScoreColor(aspect.score),
                    width: `${Math.min((aspect.score / 20) * 100, 100)}%`,
                  }
                ]}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
          💡 Keystone aspects have the highest impact on relationship dynamics
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    margin: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    paddingVertical: 24,
  },
  aspectsScroll: {
    marginBottom: 16,
  },
  aspectCard: {
    width: 280,
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  aspectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aspectRank: {
    fontSize: 12,
    fontWeight: '600',
  },
  impactEmoji: {
    fontSize: 16,
  },
  aspectDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 22,
  },
  aspectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  aspectScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  impactBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  impactFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default KeystoneAspectsHighlight;