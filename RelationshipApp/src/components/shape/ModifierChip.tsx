import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getModifierToken, type ModifierKey } from './modifierTokens';

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ModifierChipProps {
  modifier: ModifierKey | string;
}

export function ModifierChip({ modifier }: ModifierChipProps) {
  const token = getModifierToken(modifier);
  if (!token) return null;
  const displayLabel = token.key.replace(/-/g, ' ');
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: withAlpha(token.color, 0.12),
          borderColor: withAlpha(token.color, 0.25),
        },
      ]}
    >
      <Text style={[styles.label, { color: token.color }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
