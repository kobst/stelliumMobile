import React from 'react';
import { SvgProps } from 'react-native-svg';

import AriesSvg from '../../assets/astrology/signs/aries.svg';
import TaurusSvg from '../../assets/astrology/signs/taurus.svg';
import GeminiSvg from '../../assets/astrology/signs/gemini.svg';
import CancerSvg from '../../assets/astrology/signs/cancer.svg';
import LeoSvg from '../../assets/astrology/signs/leo.svg';
import VirgoSvg from '../../assets/astrology/signs/virgo.svg';
import LibraSvg from '../../assets/astrology/signs/libra.svg';
import ScorpioSvg from '../../assets/astrology/signs/scorpio.svg';
import SagittariusSvg from '../../assets/astrology/signs/sagittarius.svg';
import CapricornSvg from '../../assets/astrology/signs/capricorn.svg';
import AquariusSvg from '../../assets/astrology/signs/aquarius.svg';
import PiscesSvg from '../../assets/astrology/signs/pisces.svg';

import SunSvg from '../../assets/astrology/planets/sun.svg';
import MoonSvg from '../../assets/astrology/planets/moon.svg';
import MercurySvg from '../../assets/astrology/planets/mercury.svg';
import VenusSvg from '../../assets/astrology/planets/venus.svg';
import MarsSvg from '../../assets/astrology/planets/mars.svg';
import JupiterSvg from '../../assets/astrology/planets/jupiter.svg';
import SaturnSvg from '../../assets/astrology/planets/saturn.svg';
import UranusSvg from '../../assets/astrology/planets/uranus.svg';
import NeptuneSvg from '../../assets/astrology/planets/neptune.svg';
import PlutoSvg from '../../assets/astrology/planets/pluto.svg';
import AscendantSvg from '../../assets/astrology/planets/ascendant.svg';
import MidheavenSvg from '../../assets/astrology/planets/midheaven.svg';

export type ZodiacSignKey =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type PlanetKey =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter'
  | 'saturn' | 'uranus' | 'neptune' | 'pluto' | 'ascendant' | 'midheaven';

const zodiacIcons: Record<ZodiacSignKey, React.ComponentType<SvgProps>> = {
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

const planetIcons: Record<PlanetKey, React.ComponentType<SvgProps>> = {
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
  midheaven: MidheavenSvg,
};

export function getZodiacIconFromConstant(sign: string): React.ComponentType<SvgProps> | null {
  const normalized = sign.toLowerCase() as ZodiacSignKey;
  return zodiacIcons[normalized] || null;
}

export function getPlanetIconFromConstant(planet: string): React.ComponentType<SvgProps> | null {
  const normalized = planet.toLowerCase() as PlanetKey;
  return planetIcons[normalized] || null;
}

export type ZodiacSign = ZodiacSignKey;

interface ZodiacIconProps {
  sign: ZodiacSign;
  size?: number;
  color?: string;
}

export function ZodiacIcon({ sign, size = 24, color = '#000' }: ZodiacIconProps) {
  const IconComponent = zodiacIcons[sign];
  if (!IconComponent) {
    return null;
  }
  return <IconComponent width={`${size}`} height={`${size}`} fill={color} />;
}
