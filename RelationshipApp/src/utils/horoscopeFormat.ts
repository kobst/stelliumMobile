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
