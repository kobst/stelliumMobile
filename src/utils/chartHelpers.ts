import { BackendPlanet, SubjectDocument, ZodiacSign } from '../types';
import { zodiacSymbols, planetarySymbols } from '../../constants';

export interface PlanetaryData {
  sun: { sign: ZodiacSign | null; symbol: string };
  moon: { sign: ZodiacSign | null; symbol: string };
  ascendant: { sign: ZodiacSign | null; symbol: string } | null;
}

/**
 * Extracts sun, moon, and ascendant signs from a subject's birth chart
 */
export const extractPlanetaryData = (subject: SubjectDocument): PlanetaryData => {
  const planets = subject.birthChart?.planets || [];

  const sun = planets.find((p: BackendPlanet) => p.name === 'Sun');
  const moon = planets.find((p: BackendPlanet) => p.name === 'Moon');
  const ascendant = planets.find((p: BackendPlanet) => p.name === 'Ascendant');

  return {
    sun: {
      sign: sun?.sign || null,
      symbol: zodiacSymbols[sun?.sign || ''] || '',
    },
    moon: {
      sign: moon?.sign || null,
      symbol: zodiacSymbols[moon?.sign || ''] || '',
    },
    ascendant: ascendant?.sign ? {
      sign: ascendant.sign,
      symbol: zodiacSymbols[ascendant.sign] || '',
    } : null,
  };
};

/**
 * Gets zodiac sign from birth date (fallback for when birth chart data isn't available)
 */
export const getZodiacSignFromDate = (birthMonth: number, birthDay: number): string => {
  const zodiacDates = [
    { sign: 'Aries', start: [3, 21], end: [4, 19] },
    { sign: 'Taurus', start: [4, 20], end: [5, 20] },
    { sign: 'Gemini', start: [5, 21], end: [6, 20] },
    { sign: 'Cancer', start: [6, 21], end: [7, 22] },
    { sign: 'Leo', start: [7, 23], end: [8, 22] },
    { sign: 'Virgo', start: [8, 23], end: [9, 22] },
    { sign: 'Libra', start: [9, 23], end: [10, 22] },
    { sign: 'Scorpio', start: [10, 23], end: [11, 21] },
    { sign: 'Sagittarius', start: [11, 22], end: [12, 21] },
    { sign: 'Capricorn', start: [12, 22], end: [1, 19] },
    { sign: 'Aquarius', start: [1, 20], end: [2, 18] },
    { sign: 'Pisces', start: [2, 19], end: [3, 20] },
  ];

  for (const zodiac of zodiacDates) {
    const [startMonth, startDay] = zodiac.start;
    const [endMonth, endDay] = zodiac.end;

    if (startMonth === endMonth) {
      if (birthMonth === startMonth && birthDay >= startDay && birthDay <= endDay) {
        return zodiacSymbols[zodiac.sign as ZodiacSign] || '⭐';
      }
    } else {
      if ((birthMonth === startMonth && birthDay >= startDay) ||
          (birthMonth === endMonth && birthDay <= endDay)) {
        return zodiacSymbols[zodiac.sign as ZodiacSign] || '⭐';
      }
    }
  }

  return '⭐';
};

/**
 * Formats planetary data for display
 */
// Function to get zodiac symbol without triggering any global styling
const getZodiacSymbol = (sign: string | null): string => {
  if (!sign) {
    return '';
  }
  // Use character codes to avoid any text processing
  const symbols: { [key: string]: string } = {
    'Aries': '\u2648',
    'Taurus': '\u2649',
    'Gemini': '\u264A',
    'Cancer': '\u264B',
    'Leo': '\u264C',
    'Virgo': '\u264D',
    'Libra': '\u264E',
    'Scorpio': '\u264F',
    'Sagittarius': '\u2650',
    'Capricorn': '\u2651',
    'Aquarius': '\u2652',
    'Pisces': '\u2653',
  };

  return symbols[sign] || '';
};

export const formatPlanetaryDisplay = (planetaryData: PlanetaryData): string[] => {
  const display = [];

  if (planetaryData.sun.sign) {
    display.push(`${planetarySymbols.Sun}${getZodiacSymbol(planetaryData.sun.sign)}`);
  }

  if (planetaryData.moon.sign) {
    display.push(`${planetarySymbols.Moon}${getZodiacSymbol(planetaryData.moon.sign)}`);
  }

  if (planetaryData.ascendant?.sign) {
    display.push(`${planetarySymbols.Ascendant}${getZodiacSymbol(planetaryData.ascendant.sign)}`);
  }

  return display;
};
