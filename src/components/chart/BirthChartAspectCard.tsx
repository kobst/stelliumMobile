import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BirthChartAspect } from '../../api/charts';
import { AstroIcon } from '../../../utils/astrologyIcons';

interface BirthChartAspectCardProps {
  element: BirthChartAspect;
  colors: any;
  onPress?: (element: BirthChartAspect) => void;
  isSelected?: boolean;
}

const ASPECT_SYMBOLS: { [key: string]: string } = {
  'conjunction': '☌',
  'sextile': '⚹',
  'square': '□',
  'trine': '∆',
  'opposition': '☍',
  'quincunx': '⚻',
};

// Aspect type colors (harmonious vs challenging)
const ASPECT_COLORS: { [key: string]: { bg: string; text: string } } = {
  'trine': { bg: 'rgba(76, 175, 80, 0.12)', text: '#388E3C' },
  'sextile': { bg: 'rgba(76, 175, 80, 0.12)', text: '#388E3C' },
  'square': { bg: 'rgba(244, 67, 54, 0.12)', text: '#D32F2F' },
  'opposition': { bg: 'rgba(244, 67, 54, 0.12)', text: '#D32F2F' },
  'conjunction': { bg: 'rgba(33, 150, 243, 0.12)', text: '#1976D2' },
  'quincunx': { bg: 'rgba(33, 150, 243, 0.12)', text: '#1976D2' },
};

// Helper function to format house number with ordinal suffix
function formatHouseOrdinal(house: number | null | undefined): string {
  if (!house || house === 0) return '';
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = house % 100;
  const ordinal = house + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  return ` in house ${ordinal}`;
}

const BirthChartAspectCard: React.FC<BirthChartAspectCardProps> = ({
  element,
  colors,
  onPress,
  isSelected = false,
}) => {
  const aspectType = element.aspectType.toLowerCase();
  const aspectName = element.aspectType.charAt(0).toUpperCase() + element.aspectType.slice(1);
  const aspectColor = ASPECT_COLORS[aspectType] || ASPECT_COLORS['conjunction'];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isSelected ? colors.primary : 'transparent',
          borderWidth: 1,
        },
      ]}
      onPress={() => onPress?.(element)}
      activeOpacity={0.8}
    >
      {/* Title Section */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.titleLine1, { color: colors.onSurface, flex: 1 }]} numberOfLines={2}>
              {element.planet1} {aspectName} {element.planet2}
            </Text>
            <Text style={[styles.orbText, { color: colors.onSurface }]}>
              {element.orb.toFixed(1)}° orb
            </Text>
          </View>

          {/* 3-line detailed format with SVG icons */}
          <View style={{ marginTop: 4 }}>
            {/* Line 1: Planet 1, sign, and house */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
                {element.planet1}{' '}
              </Text>
              <AstroIcon type="planet" name={element.planet1} size={11} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
                {' '}in {element.planet1Sign}{' '}
              </Text>
              <AstroIcon type="zodiac" name={element.planet1Sign} size={11} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
                {formatHouseOrdinal(element.planet1House)}
              </Text>
            </View>

            {/* Line 2: Aspect name with symbol */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
              <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
                {ASPECT_SYMBOLS[aspectType] || ''} {aspectName}
              </Text>
            </View>

            {/* Line 3: Planet 2, sign, and house */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
                {element.planet2}{' '}
              </Text>
              <AstroIcon type="planet" name={element.planet2} size={11} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
                {' '}in {element.planet2Sign}{' '}
              </Text>
              <AstroIcon type="zodiac" name={element.planet2Sign} size={11} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 11, lineHeight: 16, color: colors.onSurfaceVariant }}>
                {formatHouseOrdinal(element.planet2House)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Chips Row */}
      <View style={styles.chipRow}>
        {/* Aspect Type Chip */}
        <View style={[
          styles.aspectChip,
          { backgroundColor: aspectColor.bg },
        ]}>
          <Text style={[styles.aspectText, { color: aspectColor.text }]}>
            {aspectName}
          </Text>
        </View>

        {/* Selection checkmark */}
        {isSelected && (
          <View style={[styles.selectionIndicator, { marginLeft: 'auto' }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
  },
  titleLine1: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
    lineHeight: 20,
  },
  orbText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    lineHeight: 20,
  },
  selectionIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  aspectChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aspectText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default BirthChartAspectCard;
