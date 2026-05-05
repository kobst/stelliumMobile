import type {
  HoroscopeKeyTheme,
  HoroscopeTransitData,
  MoonPhase,
  RelationshipHoroscopeDocument,
  RomanceTransit,
  TransitToTransitAspect,
  UnifiedKeyThemes,
} from '../api';

type KeyThemesInput = HoroscopeKeyTheme[] | UnifiedKeyThemes | undefined;

// Unified mode returns `{ composite, synastry }`. Composite/synastry single-layer
// modes return a flat array. Normalize to a flat array, composite first, so
// downstream consumers can stay shape-agnostic.
function flattenKeyThemes(input: KeyThemesInput): HoroscopeKeyTheme[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return [...(input.composite ?? []), ...(input.synastry ?? [])];
}

const ASPECT_VERB: Record<string, string> = {
  conjunction: 'meets',
  conjunct: 'meets',
  opposition: 'opposes',
  opposes: 'opposes',
  square: 'squares',
  trine: 'harmonizes with',
  sextile: 'sparks',
  quincunx: 'unsettles',
  inconjunct: 'unsettles',
  semisextile: 'nudges',
  semisquare: 'frictions with',
  sesquisquare: 'pressures',
  sesquiquadrate: 'pressures',
  quintile: 'inspires',
  biquintile: 'inspires',
};

function normalizeAspectKey(aspect: string | undefined | null): string {
  return (aspect ?? '').trim().toLowerCase();
}

function aspectVerb(aspect: string | undefined | null): string {
  const key = normalizeAspectKey(aspect);
  return ASPECT_VERB[key] ?? 'aspects';
}

export interface ComposedHeadline {
  headline: string;
  source: 'keyTheme' | 'fallback';
}

export function composeHeadlineFromKeyTheme(theme?: HoroscopeKeyTheme | null): ComposedHeadline | null {
  if (!theme) return null;
  const transiting = (theme.transitingPlanet ?? '').trim();
  const target = (theme.targetPlanet ?? '').trim();
  const verb = aspectVerb(theme.aspect);
  if (!transiting || !target) return null;
  return {
    headline: `${transiting} ${verb} your ${target} this week`,
    source: 'keyTheme',
  };
}

export function composeHoroscopeHeadline(
  keyThemes: KeyThemesInput,
  fallback: string
): string {
  const top = flattenKeyThemes(keyThemes).find(
    (theme) => theme && theme.transitingPlanet && theme.targetPlanet
  );
  const composed = composeHeadlineFromKeyTheme(top);
  if (composed) return composed.headline;
  return fallback;
}

export function splitInterpretationParagraphs(interpretation: string | undefined | null): string[] {
  if (!interpretation) return [];
  return interpretation
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

const MONTH_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function safeDate(input: string | undefined | null): Date | null {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

const SUPPORT_ASPECTS = new Set(['trine', 'sextile']);
const TENSION_ASPECTS = new Set([
  'square',
  'opposition',
  'opposes',
  'quincunx',
  'inconjunct',
  'semisquare',
  'sesquisquare',
  'sesquiquadrate',
]);

export type HighlightNature = 'support' | 'tension' | 'fusion';

export interface DerivedTransitHighlight {
  key: string;
  day: string | null;
  transit: string;
  nature: HighlightNature;
  exactDate: string | null;
}

const WEEKDAY_LABEL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function classifyAspectNature(aspect: string | undefined | null): HighlightNature {
  const key = (aspect ?? '').trim().toLowerCase();
  if (SUPPORT_ASPECTS.has(key)) return 'support';
  if (TENSION_ASPECTS.has(key)) return 'tension';
  return 'fusion';
}

function formatWeekday(input: string | undefined | null): string | null {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return WEEKDAY_LABEL[date.getUTCDay()] ?? null;
}

export function deriveTransitHighlights(
  keyThemes: KeyThemesInput,
  limit = 3
): DerivedTransitHighlight[] {
  const themes = flattenKeyThemes(keyThemes)
    .filter((theme) => theme && theme.transitingPlanet && theme.targetPlanet);
  return themes.slice(0, limit).map((theme, index) => {
    const composed = composeHeadlineFromKeyTheme(theme);
    const transit = composed?.headline ?? `${theme.transitingPlanet} ${theme.aspect ?? ''} ${theme.targetPlanet}`;
    return {
      key: `${theme.transitingPlanet}-${theme.aspect}-${theme.targetPlanet}-${index}`,
      day: formatWeekday(theme.exactDate),
      transit: transit.replace(/ this week$/i, ''),
      nature: classifyAspectNature(theme.aspect),
      exactDate: theme.exactDate ?? null,
    };
  });
}

export function formatHoroscopeDateRange(
  startDate: string | undefined | null,
  endDate: string | undefined | null
): string {
  const start = safeDate(startDate);
  const end = safeDate(endDate);
  if (!start || !end) return '';
  const startMonth = MONTH_LABEL[start.getUTCMonth()];
  const endMonth = MONTH_LABEL[end.getUTCMonth()];
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

export type AspectNature = HighlightNature;

export function classifyAspect(aspect: string | undefined | null): AspectNature {
  return classifyAspectNature(aspect);
}

export type PlanetSpeed = 'Fast' | 'Medium' | 'Slow' | 'Very slow';

const SPEED_BY_PLANET: Record<string, PlanetSpeed> = {
  sun: 'Fast',
  moon: 'Fast',
  mercury: 'Fast',
  venus: 'Fast',
  mars: 'Medium',
  jupiter: 'Slow',
  saturn: 'Slow',
  chiron: 'Slow',
  'true node': 'Slow',
  node: 'Slow',
  uranus: 'Very slow',
  neptune: 'Very slow',
  pluto: 'Very slow',
};

export function getPlanetSpeed(planet: string | undefined | null): PlanetSpeed {
  const key = (planet ?? '').trim().toLowerCase();
  return SPEED_BY_PLANET[key] ?? 'Medium';
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function bucketByDayOfWeek(
  exactIso: string | undefined | null,
  weekStartIso: string | undefined | null
): number | null {
  const exact = safeDate(exactIso);
  const start = safeDate(weekStartIso);
  if (!exact || !start) return null;
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const exactUtc = Date.UTC(exact.getUTCFullYear(), exact.getUTCMonth(), exact.getUTCDate());
  const diffDays = Math.round((exactUtc - startUtc) / DAY_MS);
  if (diffDays < 0 || diffDays > 6) return null;
  return diffDays;
}

const SHORT_WEEKDAYS: Array<{ label: string }> = [
  { label: 'Mon' },
  { label: 'Tue' },
  { label: 'Wed' },
  { label: 'Thu' },
  { label: 'Fri' },
  { label: 'Sat' },
  { label: 'Sun' },
];

export interface WeekDayCell {
  index: number;
  label: string;
  dayOfMonth: number | null;
}

export function buildWeekDayCells(weekStartIso: string | undefined | null): WeekDayCell[] {
  const start = safeDate(weekStartIso);
  return SHORT_WEEKDAYS.map((entry, index) => {
    if (!start) return { index, label: entry.label, dayOfMonth: null };
    const day = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + index)
    );
    return { index, label: entry.label, dayOfMonth: day.getUTCDate() };
  });
}

export interface DayBucket {
  index: number;
  label: string;
  dayOfMonth: number | null;
  hasMoon: boolean;
  natures: AspectNature[];
}

export function buildTimelineBuckets(params: {
  weekStartIso: string | undefined | null;
  romanceTransits: RomanceTransit[] | undefined;
  moonPhases: MoonPhase[] | undefined;
}): DayBucket[] {
  const cells = buildWeekDayCells(params.weekStartIso);
  const buckets: DayBucket[] = cells.map((cell) => ({
    ...cell,
    hasMoon: false,
    natures: [],
  }));
  for (const transit of params.romanceTransits ?? []) {
    const day = bucketByDayOfWeek(transit.exact, params.weekStartIso);
    if (day === null) continue;
    buckets[day].natures.push(classifyAspectNature(transit.aspect));
  }
  for (const moon of params.moonPhases ?? []) {
    const day = bucketByDayOfWeek(moon.exact, params.weekStartIso);
    if (day === null) continue;
    buckets[day].hasMoon = true;
  }
  return buckets;
}

export interface PlanetActivity {
  planet: string;
  count: number;
}

export function derivePlanetActivity(
  romanceTransits: RomanceTransit[] | undefined
): PlanetActivity[] {
  const counts = new Map<string, number>();
  for (const transit of romanceTransits ?? []) {
    if (transit.transitingPlanet) {
      counts.set(transit.transitingPlanet, (counts.get(transit.transitingPlanet) ?? 0) + 1);
    }
    if (transit.targetPlanet) {
      counts.set(transit.targetPlanet, (counts.get(transit.targetPlanet) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([planet, count]) => ({ planet, count }))
    .sort((a, b) => b.count - a.count || a.planet.localeCompare(b.planet));
}

export function transitInvolvesPlanet(transit: RomanceTransit, planet: string): boolean {
  return transit.transitingPlanet === planet || transit.targetPlanet === planet;
}

export function formatSkyPatternLabel(aspect: TransitToTransitAspect): string {
  const transiting = aspect.transitingPlanet ?? '';
  const target = aspect.targetPlanet ?? '';
  const aspectName = (aspect.aspect ?? '').toLowerCase();
  const sign = aspect.transitingSign ? ` in ${aspect.transitingSign}` : '';
  return `${transiting} ${aspectName} ${target}${sign}`.trim();
}

export interface FullMoonSummary {
  phase: string;
  sign: string | null;
  exactIso: string;
  description: string | null;
  natalAspect: { planet: string; aspect: string } | null;
}

export function pickPrimaryMoonPhase(
  moonPhases: MoonPhase[] | undefined
): FullMoonSummary | null {
  const candidates = (moonPhases ?? []).filter((m) => m.exact);
  if (candidates.length === 0) return null;
  const fullMoon = candidates.find((m) => (m.moonPhaseData?.phase ?? '').toLowerCase() === 'full moon');
  const chosen = fullMoon ?? candidates[0];
  const phase = chosen.moonPhaseData?.phase ?? 'Moon Phase';
  const sign = chosen.moonPhaseData?.moonSign ?? null;
  const description = chosen.moonPhaseData?.description ?? chosen.description ?? null;
  const natalAspect = chosen.aspectsToPersonalPlanets?.[0] ?? null;
  return {
    phase,
    sign,
    exactIso: chosen.exact,
    description,
    natalAspect,
  };
}

const MOON_DAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatExactMonthDay(exactIso: string | undefined | null): string {
  const date = safeDate(exactIso);
  if (!date) return '';
  return `${MONTH_LABEL[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function formatExactWeekdayShort(exactIso: string | undefined | null): string | null {
  const date = safeDate(exactIso);
  if (!date) return null;
  return MOON_DAY_LABEL[date.getUTCDay()] ?? null;
}

export type RelationshipTransitLens = 'between' | 'composite';

export interface LensTransitRow {
  id: string;
  // null when the row represents the relationship-as-entity (composite).
  owner: string | null;
  transitingPlanet: string;
  targetPlanet: string;
  aspect: string;
  transitingSign: string | null;
  targetSign: string | null;
  exact: string;
  speed: PlanetSpeed;
  nature: AspectNature;
  priority: number | null;
}

function toLensRow(
  transit: RomanceTransit,
  ownerLabel: string | null,
  idPrefix: string,
  index: number
): LensTransitRow {
  return {
    id: `${idPrefix}-${transit.transitingPlanet}-${transit.aspect}-${transit.targetPlanet}-${index}`,
    owner: ownerLabel,
    transitingPlanet: transit.transitingPlanet,
    targetPlanet: transit.targetPlanet,
    aspect: transit.aspect,
    transitingSign: transit.transitingSign ?? null,
    targetSign: transit.targetSign ?? null,
    exact: transit.exact,
    speed: getPlanetSpeed(transit.transitingPlanet),
    nature: classifyAspectNature(transit.aspect),
    priority: typeof transit.priority === 'number' ? transit.priority : null,
  };
}

function compareByExactAsc(a: LensTransitRow, b: LensTransitRow): number {
  const ad = safeDate(a.exact)?.getTime() ?? 0;
  const bd = safeDate(b.exact)?.getTime() ?? 0;
  return ad - bd;
}

/**
 * Lens-specific transit list for the unified relationship horoscope view.
 *
 * - `between`: transits hitting each partner's natal chart, owned by partner names.
 *   Pulled from `transitData.synastry.partnerA.romanceTransits` + `partnerB.romanceTransits`.
 * - `composite`: transits hitting the composite chart, no owner.
 *   Pulled from `transitData.composite.immediateEvents` + `mainThemes` (deduped).
 */
export function buildLensTransits(
  horoscope: RelationshipHoroscopeDocument | null | undefined,
  lens: RelationshipTransitLens,
  userAName: string | null | undefined,
  userBName: string | null | undefined
): LensTransitRow[] {
  if (!horoscope) return [];
  const transitData = horoscope.transitData;
  if (!transitData) return [];

  if (lens === 'between') {
    const aLabel = userAName?.trim() || horoscope.userAName?.trim() || 'Partner A';
    const bLabel = userBName?.trim() || horoscope.userBName?.trim() || 'Partner B';
    const a = (transitData.synastry?.partnerA?.romanceTransits ?? []).map((t, i) =>
      toLensRow(t, aLabel, 'a', i)
    );
    const b = (transitData.synastry?.partnerB?.romanceTransits ?? []).map((t, i) =>
      toLensRow(t, bLabel, 'b', i)
    );
    return [...a, ...b].sort(compareByExactAsc);
  }

  // Composite lens: union of immediate events + main themes, deduped on planet/aspect/target.
  const immediate = transitData.composite?.immediateEvents ?? [];
  const main = transitData.composite?.mainThemes ?? [];
  const seen = new Set<string>();
  const rows: LensTransitRow[] = [];
  let idx = 0;
  for (const t of [...immediate, ...main]) {
    const key = `${t.transitingPlanet}|${t.aspect}|${t.targetPlanet}|${t.exact ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(toLensRow(t, null, 'c', idx++));
  }
  return rows.sort(compareByExactAsc);
}

export interface KeyDayRow {
  key: string;
  weekday: string | null;
  monthDay: string;
  exactIso: string;
  description: string;
  nature: AspectNature;
}

const FULL_WEEKDAY = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function formatFullWeekday(exactIso: string | undefined | null): string | null {
  const date = safeDate(exactIso);
  if (!date) return null;
  return FULL_WEEKDAY[date.getUTCDay()] ?? null;
}

/**
 * Top key days for the week, fused from composite + synastry key themes.
 * Output is sorted by exact date ascending.
 */
export function buildRelationshipKeyDays(
  horoscope: RelationshipHoroscopeDocument | null | undefined,
  limit = 6
): KeyDayRow[] {
  if (!horoscope) return [];
  const themes = flattenKeyThemes(horoscope.analysis?.keyThemes);
  const seen = new Set<string>();
  const rows: KeyDayRow[] = [];
  for (const theme of themes) {
    if (!theme?.transitingPlanet || !theme.targetPlanet || !theme.exactDate) continue;
    const dayKey = (safeDate(theme.exactDate)?.toISOString() ?? '').slice(0, 10);
    if (!dayKey) continue;
    // Collapse multiple themes that hit the same calendar day into the first one.
    if (seen.has(dayKey)) continue;
    seen.add(dayKey);
    const composed = composeHeadlineFromKeyTheme(theme);
    const description =
      composed?.headline.replace(/ this week$/i, '') ??
      `${theme.transitingPlanet} ${theme.aspect ?? ''} ${theme.targetPlanet}`;
    rows.push({
      key: `${theme.transitingPlanet}-${theme.aspect}-${theme.targetPlanet}-${dayKey}`,
      weekday: formatFullWeekday(theme.exactDate),
      monthDay: formatExactMonthDay(theme.exactDate),
      exactIso: theme.exactDate,
      description,
      nature: classifyAspectNature(theme.aspect),
    });
  }
  rows.sort((a, b) => {
    const ad = safeDate(a.exactIso)?.getTime() ?? 0;
    const bd = safeDate(b.exactIso)?.getTime() ?? 0;
    return ad - bd;
  });
  return rows.slice(0, limit);
}

/**
 * Adapter for the existing `buildTimelineBuckets` helper. Unified payloads keep
 * transits in nested buckets; merge them into the flat shape the timeline
 * builder expects so we can reuse that visualization.
 */
export function flattenUnifiedTransitsForTimeline(
  transitData: HoroscopeTransitData | null | undefined
): { romanceTransits: RomanceTransit[]; moonPhases: MoonPhase[] } {
  if (!transitData) return { romanceTransits: [], moonPhases: [] };
  const romance: RomanceTransit[] = [];
  const compositeImmediate = transitData.composite?.immediateEvents ?? [];
  const compositeMain = transitData.composite?.mainThemes ?? [];
  const partnerA = transitData.synastry?.partnerA?.romanceTransits ?? [];
  const partnerB = transitData.synastry?.partnerB?.romanceTransits ?? [];
  // Composite first so timeline dots favor relationship-level events; synastry is supplementary.
  romance.push(...compositeImmediate, ...compositeMain, ...partnerA, ...partnerB);
  const moonPhases = transitData.composite?.moonPhases ?? [];
  return { romanceTransits: romance, moonPhases };
}
