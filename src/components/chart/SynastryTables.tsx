import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text } from 'react-native';
import { useTheme } from '../../theme';
import SynastryAspectsTable from './SynastryAspectsTable';
import SynastryHousePlacementsTable from './SynastryHousePlacementsTable';

const { width: screenWidth } = Dimensions.get('window');

interface SynastryTablesProps {
  relationship: {
    synastryAspects?: any[];
    synastryHousePlacements?: {
      AinB: any[];
      BinA: any[];
    };
    userA_name: string;
    userB_name: string;
  };
}

const SynastryTables: React.FC<SynastryTablesProps> = ({ relationship }) => {
  const { colors } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const pages = [];

  // Add Aspects page if data exists
  if (relationship.synastryAspects && relationship.synastryAspects.length > 0) {
    pages.push({
      title: 'Aspects',
      component: (
        <SynastryAspectsTable
          aspects={relationship.synastryAspects}
          userAName={relationship.userA_name}
          userBName={relationship.userB_name}
        />
      ),
    });
  }

  // Add House Placements pages if data exists
  if (relationship.synastryHousePlacements) {
    if (relationship.synastryHousePlacements.AinB && relationship.synastryHousePlacements.AinB.length > 0) {
      pages.push({
        title: `${relationship.userA_name} in ${relationship.userB_name}`,
        component: (
          <SynastryHousePlacementsTable
            synastryHousePlacements={{
              AinB: relationship.synastryHousePlacements.AinB,
              BinA: [], // Show only User A's planets in User B's houses
            }}
            userAName={relationship.userA_name}
            userBName={relationship.userB_name}
          />
        ),
      });
    }

    if (relationship.synastryHousePlacements.BinA && relationship.synastryHousePlacements.BinA.length > 0) {
      pages.push({
        title: `${relationship.userB_name} in ${relationship.userA_name}`,
        component: (
          <SynastryHousePlacementsTable
            synastryHousePlacements={{
              AinB: [], // Show only User B's planets in User A's houses
              BinA: relationship.synastryHousePlacements.BinA,
            }}
            userAName={relationship.userA_name}
            userBName={relationship.userB_name}
          />
        ),
      });
    }
  }

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / screenWidth);
    setCurrentPage(pageIndex);
  };

  if (pages.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>
            No synastry data available
          </Text>
        </View>
      </View>
    );
  }

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
            {page.component}
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

export default SynastryTables;
