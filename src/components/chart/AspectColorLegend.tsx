import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';

interface AspectLegendItem {
  symbol: string;
  name: string;
  type: 'trine' | 'square' | 'opposition' | 'sextile' | 'conjunction' | 'quincunx' | 'semisextile' | 'semisquare' | 'sesquiquadrate';
}

interface AspectColorLegendProps {
  style?: any;
  compact?: boolean;
}

const AspectColorLegend: React.FC<AspectColorLegendProps> = ({
  style,
  compact = false,
}) => {
  const { colors } = useTheme();

  const aspectItems: AspectLegendItem[] = [
    { symbol: '☌', name: 'Conjunction', type: 'conjunction' },
    { symbol: '△', name: 'Trine', type: 'trine' },
    { symbol: '□', name: 'Square', type: 'square' },
    { symbol: '☍', name: 'Opposition', type: 'opposition' },
    { symbol: '⚹', name: 'Sextile', type: 'sextile' },
    { symbol: '⚻', name: 'Quincunx', type: 'quincunx' },
  ];

  // Show fewer items in compact mode
  const displayItems = compact ? aspectItems.slice(0, 4) : aspectItems;

  const getAspectColor = (aspectType: string) => {
    switch (aspectType) {
      case 'trine':
        return colors.aspectTrine;
      case 'square':
        return colors.aspectSquare;
      case 'opposition':
        return colors.aspectOpposition;
      case 'sextile':
        return colors.aspectSextile;
      case 'conjunction':
        return colors.aspectConjunction;
      case 'quincunx':
        return colors.aspectQuincunx;
      default:
        return colors.onSurfaceMed;
    }
  };

  const renderAspectItem = (item: AspectLegendItem) => {
    const aspectColor = getAspectColor(item.type);

    return (
      <View key={item.type} style={styles.legendItem}>
        <View style={[styles.colorIndicator, { backgroundColor: aspectColor }]} />
        <Text style={[styles.aspectSymbol, { color: aspectColor }]}>
          {item.symbol}
        </Text>
        <Text style={[styles.aspectName, { color: colors.onSurfaceMed }]}>
          {item.name}
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderBottomColor: colors.strokeSubtle,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurfaceHigh }]}>
          Aspect Legend
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayItems.map(renderAspectItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  aspectSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 16,
    textAlign: 'center',
  },
  aspectName: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AspectColorLegend;
