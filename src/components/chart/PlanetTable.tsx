import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BackendPlanet, PlanetName } from '../../types';
import { useTheme } from '../../theme';
import {
  PLANET_COLORS,
  getPlanetGlyph,
  getZodiacGlyph,
  formatDegree,
  filterPlanets,
  getZodiacPositionFromDegree,
} from './ChartUtils';
import { AstroIcon } from '../../../utils/astrologyIcons';

interface PlanetTableProps {
  planets: BackendPlanet[];
}

const PlanetTable: React.FC<PlanetTableProps> = ({ planets }) => {
  const { colors } = useTheme();
  const filteredPlanets = filterPlanets(planets);

  const renderPlanetRow = (planet: BackendPlanet, index: number) => {
    const planetColor = PLANET_COLORS[planet.name as PlanetName] || colors.onSurface;
    const { sign, position } = getZodiacPositionFromDegree(planet.full_degree);

    return (
      <View key={planet.name} style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow, { borderBottomColor: colors.border }]}>
        {/* Planet Symbol */}
        <View style={styles.symbolCell}>
          <AstroIcon type="planet" name={planet.name as PlanetName} size={18} color={planetColor} />
        </View>

        {/* Planet Name */}
        <View style={styles.nameCell}>
          <Text style={[styles.planetName, { color: colors.onSurface }]}>{planet.name}</Text>
        </View>

        {/* Degree in Sign */}
        <View style={styles.degreeCell}>
          <Text style={[styles.degree, { color: colors.onSurfaceVariant }]}>{position.toFixed(1)}°</Text>
        </View>

        {/* Sign Symbol */}
        <View style={styles.symbolCell}>
          <AstroIcon type="zodiac" name={sign} size={16} color={colors.primary} />
        </View>

        {/* Sign Name */}
        <View style={styles.signCell}>
          <Text style={[styles.signName, { color: colors.onSurfaceVariant }]}>{sign}</Text>
        </View>

        {/* House */}
        <View style={styles.houseCell}>
          <Text style={[styles.house, { color: colors.onSurfaceVariant }]}>
            {planet.house > 0 ? planet.house : '-'}
          </Text>
        </View>

        {/* Retrograde */}
        <View style={styles.retroCell}>
          <Text style={[styles.retro, { color: colors.error }]}>
            {planet.is_retro ? 'R' : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.onSurface }]}>Planetary Positions</Text>

      {/* Header */}
      <View style={[styles.row, styles.headerRow, { backgroundColor: colors.surfaceVariant }]}>
        <View style={styles.planetHeaderCell}>
          <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Planet</Text>
        </View>
        <View style={styles.degreeCell}>
          <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Degree</Text>
        </View>
        <View style={styles.signHeaderCell}>
          <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Sign</Text>
        </View>
        <View style={styles.houseCell}>
          <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>House</Text>
        </View>
        <View style={styles.retroCell}>
          <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>R</Text>
        </View>
      </View>

      {/* Planet Rows */}
      <ScrollView style={styles.scrollView}>
        {filteredPlanets.map((planet, index) => renderPlanetRow(planet, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    margin: 8,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 400,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
  },
  headerRow: {
    borderRadius: 6,
    marginBottom: 4,
    borderBottomWidth: 0,
  },
  evenRow: {
    backgroundColor: 'transparent',
  },
  oddRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  symbolCell: {
    width: 40,
    alignItems: 'center',
  },
  nameCell: {
    flex: 2,
    paddingLeft: 8,
  },
  planetHeaderCell: {
    width: 40 + 8, // symbolCell width + nameCell padding
    flex: 2,
    paddingLeft: 8,
  },
  degreeCell: {
    width: 50,
    alignItems: 'center',
  },
  signCell: {
    flex: 1.5,
    paddingLeft: 8,
  },
  signHeaderCell: {
    width: 40 + 8, // symbolCell width + signCell padding
    flex: 1.5,
    paddingLeft: 8,
  },
  houseCell: {
    width: 40,
    alignItems: 'center',
  },
  retroCell: {
    width: 25,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  planetSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planetName: {
    fontSize: 14,
    fontWeight: '500',
  },
  degree: {
    fontSize: 12,
  },
  signSymbol: {
    fontSize: 16,
  },
  signName: {
    fontSize: 12,
  },
  house: {
    fontSize: 12,
  },
  retro: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default PlanetTable;
