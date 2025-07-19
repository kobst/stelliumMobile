import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useChart } from '../../hooks/useChart';
import { useStore } from '../../store';
import { BirthChart } from '../../types';
import PatternCard from './PatternCard';

interface PatternsTabProps {
  userId?: string;
  birthChart?: BirthChart;
}

const PatternsTab: React.FC<PatternsTabProps> = ({ userId, birthChart }) => {
  const { fullAnalysis, loading, loadFullAnalysis } = useChart(userId);
  const { userData } = useStore();

  // Load analysis on mount if not already loaded
  React.useEffect(() => {
    if (!fullAnalysis && !loading) {
      console.log('PatternsTab - Loading full analysis...');
      loadFullAnalysis();
    }
  }, [fullAnalysis, loading, loadFullAnalysis]);

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

  // Fallback UI component for missing analysis
  const renderMissingAnalysis = () => (
    <View style={styles.missingAnalysisContainer}>
      <Text style={styles.missingAnalysisIcon}>📊</Text>
      <Text style={styles.missingAnalysisTitle}>Patterns Analysis Not Available</Text>
      <Text style={styles.missingAnalysisText}>
        Complete analysis data is not available for this chart. 
      </Text>
      <TouchableOpacity style={styles.completeAnalysisButton} onPress={loadFullAnalysis}>
        <Text style={styles.completeAnalysisButtonText}>Complete Full Analysis</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading patterns analysis...</Text>
      </View>
    );
  }

  const dominanceInterpretations = getDominanceInterpretations();
  const chartData = getChartPatternData();

  // Check if we have BOTH raw data AND interpretation data
  // Only show pattern cards if we have interpretations, even if raw data exists
  const hasInterpretationData = fullAnalysis?.interpretation?.basicAnalysis?.dominance;
  const hasRawData = chartData.elements.length > 0 || chartData.modalities.length > 0;
  
  // Only display patterns if we have interpretation data (regardless of raw data availability)
  if (!hasInterpretationData) {
    return renderMissingAnalysis();
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Elements Card */}
        <PatternCard
          title="Elements"
          data={{
            elements: chartData.elements,
            interpretation: dominanceInterpretations.elements
          }}
          type="elements"
        />

        {/* Modalities Card */}
        <PatternCard
          title="Modalities"
          data={{
            modalities: chartData.modalities,
            interpretation: dominanceInterpretations.modalities
          }}
          type="modalities"
        />

        {/* Quadrants Card */}
        <PatternCard
          title="Quadrants"
          data={{
            quadrants: chartData.quadrants,
            interpretation: dominanceInterpretations.quadrants
          }}
          type="quadrants"
        />

        {/* Patterns and Structures Card */}
        <PatternCard
          title="Patterns and Structures"
          data={{
            patterns: chartData.patterns,
            interpretation: dominanceInterpretations.patterns
          }}
          type="patterns"
        />

        {/* Planetary Dominance Card */}
        <PatternCard
          title="Planetary Dominance"
          data={{
            planets: chartData.planetaryDominance,
            interpretation: dominanceInterpretations.planetary
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
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 16,
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
  noDataContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
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

export default PatternsTab;