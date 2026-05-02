import type { HoroscopeKeyTheme } from '../api';

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
