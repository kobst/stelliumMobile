import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ModifierChip } from './ModifierChip';
import { sortModifiersForDisplay, type ModifierKey } from './modifierTokens';

interface ModifierChipRowProps {
  modifiers: readonly (ModifierKey | string)[] | null | undefined;
  /** Cap displayed chips. Excess dropped per truncation priority. */
  max?: number;
  align?: 'flex-start' | 'center' | 'flex-end';
  style?: StyleProp<ViewStyle>;
}

function isModifierKey(value: string): value is ModifierKey {
  return (
    value === 'Magnetic' ||
    value === 'Easy-Flowing' ||
    value === 'Highly Active' ||
    value === 'Tension-Rich' ||
    value === 'Low Signal'
  );
}

export function ModifierChipRow({
  modifiers,
  max = 4,
  align = 'flex-start',
  style,
}: ModifierChipRowProps) {
  if (!modifiers || modifiers.length === 0) return null;
  const known = modifiers.filter((m): m is ModifierKey =>
    typeof m === 'string' && isModifierKey(m)
  );
  if (known.length === 0) return null;
  const sorted = sortModifiersForDisplay(known);
  const visible = sorted.slice(0, max);
  return (
    <View style={[styles.row, { justifyContent: align }, style]}>
      {visible.map((key) => (
        <ModifierChip key={key} modifier={key} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
});
