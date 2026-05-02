import type { Celebrity } from '../../../../shared/api/celebrities';
import { extractUserChartFacts } from './userChartFacts';
import type { CelebFacts } from './types';

/**
 * Reduces a Celebrity payload to the slim shape used by theme predicates.
 * Reuses the user-side birth-chart extractor for placement parsing — the
 * rising-sign logic and missing-field tolerance is identical.
 */
export function extractCelebFacts(celeb: Celebrity): CelebFacts {
  const birthChart = (celeb as { birthChart?: unknown }).birthChart as Parameters<
    typeof extractUserChartFacts
  >[0];
  const placements = extractUserChartFacts(birthChart);
  return {
    id: celeb._id,
    firstName: celeb.firstName ?? '',
    lastName: celeb.lastName ?? '',
    profilePhotoUrl:
      celeb.profilePhotoUrl ?? (celeb as { photoUrl?: string | null }).photoUrl ?? null,
    romanticProfileBlurb:
      (celeb as { romanticProfileBlurb?: string | null }).romanticProfileBlurb ?? null,
    sun: placements.sun,
    moon: placements.moon,
    mercury: placements.mercury,
    venus: placements.venus,
    mars: placements.mars,
    jupiter: placements.jupiter,
    saturn: placements.saturn,
    rising: placements.rising,
  };
}
