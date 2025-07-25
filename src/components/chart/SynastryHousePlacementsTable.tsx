import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PlanetName, ZodiacSign } from '../../types';
import { useTheme } from '../../theme';
import {
  PLANET_COLORS,
  getPlanetGlyph,
  getZodiacGlyph,
} from './ChartUtils';

interface SynastryHousePlacementsTableProps {
  synastryHousePlacements: {
    AinB: Array<{
      planet: string;
      planetDegree: number;
      planetSign: string;
      house: number;
      direction: string;
    }>;
    BinA: Array<{
      planet: string;
      planetDegree: number;
      planetSign: string;
      house: number;
      direction: string;
    }>;
  };
  userAName: string;
  userBName: string;
}

const SynastryHousePlacementsTable: React.FC<SynastryHousePlacementsTableProps> = ({
  synastryHousePlacements,
  userAName,
  userBName,
}) => {
  const { colors } = useTheme();

  const renderPlacementRow = (placement: any, index: number, isAinB: boolean) => {
    const planetColor = PLANET_COLORS[placement.planet as PlanetName] || colors.onSurface;
    const position = placement.planetDegree % 30; // Position within sign
    const sourceUser = isAinB ? userAName : userBName;
    const targetUser = isAinB ? userBName : userAName;

    return (
      <View key={`${placement.planet}-${placement.house}-${index}`}
            style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>

        {/* Planet Symbol */}
        <View style={styles.planetCell}>
          <Text style={[styles.planetSymbol, { color: planetColor }]}>
            {getPlanetGlyph(placement.planet as PlanetName)}
          </Text>
        </View>

        {/* Planet Name */}
        <View style={styles.nameCell}>
          <Text style={[styles.planetName, { color: colors.onSurface }]}>{placement.planet}</Text>
        </View>

        {/* Degree */}
        <View style={styles.degreeCell}>
          <Text style={[styles.degree, { color: colors.onSurface }]}>{position.toFixed(1)}°</Text>
        </View>

        {/* Sign Symbol */}
        <View style={styles.symbolCell}>
          <Text style={[styles.signSymbol, { color: colors.primary }]}>
            {getZodiacGlyph(placement.planetSign as ZodiacSign)}
          </Text>
        </View>

        {/* Sign Name */}
        <View style={styles.signCell}>
          <Text style={[styles.signName, { color: colors.onSurface }]}>{placement.planetSign}</Text>
        </View>

        {/* House */}
        <View style={styles.houseCell}>
          <Text style={[styles.house, { color: colors.onSurfaceVariant }]}>{placement.house}</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionCell}>
          <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
            {sourceUser}'s {placement.planet} in {targetUser}'s {placement.house}H
          </Text>
        </View>
      </View>
    );
  };

  const renderSection = (placements: any[], title: string, isAinB: boolean) => {
    if (!placements || placements.length === 0) {return null;}

    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{title}</Text>

        {/* Header */}
        <View style={[styles.row, styles.headerRow, { backgroundColor: colors.surfaceVariant }]}>
          <View style={styles.planetCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>☽</Text>
          </View>
          <View style={styles.nameCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Planet</Text>
          </View>
          <View style={styles.degreeCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Degree</Text>
          </View>
          <View style={styles.symbolCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>♈</Text>
          </View>
          <View style={styles.signCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Sign</Text>
          </View>
          <View style={styles.houseCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>House</Text>
          </View>
          <View style={styles.descriptionCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Placement</Text>
          </View>
        </View>

        {/* Placement Rows */}
        <ScrollView style={styles.scrollView} nestedScrollEnabled>
          {placements.map((placement, index) => renderPlacementRow(placement, index, isAinB))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderSection(
        synastryHousePlacements.AinB,
        `${userAName}'s Planets in ${userBName}'s Houses`,
        true
      )}
      {renderSection(
        synastryHousePlacements.BinA,
        `${userBName}'s Planets in ${userAName}'s Houses`,
        false
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 300,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#334155',
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
  planetCell: {
    width: 30,
    alignItems: 'center',
  },
  nameCell: {
    width: 60,
    paddingLeft: 4,
  },
  degreeCell: {
    width: 45,
    alignItems: 'center',
  },
  symbolCell: {
    width: 30,
    alignItems: 'center',
  },
  signCell: {
    width: 60,
    paddingLeft: 4,
  },
  houseCell: {
    width: 40,
    alignItems: 'center',
  },
  descriptionCell: {
    flex: 1,
    paddingLeft: 8,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  planetSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  planetName: {
    fontSize: 11,
    fontWeight: '500',
  },
  degree: {
    fontSize: 10,
  },
  signSymbol: {
    fontSize: 14,
  },
  signName: {
    fontSize: 10,
  },
  house: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 10,
    fontStyle: 'italic',
  },
});

export default SynastryHousePlacementsTable;
