import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CompositeChart } from '../../api/relationships';
import { PlanetName, AspectType, ZodiacSign } from '../../types';
import { useTheme } from '../../theme';
import {
  PLANET_COLORS,
  getPlanetGlyph,
  getZodiacGlyph,
  getAspectColor,
  ZODIAC_COLORS,
  filterPlanets,
} from './ChartUtils';
import { AstroIcon } from '../../../utils/astrologyIcons';

interface CompositeChartTablesProps {
  compositeChart: CompositeChart;
  showOnlyPlanets?: boolean;
  showOnlyHouses?: boolean;
  showOnlyAspects?: boolean;
}

const CompositeChartTables: React.FC<CompositeChartTablesProps> = ({
  compositeChart,
  showOnlyPlanets = false,
  showOnlyHouses = false,
  showOnlyAspects = false,
}) => {
  const { colors } = useTheme();
  // Convert composite chart planets to BackendPlanet format for filtering
  const convertedPlanets = compositeChart.planets.map(planet => ({
    name: planet.name,
    full_degree: planet.full_degree,
    norm_degree: planet.norm_degree,
    sign: planet.sign,
    house: planet.house,
    is_retro: false, // Composite charts don't have retrograde planets
  }));

  const filteredPlanets = filterPlanets(convertedPlanets);

  const getAspectName = (aspectType: string): string => {
    const aspectNames: { [key: string]: string } = {
      conjunction: 'Conjunction',
      opposition: 'Opposition',
      trine: 'Trine',
      square: 'Square',
      sextile: 'Sextile',
      quincunx: 'Quincunx',
      semisextile: 'Semi-sextile',
      semisquare: 'Semi-square',
      sesquiquadrate: 'Sesquiquadrate',
    };
    return aspectNames[aspectType] || aspectType;
  };

  const getAspectSymbol = (aspectType: string): string => {
    const aspectSymbols: { [key: string]: string } = {
      conjunction: '☌',
      opposition: '☍',
      trine: '△',
      square: '□',
      sextile: '⚹',
      quincunx: '⚻',
      semisextile: '⚺',
      semisquare: '∠',
      sesquiquadrate: '⚼',
    };
    return aspectSymbols[aspectType] || '◦';
  };

  // Planet Table
  const renderPlanetTable = () => {
    const renderPlanetRow = (planet: any, index: number) => {
      const position = planet.norm_degree;

      return (
        <View
          key={planet.name}
          style={[
            styles.row,
            index % 2 === 0 ? styles.evenRow : styles.oddRow,
            { borderBottomColor: colors.strokeSubtle },
          ]}
          accessibilityRole="listitem"
          accessibilityLabel={`${planet.name} at ${position.toFixed(1)} degrees ${planet.sign} in house ${planet.house}`}
        >
          {/* Planet Symbol */}
          <View style={styles.symbolCell}>
            <AstroIcon type="planet" name={planet.name as PlanetName} size={18} color={colors.onSurfaceVariant} />
          </View>

          {/* Planet Name */}
          <View style={styles.nameCell}>
            <Text style={[styles.planetName, { color: colors.onSurface }]}>{planet.name}</Text>
          </View>

          {/* Degree in Sign */}
          <View style={styles.degreeCell}>
            <Text style={[styles.degree, { color: colors.onSurface, fontFamily: 'monospace' }]}>{position.toFixed(1)}°</Text>
          </View>

          {/* Sign Symbol */}
          <View style={styles.symbolCell}>
            <AstroIcon type="zodiac" name={planet.sign as ZodiacSign} size={16} color={colors.primary} />
          </View>

          {/* Sign Name */}
          <View style={styles.signCell}>
            <Text style={[styles.signName, { color: colors.onSurface }]}>{planet.sign}</Text>
          </View>

          {/* House */}
          <View style={styles.houseCell}>
            <Text style={[styles.house, { color: colors.onSurfaceVariant }]}>
              {planet.house > 0 ? planet.house : '-'}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <View style={[styles.tableContainer, { backgroundColor: colors.surfaceCard, borderColor: colors.strokeSubtle }]}>
        <Text style={[styles.tableTitle, { color: colors.onSurfaceHigh }]}>Composite Planetary Positions</Text>

        {/* Header */}
        <View style={[styles.row, styles.headerRow, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.strokeSubtle }]}>
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
        </View>

        {/* Planet Rows */}
        <ScrollView
          style={styles.scrollView}
          accessibilityRole="list"
          accessibilityLabel="Composite planetary positions"
        >
          {filteredPlanets.map((planet, index) => renderPlanetRow(planet, index))}
        </ScrollView>
      </View>
    );
  };

  // House Table
  const renderHouseTable = () => {
    const renderHouseRow = (house: any, index: number) => {
      const position = house.degree % 360; // Normalize degree
      const signPosition = position % 30; // Position within sign

      return (
        <View key={house.house} style={[
          styles.row,
          index % 2 === 0 ? styles.evenRow : styles.oddRow,
          { borderBottomColor: colors.strokeSubtle },
        ]}>
          {/* House Number */}
          <View style={styles.houseNumberCell}>
            <Text style={[styles.houseNumber, { color: colors.onSurface }]}>{house.house}</Text>
          </View>

          {/* Sign (Symbol + Name combined) */}
          <View style={styles.houseSignCell}>
            {house.sign ? (
              <AstroIcon type="zodiac" name={house.sign as ZodiacSign} size={20} color={colors.primary} />
            ) : (
              <Text style={[styles.signSymbol, { color: colors.primary }]}>-</Text>
            )}
            <Text style={[styles.signName, { color: colors.onSurface, marginLeft: 8 }]}>{house.sign || 'Unknown'}</Text>
          </View>

          {/* Degree */}
          <View style={styles.degreeCell}>
            <Text style={[styles.degree, { color: colors.onSurface, fontFamily: 'monospace' }]}>{signPosition.toFixed(1)}°</Text>
          </View>
        </View>
      );
    };

    return (
      <View style={[styles.tableContainer, { backgroundColor: colors.surfaceCard, borderColor: colors.strokeSubtle }]}>
        <Text style={[styles.tableTitle, { color: colors.onSurfaceHigh }]}>Composite House Positions</Text>

        {/* Header */}
        <View style={[styles.row, styles.headerRow, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.strokeSubtle }]}>
          <View style={styles.houseNumberCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>House</Text>
          </View>
          <View style={styles.houseSignHeaderCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Sign</Text>
          </View>
          <View style={styles.degreeCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Degree</Text>
          </View>
        </View>

        {/* House Rows */}
        <ScrollView style={styles.scrollView}>
          {compositeChart.houses.map((house, index) => renderHouseRow(house, index))}
        </ScrollView>
      </View>
    );
  };

  // Aspects Table
  const renderAspectsTable = () => {
    const renderAspectRow = (aspect: any, index: number) => {
      const aspectColor = getAspectColor(aspect.aspectType as AspectType);

      return (
        <View key={`${aspect.aspectingPlanet}-${aspect.aspectedPlanet}-${index}`}
              style={[
                styles.row,
                index % 2 === 0 ? styles.evenRow : styles.oddRow,
                { borderBottomColor: colors.strokeSubtle },
              ]}>

          {/* First Planet Symbol */}
          <View style={styles.planetCell}>
            <AstroIcon type="planet" name={aspect.aspectingPlanet as PlanetName} size={16} color={colors.onSurfaceVariant} />
          </View>

          {/* First Planet Name */}
          <View style={styles.nameCell}>
            <Text style={[styles.planetName, { color: colors.onSurface }]}>{aspect.aspectingPlanet}</Text>
          </View>

          {/* Aspect Symbol */}
          <View style={styles.aspectSymbolCell}>
            <Text style={[styles.aspectSymbol, { color: aspectColor }]}>
              {getAspectSymbol(aspect.aspectType)}
            </Text>
          </View>

          {/* Aspect Name */}
          <View style={styles.aspectNameCell}>
            <Text style={[styles.aspectName, { color: aspectColor }]}>
              {getAspectName(aspect.aspectType)}
            </Text>
          </View>

          {/* Second Planet Symbol */}
          <View style={styles.planetCell}>
            <AstroIcon type="planet" name={aspect.aspectedPlanet as PlanetName} size={16} color={colors.onSurfaceVariant} />
          </View>

          {/* Second Planet Name */}
          <View style={styles.nameCell}>
            <Text style={[styles.planetName, { color: colors.onSurface }]}>{aspect.aspectedPlanet}</Text>
          </View>

          {/* Orb */}
          <View style={styles.orbCell}>
            <Text style={[styles.orb, { color: colors.onSurfaceVariant, fontFamily: 'monospace' }]}>{aspect.orb?.toFixed(1)}°</Text>
          </View>
        </View>
      );
    };

    return (
      <View style={[styles.tableContainer, { backgroundColor: colors.surfaceCard, borderColor: colors.strokeSubtle }]}>
        <Text style={[styles.tableTitle, { color: colors.onSurfaceHigh }]}>Composite Aspects</Text>

        {/* Header */}
        <View style={[styles.row, styles.headerRow, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.strokeSubtle }]}>
          <View style={styles.aspectPlanetHeaderCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Planet</Text>
          </View>
          <View style={styles.aspectSymbolCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>◦</Text>
          </View>
          <View style={styles.aspectNameCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Aspect</Text>
          </View>
          <View style={styles.aspectPlanetHeaderCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Planet</Text>
          </View>
          <View style={styles.orbCell}>
            <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Orb</Text>
          </View>
        </View>

        {/* Aspect Rows */}
        <ScrollView style={styles.scrollView}>
          {compositeChart.aspects.map((aspect, index) => renderAspectRow(aspect, index))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showOnlyPlanets && renderPlanetTable()}
      {showOnlyHouses && renderHouseTable()}
      {showOnlyAspects && renderAspectsTable()}
      {!showOnlyPlanets && !showOnlyHouses && !showOnlyAspects && (
        <>
          {renderPlanetTable()}
          {renderHouseTable()}
          {renderAspectsTable()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  tableContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  tableTitle: {
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
    borderBottomWidth: 1,
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
    width: 40 + 8,
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
    width: 40 + 8,
    flex: 1.5,
    paddingLeft: 8,
  },
  houseCell: {
    width: 40,
    alignItems: 'center',
  },
  houseNumberCell: {
    width: 60,
    alignItems: 'center',
  },
  houseSignCell: {
    flexDirection: 'row',
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseSignHeaderCell: {
    width: 40 + 8,
    flex: 1.5,
    alignItems: 'center',
  },
  planetCell: {
    width: 30,
    alignItems: 'center',
  },
  aspectPlanetHeaderCell: {
    width: 30,
    flex: 2,
    paddingLeft: 8,
  },
  aspectSymbolCell: {
    width: 25,
    alignItems: 'center',
  },
  aspectNameCell: {
    flex: 2.5,
    paddingHorizontal: 4,
  },
  orbCell: {
    width: 45,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
  planetSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planetName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  degree: {
    fontSize: 11,
    color: '#e2e8f0',
  },
  signSymbol: {
    fontSize: 16,
    color: '#8b5cf6',
  },
  signName: {
    fontSize: 11,
    color: '#e2e8f0',
  },
  house: {
    fontSize: 11,
    color: '#94a3b8',
  },
  houseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  aspectSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  aspectName: {
    fontSize: 10,
    fontWeight: '500',
  },
  orb: {
    fontSize: 10,
    color: '#94a3b8',
  },
});

export default CompositeChartTables;
