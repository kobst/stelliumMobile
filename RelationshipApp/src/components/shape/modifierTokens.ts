import type { RelationshipModifier } from '../../../../src/api/relationships';

export type ModifierKey = RelationshipModifier;

export interface ModifierToken {
  key: ModifierKey;
  /** Hex color used for text + chip border + background tint. */
  color: string;
  /** Rendered to the left of the label. Empty string = no glyph. */
  glyph: string;
}

export const MODIFIER_TOKENS: Record<ModifierKey, ModifierToken> = {
  Magnetic: { key: 'Magnetic', color: '#E899C0', glyph: '⌁' },
  'Easy-Flowing': { key: 'Easy-Flowing', color: '#82C8B4', glyph: '∼' },
  'Highly Active': { key: 'Highly Active', color: '#A89BE3', glyph: '⟳' },
  'Tension-Rich': { key: 'Tension-Rich', color: '#E89A5C', glyph: '' },
  'Low Signal': { key: 'Low Signal', color: '#8A8590', glyph: '⌀' },
};

export const ALL_MODIFIERS: readonly ModifierKey[] = [
  'Magnetic',
  'Easy-Flowing',
  'Highly Active',
  'Tension-Rich',
  'Low Signal',
];

/**
 * Truncation priority — when more chips than fit, lead with positive signals.
 * Used by list cards to drop overflow from the right.
 */
const TRUNCATION_PRIORITY: Record<ModifierKey, number> = {
  Magnetic: 0,
  'Easy-Flowing': 1,
  'Highly Active': 2,
  'Tension-Rich': 3,
  'Low Signal': 4,
};

export function sortModifiersForDisplay(
  modifiers: readonly ModifierKey[]
): ModifierKey[] {
  return [...modifiers].sort(
    (a, b) => TRUNCATION_PRIORITY[a] - TRUNCATION_PRIORITY[b]
  );
}

export function getModifierToken(key: string): ModifierToken | null {
  if (key in MODIFIER_TOKENS) {
    return MODIFIER_TOKENS[key as ModifierKey];
  }
  return null;
}
