import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useChart } from '../../hooks/useChart';
import PlanetCard from './PlanetCard';

// Planet order based on frontend guide
const PLANET_ORDER = [
  'Sun', 'Moon', 'Ascendant', 'Mercury', 'Venus', 'Mars', 
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Node', 'Midheaven'
];

const PlanetsTab: React.FC = () => {
  const { fullAnalysis, loading, loadFullAnalysis } = useChart();

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
        {availablePlanets.length > 0 ? (
          availablePlanets.map(planet => (
            <PlanetCard
              key={planet}
              planet={planet}
              interpretation={planetAnalysis[planet]?.interpretation}
              description={planetAnalysis[planet]?.description}
              astrologicalData={planetAnalysis[planet]?.astrologicalData}
            />
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataTitle}>Planetary Analysis Not Available</Text>
            <Text style={styles.noDataText}>
              Detailed planetary interpretations will appear here once the complete birth chart analysis is ready.
            </Text>
            
            {/* Show all planets even without analysis */}
            <View style={styles.placeholderPlanets}>
              <Text style={styles.placeholderTitle}>Planets in your chart:</Text>
              <View style={styles.planetGrid}>
                {PLANET_ORDER.map(planet => (
                  <PlanetCard
                    key={planet}
                    planet={planet}
                    interpretation={undefined}
                    description={undefined}
                  />
                ))}
              </View>
            </View>
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
});

export default PlanetsTab;