import React, { useState } from 'react';
import { LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import type { PlacementDetail } from '../utils/placements';
import { formatPlacementSummary } from '../utils/placements';

const PLANET_GLYPHS: Record<PlacementDetail['key'], string> = {
  sun: '☉',
  moon: '☽',
  venus: '♀',
  mars: '♂',
  ascendant: '↑',
  descendant: '↓',
};

interface PlacementRowProps {
  placement: PlacementDetail;
}

export function PlacementRow({ placement }: PlacementRowProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.ghostBorder,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.header}>
        <View
          style={[
            styles.glyph,
            {
              backgroundColor: colors.surfaceHigh,
              borderColor: colors.ghostBorder,
            },
          ]}
        >
          <Text style={[styles.glyphText, { color: colors.accent }]}>
            {PLANET_GLYPHS[placement.key]}
          </Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.label, { color: colors.text }]}>{placement.label}</Text>
          <Text style={[styles.summary, { color: colors.textMuted }]}>
            {formatPlacementSummary(placement)}
          </Text>
        </View>
        <Text style={[styles.chev, { color: colors.textSubtle }]}>{expanded ? '˅' : '›'}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.body}>
          <View style={[styles.divider, { backgroundColor: colors.ghostBorder }]} />
          <Text style={[styles.interpretation, { color: colors.textMuted }]}>
            {placement.interpretation}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  glyph: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphText: {
    fontSize: 14,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  summary: {
    fontSize: 12,
  },
  chev: {
    fontSize: 18,
    fontWeight: '500',
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  divider: {
    height: 1,
  },
  interpretation: {
    fontSize: 14,
    lineHeight: 21,
  },
});
