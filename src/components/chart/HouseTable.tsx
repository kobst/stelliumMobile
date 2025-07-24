import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BackendHouse, ZodiacSign } from '../../types';
import {
  getZodiacGlyph,
  getZodiacPositionFromDegree,
  ZODIAC_COLORS,
} from './ChartUtils';
import { useTheme } from '../../theme/useTheme';

interface HouseTableProps {
  houses: BackendHouse[];
}

const HouseTable: React.FC<HouseTableProps> = ({ houses }) => {
  const { colors } = useTheme();
  // Check if birth time is unknown (houses will have NaN degrees)
  const hasValidHouses = houses.some(house => !isNaN(house.degree));

  const renderHouseRow = (house: BackendHouse, index: number) => {
    if (isNaN(house.degree)) {return null;}

    const { position } = getZodiacPositionFromDegree(house.degree);
    const signColor = ZODIAC_COLORS[house.sign as ZodiacSign] || '#8b5cf6';

    return (
      <View key={house.house} style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow, { borderBottomColor: colors.border }]}>
        {/* House Number */}
        <View style={styles.houseCell}>
          <Text style={[styles.houseNumber, { color: colors.text }]}>{house.house}</Text>
        </View>

        {/* Sign Symbol */}
        <View style={styles.symbolCell}>
          <Text style={[styles.signSymbol, { color: signColor }]}>
            {house.sign ? getZodiacGlyph(house.sign as ZodiacSign) : '-'}
          </Text>
        </View>

        {/* Sign Name */}
        <View style={styles.signCell}>
          <Text style={[styles.signName, { color: colors.text }]}>{house.sign || 'Unknown'}</Text>
        </View>

        {/* Degree */}
        <View style={styles.degreeCell}>
          <Text style={[styles.degree, { color: colors.textSecondary }]}>{position.toFixed(1)}°</Text>
        </View>
      </View>
    );
  };

  if (!hasValidHouses) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>House Positions</Text>
        <View style={[styles.noDataContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            House data not available{'\n'}
            (Unknown birth time)
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>House Positions</Text>

      {/* Header */}
      <View style={[styles.row, styles.headerRow, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.houseCell}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>House</Text>
        </View>
        <View style={styles.symbolCell}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>♈</Text>
        </View>
        <View style={styles.signCell}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>Sign</Text>
        </View>
        <View style={styles.degreeCell}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>Degree</Text>
        </View>
      </View>

      {/* House Rows */}
      <ScrollView style={styles.scrollView}>
        {houses
          .filter(house => !isNaN(house.degree))
          .map((house, index) => renderHouseRow(house, index))}
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
    maxHeight: 300,
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
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
  },
  houseCell: {
    width: 60,
    alignItems: 'center',
  },
  symbolCell: {
    width: 50,
    alignItems: 'center',
  },
  signCell: {
    flex: 2,
    paddingLeft: 8,
  },
  degreeCell: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  houseNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  signSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  signName: {
    fontSize: 14,
  },
  degree: {
    fontSize: 12,
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
    lineHeight: 20,
  },
});

export default HouseTable;
