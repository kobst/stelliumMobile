import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useChart } from '../../hooks/useChart';

interface AnalysisTabProps {
  userId?: string;
}

// Topic definitions based on frontend guide
const BROAD_TOPICS = {
  PERSONALITY_IDENTITY: {
    label: "Self-Expression and Identity",
    icon: "🌟",
    subtopics: {
      PERSONAL_IDENTITY: "Personal Identity and Self-Image",
      OUTWARD_EXPRESSION: "Outward Expression and Appearance",
      INNER_EMOTIONAL_SELF: "Inner Self and Emotional Dynamics",
      CHALLENGES_SELF_EXPRESSION: "Challenges and Growth of Self-Expression",
    }
  },
  EMOTIONAL_FOUNDATIONS_HOME: {
    label: "Emotional Foundations and Home Life",
    icon: "🏠",
    subtopics: {
      EMOTIONAL_FOUNDATIONS: "Emotional Foundations and Security Needs",
      FAMILY_DYNAMICS: "Family Dynamics and Past Influences",
      HOME_ENVIRONMENT: "Home Environment and Preferences",
      FAMILY_CHALLENGES: "Challenges and Growth in Family Life",
    }
  },
  RELATIONSHIPS_SOCIAL: {
    label: "Relationships and Social Connections",
    icon: "💕",
    subtopics: {
      RELATIONSHIP_DESIRES: "Core Relationship Desires and Boundaries",
      LOVE_STYLE: "Love Style and Expression",
      SEXUAL_NATURE: "Sexual Nature and Intimacy",
      COMMITMENT_APPROACH: "Commitment Approach and Long-Term Vision",
      RELATIONSHIP_CHALLENGES: "Challenges and Growth in Relationships",
    }
  },
  CAREER_PURPOSE_PUBLIC_IMAGE: {
    label: "Career, Purpose, and Public Image",
    icon: "🎯",
    subtopics: {
      CAREER_MOTIVATIONS: "Career Motivations and Aspirations",
      PUBLIC_IMAGE: "Public Image Reputation and Leadership Style",
      CAREER_CHALLENGES: "Career Challenges and Opportunities",
      SKILLS_TALENTS: "Skills Talents and Strengths",
    }
  },
  UNCONSCIOUS_SPIRITUALITY: {
    label: "Unconscious Drives and Spiritual Growth",
    icon: "🔮",
    subtopics: {
      PSYCHOLOGICAL_PATTERNS: "Deep Psychological Patterns and Shadow Self",
      SPIRITUAL_GROWTH: "Spiritual Growth and Higher Purpose",
      KARMIC_LESSONS: "Karmic Lessons and Past Life Themes",
      TRANSFORMATIVE_EVENTS: "Transformative Events and Rebirths",
    }
  },
  COMMUNICATION_BELIEFS: {
    label: "Communication, Learning, and Belief Systems",
    icon: "💭",
    subtopics: {
      COMMUNICATION_STYLES: "Communication and Learning Styles",
      PHILOSOPHICAL_BELIEFS: "Philosophical Beliefs and Personal Worldview",
      TRAVEL_EXPERIENCES: "Travel and Cross-Cultural Experiences",
      MENTAL_GROWTH_CHALLENGES: "Challenges to Mental Growth and Adaptability",
    }
  },
};

interface TopicSectionProps {
  topicKey: string;
  topicData: any;
  expanded: boolean;
  onToggle: () => void;
}

const TopicSection: React.FC<TopicSectionProps> = ({ 
  topicKey, 
  topicData, 
  expanded, 
  onToggle 
}) => {
  const topicConfig = BROAD_TOPICS[topicKey as keyof typeof BROAD_TOPICS];
  
  if (!topicConfig || !topicData) return null;

  return (
    <View style={styles.topicSection}>
      <TouchableOpacity style={styles.topicHeader} onPress={onToggle}>
        <View style={styles.topicHeaderContent}>
          <Text style={styles.topicIcon}>{topicConfig.icon}</Text>
          <Text style={styles.topicTitle}>{topicData.label || topicConfig.label}</Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.topicContent}>
          {/* Tension Flow Analysis if available */}
          {topicData.tensionFlow && (
            <View style={styles.tensionFlowSection}>
              <Text style={styles.tensionFlowTitle}>⚡ Energy Pattern</Text>
              <Text style={styles.tensionFlowDescription}>
                {topicData.tensionFlow.description}
              </Text>
              
              <View style={styles.tensionMetrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Support Level</Text>
                  <Text style={styles.metricValue}>
                    {topicData.tensionFlow.supportDensity?.toFixed(1) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Challenge Level</Text>
                  <Text style={styles.metricValue}>
                    {topicData.tensionFlow.challengeDensity?.toFixed(1) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Quadrant</Text>
                  <Text style={styles.metricValue}>
                    {topicData.tensionFlow.quadrant || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Subtopics */}
          <View style={styles.subtopicsSection}>
            <Text style={styles.subtopicsTitle}>Analysis Areas</Text>
            {Object.entries(topicData.subtopics || {}).map(([subtopicKey, content]) => (
              <View key={subtopicKey} style={styles.subtopic}>
                <Text style={styles.subtopicTitle}>
                  {topicConfig.subtopics[subtopicKey] || subtopicKey.replace(/_/g, ' ')}
                </Text>
                <Text style={styles.subtopicContent}>
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
  const { fullAnalysis, loading, loadFullAnalysis } = useChart(userId);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // Load analysis on mount if not already loaded
  React.useEffect(() => {
    if (!fullAnalysis && !loading) {
      console.log('AnalysisTab - Loading full analysis...');
      loadFullAnalysis();
    }
  }, [fullAnalysis, loading, loadFullAnalysis]);

  const toggleTopic = (topicKey: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicKey)) {
      newExpanded.delete(topicKey);
    } else {
      newExpanded.add(topicKey);
    }
    setExpandedTopics(newExpanded);
  };

  // Fallback UI component for missing analysis
  const renderMissingAnalysis = () => (
    <View style={styles.missingAnalysisContainer}>
      <Text style={styles.missingAnalysisIcon}>🌍</Text>
      <Text style={styles.missingAnalysisTitle}>360° Analysis Not Available</Text>
      <Text style={styles.missingAnalysisText}>
        Complete life analysis is not available for this chart.
      </Text>
      <TouchableOpacity style={styles.completeAnalysisButton} onPress={loadFullAnalysis}>
        <Text style={styles.completeAnalysisButtonText}>Complete Full Analysis</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading 360° analysis...</Text>
      </View>
    );
  }

  const subtopicAnalysis = fullAnalysis?.interpretation?.SubtopicAnalysis || {};
  
  const availableTopics = Object.keys(subtopicAnalysis).filter(key => 
    BROAD_TOPICS[key as keyof typeof BROAD_TOPICS]
  );

  if (availableTopics.length === 0) {
    return renderMissingAnalysis();
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌍 360° Life Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Comprehensive analysis across all major life areas
          </Text>
        </View>

        {/* Topics */}
        {availableTopics.map(topicKey => (
          <TopicSection
            key={topicKey}
            topicKey={topicKey}
            topicData={subtopicAnalysis[topicKey]}
            expanded={expandedTopics.has(topicKey)}
            onToggle={() => toggleTopic(topicKey)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  topicSection: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
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
    color: '#ffffff',
    flex: 1,
  },
  expandIcon: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
  topicContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
  },
  tensionFlowSection: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  tensionFlowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 8,
  },
  tensionFlowDescription: {
    fontSize: 14,
    color: '#e2e8f0',
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
    color: '#94a3b8',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtopicsSection: {
    padding: 16,
  },
  subtopicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 12,
  },
  subtopic: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  subtopicTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtopicContent: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  noDataContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    padding: 24,
    alignItems: 'center',
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  missingAnalysisContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 32,
  },
  missingAnalysisIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  missingAnalysisTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  missingAnalysisText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  completeAnalysisButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeAnalysisButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnalysisTab;