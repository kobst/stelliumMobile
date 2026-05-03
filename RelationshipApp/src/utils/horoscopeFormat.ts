import type {
  HoroscopeKeyTheme,
  MoonPhase,
  RomanceTransit,
  TransitToTransitAspect,
} from '../api';

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
  keyThemes: HoroscopeKeyTheme[] | undefined,
  fallback: string
): string {
  const top = (keyThemes ?? []).find(
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
  keyThemes: HoroscopeKeyTheme[] | undefined,
  limit = 3
): DerivedTransitHighlight[] {
  const themes = (keyThemes ?? [])
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
