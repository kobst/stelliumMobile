import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SynastryAspect } from '../../api/relationships';
import { AspectType, PlanetName } from '../../types';
import { useTheme } from '../../theme';
import {
  getPlanetGlyph,
  getAspectColor,
  PLANET_COLORS,
} from './ChartUtils';
import { AstroIcon } from '../../../utils/astrologyIcons';

interface SynastryAspectsTableProps {
  aspects: SynastryAspect[];
  userAName: string;
  userBName: string;
}

const SynastryAspectsTable: React.FC<SynastryAspectsTableProps> = ({
  aspects,
  userAName,
  userBName,
}) => {
  const { colors } = useTheme();
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

  const renderAspectRow = (aspect: SynastryAspect, index: number) => {
    const aspectColor = getAspectColor(aspect.aspectType as AspectType);
    const planet1Color = PLANET_COLORS[aspect.planet1 as PlanetName] || colors.onSurface;
    const planet2Color = PLANET_COLORS[aspect.planet2 as PlanetName] || colors.onSurface;

    return (
      <View key={`${aspect.planet1}-${aspect.planet2}-${index}`}
            style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow, { borderBottomColor: colors.border }]}>

        {/* User A Planet Symbol */}
        <View style={styles.planetCell}>
          <AstroIcon type="planet" name={aspect.planet1 as PlanetName} size={16} color={planet1Color} />
        </View>

        {/* User A Planet Name */}
        <View style={styles.nameCell}>
          <Text style={[styles.planetName, { color: colors.onSurface }]}>{aspect.planet1}</Text>
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

        {/* User B Planet Symbol */}
        <View style={styles.planetCell}>
          <AstroIcon type="planet" name={aspect.planet2 as PlanetName} size={16} color={planet2Color} />
        </View>

        {/* User B Planet Name */}
        <View style={styles.nameCell}>
          <Text style={[styles.planetName, { color: colors.onSurface }]}>{aspect.planet2}</Text>
        </View>

        {/* Orb */}
        <View style={styles.orbCell}>
          <Text style={[styles.orb, { color: colors.onSurfaceVariant }]}>{aspect.orb?.toFixed(1)}°</Text>
        </View>
      </View>
    );
  };

  if (!aspects || aspects.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Synastry Aspects</Text>
        <View style={[styles.noDataContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>No synastry aspects found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.onSurface }]}>Synastry Aspects</Text>
      <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
        Planetary connections between {userAName} and {userBName}
      </Text>

      {/* Header */}
      <View style={[styles.row, styles.headerRow, { backgroundColor: colors.surfaceVariant }]}>
        <View style={styles.planetHeaderCell}>
          <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>{userAName.split(' ')[0]}'s Planet</Text>
        </View>
        <View style={styles.aspectSymbolCell}>
          <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>◦</Text>
        </View>
        <View style={styles.aspectNameCell}>
          <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Aspect</Text>
        </View>
        <View style={styles.planetHeaderCell}>
          <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>{userBName.split(' ')[0]}'s Planet</Text>
        </View>
        <View style={styles.orbCell}>
          <Text style={[styles.headerText, { color: colors.onSurfaceVariant }]}>Orb</Text>
        </View>
      </View>

      {/* Aspect Rows */}
      <ScrollView style={styles.scrollView}>
        {aspects.map((aspect, index) => renderAspectRow(aspect, index))}
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
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
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
    flex: 2,
    paddingHorizontal: 4,
  },
  planetHeaderCell: {
    width: 30,
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
    textAlign: 'center',
  },
  planetSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planetName: {
    fontSize: 11,
  },
  userName: {
    fontSize: 9,
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
  },
  noDataContainer: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SynastryAspectsTable;
