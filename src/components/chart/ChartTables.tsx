import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { BirthChart } from '../../types';
import { useTheme } from '../../theme';
import PlanetTable from './PlanetTable';
import HouseTable from './HouseTable';
import AspectTable from './AspectTable';

interface ChartTablesProps {
  birthChart?: BirthChart;
}

const ChartTables: React.FC<ChartTablesProps> = ({ birthChart }) => {
  const { colors } = useTheme();
  
  if (!birthChart) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={true}>
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
  },
});

export default ChartTables;