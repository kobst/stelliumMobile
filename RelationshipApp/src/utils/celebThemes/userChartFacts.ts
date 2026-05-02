import { isZodiacSign } from './zodiac';
import type { UserChartFacts, ZodiacSign } from './types';

interface PlanetLike {
  name?: string;
  sign?: string | null;
}

interface BirthChartLike {
  planets?: PlanetLike[];
  ascendant?: { sign?: string | null } | null;
  houses?: Array<{ house?: number | string; sign?: string | null }>;
}

function firstSignByPlanet(
  planets: PlanetLike[],
  planetName: string
): ZodiacSign | null {
  const match = planets.find((p) => p?.name === planetName);
  const sign = match?.sign;
  return sign && isZodiacSign(sign) ? sign : null;
}

function risingFromBirthChart(birthChart: BirthChartLike): ZodiacSign | null {
  const explicit = birthChart.ascendant?.sign;
  if (explicit && isZodiacSign(explicit)) return explicit;
  const ascPlanet = birthChart.planets?.find((p) => p?.name === 'Ascendant');
  if (ascPlanet?.sign && isZodiacSign(ascPlanet.sign)) return ascPlanet.sign;
  const firstHouse = birthChart.houses?.find(
    (h) => h?.house === 1 || h?.house === '1'
  );
  if (firstHouse?.sign && isZodiacSign(firstHouse.sign)) return firstHouse.sign;
  return null;
}

/**
 * Reduces a user's stored birth chart to the slim, predicate-friendly shape.
 * Tolerates missing fields — any sign we can't resolve becomes null and any
 * theme keying off that placement skips on its own.
 */
export function extractUserChartFacts(
  birthChart: BirthChartLike | null | undefined
): UserChartFacts {
  const planets = Array.isArray(birthChart?.planets) ? birthChart!.planets! : [];
  return {
    sun: firstSignByPlanet(planets, 'Sun'),
    moon: firstSignByPlanet(planets, 'Moon'),
    mercury: firstSignByPlanet(planets, 'Mercury'),
    venus: firstSignByPlanet(planets, 'Venus'),
    mars: firstSignByPlanet(planets, 'Mars'),
    jupiter: firstSignByPlanet(planets, 'Jupiter'),
    saturn: firstSignByPlanet(planets, 'Saturn'),
    rising: birthChart ? risingFromBirthChart(birthChart) : null,
  };
}
