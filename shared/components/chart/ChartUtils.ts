import type { PlanetName, ZodiacSign, AspectType } from './chartTypes';

export const PLANET_COLORS: Record<string, string> = {
  Sun: '#FFD700',
  Moon: '#A9A9A9',
  Mercury: '#FFA500',
  Venus: '#ADFF2F',
  Mars: '#FF4500',
  Jupiter: '#FF8C00',
  Saturn: '#DAA520',
  Uranus: '#40E0D0',
  Neptune: '#1E90FF',
  Pluto: '#8A2BE2',
  Ascendant: '#FFFFFF',
  Midheaven: '#FFFFFF',
  Chiron: '#9932CC',
  Node: '#708090',
};

export const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '\u2609',
  Moon: '\u263D',
  Mercury: '\u263F',
  Venus: '\u2640',
  Mars: '\u2642',
  Jupiter: '\u2643',
  Saturn: '\u2644',
  Uranus: '\u2645',
  Neptune: '\u2646',
  Pluto: '\u2647',
  Ascendant: 'AC',
  Midheaven: 'MC',
  Chiron: '\u26B7',
  Node: '\u260A',
};

export const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: '\u2648',
  Taurus: '\u2649',
  Gemini: '\u264A',
  Cancer: '\u264B',
  Leo: '\u264C',
  Virgo: '\u264D',
  Libra: '\u264E',
  Scorpio: '\u264F',
  Sagittarius: '\u2650',
  Capricorn: '\u2651',
  Aquarius: '\u2652',
  Pisces: '\u2653',
};

export const ZODIAC_COLORS: Record<string, string> = {
  Aries: '#FF6B6B',
  Taurus: '#4ECDC4',
  Gemini: '#45B7D1',
  Cancer: '#96CEB4',
  Leo: '#FFEAA7',
  Virgo: '#DDA0DD',
  Libra: '#FFB6C1',
  Scorpio: '#DC143C',
  Sagittarius: '#9966CC',
  Capricorn: '#8B4513',
  Aquarius: '#40E0D0',
  Pisces: '#6495ED',
};

export const CHART_DIMENSIONS = {
  size: 300,
  centerX: 150,
  centerY: 150,
  outerRadius: 120,
  innerRadius: 80,
  planetRadius: 160,
  houseRadius: 130,
  houseOuterRadius: 135,
};

export const degreeToRadians = (degree: number): number => (degree * Math.PI) / 180;

export const getZodiacPositionFromDegree = (
  degree: number
): { sign: ZodiacSign; position: number } => {
  const signIndex = Math.floor(degree / 30);
  const position = degree % 30;
  const signs: ZodiacSign[] = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];
  return { sign: signs[signIndex] || 'Aries', position: Math.round(position * 100) / 100 };
};

export const getAspectColor = (aspectType: AspectType | string): string => {
  switch (aspectType) {
    case 'conjunction':
    case 'opposition':
    case 'square':
    case 'quincunx':
      return '#FF0000';
    case 'trine':
    case 'sextile':
      return '#0066FF';
    default:
      return '#808080';
  }
};

export const getPlanetGlyph = (planetName: PlanetName | string): string =>
  PLANET_SYMBOLS[planetName as string] || (typeof planetName === 'string' ? planetName.substring(0, 2) : '');

export const getZodiacGlyph = (signName: ZodiacSign | string): string =>
  ZODIAC_SYMBOLS[signName as string] || (typeof signName === 'string' ? signName.substring(0, 2) : '');

export const getCirclePosition = (
  degree: number,
  radius: number,
  centerX: number = CHART_DIMENSIONS.centerX,
  centerY: number = CHART_DIMENSIONS.centerY,
  ascendantDegree: number = 0
): { x: number; y: number } => {
  const adjustedDegree = (180 - degree + ascendantDegree) % 360;
  const radians = degreeToRadians(adjustedDegree);
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
};

export const hexToRgba = (hex: string, alpha: number = 1): string => {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const filterPlanets = <T extends { name: string }>(planets: T[]): T[] => {
  const excludedPlanets = ['South Node', 'Part of Fortune'];
  return planets.filter((planet) => !excludedPlanets.includes(planet.name));
};

export const getAspectStrength = (orb: number): number => Math.max(0.1, 1 - orb / 10);

// Convert a sign name + within-sign degree (0-30) into an absolute zodiac
// longitude (0-360). Falls back to sign center if degree is missing.
export const absoluteLongitudeFromSign = (
  sign: ZodiacSign | string | null | undefined,
  degree: number | undefined
): number | null => {
  if (!sign) return null;
  const signs: string[] = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];
  const idx = signs.indexOf(sign as string);
  if (idx < 0) return null;
  if (typeof degree !== 'number' || !Number.isFinite(degree)) {
    return idx * 30 + 15;
  }
  if (degree >= 0 && degree < 30) return idx * 30 + degree;
  const wrapped = ((degree % 360) + 360) % 360;
  return wrapped;
};
