import type {
  EnhancedRelationshipAnalysisResponse,
  SynastryAspect,
  SynastryHousePlacement,
} from '../../../shared/api/relationships';
import type { AskAspectKind, AskAspectRef } from '../store';

const ASPECT_SYMBOL: Record<string, string> = {
  conjunction: '☌',
  sextile: '⚹',
  square: '□',
  trine: '∆',
  opposition: '☍',
  quincunx: '⚻',
};

const HOUSE_ORDINAL: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
  8: '8th',
  9: '9th',
  10: '10th',
  11: '11th',
  12: '12th',
};

function aspectShort(aspectType: string): string {
  return ASPECT_SYMBOL[aspectType.toLowerCase()] ?? aspectType;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function houseLabel(houseNumber: number): string {
  return HOUSE_ORDINAL[houseNumber] ?? `${houseNumber}th`;
}

function firstName(name: string | undefined): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

function firstInitial(name: string): string {
  return name ? name.charAt(0).toUpperCase() : '';
}

function possessive(name: string): string {
  if (!name) return '';
  return name.endsWith('s') ? `${name}’` : `${name}’s`;
}

function toSynastryAspectRef(
  aspect: SynastryAspect,
  index: number,
  userAName: string,
  userBName: string
): AskAspectRef {
  const ownerA = possessive(userAName);
  const ownerB = possessive(userBName);
  const initialA = firstInitial(userAName);
  const initialB = firstInitial(userBName);

  const namePrefix1 = ownerA ? `${ownerA} ` : '';
  const namePrefix2 = ownerB ? `${ownerB} ` : '';
  const name = `${namePrefix1}${aspect.planet1} ${capitalize(
    aspect.aspectType
  )} ${namePrefix2}${aspect.planet2}`.trim();

  const shortPrefix1 = initialA ? `${initialA} ` : '';
  const shortPrefix2 = initialB ? `${initialB} ` : '';
  const shortName = `${shortPrefix1}${aspect.planet1} ${aspectShort(
    aspect.aspectType
  )} ${shortPrefix2}${aspect.planet2}`.trim();

  return {
    id: `syn-${aspect.planet1}-${aspect.aspectType}-${aspect.planet2}-${index}`,
    type: 'Synastry',
    name,
    shortName,
  };
}

function toSynastryHouseRef(
  placement: SynastryHousePlacement,
  direction: 'AinB' | 'BinA',
  index: number,
  userAName: string,
  userBName: string
): AskAspectRef {
  const houseText = houseLabel(placement.house);
  const planetOwner = direction === 'AinB' ? userAName : userBName;
  const houseOwner = direction === 'AinB' ? userBName : userAName;

  const ownerPossessive = possessive(planetOwner);
  const housePossessive = possessive(houseOwner);
  const planetPrefix = ownerPossessive ? `${ownerPossessive} ` : '';
  const houseSuffix = housePossessive
    ? ` in ${housePossessive} chart`
    : direction === 'AinB'
    ? ' in partner’s chart'
    : ' in your chart';

  const name = `${planetPrefix}${placement.planet} in ${houseText} House${houseSuffix}`;

  const initial = firstInitial(planetOwner);
  const shortPrefix = initial ? `${initial} ` : '';
  const shortName = `${shortPrefix}${placement.planet} in ${houseText}`;

  return {
    id: `synhouse-${direction}-${placement.planet}-${placement.house}-${index}`,
    type: 'Synastry',
    name,
    shortName,
  };
}

function toCompositeHouseRef(
  planet: { name: string; house: number; sign: string },
  index: number
): AskAspectRef {
  const houseText = houseLabel(planet.house);
  const name = `${planet.name} in ${houseText} House (composite)`;
  const shortName = `${planet.name} in ${houseText}`;
  return {
    id: `comp-${planet.name}-${planet.house}-${index}`,
    type: 'Composite',
    name,
    shortName,
  };
}

function toCompositeAspectRef(
  aspect: {
    aspectingPlanet: string;
    aspectedPlanet: string;
    aspectType: string;
  },
  index: number
): AskAspectRef {
  const name = `${aspect.aspectingPlanet} ${capitalize(aspect.aspectType)} ${aspect.aspectedPlanet} (composite)`;
  const shortName = `${aspect.aspectingPlanet} ${aspectShort(aspect.aspectType)} ${aspect.aspectedPlanet}`;
  return {
    id: `comp-asp-${aspect.aspectingPlanet}-${aspect.aspectType}-${aspect.aspectedPlanet}-${index}`,
    type: 'Composite',
    name,
    shortName,
  };
}

export interface RelationshipAspectBundle {
  aspects: AskAspectRef[];
  countsByType: Record<AskAspectKind, number>;
}

const EMPTY_COUNTS: Record<AskAspectKind, number> = {
  Synastry: 0,
  Composite: 0,
  Aspect: 0,
  Placement: 0,
};

export function buildRelationshipAspects(
  preview: EnhancedRelationshipAnalysisResponse | null
): RelationshipAspectBundle {
  if (!preview) {
    return { aspects: [], countsByType: { ...EMPTY_COUNTS } };
  }

  const userAName = firstName(preview.userA?.name);
  const userBName = firstName(preview.userB?.name);

  const synastry: AskAspectRef[] = (preview.synastryAspects ?? []).map((aspect, index) =>
    toSynastryAspectRef(aspect, index, userAName, userBName)
  );

  const housePlacements = preview.synastryHousePlacements;
  const housesAinB: AskAspectRef[] = Array.isArray(housePlacements?.AinB)
    ? housePlacements!.AinB.map((placement, index) =>
        toSynastryHouseRef(placement, 'AinB', index, userAName, userBName)
      )
    : [];
  const housesBinA: AskAspectRef[] = Array.isArray(housePlacements?.BinA)
    ? housePlacements!.BinA.map((placement, index) =>
        toSynastryHouseRef(placement, 'BinA', index, userAName, userBName)
      )
    : [];

  const compositePlanets: AskAspectRef[] = Array.isArray(preview.compositeChart?.planets)
    ? preview.compositeChart!.planets.map((planet, index) => toCompositeHouseRef(planet, index))
    : [];
  const compositeAspects: AskAspectRef[] = Array.isArray(preview.compositeChart?.aspects)
    ? preview.compositeChart!.aspects.map((aspect, index) => toCompositeAspectRef(aspect, index))
    : [];

  const aspects = [
    ...synastry,
    ...housesAinB,
    ...housesBinA,
    ...compositePlanets,
    ...compositeAspects,
  ];

  const countsByType: Record<AskAspectKind, number> = { ...EMPTY_COUNTS };
  for (const entry of aspects) {
    countsByType[entry.type] = (countsByType[entry.type] ?? 0) + 1;
  }

  return { aspects, countsByType };
}

export interface ProfileNatalChart {
  planets?: Array<{ name: string; sign?: string; house?: number }>;
  aspects?: Array<{
    aspectingPlanet: string;
    aspectedPlanet: string;
    aspectType: string;
    orb?: number;
  }>;
}

export function buildProfileAspects(
  birthChart: ProfileNatalChart | null | undefined
): RelationshipAspectBundle {
  if (!birthChart) {
    return { aspects: [], countsByType: { ...EMPTY_COUNTS } };
  }

  // Sign + house for each planet, so an aspect's payload can carry both planets'
  // positions — that's what lets the backend build the canonical aspect code.
  const planetPositions = new Map<string, { sign?: string; house?: number }>();
  if (Array.isArray(birthChart.planets)) {
    for (const planet of birthChart.planets) {
      planetPositions.set(planet.name, { sign: planet.sign, house: planet.house });
    }
  }

  const placements: AskAspectRef[] = Array.isArray(birthChart.planets)
    ? birthChart.planets
        .filter((planet) => typeof planet.house === 'number')
        .map((planet, index) => {
          const houseText = houseLabel(planet.house ?? 1);
          return {
            id: `natal-place-${planet.name}-${planet.house}-${index}`,
            type: 'Placement' as const,
            name: `${planet.name} in ${houseText} House`,
            shortName: `${planet.name} in ${houseText}`,
            payload: {
              type: 'position',
              planet: planet.name,
              sign: planet.sign,
              house: planet.house,
            },
          };
        })
    : [];

  const aspectRefs: AskAspectRef[] = Array.isArray(birthChart.aspects)
    ? birthChart.aspects.map((aspect, index) => {
        const p1 = planetPositions.get(aspect.aspectingPlanet);
        const p2 = planetPositions.get(aspect.aspectedPlanet);
        return {
          id: `natal-asp-${aspect.aspectingPlanet}-${aspect.aspectType}-${aspect.aspectedPlanet}-${index}`,
          type: 'Aspect' as const,
          name: `${aspect.aspectingPlanet} ${capitalize(aspect.aspectType)} ${aspect.aspectedPlanet}`,
          shortName: `${aspect.aspectingPlanet} ${aspectShort(aspect.aspectType)} ${aspect.aspectedPlanet}`,
          payload: {
            type: 'aspect',
            planet1: aspect.aspectingPlanet,
            planet2: aspect.aspectedPlanet,
            aspectType: aspect.aspectType,
            // Both planets' sign + house (+ orb) → backend emits the canonical
            // aspect code instead of the simple fallback id. Undefined fields
            // are dropped on serialization.
            planet1Sign: p1?.sign,
            planet1House: p1?.house,
            planet2Sign: p2?.sign,
            planet2House: p2?.house,
            orb: aspect.orb,
          },
        };
      })
    : [];

  const aspects = [...placements, ...aspectRefs];
  const countsByType: Record<AskAspectKind, number> = { ...EMPTY_COUNTS };
  for (const entry of aspects) {
    countsByType[entry.type] = (countsByType[entry.type] ?? 0) + 1;
  }

  return { aspects, countsByType };
}
