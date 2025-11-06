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
  Alert,
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

  // Check if element is selected
  const isSelected = (element: ClusterScoredItem): boolean => {
    return selectedElements.some(selected => selected.id === element.id);
  };

  // Handle element selection with limit check
  const handleElementPress = (element: ClusterScoredItem) => {
    const currentlySelected = isSelected(element);

    if (!currentlySelected && selectedElements.length >= 3) {
      Alert.alert(
        'Selection Limit',
        'Maximum 3 items can be selected. Deselect one to add another.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    onSelectElement(element);
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
  const renderCategoryFilterButton = (filter: FilterType, label: string) => {
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
          {label}
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
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            Select Elements
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            Choose up to 3 relationship elements ({selectedElements.length}/3)
          </Text>

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: colors.onSurfaceVariant }]}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search elements..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.searchInput, {
              backgroundColor: colors.background,
              color: colors.onSurface,
              borderColor: colors.border,
            }]}
          />
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
            {renderCategoryFilterButton('all', 'All')}
            {renderCategoryFilterButton('keystones', 'Keystones')}
            {renderCategoryFilterButton('sparks', 'Sparks')}
            {renderCategoryFilterButton('supports', 'Supports')}
            {renderCategoryFilterButton('challenges', 'Challenges')}
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
                onPress={handleElementPress}
                isSelected={isSelected(item)}
                showSelection={true}
                userAName={userAName}
                userBName={userBName}
              />
            ))
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.clearButtonFooter, { backgroundColor: colors.errorContainer }]}
            onPress={onClearSelection}
            disabled={selectedElements.length === 0}
          >
            <Text style={[
              styles.clearButtonText,
              {
                color: selectedElements.length === 0 ? colors.onSurfaceVariant : colors.onErrorContainer,
                opacity: selectedElements.length === 0 ? 0.5 : 1,
              }
            ]}>
              Clear All ({selectedElements.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.doneButtonText, { color: colors.onPrimary }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
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
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  clearButtonFooter: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ConsolidatedItemsBottomSheet;
