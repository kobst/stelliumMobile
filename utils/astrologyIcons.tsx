import React from 'react';
import { View, Text } from 'react-native';
import { SvgProps } from 'react-native-svg';

// Import all zodiac sign SVGs
import AriesSvg from '../assets/astrology/signs/aries.svg';
import TaurusSvg from '../assets/astrology/signs/taurus.svg';
import GeminiSvg from '../assets/astrology/signs/gemini.svg';
import CancerSvg from '../assets/astrology/signs/cancer.svg';
import LeoSvg from '../assets/astrology/signs/leo.svg';
import VirgoSvg from '../assets/astrology/signs/virgo.svg';
import LibraSvg from '../assets/astrology/signs/libra.svg';
import ScorpioSvg from '../assets/astrology/signs/scorpio.svg';
import SagittariusSvg from '../assets/astrology/signs/sagittarius.svg';
import CapricornSvg from '../assets/astrology/signs/capricorn.svg';
import AquariusSvg from '../assets/astrology/signs/aquarius.svg';
import PiscesSvg from '../assets/astrology/signs/pisces.svg';

// Import all planet SVGs
import SunSvg from '../assets/astrology/planets/sun.svg';
import MoonSvg from '../assets/astrology/planets/moon.svg';
import MercurySvg from '../assets/astrology/planets/mercury.svg';
import VenusSvg from '../assets/astrology/planets/venus.svg';
import MarsSvg from '../assets/astrology/planets/mars.svg';
import JupiterSvg from '../assets/astrology/planets/jupiter.svg';
import SaturnSvg from '../assets/astrology/planets/saturn.svg';
import UranusSvg from '../assets/astrology/planets/uranus.svg';
import NeptuneSvg from '../assets/astrology/planets/neptune.svg';
import PlutoSvg from '../assets/astrology/planets/pluto.svg';
import AscendantSvg from '../assets/astrology/planets/ascendant.svg';

export type ZodiacSign =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type Planet =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto' | 'ascendant';

// Map zodiac signs to their SVG components
export const zodiacIcons: Record<ZodiacSign, React.ComponentType<SvgProps>> = {
  aries: AriesSvg,
  taurus: TaurusSvg,
  gemini: GeminiSvg,
  cancer: CancerSvg,
  leo: LeoSvg,
  virgo: VirgoSvg,
  libra: LibraSvg,
  scorpio: ScorpioSvg,
  sagittarius: SagittariusSvg,
  capricorn: CapricornSvg,
  aquarius: AquariusSvg,
  pisces: PiscesSvg,
};

// Map planets to their SVG components
export const planetIcons: Record<Planet, React.ComponentType<SvgProps>> = {
  sun: SunSvg,
  moon: MoonSvg,
  mercury: MercurySvg,
  venus: VenusSvg,
  mars: MarsSvg,
  jupiter: JupiterSvg,
  saturn: SaturnSvg,
  uranus: UranusSvg,
  neptune: NeptuneSvg,
  pluto: PlutoSvg,
  ascendant: AscendantSvg,
};

// Helper component to render zodiac sign icons
export const ZodiacIcon: React.FC<{ sign: ZodiacSign; size?: number; color?: string }> = ({
  sign,
  size = 24,
  color = '#000',
}) => {
  const IconComponent = zodiacIcons[sign];
  if (!IconComponent) {
    return null;
  }

  return <IconComponent width={`${size}`} height={`${size}`} fill={color} />;
};

// Helper component to render planet icons
export const PlanetIcon: React.FC<{ planet: Planet; size?: number; color?: string }> = ({
  planet,
  size = 24,
  color = '#000',
}) => {
  const IconComponent = planetIcons[planet];
  if (!IconComponent) {
    return null;
  }

  return <IconComponent width={`${size}`} height={`${size}`} fill={color} />;
};

// Helper functions to get icon components directly
export const getZodiacIcon = (sign: ZodiacSign): React.ComponentType<SvgProps> | null => {
  return zodiacIcons[sign] || null;
};

export const getPlanetIcon = (planet: Planet): React.ComponentType<SvgProps> | null => {
  return planetIcons[planet] || null;
};

// Helper functions to work with your existing constants format
export const getZodiacIconFromConstant = (sign: string): React.ComponentType<SvgProps> | null => {
  const normalizedSign = sign.toLowerCase() as ZodiacSign;
  return zodiacIcons[normalizedSign] || null;
};

export const getPlanetIconFromConstant = (planet: string): React.ComponentType<SvgProps> | null => {
  const normalizedPlanet = planet.toLowerCase() as Planet;
  return planetIcons[normalizedPlanet] || null;
};

// Fallback symbols for planets/signs without SVGs
const getSymbolFallback = (type: 'zodiac' | 'planet', name: string): string => {
  const planetSymbols: { [key: string]: string } = {
    'Sun': '☉', 'Moon': '☽', 'Mercury': '☿', 'Venus': '♀', 'Mars': '♂',
    'Jupiter': '♃', 'Saturn': '♄', 'Uranus': '♅', 'Neptune': '♆', 'Pluto': '♇',
    'Ascendant': '↗', 'Midheaven': '⟂', 'Node': '☊', 'Chiron': '⚷',
  };

  const zodiacSymbols: { [key: string]: string } = {
    'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
    'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
    'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓',
  };

  if (type === 'planet') {
    return planetSymbols[name] || '●';
  } else {
    return zodiacSymbols[name] || '○';
  }
};

// Component that works with your existing constants
export const AstroIcon: React.FC<{
  type: 'zodiac' | 'planet';
  name: string;
  size?: number;
  color?: string;
}> = ({ type, name, size = 24, color = '#000' }) => {
  let IconComponent: React.ComponentType<SvgProps> | null = null;

  if (type === 'zodiac') {
    IconComponent = getZodiacIconFromConstant(name);
  } else if (type === 'planet') {
    IconComponent = getPlanetIconFromConstant(name);
  }

  // If we have an SVG component, use it
  if (IconComponent) {
    return <IconComponent width={`${size}`} height={`${size}`} fill={color} />;
  }

  // Otherwise, fall back to text symbol
  const symbol = getSymbolFallback(type, name);
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.8, color, fontWeight: '500' }}>
        {symbol}
      </Text>
    </View>
  );
};
