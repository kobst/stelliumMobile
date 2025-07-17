import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { BirthChart } from '../../types';
import PlanetTable from './PlanetTable';
import HouseTable from './HouseTable';
import AspectTable from './AspectTable';

interface ChartTablesProps {
  birthChart?: BirthChart;
}

const ChartTables: React.FC<ChartTablesProps> = ({ birthChart }) => {
  if (!birthChart) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {/* Planet Positions Table */}
      {birthChart.planets && birthChart.planets.length > 0 && (
        <PlanetTable planets={birthChart.planets} />
      )}
      
      {/* House Positions Table */}
      {birthChart.houses && birthChart.houses.length > 0 && (
        <HouseTable houses={birthChart.houses} />
      )}
      
      {/* Aspects Table */}
      {birthChart.aspects && birthChart.aspects.length > 0 && (
        <AspectTable aspects={birthChart.aspects} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});

export default ChartTables;