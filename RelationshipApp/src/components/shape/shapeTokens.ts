import type { RelationshipShapeKind } from '../../../../src/api/relationships';

export type ShapeKind = RelationshipShapeKind;

export interface ShapeToken {
  kind: ShapeKind;
  name: string;
  meaning: string;
  /** SVG polygon points string for use inside <Svg viewBox="0 0 24 24">. */
  points: string;
  color: string;
  sortWeight: number;
}

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

export const SHAPE_KIND_ORDER: readonly ShapeKind[] = [
  'ridge_missing',
  'ridge',
  'single_spike',
  'trough',
  'even',
  'soft_shape',
];

export function getShapeToken(kind: string | null | undefined): ShapeToken | null {
  if (kind && kind in SHAPE_TOKENS) {
    return SHAPE_TOKENS[kind as ShapeKind];
  }
  return null;
}
