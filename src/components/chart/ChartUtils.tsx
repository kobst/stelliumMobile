import { PlanetName, ZodiacSign, AspectType } from '../../types';

// Planet colors from original frontend
export const PLANET_COLORS = {
  Sun: '#FFD700',      // gold
  Moon: '#A9A9A9',     // grey
  Mercury: '#FFA500',  // orange
  Venus: '#ADFF2F',    // greenish
  Mars: '#FF4500',     // red/orange
  Jupiter: '#FF8C00',  // dark orange
  Saturn: '#DAA520',   // goldenrod
  Uranus: '#40E0D0',   // turquoise
  Neptune: '#1E90FF',  // blue
  Pluto: '#8A2BE2',    // purple
  Ascendant: '#FFFFFF', // white
  Midheaven: '#FFFFFF', // white
  Chiron: '#9932CC',   // dark orchid
  Node: '#708090',     // slate gray
};

// Unicode symbols for planets (fallback for missing images)
export const PLANET_SYMBOLS = {
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
  Chiron: '⚷',
  Node: '☊',
};

// Unicode symbols for zodiac signs
export const ZODIAC_SYMBOLS = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

// Colors for zodiac signs
export const ZODIAC_COLORS = {
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

// Chart dimensions for mobile
export const CHART_DIMENSIONS = {
  size: 300, // Smaller for mobile
  centerX: 150,
  centerY: 150,
  outerRadius: 120,
  innerRadius: 80,
  planetRadius: 160, // Extended farther beyond house outer ring
  houseRadius: 130,
  houseOuterRadius: 135, // Outer boundary for house number ring (closer to outer edge)
};

// Helper functions
export const degreeToRadians = (degree: number): number => {
  return (degree * Math.PI) / 180;
};

export const getZodiacPositionFromDegree = (degree: number): { sign: ZodiacSign; position: number } => {
  const signIndex = Math.floor(degree / 30);
  const position = degree % 30;

  const signs: ZodiacSign[] = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];

  return {
    sign: signs[signIndex] || 'Aries',
    position: Math.round(position * 100) / 100,
  };
};

export const getAspectColor = (aspectType: AspectType): string => {
  // Hard aspects (challenging): red
  // Soft aspects (harmonious): blue
  switch (aspectType) {
    case 'conjunction':
    case 'opposition':
    case 'square':
    case 'quincunx':
      return '#FF0000'; // red for hard aspects
    case 'trine':
    case 'sextile':
      return '#0066FF'; // blue for soft aspects
    default:
      return '#808080'; // gray for minor aspects
  }
};

export const formatDegree = (degree: number): string => {
  const { sign, position } = getZodiacPositionFromDegree(degree);
  return `${position.toFixed(1)}° ${sign}`;
};

export const formatTime = (hour: number, minute: number): string => {
  if (hour === 12 && minute === 0) {
    return 'Unknown time';
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');

  return `${displayHour}:${displayMinute} ${period}`;
};

export const getPlanetGlyph = (planetName: PlanetName): string => {
  return PLANET_SYMBOLS[planetName] || planetName.substring(0, 2);
};

export const getZodiacGlyph = (signName: ZodiacSign): string => {
  return ZODIAC_SYMBOLS[signName] || signName.substring(0, 2);
};

// Calculate position on circle for given degree
export const getCirclePosition = (
  degree: number,
  radius: number,
  centerX: number = CHART_DIMENSIONS.centerX,
  centerY: number = CHART_DIMENSIONS.centerY,
  ascendantDegree: number = 0
) => {
  // In astrology:
  // - Ascendant should be at 9 o'clock (left side = 180° in math coordinates)
  // - Chart rotates so ascendant is always at 9 o'clock
  // - Degrees proceed counterclockwise from ascendant

  // Convert astrological degree to math coordinates
  // Astrological 0° = Math 180° (9 o'clock position)
  const adjustedDegree = (180 - degree + ascendantDegree) % 360;
  const radians = degreeToRadians(adjustedDegree);

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
};

// Convert hex color to rgba
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

// Filter out excluded planets
export const filterPlanets = (planets: any[]): any[] => {
  const excludedPlanets = ['South Node', 'Part of Fortune'];
  return planets.filter(planet => !excludedPlanets.includes(planet.name));
};

// Calculate aspect strength for visual representation
export const getAspectStrength = (orb: number): number => {
  // Closer to exact = stronger (1.0), further away = weaker (0.1)
  return Math.max(0.1, 1 - (orb / 10));
};
