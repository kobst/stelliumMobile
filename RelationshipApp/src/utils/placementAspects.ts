import type { PlacementKey } from './placements';

interface BirthChartPlanet {
  name?: string;
  sign?: string | null;
  full_degree?: number | null;
  norm_degree?: number | null;
  house?: number | null;
}

interface BirthChartAspect {
  aspectingPlanet?: string;
  aspectedPlanet?: string;
  aspectingPlanetDegree?: number;
  aspectedPlanetDegree?: number;
  aspectType?: string;
  orb?: number;
}

interface BirthChartLike {
  planets?: BirthChartPlanet[];
  aspects?: BirthChartAspect[];
  houses?: unknown[];
}

export type AspectNature = 'support' | 'tension' | 'fusion';

export interface PlacementAspect {
  // The aspect type as returned by the backend (e.g. "trine", "quincunx").
  type: string;
  // The other planet in the aspect (the one that is NOT the placement planet).
  otherPlanet: string;
  otherSign: string | null;
  otherDegree: number | null;
  otherHouse: number | null;
  nature: AspectNature;
  orb: number | null;
}

export interface AspectCounts {
  support: number;
  tension: number;
  fusion: number;
}

const PLANET_SOURCE_NAMES: Record<Exclude<PlacementKey, 'descendant'>, string> = {
  sun: 'Sun',
  moon: 'Moon',
  venus: 'Venus',
  mars: 'Mars',
  ascendant: 'Ascendant',
};

const SUPPORT_TYPES = new Set(['trine', 'sextile']);
const TENSION_TYPES = new Set(['square', 'opposition', 'quincunx']);
const FUSION_TYPES = new Set(['conjunction']);

export function classifyAspectNature(aspectType: string | undefined | null): AspectNature {
  const t = (aspectType ?? '').toLowerCase();
  if (SUPPORT_TYPES.has(t)) return 'support';
  if (TENSION_TYPES.has(t)) return 'tension';
  if (FUSION_TYPES.has(t)) return 'fusion';
  // Default unknown aspects to "tension" so they are still surfaced; they will
  // render with the dashed/coral treatment.
  return 'tension';
}

function roundDegree(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.round(value);
}

function getBirthChart(
  source: { birthChart?: unknown } | null | undefined
): BirthChartLike | null {
  const chart = source?.birthChart;
  if (!chart || typeof chart !== 'object') return null;
  return chart as BirthChartLike;
}

function planetSourceNameFor(key: PlacementKey): string | null {
  if (key === 'descendant') return null;
  return PLANET_SOURCE_NAMES[key];
}

function findPlanet(
  birthChart: BirthChartLike | null,
  name: string
): BirthChartPlanet | null {
  const planets = birthChart?.planets ?? [];
  return planets.find((p) => p.name === name) ?? null;
}

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

interface SignFromDegree {
  sign: string;
  degree: number;
}

function signFromAbsoluteLongitude(degree: number | null | undefined): SignFromDegree | null {
  if (typeof degree !== 'number' || !Number.isFinite(degree)) return null;
  const wrapped = ((degree % 360) + 360) % 360;
  const idx = Math.floor(wrapped / 30);
  const within = wrapped - idx * 30;
  return { sign: SIGN_NAMES[idx], degree: Math.round(within) };
}

/**
 * Returns the natal aspects touching `planetName` from the subject's birthChart.
 * The aspect's "other" planet (whichever side is not `planetName`) is resolved
 * back to a sign/degree/house from `birthChart.planets` so the UI can render an
 * AspectFocusChart and a degree label without re-fetching.
 */
export function getPlacementAspects(
  source: { birthChart?: unknown } | null | undefined,
  planetName: string | null
): PlacementAspect[] {
  if (!planetName) return [];
  const birthChart = getBirthChart(source);
  const aspects = birthChart?.aspects ?? [];
  if (!aspects.length) return [];

  const out: PlacementAspect[] = [];
  for (const aspect of aspects) {
    const a = aspect.aspectingPlanet;
    const b = aspect.aspectedPlanet;
    const isAtoB = a === planetName;
    const isBtoA = b === planetName;
    if (!isAtoB && !isBtoA) continue;

    const otherName = isAtoB ? b : a;
    if (!otherName) continue;

    const otherPlanet = findPlanet(birthChart, otherName);
    // Prefer the planet record when complete; otherwise fall back to the
    // longitude embedded in the aspect itself (no-birth-time charts have
    // angles like Midheaven without sign/degree on the planet record).
    const otherDegFromAspect = isAtoB
      ? aspect.aspectedPlanetDegree
      : aspect.aspectingPlanetDegree;
    const fallback = signFromAbsoluteLongitude(otherDegFromAspect);

    out.push({
      type: aspect.aspectType ?? '',
      otherPlanet: otherName,
      otherSign: otherPlanet?.sign ?? fallback?.sign ?? null,
      otherDegree:
        roundDegree(otherPlanet?.norm_degree ?? otherPlanet?.full_degree ?? null) ??
        fallback?.degree ??
        null,
      otherHouse:
        typeof otherPlanet?.house === 'number' && otherPlanet.house > 0
          ? otherPlanet.house
          : null,
      nature: classifyAspectNature(aspect.aspectType),
      orb: typeof aspect.orb === 'number' ? aspect.orb : null,
    });
  }
  return out;
}

/**
 * Convenience wrapper that maps a placement key to the right backend planet
 * name. The descendant is treated as the ascendant for aspect lookup since
 * the backend does not emit aspects against the Descendant directly.
 */
export function getAspectsForPlacementKey(
  source: { birthChart?: unknown } | null | undefined,
  key: PlacementKey
): PlacementAspect[] {
  if (key === 'descendant') {
    // Descendant is opposite Ascendant — the relevant aspects are the same.
    return getPlacementAspects(source, 'Ascendant');
  }
  const planetName = planetSourceNameFor(key);
  return getPlacementAspects(source, planetName);
}

interface BirthChartHouseLike {
  house?: number | string | null;
  degree?: number | null;
}

/**
 * Returns the absolute longitude of the chart owner's Ascendant (the first
 * house cusp). AspectFocusChart / ChartWheel rotate the wheel so the
 * Ascendant sits at the 9 o'clock position when this value is non-zero.
 */
export function getAscendantDegree(
  source: { birthChart?: unknown } | null | undefined
): number {
  const birthChart = getBirthChart(source);
  const houses = (birthChart?.houses as BirthChartHouseLike[] | undefined) ?? [];
  const first = houses.find((h) => h?.house === 1 || h?.house === '1');
  const fromHouses =
    (typeof first?.degree === 'number' ? first.degree : null) ??
    (typeof houses[0]?.degree === 'number' ? houses[0].degree : null);
  if (typeof fromHouses === 'number') return fromHouses;
  // Fall back to the Ascendant planet's own longitude if houses are missing.
  const asc = findPlanet(birthChart, 'Ascendant');
  return asc?.full_degree ?? 0;
}

export function summarizeAspectCounts(
  source: { birthChart?: unknown } | null | undefined
): AspectCounts {
  const counts: AspectCounts = { support: 0, tension: 0, fusion: 0 };
  const aspects = getBirthChart(source)?.aspects ?? [];
  for (const aspect of aspects) {
    counts[classifyAspectNature(aspect.aspectType)] += 1;
  }
  return counts;
}
