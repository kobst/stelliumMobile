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

  // Filter buttons
  const filterButtons = [
    { key: 'all', label: 'All', count: chartElements.length },
    { key: 'positions', label: 'Positions', count: chartElements.filter(el => el.type === 'position').length },
    { key: 'aspects', label: 'Aspects', count: chartElements.filter(el => el.type === 'aspect').length },
  ] as const;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.onSurface }]}>
              Select Chart Elements
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.selectionInfo}>
            <Text style={[styles.selectionCount, { color: colors.onSurfaceVariant }]}>
              {selectedElements.length} of 4 selected
            </Text>
            {selectedElements.length > 0 && (
              <TouchableOpacity onPress={onClearSelection} style={styles.clearButton}>
                <Text style={[styles.clearText, { color: colors.error }]}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
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
                    backgroundColor: activeFilter === button.key ? colors.primary : colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: activeFilter === button.key ? colors.onPrimary : colors.onSurface },
                ]}>
                  {button.label} ({button.count})
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
                  onPress={onSelectElement}
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
                onPress={() => onSelectElement(element)}
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: 14,
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
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
});

export default BirthChartElementsBottomSheet;
