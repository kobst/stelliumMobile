import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../theme';
import { BirthChartElement, BirthChartAspect } from '../../api/charts';
import { BirthChart } from '../../types';
import BirthChartAspectCard from './BirthChartAspectCard';
import { getPlanetGlyph, PlanetName } from './ChartUtils';

interface BirthChartElementsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  birthChart: BirthChart;
  selectedElements: BirthChartElement[];
  onSelectElement: (element: BirthChartElement) => void;
  onClearSelection: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

const BirthChartElementsBottomSheet: React.FC<BirthChartElementsBottomSheetProps> = ({
  visible,
  onClose,
  birthChart,
  selectedElements,
  onSelectElement,
  onClearSelection,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'positions' | 'aspects'>('all');

  // Helper function for ordinal numbers
  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Convert birth chart data to our element format
  const chartElements = useMemo(() => {
    const elements: BirthChartElement[] = [];

    // Add planetary positions
    if (birthChart?.planets) {
      birthChart.planets.forEach(planet => {
        // Skip certain points that aren't typically analyzed
        if (['South Node', 'Part of Fortune', 'Lilith'].includes(planet.name)) {
          return;
        }

        const position: BirthChartElement = {
          type: 'position',
          planet: planet.name,
          sign: planet.sign,
          house: planet.house || null,
          degree: planet.norm_degree || planet.full_degree || 0,
          isRetrograde: planet.is_retro === 'true' || planet.is_retro === true,
          description: `${planet.name} in ${planet.sign}${planet.house ? ` in ${getOrdinal(planet.house)} house` : ''}${planet.is_retro ? ' ℞' : ''}`,
        };
        elements.push(position);
      });
    }

    // Add aspects
    if (birthChart?.aspects) {
      birthChart.aspects.forEach(aspect => {
        // Find the corresponding planets to get their signs and houses
        const planet1Data = birthChart.planets?.find(p => p.name === aspect.aspectedPlanet);
        const planet2Data = birthChart.planets?.find(p => p.name === aspect.aspectingPlanet);

        if (planet1Data && planet2Data) {
          const aspectElement: BirthChartElement = {
            type: 'aspect',
            planet1: aspect.aspectedPlanet,
            planet2: aspect.aspectingPlanet,
            aspectType: aspect.aspectType.toLowerCase(),
            orb: aspect.orb || 0,
            planet1Sign: planet1Data.sign,
            planet2Sign: planet2Data.sign,
            planet1House: planet1Data.house || null,
            planet2House: planet2Data.house || null,
            description: `${aspect.aspectedPlanet} ${aspect.aspectType.toLowerCase()} ${aspect.aspectingPlanet}`,
          };
          elements.push(aspectElement);
        }
      });
    }

    return elements;
  }, [birthChart]);

  // Filter elements based on search and active filter
  const filteredElements = useMemo(() => {
    let filtered = chartElements;

    // Apply type filter
    if (activeFilter === 'positions') {
      filtered = filtered.filter(el => el.type === 'position');
    } else if (activeFilter === 'aspects') {
      filtered = filtered.filter(el => el.type === 'aspect');
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(element => {
        if (element.type === 'position') {
          return (
            element.planet.toLowerCase().includes(query) ||
            element.sign.toLowerCase().includes(query) ||
            element.description.toLowerCase().includes(query)
          );
        } else {
          return (
            element.planet1.toLowerCase().includes(query) ||
            element.planet2.toLowerCase().includes(query) ||
            element.aspectType.toLowerCase().includes(query) ||
            element.planet1Sign.toLowerCase().includes(query) ||
            element.planet2Sign.toLowerCase().includes(query) ||
            element.description.toLowerCase().includes(query)
          );
        }
      });
    }

    return filtered;
  }, [chartElements, searchQuery, activeFilter]);

  // Check if element is selected
  const isElementSelected = (element: BirthChartElement): boolean => {
    const elementId = element.type === 'aspect'
      ? `${element.planet1}-${element.aspectType}-${element.planet2}`
      : `${element.planet}-${element.sign}`;

    return selectedElements.some(selected => {
      const selectedId = selected.type === 'aspect'
        ? `${selected.planet1}-${selected.aspectType}-${selected.planet2}`
        : `${selected.planet}-${selected.sign}`;
      return selectedId === elementId;
    });
  };

  // Get element display name
  const getElementDisplayName = (element: BirthChartElement): string => {
    if (element.type === 'aspect') {
      const aspectName = element.aspectType?.charAt(0).toUpperCase() + element.aspectType?.slice(1) || 'aspect';
      return `${element.planet1} ${aspectName} ${element.planet2}`;
    }

    const houseText = element.house ? ` in ${getOrdinal(element.house)} house` : '';
    const retroText = element.isRetrograde ? ' ℞' : '';

    return `${element.planet} in ${element.sign}${houseText}${retroText}`;
  };

  // Get element category for styling
  const getElementCategory = (element: BirthChartElement): string => {
    if (element.type === 'aspect') {
      return element.aspectType;
    }
    return 'position';
  };

  // Handle element selection with limit check
  const handleElementPress = (element: BirthChartElement) => {
    const isCurrentlySelected = isElementSelected(element);

    if (!isCurrentlySelected && selectedElements.length >= 3) {
      Alert.alert(
        'Selection Limit',
        'Maximum 3 items can be selected. Deselect one to add another.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    onSelectElement(element);
  };

  // Filter buttons
  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'positions', label: 'Positions' },
    { key: 'aspects', label: 'Aspects' },
  ] as const;

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
            Select Chart Elements
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            Choose up to 3 chart elements ({selectedElements.length}/3)
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
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search planets, signs, aspects..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.searchInput, {
              color: colors.onSurface,
              backgroundColor: colors.background,
              borderColor: colors.border,
            }]}
          />
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {filterButtons.map(button => (
              <TouchableOpacity
                key={button.key}
                onPress={() => setActiveFilter(button.key)}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: activeFilter === button.key ? colors.primary : colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: activeFilter === button.key ? colors.onPrimary : colors.onSurfaceVariant },
                ]}>
                  {button.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Elements List */}
        <ScrollView
          style={styles.elementsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.elementsContent}
        >
          {filteredElements.map((element, index) => {
            const isSelected = isElementSelected(element);
            const category = getElementCategory(element);

            // Render aspect cards with new BirthChartAspectCard component
            if (element.type === 'aspect') {
              return (
                <BirthChartAspectCard
                  key={index}
                  element={element}
                  colors={colors}
                  onPress={handleElementPress}
                  isSelected={isSelected}
                />
              );
            }

            // Render position cards with planets tab styling
            const houseText = element.house ? ` in House ${element.house}` : '';
            const retroText = element.isRetrograde ? ' ℞' : '';

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleElementPress(element)}
                style={[
                  styles.positionCard,
                  {
                    backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.positionCardContent}>
                  <Text style={styles.planetGlyph}>{getPlanetGlyph(element.planet as PlanetName)}</Text>
                  <View style={styles.planetInfo}>
                    <Text style={[
                      styles.planetName,
                      { color: isSelected ? colors.onPrimaryContainer : colors.onSurface },
                    ]}>
                      {element.planet}
                    </Text>
                    <Text style={[
                      styles.planetPosition,
                      { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant },
                    ]}>
                      {element.sign}{houseText}{retroText}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.selectedBadgeText, { color: colors.onPrimary }]}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {filteredElements.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                {searchQuery ? 'No elements match your search' : 'No elements available'}
              </Text>
            </View>
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
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
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
  elementsContainer: {
    flex: 1,
  },
  elementsContent: {
    padding: 16,
    paddingBottom: 32,
  },
  positionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  positionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planetGlyph: {
    fontSize: 20,
    marginRight: 12,
  },
  planetInfo: {
    flex: 1,
  },
  planetName: {
    fontSize: 17,
    fontWeight: '600',
  },
  planetPosition: {
    fontSize: 13,
    marginTop: 2,
  },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
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

export default BirthChartElementsBottomSheet;
