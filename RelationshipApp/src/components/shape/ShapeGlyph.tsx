import React from 'react';
import Svg, { Polygon } from 'react-native-svg';
import { getShapeToken, type ShapeKind } from './shapeTokens';

interface ShapeGlyphProps {
  kind: ShapeKind | string | null | undefined;
  size?: number;
  filled?: boolean;
}

export function ShapeGlyph({ kind, size = 26, filled = true }: ShapeGlyphProps) {
  const token = getShapeToken(kind);
  if (!token) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon
        points={token.points}
        fill={filled ? 'rgba(127, 119, 221, 0.22)' : 'none'}
        stroke={token.color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
