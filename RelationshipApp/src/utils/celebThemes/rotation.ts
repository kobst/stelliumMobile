import type { CelebFacts, RelationshipTheme, UserChartFacts } from './types';

export interface ResolvedTheme {
  theme: RelationshipTheme;
  title: string;
  matches: CelebFacts[];
}

/**
 * Deterministic 32-bit FNV-1a hash. Picked for being tiny, dependency-free,
 * and stable across JS engines. Used solely to choose a starting offset into
 * the theme catalog from `(userId, weekOf)`.
 */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Returns the Monday of the week containing `date` as a `YYYY-MM-DD` string,
 * computed in UTC. Mirrors the backend's `weekOf` semantics closely enough
 * for client rotation; if precise America/New_York alignment is needed
 * later, swap the implementation without changing callers.
 */
export function weekOfFromDate(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Picks themes for the week. Pure function — same inputs always produce the
 * same ordered output.
 *
 * Algorithm:
 *   1. Sort themes by id for deterministic ordering independent of catalog
 *      authoring order.
 *   2. Hash `(userId, weekOf)` to pick a starting offset.
 *   3. Walk the catalog from that offset, evaluating each theme. Skip themes
 *      whose title returns null or whose match yields fewer celebs than
 *      `minMatches`. Keep going (fall-forward) until `count` themes are
 *      collected or the catalog is exhausted.
 *   4. Return resolved themes in walk order, each with the celeb subset
 *      already filtered so the view renders the result without re-filtering.
 */
export function pickWeeklyThemes(
  themes: readonly RelationshipTheme[],
  candidates: readonly CelebFacts[],
  chart: UserChartFacts,
  userId: string,
  weekOf: string,
  count: number
): ResolvedTheme[] {
  if (themes.length === 0 || count <= 0) return [];

  const sorted = [...themes].sort((a, b) => a.id.localeCompare(b.id));
  const offset = fnv1a(`${userId}:${weekOf}`) % sorted.length;
  const resolved: ResolvedTheme[] = [];

  for (let step = 0; step < sorted.length && resolved.length < count; step += 1) {
    const theme = sorted[(offset + step) % sorted.length];
    const title = theme.title(chart);
    if (!title) continue;
    const matches = candidates.filter((celeb) => theme.match(celeb, chart));
    if (matches.length < theme.minMatches) continue;
    resolved.push({ theme, title, matches });
  }

  return resolved;
}
