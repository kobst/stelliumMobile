import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useChart } from '../../hooks/useChart';
import { BirthChart } from '../../types';
import PlanetCard from './PlanetCard';

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
    <View style={styles.missingAnalysisContainer}>
      <Text style={styles.missingAnalysisIcon}>🪐</Text>
      <Text style={styles.missingAnalysisTitle}>Planetary Analysis Not Available</Text>
      <Text style={styles.missingAnalysisText}>
        Complete planetary analysis is not available for this chart.
      </Text>
      <TouchableOpacity style={styles.completeAnalysisButton} onPress={loadFullAnalysis}>
        <Text style={styles.completeAnalysisButtonText}>Complete Full Analysis</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading planetary analysis...</Text>
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🪐 Planetary Analysis</Text>
          <Text style={styles.headerSubtitle}>
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
    marginBottom: 24,
  },
  placeholderPlanets: {
    width: '100%',
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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

export default PlanetsTab;