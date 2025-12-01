import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useChart } from '../../hooks/useChart';
import { useStore } from '../../store';
import { BirthChart } from '../../types';
import PlanetCard from './PlanetCard';
import CompleteFullAnalysisButton from './CompleteFullAnalysisButton';
import { AnalysisLoadingView } from '../ui/AnalysisLoadingView';
import { useTheme } from '../../theme';
import { getPlanetGlyph } from './ChartUtils';

// Planet order based on frontend guide
const PLANET_ORDER = [
  'Sun', 'Moon', 'Ascendant', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Node', 'Midheaven',
];

interface PlanetsTabProps {
  userId?: string;
  birthChart?: BirthChart;
}

const PlanetsTab: React.FC<PlanetsTabProps> = ({ userId, birthChart }) => {
  const { fullAnalysis, loading, loadFullAnalysis, hasAnalysisData, isAnalysisInProgress, workflowState } = useChart(userId);
  const { colors } = useTheme();

  // State to track which planets are expanded
  const [expandedPlanets, setExpandedPlanets] = useState<Set<string>>(new Set());

  const togglePlanet = (planetName: string) => {
    setExpandedPlanets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planetName)) {
        newSet.delete(planetName);
      } else {
        newSet.add(planetName);
      }
      return newSet;
    });
  };

  // Get planet analysis data
  const getPlanetAnalysis = () => {
    const planets = fullAnalysis?.interpretation?.basicAnalysis?.planets || {};
    console.log('PlanetsTab - fullAnalysis:', fullAnalysis);
    console.log('PlanetsTab - planets data:', planets);
    return planets;
  };

  // Get planet tags from birth chart
  const getPlanetTags = (planetName: string): string[] => {
    if (!birthChart?.planets) return [];
    const planet = birthChart.planets.find(p => p.name === planetName);
    return planet?.tags || [];
  };

  // Don't automatically load analysis - let users trigger it with the button

  // Get planet summary for header display
  const getPlanetSummary = (planet: string, planetData: any) => {
    // Try to extract sign and house from astrologicalData or description
    if (planetData.astrologicalData) {
      try {
        const data = JSON.parse(planetData.astrologicalData);
        const position = data.positions?.find((p: any) => p.planet === planet);
        if (position) {
          return `${position.sign}${position.house ? ` in House ${position.house}` : ''}`;
        }
      } catch (e) {
        // Fallback to parsing from description
      }
    }

    // Extract from description if available
    if (planetData.description) {
      const signMatch = planetData.description.match(/in (\w+)/i);
      const houseMatch = planetData.description.match(/House (\d+)/i);
      if (signMatch) {
        const sign = signMatch[1];
        const house = houseMatch ? ` in House ${houseMatch[1]}` : '';
        return `${sign}${house}`;
      }
    }

    return '';
  };

  // Expandable Planet Section Component
  const ExpandablePlanetSection = ({ planet, planetData }: {
    planet: string;
    planetData: any;
  }) => {
    const isExpanded = expandedPlanets.has(planet);
    const summary = getPlanetSummary(planet, planetData);

    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => togglePlanet(planet)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderContent}>
            <Text style={[styles.planetGlyph, { color: colors.onSurface }]}>{getPlanetGlyph(planet)}</Text>
            <View style={styles.planetInfo}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{planet}</Text>
              {summary && (
                <Text style={[styles.planetSummary, { color: colors.onSurfaceVariant }]}>{summary}</Text>
              )}
            </View>
          </View>
          <Text style={[styles.expandIcon, { color: colors.primary }]}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.sectionContent, { borderTopColor: colors.border }]}>
            <PlanetCard
              planet={planet}
              interpretation={planetData.interpretation}
              description={planetData.description}
              astrologicalData={planetData.astrologicalData}
              tags={getPlanetTags(planet)}
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

  // Show button if no analysis data available
  if (!hasAnalysisData) {
    return renderAnalysisButton();
  }

  const planetAnalysis = getPlanetAnalysis();
  const availablePlanets = PLANET_ORDER.filter(planet =>
    planetAnalysis[planet] && planetAnalysis[planet].interpretation
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Planet Sections */}
        {availablePlanets.map(planet => (
          <ExpandablePlanetSection
            key={planet}
            planet={planet}
            planetData={planetAnalysis[planet]}
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
    marginBottom: 8,
  },
  timingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
  planetGlyph: {
    fontSize: 20,
    marginRight: 12,
  },
  planetInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  planetSummary: {
    fontSize: 13,
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    marginLeft: 8,
  },
  sectionContent: {
    borderTopWidth: 1,
  },
});

export default PlanetsTab;
