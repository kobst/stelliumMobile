import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { ClusterScoredItem, ClusterContribution, KeystoneAspect } from '../../api/relationships';
import AspectCard from './AspectCard';

interface ConsolidatedItemsGridProps {
  scoredItems: ClusterScoredItem[];
  keystoneAspects?: KeystoneAspect[];
  onItemPress?: (item: ClusterScoredItem) => void;
  selectedItems?: ClusterScoredItem[];
  onChatAboutItem?: (item: ClusterScoredItem) => void;
  userAName?: string;
  userBName?: string;
}

type FilterType = 'keystones' | 'sparks' | 'topSupports' | 'topChallenges';

const ConsolidatedItemsGrid: React.FC<ConsolidatedItemsGridProps> = ({
  scoredItems,
  keystoneAspects = [],
  onItemPress,
  selectedItems = [],
  onChatAboutItem,
  userAName = 'Person A',
  userBName = 'Person B',
}) => {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('keystones');

  const filteredAndSortedItems = useMemo(() => {
    // Convert keystone aspects to cluster scored item format for display
    const keystoneAsClusterItems: ClusterScoredItem[] = keystoneAspects.map((aspect, index) => ({
      id: `keystone-${index}`,
      source: (aspect as any).source || 'synastry' as const,
      type: (aspect as any).type || 'aspect' as const,
      description: aspect.description,
      // Copy all the structured aspect data from the keystone
      aspect: (aspect as any).aspect,
      orb: (aspect as any).orb,
      planet1: (aspect as any).planet1,
      planet2: (aspect as any).planet2,
      planet1Sign: (aspect as any).planet1Sign,
      planet2Sign: (aspect as any).planet2Sign,
      planet1House: (aspect as any).planet1House,
      planet2House: (aspect as any).planet2House,
      pairKey: (aspect as any).pairKey,
      planet: (aspect as any).planet,
      house: (aspect as any).house,
      direction: (aspect as any).direction,
      clusterContributions: [{
        cluster: (aspect as any).primaryCluster || (aspect as any).cluster || 'Passion',
        score: Math.abs(aspect.score),
        weight: (aspect as any).weight || 10,
        intensity: (aspect as any).intensity || 1,
        valence: aspect.score > 0 ? 1 : -1,
        centrality: (aspect as any).centrality || 10,
        spark: (aspect as any).spark || false,
        sparkType: (aspect as any).sparkType,
        isKeystone: true,
        starRating: (aspect as any).starRating || 5,
      }],
      code: (aspect as any).code || `keystone-${index}`,
      overallCentrality: (aspect as any).centrality || 10,
      maxStarRating: (aspect as any).starRating || 5,
    }));

    // Combine regular scored items with keystone aspects
    const allItems = [...scoredItems, ...keystoneAsClusterItems];

    // Apply filters
    let filtered = [...allItems];
    switch (activeFilter) {
      case 'keystones':
        filtered = keystoneAsClusterItems; // Only show keystone aspects
        break;
      case 'sparks':
        filtered = scoredItems.filter(item =>
          item.clusterContributions.some(cc => cc.spark)
        );
        break;
      case 'topSupports':
        // Filter items where the strongest contribution (by absolute value) is positive
        let positiveItems = allItems.filter(item => {
          const strongestContribution = item.clusterContributions.reduce((prev, current) =>
            Math.abs(prev.score) > Math.abs(current.score) ? prev : current
          );
          return strongestContribution.valence === 1;
        });
        // Prefer 4+ star items
        let highQualitySupports = positiveItems.filter(item => item.maxStarRating >= 4);
        if (highQualitySupports.length === 0) {
          highQualitySupports = positiveItems; // Fallback to all positive
        }
        // Sort by highest absolute scores and take top 3-6
        filtered = highQualitySupports
          .sort((a, b) => {
            const aStrongest = a.clusterContributions.reduce((prev, current) =>
              Math.abs(prev.score) > Math.abs(current.score) ? prev : current
            );
            const bStrongest = b.clusterContributions.reduce((prev, current) =>
              Math.abs(prev.score) > Math.abs(current.score) ? prev : current
            );
            return Math.abs(bStrongest.score) - Math.abs(aStrongest.score);
          })
          .slice(0, 6);
        break;
      case 'topChallenges':
        // Filter items where the strongest contribution (by absolute value) is negative
        let negativeItems = allItems.filter(item => {
          const strongestContribution = item.clusterContributions.reduce((prev, current) =>
            Math.abs(prev.score) > Math.abs(current.score) ? prev : current
          );
          return strongestContribution.valence === -1;
        });
        // Sort by highest absolute scores (most impactful challenges) and take top 3-6
        filtered = negativeItems
          .sort((a, b) => {
            const aStrongest = a.clusterContributions.reduce((prev, current) =>
              Math.abs(prev.score) > Math.abs(current.score) ? prev : current
            );
            const bStrongest = b.clusterContributions.reduce((prev, current) =>
              Math.abs(prev.score) > Math.abs(current.score) ? prev : current
            );
            return Math.abs(bStrongest.score) - Math.abs(aStrongest.score);
          })
          .slice(0, 6);
        break;
    }

    // Default sorting by centrality for all filters except topSupports and topChallenges
    // (topSupports and topChallenges already have their own sorting logic)
    if (activeFilter !== 'topSupports' && activeFilter !== 'topChallenges') {
      filtered.sort((a, b) => b.overallCentrality - a.overallCentrality);
    }

    return filtered;
  }, [scoredItems, keystoneAspects, activeFilter]);

  const renderFilterChip = (filter: FilterType, label: string, count: number) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterChip,
          {
            backgroundColor: isActive ? colors.primary : colors.background,
            borderColor: colors.primary,
          },
        ]}
        onPress={() => setActiveFilter(filter)}
      >
        <Text style={[
          styles.filterText,
          { color: isActive ? 'white' : colors.primary },
        ]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };


  const renderItem = ({ item }: { item: ClusterScoredItem }) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);

    return (
      <AspectCard
        item={item}
        colors={colors}
        onPress={onItemPress}
        isSelected={isSelected}
        showSelection={false}
        userAName={userAName}
        userBName={userBName}
      />
    );
  };

  const filterCounts = useMemo(() => {
    // Convert keystone aspects to cluster scored item format for counting
    const keystoneAsClusterItems: ClusterScoredItem[] = keystoneAspects.map((aspect, index) => ({
      id: `keystone-${index}`,
      source: (aspect as any).source || 'synastry' as const,
      type: (aspect as any).type || 'aspect' as const,
      description: aspect.description,
      // Copy all the structured aspect data from the keystone
      aspect: (aspect as any).aspect,
      orb: (aspect as any).orb,
      planet1: (aspect as any).planet1,
      planet2: (aspect as any).planet2,
      planet1Sign: (aspect as any).planet1Sign,
      planet2Sign: (aspect as any).planet2Sign,
      planet1House: (aspect as any).planet1House,
      planet2House: (aspect as any).planet2House,
      pairKey: (aspect as any).pairKey,
      planet: (aspect as any).planet,
      house: (aspect as any).house,
      direction: (aspect as any).direction,
      clusterContributions: [{
        cluster: (aspect as any).primaryCluster || (aspect as any).cluster || 'Passion',
        score: Math.abs(aspect.score),
        weight: (aspect as any).weight || 10,
        intensity: (aspect as any).intensity || 1,
        valence: aspect.score > 0 ? 1 : -1,
        centrality: (aspect as any).centrality || 10,
        spark: (aspect as any).spark || false,
        sparkType: (aspect as any).sparkType,
        isKeystone: true,
        starRating: (aspect as any).starRating || 5,
      }],
      code: (aspect as any).code || `keystone-${index}`,
      overallCentrality: (aspect as any).centrality || 10,
      maxStarRating: (aspect as any).starRating || 5,
    }));

    // Calculate topSupports count - match the filtering logic (strongest contribution)
    const allItems = [...scoredItems, ...keystoneAsClusterItems];
    let positiveItems = allItems.filter(item => {
      const strongestContribution = item.clusterContributions.reduce((prev, current) =>
        Math.abs(prev.score) > Math.abs(current.score) ? prev : current
      );
      return strongestContribution.valence === 1;
    });
    let highQualitySupports = positiveItems.filter(item => item.maxStarRating >= 4);
    if (highQualitySupports.length === 0) {
      highQualitySupports = positiveItems;
    }
    const topSupportsCount = Math.min(highQualitySupports.length, 6);

    // Calculate topChallenges count - match the filtering logic (strongest contribution)
    let negativeItems = allItems.filter(item => {
      const strongestContribution = item.clusterContributions.reduce((prev, current) =>
        Math.abs(prev.score) > Math.abs(current.score) ? prev : current
      );
      return strongestContribution.valence === -1;
    });
    const topChallengesCount = Math.min(negativeItems.length, 6);

    return {
      keystones: keystoneAspects.length,
      sparks: scoredItems.filter(item => item.clusterContributions.some(cc => cc.spark)).length,
      topSupports: topSupportsCount,
      topChallenges: topChallengesCount,
    };
  }, [scoredItems, keystoneAspects]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Highlights
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Key relationship dynamics organized by five compatibility dimensions
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {renderFilterChip('keystones', 'Keystones', filterCounts.keystones)}
        {renderFilterChip('sparks', 'Sparks', filterCounts.sparks)}
        {renderFilterChip('topSupports', 'Top Supports', filterCounts.topSupports)}
        {renderFilterChip('topChallenges', 'Top Challenges', filterCounts.topChallenges)}
      </ScrollView>


      <Text style={[styles.resultCount, { color: colors.onSurfaceVariant }]}>
        Showing {filteredAndSortedItems.length} items
      </Text>

      <View style={styles.grid}>
        {filteredAndSortedItems.map((item) => (
          <View
            key={item.id}
            style={styles.gridItem}
          >
            {renderItem({ item })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  grid: {
    paddingBottom: 16,
  },
  gridItem: {
    width: '100%',
    marginBottom: 12,
  },
});

export default ConsolidatedItemsGrid;
