import { BirthChart } from '../types';
import { BirthChartElement, BirthChartAspect, BirthChartPosition } from '../api/charts';
import { decodeAstroCode } from './astroCode';

/**
 * Converts an array of astro codes (e.g., 'A-SusCp12GaCoAssCp01', 'Pp-MasAq02')
 * into BirthChartElement objects (aspects or positions) by matching them against
 * the full birth chart data.
 */
export function convertAstroCodesToElements(
  astroCodes: string[],
  birthChart: BirthChart
): BirthChartElement[] {
  const elements: BirthChartElement[] = [];

  console.log('astroCodeConverter - Converting codes:', astroCodes);
  console.log('astroCodeConverter - Birth chart aspects count:', birthChart?.aspects?.length || 0);
  console.log('astroCodeConverter - Birth chart planets count:', birthChart?.planets?.length || 0);

  for (const code of astroCodes) {
    const decoded = decodeAstroCode(code);

    console.log('astroCodeConverter - Code:', code, '-> Decoded:', decoded);

    if (!decoded) {
      console.log('astroCodeConverter - Failed to decode:', code);
      continue;
    }

    if (decoded.type === 'aspect') {
      // Find matching aspect in birth chart
      const aspect = findMatchingAspect(decoded, birthChart);
      if (aspect) {
        console.log('astroCodeConverter - Found matching aspect:', aspect);
        elements.push(aspect);
      } else {
        console.log('astroCodeConverter - No matching aspect found for:', decoded);
      }
    } else if (decoded.type === 'placement') {
      // Find matching position in birth chart
      const position = findMatchingPosition(decoded, birthChart);
      if (position) {
        console.log('astroCodeConverter - Found matching position:', position);
        elements.push(position);
      } else {
        console.log('astroCodeConverter - No matching position found for:', decoded);
      }
    }
  }

  console.log('astroCodeConverter - Final elements count:', elements.length);

  return elements;
}

function findMatchingAspect(
  decoded: any,
  birthChart: BirthChart
): BirthChartAspect | null {
  if (!birthChart.aspects) {
    return null;
  }

  const { p1, p2, aspect } = decoded;

  // Find matching aspect in birth chart (match both planet orders)
  const matchingAspect = birthChart.aspects.find((chartAspect) => {
    const type = chartAspect.aspectType.toLowerCase();
    return (
      type === aspect &&
      ((chartAspect.aspectedPlanet === p1.planet && chartAspect.aspectingPlanet === p2.planet) ||
       (chartAspect.aspectedPlanet === p2.planet && chartAspect.aspectingPlanet === p1.planet))
    );
  });

  if (!matchingAspect) {
    return null;
  }

  // Find planet data for signs and houses
  const planet1Data = birthChart.planets?.find(p => p.name === matchingAspect.aspectedPlanet);
  const planet2Data = birthChart.planets?.find(p => p.name === matchingAspect.aspectingPlanet);

  if (!planet1Data || !planet2Data) {
    return null;
  }

  return {
    type: 'aspect',
    planet1: matchingAspect.aspectedPlanet,
    planet2: matchingAspect.aspectingPlanet,
    aspectType: matchingAspect.aspectType.toLowerCase(),
    orb: matchingAspect.orb || 0,
    planet1Sign: planet1Data.sign,
    planet2Sign: planet2Data.sign,
    planet1House: planet1Data.house || null,
    planet2House: planet2Data.house || null,
    description: `${matchingAspect.aspectedPlanet} ${matchingAspect.aspectType.toLowerCase()} ${matchingAspect.aspectingPlanet}`,
  };
}

function findMatchingPosition(
  decoded: any,
  birthChart: BirthChart
): BirthChartPosition | null {
  if (!birthChart.planets) {
    return null;
  }

  const { planet, sign, house } = decoded;

  // Find matching planet in birth chart
  const matchingPlanet = birthChart.planets.find((chartPlanet) => {
    return (
      chartPlanet.name === planet &&
      chartPlanet.sign === sign &&
      (!house || chartPlanet.house === house)
    );
  });

  if (!matchingPlanet) {
    return null;
  }

  return {
    type: 'position',
    planet: matchingPlanet.name,
    sign: matchingPlanet.sign,
    house: matchingPlanet.house || null,
    degree: matchingPlanet.norm_degree || matchingPlanet.full_degree || 0,
    isRetrograde: matchingPlanet.is_retro === 'true' || matchingPlanet.is_retro === true,
    description: `${matchingPlanet.name} in ${matchingPlanet.sign}${matchingPlanet.house ? ` (${matchingPlanet.house})` : ''}${matchingPlanet.is_retro ? ' ℞' : ''}`,
  };
}
