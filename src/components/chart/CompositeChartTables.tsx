import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CompositeChart } from '../../api/relationships';
import { PlanetName, AspectType, ZodiacSign } from '../../types';
import { 
  PLANET_COLORS, 
  getPlanetGlyph, 
  getZodiacGlyph, 
  getAspectColor,
  ZODIAC_COLORS,
  filterPlanets
} from './ChartUtils';

interface CompositeChartTablesProps {
  compositeChart: CompositeChart;
}

const CompositeChartTables: React.FC<CompositeChartTablesProps> = ({ compositeChart }) => {
  // Convert composite chart planets to BackendPlanet format for filtering
  const convertedPlanets = compositeChart.planets.map(planet => ({
    name: planet.name,
    full_degree: planet.full_degree,
    norm_degree: planet.norm_degree,
    sign: planet.sign,
    house: planet.house,
    is_retro: false // Composite charts don't have retrograde planets
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
      const planetColor = PLANET_COLORS[planet.name as PlanetName] || '#ffffff';
      const position = planet.norm_degree;
      
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
              {getZodiacGlyph(planet.sign as ZodiacSign)}
            </Text>
          </View>
          
          {/* Sign Name */}
          <View style={styles.signCell}>
            <Text style={styles.signName}>{planet.sign}</Text>
          </View>
          
          {/* House */}
          <View style={styles.houseCell}>
            <Text style={styles.house}>
              {planet.house > 0 ? planet.house : '-'}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>Composite Planetary Positions</Text>
        
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
        </View>
        
        {/* Planet Rows */}
        <ScrollView style={styles.scrollView}>
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
      const signColor = ZODIAC_COLORS[house.sign as ZodiacSign] || '#8b5cf6';
      
      return (
        <View key={house.house} style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
          {/* House Number */}
          <View style={styles.houseNumberCell}>
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
            <Text style={styles.degree}>{signPosition.toFixed(1)}°</Text>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>Composite House Positions</Text>
        
        {/* Header */}
        <View style={[styles.row, styles.headerRow]}>
          <View style={styles.houseNumberCell}>
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
          {compositeChart.houses.map((house, index) => renderHouseRow(house, index))}
        </ScrollView>
      </View>
    );
  };

  // Aspects Table
  const renderAspectsTable = () => {
    const renderAspectRow = (aspect: any, index: number) => {
      const aspectColor = getAspectColor(aspect.aspectType as AspectType);
      const planet1Color = PLANET_COLORS[aspect.aspectingPlanet as PlanetName] || '#ffffff';
      const planet2Color = PLANET_COLORS[aspect.aspectedPlanet as PlanetName] || '#ffffff';
      
      return (
        <View key={`${aspect.aspectingPlanet}-${aspect.aspectedPlanet}-${index}`} 
              style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
          
          {/* First Planet Symbol */}
          <View style={styles.planetCell}>
            <Text style={[styles.planetSymbol, { color: planet1Color }]}>
              {getPlanetGlyph(aspect.aspectingPlanet as PlanetName)}
            </Text>
          </View>
          
          {/* First Planet Name */}
          <View style={styles.nameCell}>
            <Text style={styles.planetName}>{aspect.aspectingPlanet}</Text>
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
              {getPlanetGlyph(aspect.aspectedPlanet as PlanetName)}
            </Text>
          </View>
          
          {/* Second Planet Name */}
          <View style={styles.nameCell}>
            <Text style={styles.planetName}>{aspect.aspectedPlanet}</Text>
          </View>
          
          {/* Orb */}
          <View style={styles.orbCell}>
            <Text style={styles.orb}>{aspect.orb?.toFixed(1)}°</Text>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>Composite Aspects</Text>
        
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
          {compositeChart.aspects.map((aspect, index) => renderAspectRow(aspect, index))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderPlanetTable()}
      {renderHouseTable()}
      {renderAspectsTable()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  tableContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tableTitle: {
    fontSize: 16,
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
  houseNumberCell: {
    width: 60,
    alignItems: 'center',
  },
  planetCell: {
    width: 30,
    alignItems: 'center',
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