/**
 * Shape pattern tokens for v4 archetype enrichment.
 *
 * Maps the backend `shapeKind` field to display name, meaning, glyph SVG,
 * color, and sort weight. Used by the shape badge on Relationship list cards
 * and the pattern card on the connection detail screen.
 *
 * All glyphs are stylized geometric icons — they do NOT recreate the user's
 * actual radar shape. Two relationships sharing a shapeKind display the
 * identical glyph. This is what makes the categorical nature visible.
 *
 * Construction principle: every glyph deforms from the same base regular
 * pentagon (vertices at 72° intervals, radius 9, viewBox 24x24). This keeps
 * the set reading as a unified family.
 */

export type ShapeKind =
  | 'even'
  | 'single_spike'
  | 'ridge'
  | 'ridge_missing'
  | 'trough'
  | 'soft_shape';

export interface ShapeToken {
  /** Backend key — never shown to users. */
  kind: ShapeKind;
  /** User-facing display name (sentence case). */
  name: string;
  /** One-line meaning shown beside the glyph. */
  meaning: string;
  /** SVG polygon points string. Use inside <svg viewBox="0 0 24 24">. */
  points: string;
  /** Accent stroke color. Default: brand purple for all six. */
  color: string;
  /** Sort weight for "Strongest first" — higher = more concentrated/intense shape. */
  sortWeight: number;
}

/**
 * Brand purple. Single color across all six glyphs by design — the
 * geometry distinguishes them, color would be redundant.
 */
const SHAPE_COLOR = '#7F77DD';

export const SHAPE_TOKENS: Record<ShapeKind, ShapeToken> = {
  even: {
    kind: 'even',
    name: 'Plateau',
    meaning: 'Every cluster lands in the same range — no peaks, no valleys.',
    points: '12,3 20.6,9.2 17.3,19.3 6.7,19.3 3.4,9.2',
    color: SHAPE_COLOR,
    sortWeight: 1,
  },
  single_spike: {
    kind: 'single_spike',
    name: 'Pillar',
    meaning: 'One cluster towers above the rest.',
    points: '12,1.5 17.7,10.2 15.5,16.9 8.5,16.9 6.3,10.2',
    color: SHAPE_COLOR,
    sortWeight: 4,
  },
  ridge: {
    kind: 'ridge',
    name: 'Ridge',
    meaning: 'Two adjacent clusters lead, the rest sit lower.',
    points: '12,2 21.5,8.9 17.3,19.3 6.7,19.3 3.4,9.2',
    color: SHAPE_COLOR,
    sortWeight: 5,
  },
  ridge_missing: {
    kind: 'ridge_missing',
    name: 'Crescent',
    meaning: 'Two clusters lead the rest.',
    points: '11,2.5 21,8 17.3,19.3 12,13 4,10',
    color: SHAPE_COLOR,
    sortWeight: 6,
  },
  trough: {
    kind: 'trough',
    name: 'Notch',
    meaning: 'One cluster dips below an even line.',
    points: '12,3 20.6,9.2 13,14 6.7,19.3 3.4,9.2',
    color: SHAPE_COLOR,
    sortWeight: 3,
  },
  soft_shape: {
    kind: 'soft_shape',
    name: 'Mosaic',
    meaning: 'A varied mix without a single dominant pattern.',
    points: '11,3 19.5,8 16.5,18 7,19 4,11',
    color: SHAPE_COLOR,
    sortWeight: 2,
  },
};

/**
 * Convenience accessor with a fallback for unknown values.
 * Use this rather than indexing SHAPE_TOKENS directly so the UI
 * never crashes if the backend introduces a new shapeKind before
 * the frontend ships token coverage.
 */
export function getShapeToken(kind: string | null | undefined): ShapeToken {
  if (kind && kind in SHAPE_TOKENS) {
    return SHAPE_TOKENS[kind as ShapeKind];
  }
  return SHAPE_TOKENS.soft_shape;
}

/**
 * Usage example:
 *
 * import { getShapeToken } from './shape-tokens';
 *
 * function ShapeBadge({ shapeKind }: { shapeKind: string }) {
 *   const token = getShapeToken(shapeKind);
 *   return (
 *     <div className="shape-badge">
 *       <svg width="26" height="26" viewBox="0 0 24 24">
 *         <polygon
 *           points={token.points}
 *           fill="rgba(127, 119, 221, 0.25)"
 *           stroke={token.color}
 *           strokeWidth="1.2"
 *           strokeLinejoin="round"
 *         />
 *       </svg>
 *       <span className="shape-badge__name">{token.name.toUpperCase()}</span>
 *     </div>
 *   );
 * }
 */