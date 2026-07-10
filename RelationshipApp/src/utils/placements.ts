import { RelationshipAppProfile } from '../../../shared/domain/relationshipUser';
import { SubjectDocument } from '../../../shared/types/subject';

export type PlacementKey = 'sun' | 'moon' | 'venus' | 'mars' | 'ascendant' | 'descendant';

export interface PlacementDetail {
  key: PlacementKey;
  label: string;
  sign: string | null;
  degree: number | null;
  house: number | null;
  interpretation: string;
}

interface BirthChartPlanet {
  name?: string;
  sign?: string | null;
  full_degree?: number | null;
  norm_degree?: number | null;
  house?: number | null;
}

interface BirthChartHouse {
  house?: number | null;
  sign?: string | null;
  full_degree?: number | null;
  norm_degree?: number | null;
}

const PLANET_SOURCE_NAMES: Record<Exclude<PlacementKey, 'descendant'>, string> = {
  sun: 'Sun',
  moon: 'Moon',
  venus: 'Venus',
  mars: 'Mars',
  ascendant: 'Ascendant',
};

const LABELS: Record<PlacementKey, string> = {
  sun: 'Sun',
  moon: 'Moon',
  venus: 'Venus',
  mars: 'Mars',
  ascendant: 'Ascendant',
  descendant: 'Descendant',
};

// General descriptions of what each placement governs. Person-neutral because
// they render on the self profile, partner detail, and celebrity detail
// screens alike. A backend endpoint for personalized interpretations can
// replace these per-placement later.
const PLACEMENT_DESCRIPTIONS: Record<PlacementKey, string> = {
  sun: 'Core identity in love — the essential self that shows up in a relationship.',
  moon: 'The emotional weather brought into intimacy — what soothes, and what feels threatening.',
  venus: 'What feels beautiful in a partner, and the kind of affection that lands.',
  mars: 'How desire is pursued — the way of initiating and fighting for what is wanted.',
  ascendant: 'The first impression given to a potential partner, before the deeper self is known.',
  descendant: 'The qualities unconsciously sought in a partner — the mirror of the Ascendant.',
};

const OPPOSITE_SIGN: Record<string, string> = {
  Aries: 'Libra',
  Taurus: 'Scorpio',
  Gemini: 'Sagittarius',
  Cancer: 'Capricorn',
  Leo: 'Aquarius',
  Virgo: 'Pisces',
  Libra: 'Aries',
  Scorpio: 'Taurus',
  Sagittarius: 'Gemini',
  Capricorn: 'Cancer',
  Aquarius: 'Leo',
  Pisces: 'Virgo',
};

function getSubject(
  profile: RelationshipAppProfile | SubjectDocument | null | undefined
): SubjectDocument | null {
  if (!profile) {
    return null;
  }
  return 'subject' in profile ? profile.subject : profile;
}

function getBirthChart(subject: SubjectDocument | null) {
  return subject?.birthChart as
    | { planets?: BirthChartPlanet[]; houses?: BirthChartHouse[] }
    | undefined;
}

function roundDegree(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return Math.round(value);
}

function findPlanet(
  subject: SubjectDocument | null,
  name: string
): BirthChartPlanet | null {
  const planets = getBirthChart(subject)?.planets ?? [];
  return planets.find((planet) => planet.name === name) ?? null;
}

function buildDetail(
  key: Exclude<PlacementKey, 'descendant'>,
  subject: SubjectDocument | null
): PlacementDetail {
  const planet = findPlanet(subject, PLANET_SOURCE_NAMES[key]);
  return {
    key,
    label: LABELS[key],
    sign: planet?.sign ?? null,
    degree: roundDegree(planet?.norm_degree ?? planet?.full_degree ?? null),
    house: typeof planet?.house === 'number' ? planet.house : null,
    interpretation: PLACEMENT_DESCRIPTIONS[key],
  };
}

function buildDescendant(subject: SubjectDocument | null): PlacementDetail {
  const ascendant = findPlanet(subject, 'Ascendant');
  const sign = ascendant?.sign ? OPPOSITE_SIGN[ascendant.sign] ?? null : null;
  return {
    key: 'descendant',
    label: LABELS.descendant,
    sign,
    degree: roundDegree(ascendant?.norm_degree ?? ascendant?.full_degree ?? null),
    house: 7,
    interpretation: PLACEMENT_DESCRIPTIONS.descendant,
  };
}

export function getRomanticPlacements(
  profile: RelationshipAppProfile | SubjectDocument | null | undefined
): PlacementDetail[] {
  const subject = getSubject(profile);
  return [
    buildDetail('sun', subject),
    buildDetail('moon', subject),
    buildDetail('venus', subject),
    buildDetail('mars', subject),
    buildDetail('ascendant', subject),
    buildDescendant(subject),
  ];
}

function ordinalHouse(house: number): string {
  if (house === 1) return '1st House';
  if (house === 2) return '2nd House';
  if (house === 3) return '3rd House';
  return `${house}th House`;
}

export function formatPlacementSummary(detail: PlacementDetail): string {
  const sign = detail.sign ?? 'Unknown';
  const degree = detail.degree !== null ? `${detail.degree}°` : '—';
  const house =
    typeof detail.house === 'number' && detail.house > 0
      ? ` · ${ordinalHouse(detail.house)}`
      : '';
  return `${sign} ${degree}${house}`;
}
