import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BackendHouse, ZodiacSign } from '../../types';
import { 
  getZodiacGlyph, 
  getZodiacPositionFromDegree,
  ZODIAC_COLORS
} from './ChartUtils';

interface HouseTableProps {
  houses: BackendHouse[];
}

const HouseTable: React.FC<HouseTableProps> = ({ houses }) => {
  // Check if birth time is unknown (houses will have NaN degrees)
  const hasValidHouses = houses.some(house => !isNaN(house.degree));

  const renderHouseRow = (house: BackendHouse, index: number) => {
    if (isNaN(house.degree)) return null;
    
    const { position } = getZodiacPositionFromDegree(house.degree);
    const signColor = ZODIAC_COLORS[house.sign as ZodiacSign] || '#8b5cf6';
    
    return (
      <View key={house.house} style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
        {/* House Number */}
        <View style={styles.houseCell}>
          <Text style={styles.houseNumber}>{house.house}</Text>
        </View>
        
        {/* Sign Symbol */}
        <View style={styles.symbolCell}>
          <Text style={[styles.signSymbol, { color: signColor }]}>
            {house.sign ? getZodiacGlyph(house.sign as ZodiacSign) : '-'}
          </Text>
        </View>
        
        {/* Sign Name */}
        <View style={styles.signCell}>
          <Text style={styles.signName}>{house.sign || 'Unknown'}</Text>
        </View>
        
        {/* Degree */}
        <View style={styles.degreeCell}>
          <Text style={styles.degree}>{position.toFixed(1)}°</Text>
        </View>
      </View>
    );
  };

  if (!hasValidHouses) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>House Positions</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            House data not available{'\n'}
            (Unknown birth time)
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>House Positions</Text>
      
      {/* Header */}
      <View style={[styles.row, styles.headerRow]}>
        <View style={styles.houseCell}>
          <Text style={styles.headerText}>House</Text>
        </View>
        <View style={styles.symbolCell}>
          <Text style={styles.headerText}>♈</Text>
        </View>
        <View style={styles.signCell}>
          <Text style={styles.headerText}>Sign</Text>
        </View>
        <View style={styles.degreeCell}>
          <Text style={styles.headerText}>Degree</Text>
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
    maxHeight: 300,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    color: '#94a3b8',
    textAlign: 'center',
  },
  houseNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  signSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  signName: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  degree: {
    fontSize: 12,
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
    lineHeight: 20,
  },
});

export default HouseTable;