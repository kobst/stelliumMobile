import { RelationshipAppProfile } from '../../../shared/domain/relationshipUser';
import { UserCompositeChart } from '../../../shared/api/relationships';
import { SubjectDocument } from '../../../shared/types/subject';
import { Celebrity } from '../api';

const CLUSTER_LABELS = ['Harmony', 'Passion', 'Connection', 'Stability', 'Growth'] as const;

type ClusterLabel = (typeof CLUSTER_LABELS)[number];

type BirthChartPlanet = {
  name?: string;
  sign?: string | null;
};

function getSubjectFromProfile(profile: RelationshipAppProfile | SubjectDocument | null | undefined) {
  if (!profile) {
    return null;
  }

  return 'subject' in profile ? profile.subject : profile;
}

function getBirthChartPlanets(subject: SubjectDocument | null) {
  const planets = (subject?.birthChart as { planets?: BirthChartPlanet[] } | undefined)?.planets;
  return Array.isArray(planets) ? planets : [];
}

function readSign(subject: SubjectDocument | null, planetName: string): string | null {
  const match = getBirthChartPlanets(subject).find((planet) => planet.name === planetName);
  return typeof match?.sign === 'string' ? match.sign : null;
}

function getSignFromIsoDate(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const [yearString, monthString, dayString] = value.split('-');
  const month = Number(monthString);
  const day = Number(dayString);

  if (!yearString || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return 'Aries';
  }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return 'Taurus';
  }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return 'Gemini';
  }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return 'Cancer';
  }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return 'Leo';
  }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return 'Virgo';
  }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return 'Libra';
  }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return 'Scorpio';
  }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return 'Sagittarius';
  }
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return 'Capricorn';
  }
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return 'Aquarius';
  }
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
    return 'Pisces';
  }

  return null;
}

export function getBigThree(profile: RelationshipAppProfile | SubjectDocument | null | undefined) {
  const subject = getSubjectFromProfile(profile);
  return {
    sun: readSign(subject, 'Sun'),
    moon: readSign(subject, 'Moon'),
    rising: readSign(subject, 'Ascendant'),
  };
}

export function getBigThreeSummary(
  profile: RelationshipAppProfile | SubjectDocument | null | undefined
): string {
  const { sun, moon, rising } = getBigThree(profile);
  const placements = [
    sun ? `${sun} Sun` : null,
    moon ? `${moon} Moon` : null,
    rising ? `${rising} Rising` : null,
  ].filter(Boolean);

  return placements.length > 0 ? placements.join(' • ') : 'Your chart is ready.';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function getRelationshipPairLabel(relationship: UserCompositeChart): string {
  return `${relationship.userA_name} + ${relationship.userB_name}`;
}

export function getRelationshipArchetypeLabel(relationship: UserCompositeChart): string {
  return (
    relationship.clusterScoring?.overall?.profile ??
    relationship.relationshipAnalysisStatus?.profile ??
    'Compatibility read'
  );
}

export function getRelationshipOverviewExcerpt(relationship: UserCompositeChart): string | null {
  if (typeof relationship.initialOverview !== 'string') {
    return null;
  }

  const text = relationship.initialOverview.trim();
  return text.length > 0 ? text : null;
}

export function getRelationshipTopCluster(
  relationship: UserCompositeChart
): { label: ClusterLabel; score: number } | null {
  const fromClusterScoring = relationship.clusterScoring?.clusters;
  if (fromClusterScoring) {
    const ranked = CLUSTER_LABELS.map((label) => ({
      label,
      score: Math.round(fromClusterScoring[label]?.score ?? 0),
    })).sort((left, right) => right.score - left.score);

    return ranked[0] ?? null;
  }

  const fromStatus = relationship.relationshipAnalysisStatus?.clusterScores;
  if (fromStatus) {
    const ranked = CLUSTER_LABELS.map((label) => ({
      label,
      score: Math.round(fromStatus[label] ?? 0),
    })).sort((left, right) => right.score - left.score);

    return ranked[0] ?? null;
  }

  return null;
}

export function celebrityToSubject(celebrity: Celebrity): SubjectDocument {
  return {
    _id: celebrity._id,
    createdAt: '',
    updatedAt: '',
    kind: 'celebrity',
    ownerUserId: null,
    isCelebrity: true,
    isReadOnly: true,
    firstName: celebrity.firstName,
    lastName: celebrity.lastName,
    gender: celebrity.gender,
    dateOfBirth: celebrity.dateOfBirth,
    placeOfBirth: celebrity.placeOfBirth,
    time: celebrity.time,
    birthTimeUnknown: !celebrity.time,
    totalOffsetHours: celebrity.totalOffsetHours ?? 0,
    birthChart: celebrity.birthChart,
    appDomain: null,
    firebaseUid: null,
  };
}

export function getCelebritySunSign(celebrity: Celebrity): string | null {
  const subject = celebrityToSubject(celebrity);
  return readSign(subject, 'Sun') ?? getSignFromIsoDate(celebrity.dateOfBirth);
}
