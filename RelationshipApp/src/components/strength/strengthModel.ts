// Relationship Strength model
// ───────────────────────────────────────────────
// Mirrors the Iris design hierarchy (iris-relationships.jsx):
//   strength FIRST (continuous, not a grade), an optional flavour tag,
//   the five-pillar bars, then the archetype demoted to a detail card.
//
// strengthOf() computes the UNWEIGHTED mean of the five pillars so a single
// number can lead without privileging any one cluster.

import type {
  OverallSummary,
  RelationshipModifier,
} from '../../../../src/api/relationships';

export type ClusterKey =
  | 'Harmony'
  | 'Passion'
  | 'Connection'
  | 'Stability'
  | 'Growth';

export const CLUSTER_ORDER: readonly ClusterKey[] = [
  'Harmony',
  'Passion',
  'Connection',
  'Stability',
  'Growth',
];

interface ClusterMeta {
  label: string;
  emoji: string;
  tint: string;
}

// Tints carried over from the Iris design tokens (CATS) — the visual identity
// for each pillar.
export const CLUSTER_META: Record<ClusterKey, ClusterMeta> = {
  Harmony: { label: 'Harmony', emoji: '❤', tint: '#F8A4A4' },
  Passion: { label: 'Passion', emoji: '✦', tint: '#FFB07A' },
  Connection: { label: 'Connection', emoji: '◉', tint: '#E7B5FF' },
  Stability: { label: 'Stability', emoji: '◆', tint: '#9DD6F2' },
  Growth: { label: 'Growth', emoji: '✿', tint: '#A5E3B8' },
};

export type PillarScores = Record<ClusterKey, number>;

// A pillar lead is "clear" when the top pillar sits this many points above the
// second-highest. Below the margin the bond reads as broad/even (still positive).
const LEAD_MARGIN = 8;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Normalize a cluster score to 0–100. The backend sometimes emits 0–1 decimals
 * and sometimes 0–100 percentages; treat values <= 1 as a fraction.
 */
export function normalizeScore(score: number | undefined | null): number {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }
  return clamp(score > 1 ? score : score * 100);
}

/**
 * Unweighted mean of the five pillars (0–100, rounded). This is the continuous
 * "Relationship Strength" reading — deliberately NOT a weighted/graded score.
 */
export function strengthOf(scores: PillarScores): number {
  const sum = CLUSTER_ORDER.reduce((acc, key) => acc + (scores[key] || 0), 0);
  return Math.round(sum / CLUSTER_ORDER.length);
}

export interface FlavorResult {
  flavorPresent: boolean;
  flavorCluster: ClusterKey | null;
}

function matchClusterKey(raw: string): ClusterKey | null {
  const normalized = raw.trim().toLowerCase();
  return CLUSTER_ORDER.find((key) => key.toLowerCase() === normalized) ?? null;
}

/**
 * Decide whether a single pillar clearly leads. When one does we surface
 * "{Cluster}-Forward"; otherwise the bond is broad across the five pillars.
 *
 * Prefers explicit backend signals (shapeKind / dominantClusters) when present,
 * and falls back to a margin heuristic on the raw pillar scores.
 */
export function deriveFlavor(
  scores: PillarScores,
  summary?: OverallSummary | null
): FlavorResult {
  if (summary?.shapeKind) {
    const broadShapes = new Set(['even', 'soft_shape', 'trough']);
    if (broadShapes.has(summary.shapeKind)) {
      return { flavorPresent: false, flavorCluster: null };
    }
    const dominant = summary.dominantClusters;
    if (dominant && dominant.length === 1) {
      const key = matchClusterKey(dominant[0]);
      if (key) {
        return { flavorPresent: true, flavorCluster: key };
      }
    }
  }

  const ranked = [...CLUSTER_ORDER].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
  const gap = (scores[ranked[0]] || 0) - (scores[ranked[1]] || 0);
  if (gap >= LEAD_MARGIN) {
    return { flavorPresent: true, flavorCluster: ranked[0] };
  }
  return { flavorPresent: false, flavorCluster: null };
}

export interface StrengthModel {
  scores: PillarScores;
  strengthScore: number;
  flavorPresent: boolean;
  flavorCluster: ClusterKey | null;
  pattern: string | null;
  blurb: string | null;
  modifiers: RelationshipModifier[];
}

interface ClusterLike {
  score?: number;
}

/**
 * Build the full strength model from a preview/full analysis payload.
 *
 * The backend-authoritative A-4 `summary.headline` is the source of truth for
 * the strength score and flavour decision when present — it uses a dynamic
 * boundary threshold the client cannot reproduce. We fall back to our own
 * derivation (mean + margin heuristic) only for older relationships whose
 * payload predates the headline contract.
 *
 * The archetype pattern + blurb are extracted here but rendered in the demoted
 * detail tier.
 */
export function buildStrengthModel(
  clusters: Partial<Record<ClusterKey, ClusterLike>> | undefined | null,
  summary: OverallSummary | null | undefined
): StrengthModel | null {
  if (!clusters) {
    return null;
  }

  const scores = CLUSTER_ORDER.reduce((acc, key) => {
    acc[key] = normalizeScore(clusters[key]?.score);
    return acc;
  }, {} as PillarScores);

  const hasAnyScore = CLUSTER_ORDER.some((key) => scores[key] > 0);
  if (!hasAnyScore) {
    return null;
  }

  const headline = summary?.headline ?? null;
  let strengthScore: number;
  let flavorPresent: boolean;
  let flavorCluster: ClusterKey | null;

  if (headline && typeof headline.strengthScore === 'number') {
    // Authoritative A-4 headline: render its values verbatim. Only show a
    // flavour cluster when the backend says it cleared the boundary.
    strengthScore = Math.round(Math.max(0, Math.min(100, headline.strengthScore)));
    flavorPresent = headline.flavorPresent === true;
    flavorCluster =
      flavorPresent && headline.flavorCluster
        ? matchClusterKey(headline.flavorCluster)
        : null;
  } else {
    // Fallback for pre-contract payloads. Prefer the authoritative meanScore
    // for the strength number, derive the flavour from scores + shape signals.
    strengthScore =
      typeof summary?.meanScore === 'number'
        ? Math.round(Math.max(0, Math.min(100, summary.meanScore)))
        : strengthOf(scores);
    const derived = deriveFlavor(scores, summary);
    flavorPresent = derived.flavorPresent;
    flavorCluster = derived.flavorCluster;
  }

  return {
    scores,
    strengthScore,
    flavorPresent,
    flavorCluster,
    pattern: summary?.label ?? null,
    blurb: summary?.blurb ?? null,
    modifiers: summary?.modifiers ?? [],
  };
}
