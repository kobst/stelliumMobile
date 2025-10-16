import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useChart } from '../../hooks/useChart';
import { useStore } from '../../store';
import { BirthChart } from '../../types';
import PatternCard from './PatternCard';
import CompleteFullAnalysisButton from './CompleteFullAnalysisButton';
import { AnalysisLoadingView } from '../ui/AnalysisLoadingView';
import { useTheme } from '../../theme';

interface PatternsTabProps {
  userId?: string;
  birthChart?: BirthChart;
}

const PatternsTab: React.FC<PatternsTabProps> = ({ userId, birthChart }) => {
  const { fullAnalysis, loading, loadFullAnalysis, hasAnalysisData, isAnalysisInProgress, workflowState } = useChart(userId);
  const { userData, creationWorkflowState } = useStore();
  const { colors } = useTheme();

  // State to track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  // Don't automatically load analysis - let users trigger it with the button

  // Get dominance interpretations from the analysis response
  const getDominanceInterpretations = () => {
    const basicAnalysis = fullAnalysis?.interpretation?.basicAnalysis || {};
    // Based on the API response, dominance interpretations are directly in basicAnalysis.dominance
    return {
      elements: basicAnalysis.dominance?.elements?.interpretation || '',
      modalities: basicAnalysis.dominance?.modalities?.interpretation || '',
      quadrants: basicAnalysis.dominance?.quadrants?.interpretation || '',
      patterns: basicAnalysis.dominance?.pattern?.interpretation || '', // Note: API uses "pattern" not "patterns"
      planetary: basicAnalysis.dominance?.planetary?.interpretation || '',
    };
  };

  // Parse the actual API response format for dominance data
  const parseElementsData = (basicAnalysis: any) => {
    const descriptions = basicAnalysis.dominance?.elements?.descriptions || [];
    return descriptions.map((desc: string) => {
      // Parse descriptions like "Fire is extremely dominant with Mercury, Sun, Pluto, Ascendant (42.9% of the chart, 9 points)"
      const match = desc.match(/^(\w+).*?(\d+\.?\d*)%/);
      if (match) {
        const [, name, percentage] = match;
        return { name, percentage: parseFloat(percentage) };
      }
      return null;
    }).filter(Boolean);
  };

  const parseModalitiesData = (basicAnalysis: any) => {
    const descriptions = basicAnalysis.dominance?.modalities?.descriptions || [];
    return descriptions.map((desc: string) => {
      const match = desc.match(/^(\w+).*?(\d+\.?\d*)%/);
      if (match) {
        const [, name, percentage] = match;
        return { name, percentage: parseFloat(percentage) };
      }
      return null;
    }).filter(Boolean);
  };

  const parseQuadrantsData = (basicAnalysis: any) => {
    const descriptions = basicAnalysis.dominance?.quadrants?.descriptions || [];
    return descriptions.map((desc: string) => {
      const match = desc.match(/^(\w+).*?(\d+\.?\d*)%/);
      if (match) {
        const [, name, percentage] = match;
        return { name, percentage: parseFloat(percentage) };
      }
      return null;
    }).filter(Boolean);
  };

  const parsePlanetaryData = (basicAnalysis: any) => {
    const descriptions = basicAnalysis.dominance?.planetary?.descriptions || [];
    // Skip the first description which is just a summary
    return descriptions.slice(1).map((desc: string) => {
      const match = desc.match(/^\d+\.\s+(\w+).*?(\d+\.?\d*)% dominance/);
      if (match) {
        const [, name, percentage] = match;
        return { name, percentage: parseFloat(percentage) };
      }
      return null;
    }).filter(Boolean);
  };

  // Get chart pattern data from the selected subject's birth chart
  const getChartPatternData = () => {
    // Use the passed birthChart prop or fall back to userData.birthChart
    const chartData = birthChart || userData?.birthChart;

    return {
      // Use the correct nested structure from the API response
      elements: Array.isArray(chartData?.elements?.elements) ? chartData.elements.elements : [],
      modalities: Array.isArray(chartData?.modalities?.modalities) ? chartData.modalities.modalities : [],
      quadrants: Array.isArray(chartData?.quadrants?.quadrants) ? chartData.quadrants.quadrants : [],
      patterns: chartData?.patterns || { patterns: [] },
      planetaryDominance: Array.isArray(chartData?.planetaryDominance?.planets) ? chartData.planetaryDominance.planets : [],
    };
  };

  // Expandable Pattern Section Component
  const ExpandablePatternSection = ({ title, data, type }: {
    title: string;
    data: any;
    type: string;
  }) => {
    const isExpanded = expandedSections.has(type);

    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(type)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderContent}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{title}</Text>
          </View>
          <Text style={[styles.expandIcon, { color: colors.primary }]}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.sectionContent, { borderTopColor: colors.border }]}>
            <PatternCard
              title={title}
              data={data}
              type={type as any}
              hideHeader={true}
            />
          </View>
        )}
      </View>
    );
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

  // Show loading state when analysis is in progress
  if (isAnalysisInProgress) {
    return <AnalysisLoadingView isAnalysisInProgress={isAnalysisInProgress} workflowState={workflowState} />;
  }

  const dominanceInterpretations = getDominanceInterpretations();
  const chartData = getChartPatternData();

  // Check if we have BOTH raw data AND interpretation data
  // Show button if no analysis data available
  if (!hasAnalysisData) {
    return renderAnalysisButton();
  }

  const hasRawData = chartData.elements.length > 0 || chartData.modalities.length > 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Elements Section */}
        <ExpandablePatternSection
          title="Elements"
          data={{
            elements: chartData.elements,
            interpretation: dominanceInterpretations.elements,
          }}
          type="elements"
        />

        {/* Modalities Section */}
        <ExpandablePatternSection
          title="Modalities"
          data={{
            modalities: chartData.modalities,
            interpretation: dominanceInterpretations.modalities,
          }}
          type="modalities"
        />

        {/* Quadrants Section */}
        <ExpandablePatternSection
          title="Quadrants"
          data={{
            quadrants: chartData.quadrants,
            interpretation: dominanceInterpretations.quadrants,
          }}
          type="quadrants"
        />

        {/* Patterns and Structures Section */}
        <ExpandablePatternSection
          title="Patterns and Structures"
          data={{
            patterns: chartData.patterns,
            interpretation: dominanceInterpretations.patterns,
          }}
          type="patterns"
        />

        {/* Planetary Dominance Section */}
        <ExpandablePatternSection
          title="Planetary Dominance"
          data={{
            planets: chartData.planetaryDominance,
            interpretation: dominanceInterpretations.planetary,
          }}
          type="planetary"
        />

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
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
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
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noDataContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
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
  sectionContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 12,
    marginLeft: 8,
  },
  sectionContent: {
    borderTopWidth: 1,
  },
});

export default PatternsTab;
