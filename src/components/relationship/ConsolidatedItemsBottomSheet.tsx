import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../theme';
import { ClusterScoredItem } from '../../api/relationships';

interface ConsolidatedItemsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  scoredItems: ClusterScoredItem[];
  selectedElements: ClusterScoredItem[];
  onSelectElement: (element: ClusterScoredItem) => void;
  onClearSelection: () => void;
}

type FilterType = 'all' | 'sparks' | 'supports' | 'challenges' | 'keystones';

const SPARK_TYPE_EMOJIS = {
  sexual: '🔥',
  transformative: '⚡️',
  intellectual: '🧠',
  emotional: '💖',
  power: '👑',
};

const ConsolidatedItemsBottomSheet: React.FC<ConsolidatedItemsBottomSheetProps> = ({
  visible,
  onClose,
  scoredItems,
  selectedElements,
  onSelectElement,
  onClearSelection,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filter and search logic
  const filteredItems = useMemo(() => {
    let items = [...scoredItems];

    // Apply filter
    switch (activeFilter) {
      case 'sparks':
        items = items.filter(item =>
          item.clusterContributions.some(cc => cc.spark === true)
        );
        break;
      case 'supports':
        items = items.filter(item =>
          item.clusterContributions.some(cc => cc.valence === 1)
        );
        break;
      case 'challenges':
        items = items.filter(item =>
          item.clusterContributions.some(cc => cc.valence === -1)
        );
        break;
      case 'keystones':
        items = items.filter(item =>
          item.clusterContributions.some(cc => cc.isKeystone === true)
        );
        break;
      // 'all' shows everything
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item =>
        item.description.toLowerCase().includes(query) ||
        item.planet1?.toLowerCase().includes(query) ||
        item.planet2?.toLowerCase().includes(query) ||
        item.aspect?.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query)
      );
    }

    // Sort by overall centrality (most important first)
    return items.sort((a, b) => b.overallCentrality - a.overallCentrality);
  }, [scoredItems, activeFilter, searchQuery]);

  // Get filter counts
  const filterCounts = useMemo(() => {
    return {
      all: scoredItems.length,
      sparks: scoredItems.filter(item =>
        item.clusterContributions.some(cc => cc.spark === true)
      ).length,
      supports: scoredItems.filter(item =>
        item.clusterContributions.some(cc => cc.valence === 1)
      ).length,
      challenges: scoredItems.filter(item =>
        item.clusterContributions.some(cc => cc.valence === -1)
      ).length,
      keystones: scoredItems.filter(item =>
        item.clusterContributions.some(cc => cc.isKeystone === true)
      ).length,
    };
  }, [scoredItems]);

  // Check if element is selected
  const isSelected = (element: ClusterScoredItem): boolean => {
    return selectedElements.some(selected => selected.id === element.id);
  };

  // Get element display details
  const getElementDetails = (element: ClusterScoredItem) => {
    const topContribution = element.clusterContributions.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );
    const sparks = element.clusterContributions.filter(cc => cc.spark);
    const maxScore = Math.max(...element.clusterContributions.map(cc => cc.score));

    return { topContribution, sparks, maxScore };
  };

  // Format element title for display
  const getElementTitle = (element: ClusterScoredItem): string => {
    if (element.source === 'synastry' && element.type === 'aspect') {
      return `${element.planet1} ${element.aspect} ${element.planet2}`;
    }
    if (element.source === 'composite' && element.type === 'aspect') {
      return `${element.planet1} ${element.aspect} ${element.planet2}`;
    }
    if (element.type === 'housePlacement') {
      return `${element.planet1} → House ${element.planet2}`;
    }
    return element.description?.substring(0, 40) || 'Unknown Element';
  };

  // Render filter chip
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
          { color: isActive ? colors.onPrimary : colors.primary },
        ]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Select Elements
          </Text>
          <Text style={[styles.selectionCounter, { color: colors.onSurfaceVariant }]}>
            {selectedElements.length}/4
          </Text>
        </View>

        {/* Search and Clear */}
        <View style={styles.searchSection}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search elements..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.searchInput, {
              backgroundColor: colors.surface,
              color: colors.onSurface,
              borderColor: colors.border,
            }]}
          />
          {selectedElements.length > 0 && (
            <TouchableOpacity
              onPress={onClearSelection}
              style={[styles.clearButton, { backgroundColor: colors.errorContainer }]}
            >
              <Text style={[styles.clearButtonText, { color: colors.onErrorContainer }]}>
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {renderFilterChip('all', 'All', filterCounts.all)}
          {renderFilterChip('keystones', 'Keystones', filterCounts.keystones)}
          {renderFilterChip('sparks', 'Sparks', filterCounts.sparks)}
          {renderFilterChip('supports', 'Supports', filterCounts.supports)}
          {renderFilterChip('challenges', 'Challenges', filterCounts.challenges)}
        </ScrollView>

        {/* Results */}
        <ScrollView
          style={styles.itemsList}
          contentContainerStyle={styles.itemsListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                {searchQuery.trim() ? 'No matching elements found' : 'No elements in this category'}
              </Text>
            </View>
          ) : (
            filteredItems.map((item) => {
              const { topContribution, sparks, maxScore } = getElementDetails(item);
              const selected = isSelected(item);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: selected ? colors.primaryContainer : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  onPress={() => onSelectElement(item)}
                  activeOpacity={0.7}
                >
                  {/* Header with badges */}
                  <View style={styles.itemHeader}>
                    <View style={styles.itemBadges}>
                      {/* Source badge */}
                      <View style={[
                        styles.sourceBadge,
                        { backgroundColor: item.source === 'synastry' ? '#2196F3' : '#9C27B0' },
                      ]}>
                        <Text style={[styles.sourceBadgeText, { color: 'white' }]}>
                          {item.source === 'synastry' ? 'Syn' : 'Comp'}
                        </Text>
                      </View>

                      {/* Keystone badge */}
                      {item.isOverallKeystone && (
                        <View style={[styles.keystoneBadge, { backgroundColor: '#FFD700' }]}>
                          <Text style={[styles.keystoneBadgeText, { color: '#8B4513' }]}>👑</Text>
                        </View>
                      )}

                      {/* Spark badges */}
                      {sparks.map((spark, index) => (
                        <View key={index} style={styles.sparkBadge}>
                          <Text style={styles.sparkEmoji}>
                            {SPARK_TYPE_EMOJIS[spark.sparkType as keyof typeof SPARK_TYPE_EMOJIS] || '✨'}
                          </Text>
                        </View>
                      ))}

                      {/* Star rating */}
                      {item.maxStarRating > 0 && (
                        <Text style={styles.starRating}>
                          {'⭐️'.repeat(Math.min(item.maxStarRating, 5))}
                        </Text>
                      )}

                      {/* Selection checkmark */}
                      {selected && (
                        <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.selectedBadgeText, { color: colors.onPrimary }]}>✓</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Main content */}
                  <View style={styles.itemContent}>
                    <Text style={[
                      styles.itemTitle,
                      { color: selected ? colors.onPrimaryContainer : colors.onSurface },
                    ]}>
                      {getElementTitle(item)}
                    </Text>

                    <Text style={[
                      styles.itemDescription,
                      { color: selected ? colors.onPrimaryContainer : colors.onSurfaceVariant },
                    ]}
                    numberOfLines={2}>
                      {item.description}
                    </Text>

                    {/* Bottom row with score and valence */}
                    <View style={styles.itemBottomRow}>
                      {/* Score badge */}
                      <View style={[
                        styles.scoreBadge,
                        {
                          backgroundColor: maxScore >= 0 ? '#10b98120' : '#ef444420',
                        },
                      ]}>
                        <Text style={[
                          styles.scoreBadgeText,
                          { color: maxScore >= 0 ? '#10b981' : '#ef4444' },
                        ]}>
                          {maxScore > 0 ? '+' : ''}{maxScore.toFixed(0)}
                        </Text>
                      </View>

                      {/* Valence indicator */}
                      <View style={styles.valenceContainer}>
                        <View style={[
                          styles.valenceIndicator,
                          { backgroundColor: topContribution.valence === 1 ? '#4CAF50' : '#F44336' },
                        ]} />
                        <Text style={[
                          styles.valenceText,
                          { color: selected ? colors.onPrimaryContainer : colors.onSurfaceVariant },
                        ]}>
                          {topContribution.valence === 1 ? 'Support' : 'Challenge'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  selectionCounter: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filtersContent: {
    paddingRight: 20,
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
  itemsList: {
    flex: 1,
  },
  itemsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  keystoneBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keystoneBadgeText: {
    fontSize: 10,
  },
  sparkBadge: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkEmoji: {
    fontSize: 12,
  },
  starRating: {
    fontSize: 10,
  },
  selectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  valenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valenceIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  valenceText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default ConsolidatedItemsBottomSheet;
