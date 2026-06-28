import type {
  CompositeCharacter,
  DetailArchetype,
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

/** The detail-tier archetype (markers / compounds / woven / Mosaic), if present. */
export function getDetailArchetype(
  relationship: UserCompositeChart
): DetailArchetype | null {
  return getOverallSummary(relationship)?.detailArchetype ?? null;
}

/**
 * Preferred headline archetype label: the detail-tier name (Common Cause, Fated Bond,
 * Bedrock, …) when present and not suppressed; otherwise the legacy cluster archetype label.
 * Mosaic (suppressed) intentionally falls back to the cluster label.
 */
export function getArchetypeLabel(
  relationship: UserCompositeChart
): string | null {
  const summary = getOverallSummary(relationship);
  const detail = summary?.detailArchetype;
  if (detail?.label && !detail.suppressed) return detail.label;
  return summary?.label ?? null;
}

/**
 * The composite "character" coordinate (element + dominant planet).
 *
 * Present top-level on the single analysis read; on the list endpoint
 * (getUserCompositeCharts) the backend surfaces it nested under
 * `relationshipAnalysisStatus.compositeCharacter`, so we check both.
 */
export function getCompositeCharacter(
  relationship: UserCompositeChart
): CompositeCharacter | null {
  return (
    relationship.compositeCharacter ??
    relationship.relationshipAnalysisStatus?.compositeCharacter ??
    null
  );
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
