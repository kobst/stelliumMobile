// Visual tokens for the detail-archetype headline and composite-character chip.
// Mirrors the Iris design (iris-relationships.jsx VALENCE / FAMILY_PATH / ELEMENT_TINT).

import type { CompositeCharacter, DetailArchetype } from '../../../../shared/api/relationships';

// nameValence drives colour: favorable = warm, friction = cool/charged
// (texture, not "bad"), neutral = muted.
export interface ValenceToken {
  fg: string;
  bg: string;
  line: string;
}

export const VALENCE: Record<'favorable' | 'friction' | 'neutral', ValenceToken> = {
  favorable: { fg: '#F2C14E', bg: 'rgba(242,193,78,0.12)', line: 'rgba(242,193,78,0.42)' },
  friction: { fg: '#5FD0E6', bg: 'rgba(95,208,230,0.12)', line: 'rgba(95,208,230,0.42)' },
  neutral: { fg: '#C7C2DE', bg: 'rgba(199,194,222,0.10)', line: 'rgba(199,194,222,0.32)' },
};

export function valenceOf(detail: DetailArchetype | null | undefined): ValenceToken {
  const key = detail?.nameValence;
  if (key && key in VALENCE) {
    return VALENCE[key];
  }
  return VALENCE.neutral;
}

// route (name family) → a distinct glyph echoing the chart's geometry.
//   marker = single thread → diamond · compound = two → pentagon
//   woven = all three → hexagon · secondary = soft theme → circle
export type FamilyRoute = NonNullable<DetailArchetype['route']>;

// SVG path data on a 0 0 24 24 viewBox. `secondary` is drawn as a circle.
export const FAMILY_PATH: Record<Exclude<FamilyRoute, 'secondary'>, string> = {
  marker: 'M12 2 L21 12 L12 22 L3 12 Z',
  compound: 'M12 2 L21.5 9 L17.9 20.5 L6.1 20.5 L2.5 9 Z',
  woven: 'M12 2 L19 7 L19 17 L12 22 L5 17 L5 7 Z',
  cluster_leaf: 'M12 2 L21 12 L12 22 L3 12 Z',
  strength_only: 'M12 2 L21 12 L12 22 L3 12 Z',
};

// Composite "character" coordinate — element tints.
export const ELEMENT_TINT: Record<string, string> = {
  Fire: '#F2A25C',
  Earth: '#9FD08C',
  Air: '#9DC7F2',
  Water: '#7FB9E6',
};

export function compositeShort(composite: CompositeCharacter | null | undefined): string {
  if (!composite) return '';
  if (composite.shortLabel) return composite.shortLabel;
  if (composite.element && composite.planet) {
    return `${composite.element} · ${composite.planet}-driven`;
  }
  return '';
}
