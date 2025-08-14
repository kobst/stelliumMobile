import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useChart } from '../../hooks/useChart';
import { useStore } from '../../store';
import CompleteFullAnalysisButton from './CompleteFullAnalysisButton';
import { useTheme } from '../../theme';

interface AnalysisTabProps {
  userId?: string;
}

// Topic definitions based on frontend guide
const BROAD_TOPICS = {
  PERSONALITY_IDENTITY: {
    label: 'Self-Expression and Identity',
    icon: '🌟',
    subtopics: {
      PERSONAL_IDENTITY: 'Personal Identity and Self-Image',
      OUTWARD_EXPRESSION: 'Outward Expression and Appearance',
      INNER_EMOTIONAL_SELF: 'Inner Self and Emotional Dynamics',
      CHALLENGES_SELF_EXPRESSION: 'Challenges and Growth of Self-Expression',
    },
  },
  EMOTIONAL_FOUNDATIONS_HOME: {
    label: 'Emotional Foundations and Home Life',
    icon: '🏠',
    subtopics: {
      EMOTIONAL_FOUNDATIONS: 'Emotional Foundations and Security Needs',
      FAMILY_DYNAMICS: 'Family Dynamics and Past Influences',
      HOME_ENVIRONMENT: 'Home Environment and Preferences',
      FAMILY_CHALLENGES: 'Challenges and Growth in Family Life',
    },
  },
  RELATIONSHIPS_SOCIAL: {
    label: 'Relationships and Social Connections',
    icon: '💕',
    subtopics: {
      RELATIONSHIP_DESIRES: 'Core Relationship Desires and Boundaries',
      LOVE_STYLE: 'Love Style and Expression',
      SEXUAL_NATURE: 'Sexual Nature and Intimacy',
      COMMITMENT_APPROACH: 'Commitment Approach and Long-Term Vision',
      RELATIONSHIP_CHALLENGES: 'Challenges and Growth in Relationships',
    },
  },
  CAREER_PURPOSE_PUBLIC_IMAGE: {
    label: 'Career, Purpose, and Public Image',
    icon: '🎯',
    subtopics: {
      CAREER_MOTIVATIONS: 'Career Motivations and Aspirations',
      PUBLIC_IMAGE: 'Public Image Reputation and Leadership Style',
      CAREER_CHALLENGES: 'Career Challenges and Opportunities',
      SKILLS_TALENTS: 'Skills Talents and Strengths',
    },
  },
  UNCONSCIOUS_SPIRITUALITY: {
    label: 'Unconscious Drives and Spiritual Growth',
    icon: '🔮',
    subtopics: {
      PSYCHOLOGICAL_PATTERNS: 'Deep Psychological Patterns and Shadow Self',
      SPIRITUAL_GROWTH: 'Spiritual Growth and Higher Purpose',
      KARMIC_LESSONS: 'Karmic Lessons and Past Life Themes',
      TRANSFORMATIVE_EVENTS: 'Transformative Events and Rebirths',
    },
  },
  COMMUNICATION_BELIEFS: {
    label: 'Communication, Learning, and Belief Systems',
    icon: '💭',
    subtopics: {
      COMMUNICATION_STYLES: 'Communication and Learning Styles',
      PHILOSOPHICAL_BELIEFS: 'Philosophical Beliefs and Personal Worldview',
      TRAVEL_EXPERIENCES: 'Travel and Cross-Cultural Experiences',
      MENTAL_GROWTH_CHALLENGES: 'Challenges to Mental Growth and Adaptability',
    },
  },
};

interface TopicSectionProps {
  topicKey: string;
  topicData: any;
  expanded: boolean;
  onToggle: () => void;
  colors: any;
}

const TopicSection: React.FC<TopicSectionProps> = ({
  topicKey,
  topicData,
  expanded,
  onToggle,
  colors,
}) => {
  const topicConfig = BROAD_TOPICS[topicKey as keyof typeof BROAD_TOPICS];

  if (!topicConfig || !topicData) {return null;}

  return (
    <View style={[styles.topicSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.topicHeader} onPress={onToggle}>
        <View style={styles.topicHeaderContent}>
          <Text style={styles.topicIcon}>{topicConfig.icon}</Text>
          <Text style={[styles.topicTitle, { color: colors.onSurface }]}>{topicData.label || topicConfig.label}</Text>
        </View>
        <Text style={[styles.expandIcon, { color: colors.primary }]}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.topicContent, { borderTopColor: colors.border }]}>
          {/* Tension Flow Analysis if available */}
          {topicData.tensionFlow && (
            <View style={[styles.tensionFlowSection, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
              <Text style={[styles.tensionFlowTitle, { color: colors.primary }]}>⚡ Energy Pattern</Text>
              <Text style={[styles.tensionFlowDescription, { color: colors.onSurface }]}>
                {topicData.tensionFlow.llmAnalysis || topicData.tensionFlow.description}
              </Text>

              <View style={styles.tensionMetrics}>
                <View style={styles.metric}>
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Support Level</Text>
                  <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                    {topicData.tensionFlow.supportDensity?.toFixed(1) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Challenge Level</Text>
                  <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                    {topicData.tensionFlow.challengeDensity?.toFixed(1) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Quadrant</Text>
                  <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                    {topicData.tensionFlow.quadrant || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Subtopics */}
          <View style={styles.subtopicsSection}>
            <Text style={[styles.subtopicsTitle, { color: colors.primary }]}>Analysis Areas</Text>
            {Object.entries(topicData.editedSubtopics || topicData.subtopics || {}).map(([subtopicKey, content]) => (
              <View key={subtopicKey} style={[styles.subtopic, { borderBottomColor: colors.border }]}>
                <Text style={[styles.subtopicTitle, { color: colors.onSurface }]}>
                  {topicConfig.subtopics[subtopicKey] || subtopicKey.replace(/_/g, ' ')}
                </Text>
                <Text style={[styles.subtopicContent, { color: colors.onSurface }]}>
                  {typeof content === 'string' ? content : 'Analysis content not available'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const AnalysisTab: React.FC<AnalysisTabProps> = ({ userId }) => {
  const { fullAnalysis, loading, loadFullAnalysis, hasAnalysisData } = useChart(userId);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const { colors } = useTheme();

  // Don't automatically load analysis - let users trigger it with the button

  const toggleTopic = (topicKey: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicKey)) {
      newExpanded.delete(topicKey);
    } else {
      newExpanded.add(topicKey);
    }
    setExpandedTopics(newExpanded);
  };

  // Simple button container for missing analysis
  const renderAnalysisButton = () => (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.missingAnalysisContainer}>
          <CompleteFullAnalysisButton userId={userId} onAnalysisComplete={loadFullAnalysis} />
        </View>
      </View>
    </ScrollView>
  );

  // Show loading state first to prevent flash of button before data loads
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading analysis...</Text>
      </View>
    );
  }

  // Show button if no analysis data available
  if (!hasAnalysisData) {
    return renderAnalysisButton();
  }

  const subtopicAnalysis = fullAnalysis?.interpretation?.SubtopicAnalysis || {};
  const availableTopics = Object.keys(subtopicAnalysis).filter(key =>
    BROAD_TOPICS[key as keyof typeof BROAD_TOPICS]
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Topics */}
        {availableTopics.map(topicKey => (
          <TopicSection
            key={topicKey}
            topicKey={topicKey}
            topicData={subtopicAnalysis[topicKey]}
            expanded={expandedTopics.has(topicKey)}
            onToggle={() => toggleTopic(topicKey)}
            colors={colors}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  topicSection: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  topicHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topicIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  expandIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  topicContent: {
    borderTopWidth: 1,
  },
  tensionFlowSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  tensionFlowTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tensionFlowDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tensionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtopicsSection: {
    padding: 16,
  },
  subtopicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  subtopic: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  subtopicTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtopicContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  noDataContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  missingAnalysisContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  missingAnalysisIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  missingAnalysisTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  missingAnalysisText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  completeAnalysisButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeAnalysisButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnalysisTab;
