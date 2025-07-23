import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BackendAspect, AspectType, PlanetName } from '../../types';
import {
  getPlanetGlyph,
  getAspectColor,
  PLANET_COLORS,
} from './ChartUtils';

interface AspectTableProps {
  aspects: BackendAspect[];
}

const AspectTable: React.FC<AspectTableProps> = ({ aspects }) => {
  // Filter out aspects with excluded planets
  const filteredAspects = aspects.filter(aspect => {
    const excludedPlanets = ['South Node', 'Part of Fortune', 'Chiron'];
    return !excludedPlanets.includes(aspect.aspectedPlanet) &&
           !excludedPlanets.includes(aspect.aspectingPlanet);
  });

  const getAspectName = (aspectType: AspectType): string => {
    const aspectNames = {
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

  const getAspectSymbol = (aspectType: AspectType): string => {
    const aspectSymbols = {
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

  const renderAspectRow = (aspect: BackendAspect, index: number) => {
    const aspectColor = getAspectColor(aspect.aspectType);
    const planet1Color = PLANET_COLORS[aspect.aspectedPlanet as PlanetName] || '#ffffff';
    const planet2Color = PLANET_COLORS[aspect.aspectingPlanet as PlanetName] || '#ffffff';

    return (
      <View key={`${aspect.aspectedPlanet}-${aspect.aspectingPlanet}-${index}`}
            style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>

        {/* First Planet Symbol */}
        <View style={styles.planetCell}>
          <Text style={[styles.planetSymbol, { color: planet1Color }]}>
            {getPlanetGlyph(aspect.aspectedPlanet as PlanetName)}
          </Text>
        </View>

        {/* First Planet Name */}
        <View style={styles.nameCell}>
          <Text style={styles.planetName}>{aspect.aspectedPlanet}</Text>
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
          <Text style={[styles.planetSymbol, { color: planet2Color }]}>
            {getPlanetGlyph(aspect.aspectingPlanet as PlanetName)}
          </Text>
        </View>

        {/* Second Planet Name */}
        <View style={styles.nameCell}>
          <Text style={styles.planetName}>{aspect.aspectingPlanet}</Text>
        </View>

        {/* Orb */}
        <View style={styles.orbCell}>
          <Text style={styles.orb}>{aspect.orb.toFixed(1)}°</Text>
        </View>
      </View>
    );
  };

  if (filteredAspects.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Aspects</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No aspects found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aspects</Text>

      {/* Header */}
      <View style={[styles.row, styles.headerRow]}>
        <View style={styles.planetCell}>
          <Text style={styles.headerText}>☽</Text>
        </View>
        <View style={styles.nameCell}>
          <Text style={styles.headerText}>Planet</Text>
        </View>
        <View style={styles.aspectSymbolCell}>
          <Text style={styles.headerText}>◦</Text>
        </View>
        <View style={styles.aspectNameCell}>
          <Text style={styles.headerText}>Aspect</Text>
        </View>
        <View style={styles.planetCell}>
          <Text style={styles.headerText}>☉</Text>
        </View>
        <View style={styles.nameCell}>
          <Text style={styles.headerText}>Planet</Text>
        </View>
        <View style={styles.orbCell}>
          <Text style={styles.headerText}>Orb</Text>
        </View>
      </View>

      {/* Aspect Rows */}
      <ScrollView style={styles.scrollView}>
        {filteredAspects.map((aspect, index) => renderAspectRow(aspect, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 400,
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
    backgroundColor: '#374151',
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
    flex: 2,
    paddingHorizontal: 4,
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
    fontSize: 11,
    color: '#e2e8f0',
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
  noDataContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default AspectTable;
