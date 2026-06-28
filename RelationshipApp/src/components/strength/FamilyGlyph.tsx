import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { FAMILY_PATH, type FamilyRoute } from './archetypeTokens';

interface FamilyGlyphProps {
  route?: FamilyRoute | null;
  color: string;
  size?: number;
  strokeOnly?: boolean;
}

/**
 * The detail-archetype family glyph: a small geometric mark whose shape encodes
 * the name "route" (marker → diamond, compound → pentagon, woven → hexagon).
 * Colour comes from the archetype's valence.
 */
export function FamilyGlyph({ route = 'marker', color, size = 22, strokeOnly = false }: FamilyGlyphProps) {
  const fillOpacity = strokeOnly ? 0 : 0.16;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={FAMILY_PATH[route ?? 'marker'] ?? FAMILY_PATH.marker}
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={color}
        fillOpacity={fillOpacity}
      />
    </Svg>
  );
}
