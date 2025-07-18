import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useChart } from '../../hooks/useChart';
import { useStore } from '../../store';
import PatternCard from './PatternCard';

const PatternsTab: React.FC = () => {
  const { fullAnalysis, loading } = useChart();
  const { userData } = useStore();

  // Get dominance interpretations from the analysis response
  const getDominanceInterpretations = () => {
    const basicAnalysis = fullAnalysis?.interpretation?.basicAnalysis || {};
    // Based on the API response, dominance interpretations are directly in basicAnalysis.dominance
    return {
      elements: basicAnalysis.dominance?.elements?.interpretation || '',
      modalities: basicAnalysis.dominance?.modalities?.interpretation || '',
      quadrants: basicAnalysis.dominance?.quadrants?.interpretation || '',
      patterns: basicAnalysis.dominance?.pattern?.interpretation || '',
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

  // Get chart pattern data from the birth chart response in userData
  const getChartPatternData = () => {
    // Pattern data comes from the birthChart in userData, not from the analysis
    const birthChart = userData?.birthChart;

    return {
      // Use the correct nested structure from the API response
      elements: Array.isArray(birthChart?.elements?.elements) ? birthChart.elements.elements : [],
      modalities: Array.isArray(birthChart?.modalities?.modalities) ? birthChart.modalities.modalities : [],
      quadrants: Array.isArray(birthChart?.quadrants?.quadrants) ? birthChart.quadrants.quadrants : [],
      patterns: birthChart?.patterns || { patterns: [] },
      planetaryDominance: Array.isArray(birthChart?.planetaryDominance?.planets) ? birthChart.planetaryDominance.planets : [],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading patterns analysis...</Text>
      </View>
    );
  }

  const dominanceInterpretations = getDominanceInterpretations();
  const chartData = getChartPatternData();

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

        {/* Show message if no analysis data available */}
        {!fullAnalysis && !loading && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataTitle}>Analysis Not Available</Text>
            <Text style={styles.noDataText}>
              Complete birth chart analysis data is not yet available. The patterns will appear here once the analysis is complete.
            </Text>
          </View>
        )}
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
});

export default PatternsTab;