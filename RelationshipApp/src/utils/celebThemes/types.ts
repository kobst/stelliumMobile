/**
 * Types for the Add Celebrity rotating-theme system.
 *
 * The catalog is structured so it can later hydrate from a JSON endpoint
 * without changing the filter logic. The only piece that doesn't serialize
 * cleanly is `match` (a function). When the catalog moves server-side, the
 * JSON will carry editorial fields (id, titleTemplate, subtitle, minMatches)
 * and a `rule` discriminated union; a small client-side evaluator will then
 * stand in for the predicate function. Until then, predicates live in code
 * and the editorial fields below are the only things ever rendered.
 */

export type ZodiacSign =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';

export interface UserChartFacts {
  sun: ZodiacSign | null;
  moon: ZodiacSign | null;
  mercury: ZodiacSign | null;
  venus: ZodiacSign | null;
  mars: ZodiacSign | null;
  jupiter: ZodiacSign | null;
  saturn: ZodiacSign | null;
  rising: ZodiacSign | null;
}

export interface CelebFacts {
  id: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  romanticProfileBlurb: string | null;
  sun: ZodiacSign | null;
  moon: ZodiacSign | null;
  mercury: ZodiacSign | null;
  venus: ZodiacSign | null;
  mars: ZodiacSign | null;
  jupiter: ZodiacSign | null;
  saturn: ZodiacSign | null;
  rising: ZodiacSign | null;
}

export interface RelationshipTheme {
  /** Stable id used by the rotation hash. Don't change after launch. */
  id: string;
  /** Editorial subtitle. Sign-agnostic so it reads consistently. */
  subtitle: string;
  /** Fall-forward threshold — themes producing fewer matches are skipped. */
  minMatches: number;
  /**
   * Builds the section header from the user's chart. Pure function.
   * Returns null when the user's chart can't supply a needed placement,
   * which causes the theme to be skipped (same effect as failing match).
   */
  title: (chart: UserChartFacts) => string | null;
  /** Predicate. Pure function of (celeb, chart). */
  match: (celeb: CelebFacts, chart: UserChartFacts) => boolean;
  /**
   * Optional badge label rendered on each card (e.g. "MOON IN GEMINI").
   * Mirrors the existing Discover chip treatment. Returns null to omit.
   */
  badge?: (chart: UserChartFacts, celeb: CelebFacts) => string | null;
}
