// Chart-specific types decoupled from main-app type tree so the chart
// component is reusable from any app surface.

export type PlanetName =
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars'
  | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto'
  | 'Ascendant' | 'Midheaven' | 'Chiron' | 'Node';

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo'
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type AspectType =
  | 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile'
  | 'quincunx' | 'semisextile' | 'semisquare' | 'sesquiquadrate';

export interface BackendPlanet {
  name: PlanetName | string;
  full_degree: number;
  norm_degree?: number;
  speed?: number;
  is_retro?: boolean;
  sign: ZodiacSign | string | null;
  house?: number;
  tags?: string[];
}

export interface BackendAspect {
  aspectingPlanet: PlanetName | string;
  aspectingPlanetDegree?: number;
  aspectedPlanet: PlanetName | string;
  aspectedPlanetDegree?: number;
  aspectType: AspectType | string;
  orb: number;
}

export interface BackendHouse {
  house: number;
  degree: number;
  sign?: ZodiacSign | string | null;
}

export interface BirthChart {
  planets: BackendPlanet[];
  aspects: BackendAspect[];
  houses: BackendHouse[];
}

export interface ChartColorTokens {
  surface: string;
  border: string;
  onSurface: string;
  onSurfaceVariant: string;
}
