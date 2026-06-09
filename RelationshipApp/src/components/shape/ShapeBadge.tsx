import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getShapeToken, type ShapeKind } from './shapeTokens';
import { ShapeGlyph } from './ShapeGlyph';

interface ShapeBadgeProps {
  kind: ShapeKind | string | null | undefined;
  size?: number;
}

export function ShapeBadge({ kind, size = 26 }: ShapeBadgeProps) {
  const token = getShapeToken(kind);
  if (!token) return null;
  return (
    <View style={styles.wrap}>
      <ShapeGlyph kind={kind} size={size} />
      <Text style={[styles.name, { color: token.color }]} numberOfLines={1}>
        {token.name.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 2,
  },
  name: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
