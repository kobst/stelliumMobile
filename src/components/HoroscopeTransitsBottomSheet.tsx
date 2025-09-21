import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTheme } from '../theme';
import { TransitEvent } from '../types';
import { AstroIcon } from '../../utils/astrologyIcons';
import { formatDate, formatDateRange } from '../utils/dateHelpers';

interface HoroscopeTransitsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  transitWindows: TransitEvent[];
  selectedTransits: TransitEvent[];
  onSelectTransit: (transit: TransitEvent) => void;
  onClearSelection: () => void;
}

const HoroscopeTransitsBottomSheet: React.FC<HoroscopeTransitsBottomSheetProps> = ({
  visible,
  onClose,
  transitWindows,
  selectedTransits,
  onSelectTransit,
  onClearSelection,
}) => {
  const { colors } = useTheme();
  const [filterTab, setFilterTab] = useState<'all' | 'natal' | 'transit-to-transit'>('all');

  // Filter transits based on type
  const filteredTransits = useMemo(() => {
    if (!transitWindows || transitWindows.length === 0) return [];

    let filtered = transitWindows;

    // Filter by transit type
    if (filterTab === 'natal') {
      filtered = filtered.filter(transit => transit.type === 'transit-to-natal');
    } else if (filterTab === 'transit-to-transit') {
      filtered = filtered.filter(transit => transit.type === 'transit-to-transit');
    }

    // Sort by priority and date
    return filtered.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }, [transitWindows, filterTab]);

  // Check if transit is selected
  const isTransitSelected = (transit: TransitEvent): boolean => {
    return selectedTransits.some(selected =>
      selected.transitingPlanet === transit.transitingPlanet &&
      selected.targetPlanet === transit.targetPlanet &&
      selected.aspect === transit.aspect &&
      selected.start === transit.start &&
      selected.end === transit.end
    );
  };

  // Handle transit selection
  const handleTransitPress = (transit: TransitEvent) => {
    const isCurrentlySelected = isTransitSelected(transit);

    if (isCurrentlySelected) {
      // Remove the transit
      onSelectTransit(transit);
    } else if (selectedTransits.length >= 3) {
      Alert.alert(
        'Selection Limit',
        'Maximum 3 transits can be selected. Deselect one to add another.',
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      // Add the transit
      onSelectTransit(transit);
    }
  };

  // Get aspect symbol
  const getAspectSymbol = (aspect: string): string => {
    const aspectSymbols: { [key: string]: string } = {
      'conjunction': '☌',
      'sextile': '⚹',
      'square': '□',
      'trine': '△',
      'opposition': '☍',
      'quincunx': '⚻',
      'inconjunct': '⚻',
    };
    return aspectSymbols[aspect?.toLowerCase()] || aspect || '';
  };

  // Render transit description with symbols
  const TransitDescriptionWithSymbols: React.FC<{
    transit: TransitEvent;
    textStyle: any;
    iconSize?: number;
    iconColor?: string;
  }> = ({ transit, textStyle, iconSize = 16, iconColor = colors.onSurface }) => {
    if (transit.description) {
      return <Text style={textStyle}>{transit.description}</Text>;
    }

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Transiting Planet */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AstroIcon type="planet" name={transit.transitingPlanet} size={iconSize} color={iconColor} />
          <Text style={textStyle}> {transit.transitingPlanet}</Text>
        </View>

        {/* Retrograde indicator */}
        {transit.isRetrograde && <Text style={textStyle}> ℞</Text>}

        {/* Sign information */}
        {transit.transitingSign && (
          <>
            <Text style={textStyle}> in </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AstroIcon type="zodiac" name={transit.transitingSign} size={iconSize} color={iconColor} />
              <Text style={textStyle}> {transit.transitingSign}</Text>
            </View>
          </>
        )}

        {/* Aspect */}
        <Text style={textStyle}> {getAspectSymbol(transit.aspect)} {transit.aspect} </Text>

        {/* Target */}
        {transit.type === 'transit-to-natal' && <Text style={textStyle}>natal </Text>}
        {transit.targetPlanet && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AstroIcon type="planet" name={transit.targetPlanet} size={iconSize} color={iconColor} />
            <Text style={textStyle}> {transit.targetPlanet}</Text>
          </View>
        )}
        {transit.targetIsRetrograde && <Text style={textStyle}> ℞</Text>}

        {/* Target sign */}
        {transit.targetSign && (
          <>
            <Text style={textStyle}> in </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AstroIcon type="zodiac" name={transit.targetSign} size={iconSize} color={iconColor} />
              <Text style={textStyle}> {transit.targetSign}</Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const filterTabs = [
    { key: 'all', label: 'All Transits' },
    { key: 'natal', label: 'To Natal' },
    { key: 'transit-to-transit', label: 'Transit-to-Transit' },
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
            Select Transits
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            Choose up to 3 transit events ({selectedTransits.length}/3)
          </Text>

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: colors.onSurfaceVariant }]}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterTabs, { backgroundColor: colors.surface }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsContent}
          >
            {filterTabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterTab,
                  filterTab === tab.key && [styles.activeFilterTab, { backgroundColor: colors.primary }],
                  { borderColor: colors.border }
                ]}
                onPress={() => setFilterTab(tab.key)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filterTab === tab.key
                      ? [styles.activeFilterTabText, { color: colors.onPrimary }]
                      : { color: colors.onSurfaceVariant }
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transits List */}
        <ScrollView style={styles.transitsList} showsVerticalScrollIndicator={false}>
          {filteredTransits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                No transit events found for the selected filter.
              </Text>
            </View>
          ) : (
            filteredTransits.map((transit, index) => {
              const isSelected = isTransitSelected(transit);

              return (
                <TouchableOpacity
                  key={`${transit.transitingPlanet}-${transit.aspect}-${transit.targetPlanet}-${index}`}
                  style={[
                    styles.transitItem,
                    {
                      backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => handleTransitPress(transit)}
                  activeOpacity={0.7}
                >
                  {/* Selection Indicator */}
                  <View style={styles.transitHeader}>
                    <View style={[
                      styles.selectionIndicator,
                      isSelected ? styles.selectedIndicator : styles.unselectedIndicator,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.onSurfaceVariant,
                      }
                    ]}>
                      {isSelected ? (
                        <Text style={[styles.checkmark, { color: colors.onPrimary }]}>✓</Text>
                      ) : null}
                    </View>

                    {/* Priority Indicator */}
                    {transit.priority && transit.priority > 5 && (
                      <View style={[styles.priorityBadge, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.priorityText, { color: colors.onSecondary }]}>
                          High
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Transit Description */}
                  <View style={styles.transitContent}>
                    <TransitDescriptionWithSymbols
                      transit={transit}
                      textStyle={[
                        styles.transitDescription,
                        { color: isSelected ? colors.onPrimaryContainer : colors.onSurface }
                      ]}
                      iconSize={16}
                      iconColor={isSelected ? colors.onPrimaryContainer : colors.onSurface}
                    />

                    {/* Date Information */}
                    <Text style={[
                      styles.transitDateRange,
                      { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant }
                    ]}>
                      {formatDateRange(transit.start, transit.end)}
                    </Text>

                    {transit.isExactInRange && transit.exact && (
                      <Text style={[
                        styles.transitExactDate,
                        { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant }
                      ]}>
                        Exact: {formatDate(transit.exact)}
                      </Text>
                    )}

                    {transit.orbAtStart !== undefined && transit.orbAtEnd !== undefined && (
                      <Text style={[
                        styles.transitOrbInfo,
                        { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant }
                      ]}>
                        Orb: {transit.orbAtStart.toFixed(1)}° → {transit.orbAtEnd.toFixed(1)}° ({transit.orbDirection})
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: colors.errorContainer }]}
            onPress={onClearSelection}
            disabled={selectedTransits.length === 0}
          >
            <Text style={[
              styles.clearButtonText,
              {
                color: selectedTransits.length === 0 ? colors.onSurfaceVariant : colors.onErrorContainer,
                opacity: selectedTransits.length === 0 ? 0.5 : 1,
              }
            ]}>
              Clear All ({selectedTransits.length})
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
  filterTabs: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterTabsContent: {
    paddingRight: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  activeFilterTab: {
    borderWidth: 0,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterTabText: {
    fontWeight: '600',
  },
  transitsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  transitItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedIndicator: {
    transform: [{ scale: 1 }],
  },
  unselectedIndicator: {
    transform: [{ scale: 1 }],
  },
  checkmark: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transitContent: {
    flex: 1,
  },
  transitDescription: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  transitDateRange: {
    fontSize: 12,
    marginBottom: 2,
  },
  transitExactDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  transitOrbInfo: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  clearButton: {
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

export default HoroscopeTransitsBottomSheet;