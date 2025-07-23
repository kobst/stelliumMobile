import { Planet, House, Aspect } from '../types';

export interface RawPlanetData {
  name: string;
  sign: string;
  degree: number;
  house: number;
  retrograde?: boolean;
}

export interface RawHouseData {
  number: number;
  sign: string;
  cusp: number;
}

export interface RawAspectData {
  planet1: string;
  planet2: string;
  aspect: string;
  orb: number;
  applying?: boolean;
}

export const chartTransformers = {
  // Transform raw planet data to UI format
  transformPlanets: (rawPlanets: RawPlanetData[]): Planet[] => {
    const planetColors: Record<string, string> = {
      Sun: '#FFD700',
      Moon: '#C0C0C0',
      Mercury: '#FFA500',
      Venus: '#FFB6C1',
      Mars: '#FF4500',
      Jupiter: '#9400D3',
      Saturn: '#8B4513',
      Uranus: '#40E0D0',
      Neptune: '#4169E1',
      Pluto: '#800080',
      Ascendant: '#FF1493',
      Midheaven: '#32CD32',
    };

    const planetSymbols: Record<string, string> = {
      Sun: '☉',
      Moon: '☽',
      Mercury: '☿',
      Venus: '♀',
      Mars: '♂',
      Jupiter: '♃',
      Saturn: '♄',
      Uranus: '♅',
      Neptune: '♆',
      Pluto: '♇',
      Ascendant: 'AC',
      Midheaven: 'MC',
    };

    return rawPlanets.map(planet => ({
      name: planet.name,
      degree: planet.degree,
      sign: planet.sign,
      house: planet.house,
      symbol: planetSymbols[planet.name] || planet.name.charAt(0),
      color: planetColors[planet.name] || '#808080',
    }));
  },

  // Transform raw house data to UI format
  transformHouses: (rawHouses: RawHouseData[]): House[] => {
    return rawHouses.map(house => ({
      number: house.number,
      startDegree: house.cusp,
      sign: house.sign,
    }));
  },

  // Transform raw aspect data to UI format
  transformAspects: (rawAspects: RawAspectData[]): Aspect[] => {
    const aspectColors: Record<string, string> = {
      conjunction: '#FF0000',
      opposition: '#FF4500',
      square: '#FF8C00',
      trine: '#0000FF',
      sextile: '#008000',
      quincunx: '#800080',
    };

    const majorAspects = ['conjunction', 'opposition', 'square', 'trine', 'sextile'];

    return rawAspects.map(aspect => {
      const planet1Data = { degree: 0 }; // Would come from planet lookup
      const planet2Data = { degree: 0 }; // Would come from planet lookup

      return {
        planet1: aspect.planet1,
        planet2: aspect.planet2,
        planet1Degree: planet1Data.degree,
        planet2Degree: planet2Data.degree,
        type: majorAspects.includes(aspect.aspect) ? 'major' : 'minor',
        aspect: aspect.aspect,
        color: aspectColors[aspect.aspect] || '#808080',
        orb: aspect.orb,
      };
    });
  },

  // Transform chart analysis response
  transformAnalysisResponse: (rawAnalysis: any) => {
    return {
      overview: rawAnalysis.overview || '',
      fullAnalysis: rawAnalysis.fullAnalysis || {},
      topics: rawAnalysis.topics || {},
      chartData: {
        planets: rawAnalysis.planets ? chartTransformers.transformPlanets(rawAnalysis.planets) : [],
        houses: rawAnalysis.houses ? chartTransformers.transformHouses(rawAnalysis.houses) : [],
        aspects: rawAnalysis.aspects ? chartTransformers.transformAspects(rawAnalysis.aspects) : [],
      },
      elements: rawAnalysis.elements || {},
      modalities: rawAnalysis.modalities || {},
      quadrants: rawAnalysis.quadrants || {},
      patterns: rawAnalysis.patterns || {},
    };
  },

  // Format degrees to astrological notation
  formatDegree: (degree: number, includeMinutes: boolean = true): string => {
    const wholeDegrees = Math.floor(degree);
    const minutes = Math.floor((degree - wholeDegrees) * 60);

    if (includeMinutes) {
      return `${wholeDegrees}°${minutes.toString().padStart(2, '0')}'`;
    }
    return `${wholeDegrees}°`;
  },

  // Get sign position from degree
  getSignPosition: (degree: number): { sign: string; position: number } => {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer',
      'Leo', 'Virgo', 'Libra', 'Scorpio',
      'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ];

    const signIndex = Math.floor(degree / 30);
    const position = degree % 30;

    return {
      sign: signs[signIndex] || 'Unknown',
      position,
    };
  },
};
