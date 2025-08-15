import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text } from 'react-native';
import { BirthChart } from '../../types';
import { useTheme } from '../../theme';
import PlanetTable from './PlanetTable';
import HouseTable from './HouseTable';
import AspectTable from './AspectTable';

const { width: screenWidth } = Dimensions.get('window');

interface ChartTablesProps {
  birthChart?: BirthChart;
}

const ChartTables: React.FC<ChartTablesProps> = ({ birthChart }) => {
  const { colors } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  if (!birthChart) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  const pages = [
    {
      title: 'Houses',
      component: birthChart.houses && birthChart.houses.length > 0 ? (
        <HouseTable houses={birthChart.houses} />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>No house data available</Text>
        </View>
      ),
    },
    {
      title: 'Planets',
      component: birthChart.planets && birthChart.planets.length > 0 ? (
        <PlanetTable planets={birthChart.planets} />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>No planet data available</Text>
        </View>
      ),
    },
    {
      title: 'Aspects',
      component: birthChart.aspects && birthChart.aspects.length > 0 ? (
        <AspectTable aspects={birthChart.aspects} />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>No aspect data available</Text>
        </View>
      ),
    },
  ];

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / screenWidth);
    setCurrentPage(pageIndex);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.carousel}
      >
        {pages.map((page, index) => (
          <View key={index} style={[styles.page, { width: screenWidth }]}>
            <ScrollView
              style={styles.pageContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.pageScrollContent}
            >
              {page.component}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Page Control Dots */}
      <View style={styles.pageControl}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: colors.primary,
                opacity: currentPage === index ? 1.0 : 0.3,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carousel: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
  },
  pageScrollContent: {
    paddingBottom: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
  },
  pageControl: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
});

export default ChartTables;
