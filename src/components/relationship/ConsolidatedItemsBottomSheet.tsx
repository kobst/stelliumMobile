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
import AspectCard from './AspectCard';

interface ConsolidatedItemsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  scoredItems: ClusterScoredItem[];
  selectedElements: ClusterScoredItem[];
  onSelectElement: (element: ClusterScoredItem) => void;
  onClearSelection: () => void;
  userAName?: string;
  userBName?: string;
}

type FilterType = 'all' | 'sparks' | 'supports' | 'challenges' | 'keystones';
type SourceType = 'synastry' | 'composite';

const ConsolidatedItemsBottomSheet: React.FC<ConsolidatedItemsBottomSheetProps> = ({
  visible,
  onClose,
  scoredItems,
  selectedElements,
  onSelectElement,
  onClearSelection,
  userAName = 'Person A',
  userBName = 'Person B',
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeSourceFilters, setActiveSourceFilters] = useState<Set<SourceType>>(new Set(['synastry', 'composite']));

  // Filter and search logic
  const filteredItems = useMemo(() => {
    let items = [...scoredItems];

    // First apply source filter
    if (activeSourceFilters.size > 0 && activeSourceFilters.size < 2) {
      items = items.filter(item => activeSourceFilters.has(item.source as SourceType));
    }

    // Then apply category filter
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
  }, [scoredItems, activeFilter, searchQuery, activeSourceFilters]);

  // Get filter counts based on current source selection
  const filterCounts = useMemo(() => {
    // First filter by source if not all sources are selected
    let baseItems = scoredItems;
    if (activeSourceFilters.size > 0 && activeSourceFilters.size < 2) {
      baseItems = scoredItems.filter(item => activeSourceFilters.has(item.source as SourceType));
    }

    return {
      all: baseItems.length,
      sparks: baseItems.filter(item =>
        item.clusterContributions.some(cc => cc.spark === true)
      ).length,
      supports: baseItems.filter(item =>
        item.clusterContributions.some(cc => cc.valence === 1)
      ).length,
      challenges: baseItems.filter(item =>
        item.clusterContributions.some(cc => cc.valence === -1)
      ).length,
      keystones: baseItems.filter(item =>
        item.clusterContributions.some(cc => cc.isKeystone === true)
      ).length,
    };
  }, [scoredItems, activeSourceFilters]);

  // Check if element is selected
  const isSelected = (element: ClusterScoredItem): boolean => {
    return selectedElements.some(selected => selected.id === element.id);
  };

  // Handle source filter toggle
  const toggleSourceFilter = (source: SourceType) => {
    const newFilters = new Set(activeSourceFilters);
    if (newFilters.has(source)) {
      newFilters.delete(source);
    } else {
      newFilters.add(source);
    }
    setActiveSourceFilters(newFilters);
  };

  // Render source filter button (toggle style)
  const renderSourceFilterButton = (source: SourceType, label: string) => {
    const isActive = activeSourceFilters.has(source);
    return (
      <TouchableOpacity
        key={source}
        style={[
          styles.sourceFilterButton,
          {
            backgroundColor: isActive ? colors.primary : colors.surface,
            borderColor: colors.primary,
          },
        ]}
        onPress={() => toggleSourceFilter(source)}
      >
        <Text style={[
          styles.sourceFilterButtonText,
          { color: isActive ? colors.onPrimary : colors.primary },
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render category filter button (radio style)
  const renderCategoryFilterButton = (filter: FilterType, label: string, count: number) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterButton,
          {
            backgroundColor: isActive ? colors.primary : colors.background,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setActiveFilter(filter)}
      >
        <Text style={[
          styles.filterButtonText,
          { color: isActive ? colors.onPrimary : colors.onSurface },
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
              style={[styles.clearButton, { backgroundColor: colors.error }]}
            >
              <Text style={[styles.clearButtonText, { color: 'white' }]}>
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Source Filter Row */}
        <View style={[styles.sourceFilterContainer, { backgroundColor: colors.surface }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sourceFilterContent}
          >
            {renderSourceFilterButton('synastry', 'Synastry')}
            {renderSourceFilterButton('composite', 'Composite')}
          </ScrollView>
        </View>

        {/* Category Filter Row */}
        <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {renderCategoryFilterButton('all', 'All', filterCounts.all)}
            {renderCategoryFilterButton('keystones', 'Keystones', filterCounts.keystones)}
            {renderCategoryFilterButton('sparks', 'Sparks', filterCounts.sparks)}
            {renderCategoryFilterButton('supports', 'Supports', filterCounts.supports)}
            {renderCategoryFilterButton('challenges', 'Challenges', filterCounts.challenges)}
          </ScrollView>
        </View>

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
            filteredItems.map((item) => (
              <AspectCard
                key={item.id}
                item={item}
                colors={colors}
                onPress={onSelectElement}
                isSelected={isSelected(item)}
                showSelection={true}
                userAName={userAName}
                userBName={userBName}
              />
            ))
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
  sourceFilterContainer: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sourceFilterContent: {
    gap: 12,
  },
  sourceFilterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  sourceFilterButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
});

export default ConsolidatedItemsBottomSheet;
