import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { getShapeToken, type ShapeKind } from './shapeTokens';
import { ShapeGlyph } from './ShapeGlyph';

interface ShapePatternCardProps {
  kind: ShapeKind | string | null | undefined;
}

export function ShapePatternCard({ kind }: ShapePatternCardProps) {
  const { colors } = useTheme();
  const token = getShapeToken(kind);
  if (!token) return null;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: 'rgba(127, 119, 221, 0.08)',
          borderColor: 'rgba(127, 119, 221, 0.32)',
        },
      ]}
    >
      <ShapeGlyph kind={kind} size={42} />
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.text }]}>{token.name}</Text>
          <Text style={[styles.tag, { color: colors.textSubtle }]}>
            shape pattern
          </Text>
        </View>
        <Text style={[styles.meaning, { color: colors.textMuted }]}>
          {token.meaning}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  tag: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  meaning: {
    fontSize: 13,
    lineHeight: 19,
  },
});
