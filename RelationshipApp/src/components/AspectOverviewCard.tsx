import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import type { AspectCounts } from '../utils/placementAspects';

interface AspectOverviewCardProps {
  counts: AspectCounts;
}

const SUPPORT_COLOR = '#82C8B4';
const TENSION_COLOR = '#E8856B';
const FUSION_COLOR = '#D4A843';
const SUPPORT_BG = 'rgba(130, 200, 180, 0.12)';
const TENSION_BG = 'rgba(232, 133, 107, 0.12)';
const FUSION_BG = 'rgba(212, 168, 67, 0.15)';

export function AspectOverviewCard({ counts }: AspectOverviewCardProps) {
  const { colors } = useTheme();
  const tiles = [
    { label: 'Flowing', count: counts.support, color: SUPPORT_COLOR, bg: SUPPORT_BG },
    { label: 'Tension', count: counts.tension, color: TENSION_COLOR, bg: TENSION_BG },
    { label: 'Fusion', count: counts.fusion, color: FUSION_COLOR, bg: FUSION_BG },
  ];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
      ]}
    >
      {tiles.map((tile) => (
        <View key={tile.label} style={[styles.tile, { backgroundColor: tile.bg }]}>
          <Text style={[styles.count, { color: tile.color }]}>{tile.count}</Text>
          <Text style={[styles.label, { color: colors.textSubtle }]}>{tile.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  count: {
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
