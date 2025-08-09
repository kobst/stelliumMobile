import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { ConsolidatedScoredItem, CategoryData } from '../../api/relationships';

interface ConsolidatedItemsGridProps {
  consolidatedItems: ConsolidatedScoredItem[];
  onItemPress?: (item: ConsolidatedScoredItem) => void;
  selectedItems?: ConsolidatedScoredItem[];
}

type FilterType = 'all' | 'keystones' | 'sparks' | 'supports' | 'challenges';
type SortType = 'centrality' | 'starRating' | 'score';

const CATEGORY_COLORS: { [key: string]: string } = {
  'OVERALL_ATTRACTION_CHEMISTRY': '#E91E63',
  'EMOTIONAL_SECURITY_CONNECTION': '#4CAF50',
  'SEX_AND_INTIMACY': '#F44336',
  'COMMUNICATION_AND_MENTAL_CONNECTION': '#2196F3',
  'COMMITMENT_LONG_TERM_POTENTIAL': '#9C27B0',
  'KARMIC_LESSONS_GROWTH': '#FF9800',
  'PRACTICAL_GROWTH_SHARED_GOALS': '#795548',
};

const SPARK_TYPE_EMOJIS = {
  sexual: '🔥',
  transformative: '⚡️',
  intellectual: '🧠',
  emotional: '💖',
  power: '👑',
};

const ConsolidatedItemsGrid: React.FC<ConsolidatedItemsGridProps> = ({
  consolidatedItems,
  onItemPress,
  selectedItems = [],
}) => {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('centrality');

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...consolidatedItems];

    // Apply filters
    switch (activeFilter) {
      case 'keystones':
        filtered = filtered.filter(item => item.isOverallKeystone);
        break;
      case 'sparks':
        filtered = filtered.filter(item => 
          item.categoryData.some(cd => cd.spark)
        );
        break;
      case 'supports':
        filtered = filtered.filter(item =>
          item.categoryData.some(cd => cd.valence === 1)
        );
        break;
      case 'challenges':
        filtered = filtered.filter(item =>
          item.categoryData.some(cd => cd.valence === -1)
        );
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'centrality':
          return b.overallCentrality - a.overallCentrality;
        case 'starRating':
          return b.maxStarRating - a.maxStarRating;
        case 'score':
          const aMaxScore = Math.max(...a.categoryData.map(cd => cd.score));
          const bMaxScore = Math.max(...b.categoryData.map(cd => cd.score));
          return bMaxScore - aMaxScore;
        default:
          return 0;
      }
    });

    return filtered;
  }, [consolidatedItems, activeFilter, sortBy]);

  const getValenceColor = (valence: number): string => {
    if (valence === 1) return '#4CAF50';
    if (valence === -1) return '#F44336';
    return '#FFC107';
  };

  const getStarDisplay = (stars: number): string => {
    return '⭐️'.repeat(Math.min(stars, 5));
  };

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
          }
        ]}
        onPress={() => setActiveFilter(filter)}
      >
        <Text style={[
          styles.filterText,
          { color: isActive ? 'white' : colors.primary }
        ]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSortChip = (sort: SortType, label: string) => {
    const isActive = sortBy === sort;
    return (
      <TouchableOpacity
        key={sort}
        style={[
          styles.sortChip,
          {
            backgroundColor: isActive ? colors.secondary : colors.background,
            borderColor: colors.secondary,
          }
        ]}
        onPress={() => setSortBy(sort)}
      >
        <Text style={[
          styles.sortText,
          { color: isActive ? 'white' : colors.secondary }
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: ConsolidatedScoredItem }) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    const topCategory = item.categoryData.reduce((prev, current) => 
      prev.score > current.score ? prev : current
    );
    const sparks = item.categoryData.filter(cd => cd.spark);
    
    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          {
            backgroundColor: colors.background,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => onItemPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <Text style={[styles.itemDescription, { color: colors.onSurface }]} numberOfLines={2}>
            {item.description}
          </Text>
          {item.isOverallKeystone && (
            <Text style={styles.keystoneIcon}>👑</Text>
          )}
        </View>

        <View style={styles.itemDetails}>
          <View style={[
            styles.sourceChip,
            { backgroundColor: item.source === 'synastry' ? '#2196F3' : '#9C27B0' }
          ]}>
            <Text style={[styles.sourceText, { color: 'white' }]}>
              {item.source === 'synastry' ? 'SYN' : 'COMP'}
            </Text>
          </View>
          
          <Text style={[styles.starRating]}>
            {getStarDisplay(item.maxStarRating)}
          </Text>
        </View>

        <View style={styles.categoryInfo}>
          <View style={[
            styles.topCategoryChip,
            { backgroundColor: CATEGORY_COLORS[topCategory.category] || colors.primary }
          ]}>
            <Text style={[styles.topCategoryText, { color: 'white' }]} numberOfLines={1}>
              {topCategory.category.replace('_', ' ')}
            </Text>
          </View>
          
          <View style={styles.scoreInfo}>
            <Text style={[styles.score, { color: getValenceColor(topCategory.valence) }]}>
              {topCategory.score.toFixed(1)}
            </Text>
            <View style={[
              styles.valenceIndicator,
              { backgroundColor: getValenceColor(topCategory.valence) }
            ]} />
          </View>
        </View>

        {sparks.length > 0 && (
          <View style={styles.sparksContainer}>
            {sparks.slice(0, 3).map((spark, index) => (
              <Text key={index} style={styles.sparkEmoji}>
                {SPARK_TYPE_EMOJIS[spark.sparkType as keyof typeof SPARK_TYPE_EMOJIS] || '✨'}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.centralityBar}>
          <View
            style={[
              styles.centralityFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.min((item.overallCentrality / 10) * 100, 100)}%`,
              }
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const filterCounts = {
    all: consolidatedItems.length,
    keystones: consolidatedItems.filter(item => item.isOverallKeystone).length,
    sparks: consolidatedItems.filter(item => item.categoryData.some(cd => cd.spark)).length,
    supports: consolidatedItems.filter(item => item.categoryData.some(cd => cd.valence === 1)).length,
    challenges: consolidatedItems.filter(item => item.categoryData.some(cd => cd.valence === -1)).length,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Consolidated Aspects & Placements
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          All relationship factors in one unified view
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {renderFilterChip('all', 'All', filterCounts.all)}
        {renderFilterChip('keystones', 'Keystones', filterCounts.keystones)}
        {renderFilterChip('sparks', 'Sparks', filterCounts.sparks)}
        {renderFilterChip('supports', 'Supports', filterCounts.supports)}
        {renderFilterChip('challenges', 'Challenges', filterCounts.challenges)}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
        {renderSortChip('centrality', 'By Centrality')}
        {renderSortChip('starRating', 'By Stars')}
        {renderSortChip('score', 'By Score')}
      </ScrollView>

      <Text style={[styles.resultCount, { color: colors.onSurfaceVariant }]}>
        Showing {filteredAndSortedItems.length} items
      </Text>

      <View style={styles.grid}>
        {filteredAndSortedItems.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.gridItem,
              index % 2 === 1 ? { marginLeft: 8 } : {}
            ]}
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
    margin: 8,
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
  sortContainer: {
    marginBottom: 12,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 11,
    fontWeight: '500',
  },
  resultCount: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 16,
  },
  gridItem: {
    width: '48%',
    marginBottom: 8,
  },
  itemCard: {
    flex: 1,
    maxWidth: '48%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 4,
  },
  keystoneIcon: {
    fontSize: 16,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  starRating: {
    fontSize: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topCategoryChip: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  topCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  score: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  valenceIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sparksContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sparkEmoji: {
    fontSize: 12,
    marginRight: 2,
  },
  centralityBar: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  centralityFill: {
    height: '100%',
    borderRadius: 1,
  },
});

export default ConsolidatedItemsGrid;