import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useChart } from '../../hooks/useChart';
import { BirthChart } from '../../types';
import PlanetCard from './PlanetCard';
import CompleteFullAnalysisButton from './CompleteFullAnalysisButton';
import { useTheme } from '../../theme';

// Planet order based on frontend guide
const PLANET_ORDER = [
  'Sun', 'Moon', 'Ascendant', 'Mercury', 'Venus', 'Mars', 
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Node', 'Midheaven'
];

interface PlanetsTabProps {
  userId?: string;
  birthChart?: BirthChart;
}

const PlanetsTab: React.FC<PlanetsTabProps> = ({ userId, birthChart }) => {
  const { fullAnalysis, loading, loadFullAnalysis } = useChart(userId);
  const { colors } = useTheme();

  // Get planet analysis data
  const getPlanetAnalysis = () => {
    const planets = fullAnalysis?.interpretation?.basicAnalysis?.planets || {};
    console.log('PlanetsTab - fullAnalysis:', fullAnalysis);
    console.log('PlanetsTab - planets data:', planets);
    return planets;
  };

  // Load analysis on mount if not already loaded
  React.useEffect(() => {
    if (!fullAnalysis && !loading) {
      console.log('PlanetsTab - Loading full analysis...');
      loadFullAnalysis();
    }
  }, [fullAnalysis, loading, loadFullAnalysis]);

  // Fallback UI component for missing analysis
  const renderMissingAnalysis = () => (
    <View style={[styles.missingAnalysisContainer, { backgroundColor: colors.background }]}>
      <Text style={styles.missingAnalysisIcon}>🪐</Text>
      <Text style={[styles.missingAnalysisTitle, { color: colors.onBackground }]}>Planetary Analysis Not Available</Text>
      <Text style={[styles.missingAnalysisText, { color: colors.onSurfaceVariant }]}>
        Complete planetary analysis is not available for this chart.
      </Text>
      <CompleteFullAnalysisButton userId={userId} onAnalysisComplete={loadFullAnalysis} />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading planetary analysis...</Text>
      </View>
    );
  }

  const planetAnalysis = getPlanetAnalysis();
  const availablePlanets = PLANET_ORDER.filter(planet => 
    planetAnalysis[planet] && planetAnalysis[planet].interpretation
  );

  // Only show planet cards if we have interpretation data
  // If no planets have interpretations, show the "Complete Full Analysis" screen
  if (availablePlanets.length === 0) {
    return renderMissingAnalysis();
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>🪐 Planetary Analysis</Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            Detailed interpretations for each planet in your birth chart
          </Text>
        </View>

        {/* Planet Cards */}
        {availablePlanets.map(planet => (
            <PlanetCard
              key={planet}
              planet={planet}
              interpretation={planetAnalysis[planet]?.interpretation}
              description={planetAnalysis[planet]?.description}
              astrologicalData={planetAnalysis[planet]?.astrologicalData}
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
    marginBottom: 24,
  },
  placeholderPlanets: {
    width: '100%',
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  planetGrid: {
    gap: 8,
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

export default PlanetsTab;