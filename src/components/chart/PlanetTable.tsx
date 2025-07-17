import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BackendPlanet, PlanetName } from '../../types';
import { 
  PLANET_COLORS, 
  getPlanetGlyph, 
  getZodiacGlyph, 
  formatDegree,
  filterPlanets,
  getZodiacPositionFromDegree
} from './ChartUtils';

interface PlanetTableProps {
  planets: BackendPlanet[];
}

const PlanetTable: React.FC<PlanetTableProps> = ({ planets }) => {
  const filteredPlanets = filterPlanets(planets);

  const renderPlanetRow = (planet: BackendPlanet, index: number) => {
    const planetColor = PLANET_COLORS[planet.name as PlanetName] || '#ffffff';
    const { sign, position } = getZodiacPositionFromDegree(planet.full_degree);
    
    return (
      <View key={planet.name} style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
        {/* Planet Symbol */}
        <View style={styles.symbolCell}>
          <Text style={[styles.planetSymbol, { color: planetColor }]}>
            {getPlanetGlyph(planet.name as PlanetName)}
          </Text>
        </View>
        
        {/* Planet Name */}
        <View style={styles.nameCell}>
          <Text style={styles.planetName}>{planet.name}</Text>
        </View>
        
        {/* Degree in Sign */}
        <View style={styles.degreeCell}>
          <Text style={styles.degree}>{position.toFixed(1)}°</Text>
        </View>
        
        {/* Sign Symbol */}
        <View style={styles.symbolCell}>
          <Text style={styles.signSymbol}>
            {getZodiacGlyph(sign)}
          </Text>
        </View>
        
        {/* Sign Name */}
        <View style={styles.signCell}>
          <Text style={styles.signName}>{sign}</Text>
        </View>
        
        {/* House */}
        <View style={styles.houseCell}>
          <Text style={styles.house}>
            {planet.house > 0 ? planet.house : '-'}
          </Text>
        </View>
        
        {/* Retrograde */}
        <View style={styles.retroCell}>
          <Text style={styles.retro}>
            {planet.is_retro ? 'R' : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Planetary Positions</Text>
      
      {/* Header */}
      <View style={[styles.row, styles.headerRow]}>
        <View style={styles.symbolCell}>
          <Text style={styles.headerText}>☽</Text>
        </View>
        <View style={styles.nameCell}>
          <Text style={styles.headerText}>Planet</Text>
        </View>
        <View style={styles.degreeCell}>
          <Text style={styles.headerText}>Degree</Text>
        </View>
        <View style={styles.symbolCell}>
          <Text style={styles.headerText}>♈</Text>
        </View>
        <View style={styles.signCell}>
          <Text style={styles.headerText}>Sign</Text>
        </View>
        <View style={styles.houseCell}>
          <Text style={styles.headerText}>House</Text>
        </View>
        <View style={styles.retroCell}>
          <Text style={styles.headerText}>R</Text>
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
  symbolCell: {
    width: 40,
    alignItems: 'center',
  },
  nameCell: {
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
    color: '#94a3b8',
    textAlign: 'center',
  },
  planetSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planetName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  degree: {
    fontSize: 12,
    color: '#e2e8f0',
  },
  signSymbol: {
    fontSize: 16,
    color: '#8b5cf6',
  },
  signName: {
    fontSize: 12,
    color: '#e2e8f0',
  },
  house: {
    fontSize: 12,
    color: '#94a3b8',
  },
  retro: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: 'bold',
  },
});

export default PlanetTable;