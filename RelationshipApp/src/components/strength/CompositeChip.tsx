import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CompositeCharacter } from '../../../../shared/api/relationships';
import { compositeShort, ELEMENT_TINT } from './archetypeTokens';

interface CompositeChipProps {
  composite?: CompositeCharacter | null;
}

const DEFAULT_TINT = '#cabeff';

/**
 * Composite "character" coordinate chip — the relationship as an entity
 * ("Earth · Mercury-driven"), tinted by its dominant element. A separate
 * coordinate from the archetype; never merged into it.
 */
export function CompositeChip({ composite }: CompositeChipProps) {
  const text = compositeShort(composite);
  if (!text) return null;
  const tint = (composite?.element && ELEMENT_TINT[composite.element]) || DEFAULT_TINT;

  return (
    <View style={[styles.chip, { borderColor: `${tint}40` }]}>
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <Text style={styles.label}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: 'rgba(236,232,255,0.82)',
  },
});
