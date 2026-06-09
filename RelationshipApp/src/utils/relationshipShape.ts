import type {
  OverallSummary,
  RelationshipMagnitudeTier,
  RelationshipModifier,
  RelationshipShapeKind,
  UserCompositeChart,
} from '../../../shared/api/relationships';

/**
 * Extracts the v4 archetype summary from a relationship row,
 * preferring the live `clusterScoring.overall.summary` payload and
 * falling back to the cached `relationshipAnalysisStatus.overall.summary`.
 */
export function getOverallSummary(
  relationship: UserCompositeChart
): OverallSummary | null {
  const live = relationship.clusterScoring?.overall?.summary;
  if (live) return live;
  const cached = relationship.relationshipAnalysisStatus?.overall?.summary;
  return cached ?? null;
}

export function getShapeKind(
  relationship: UserCompositeChart
): RelationshipShapeKind | null {
  return getOverallSummary(relationship)?.shapeKind ?? null;
}

export function getMagnitudeTier(
  relationship: UserCompositeChart
): RelationshipMagnitudeTier | null {
  return getOverallSummary(relationship)?.magnitudeTier ?? null;
}

export function getModifiers(
  relationship: UserCompositeChart
): RelationshipModifier[] {
  return getOverallSummary(relationship)?.modifiers ?? [];
}

export function getConfidence(
  relationship: UserCompositeChart
): number | null {
  const value = getOverallSummary(relationship)?.confidence;
  return typeof value === 'number' ? value : null;
}
