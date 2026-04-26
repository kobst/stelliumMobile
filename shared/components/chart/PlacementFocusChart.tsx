import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { absoluteLongitudeFromSign } from './ChartUtils';
import {
  getPlanetIconFromConstant,
  getZodiacIconFromConstant,
} from '../../utils/astrologyIcons';
import type { PlanetName, ZodiacSign } from './chartTypes';

const SIGN_NAMES: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const NEUTRAL_COLOR = '#cabeff';
const FAINT_RING_DEFAULT = 'rgba(255, 255, 255, 0.07)';
const INACTIVE_SIGN_DEFAULT = 'rgba(255, 255, 255, 0.12)';
const ACTIVE_SECTOR_FILL_DEFAULT = 'rgba(255, 255, 255, 0.04)';

export interface PlacementFocusPlanet {
  name: PlanetName | string;
  sign?: ZodiacSign | string;
  degree?: number;
  house?: number;
  isRetro?: boolean;
}

export interface PlacementFocusChartProps {
  planet: PlacementFocusPlanet;
  size?: number;
  planetColor?: string;
  activeSignColor?: string;
  inactiveSignColor?: string;
  ringColor?: string;
  activeSectorFill?: string;
  ascendantDegree?: number;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  deg: number,
  ascendantDegree: number = 0
) {
  const adjusted = (180 - deg + ascendantDegree + 360) % 360;
  const rad = (adjusted * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
  ascendantDegree: number = 0
): string {
  const start1 = polarToCartesian(cx, cy, rOuter, startDeg, ascendantDegree);
  const end1 = polarToCartesian(cx, cy, rOuter, endDeg, ascendantDegree);
  const start2 = polarToCartesian(cx, cy, rInner, endDeg, ascendantDegree);
  const end2 = polarToCartesian(cx, cy, rInner, startDeg, ascendantDegree);
  const sweep = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return [
    `M ${start1.x} ${start1.y}`,
    `A ${rOuter} ${rOuter} 0 ${sweep} 0 ${end1.x} ${end1.y}`,
    `L ${start2.x} ${start2.y}`,
    `A ${rInner} ${rInner} 0 ${sweep} 1 ${end2.x} ${end2.y}`,
    'Z',
  ].join(' ');
}

export function PlacementFocusChart({
  planet,
  size = 90,
  planetColor = NEUTRAL_COLOR,
  activeSignColor = '#e8e4f0',
  inactiveSignColor = INACTIVE_SIGN_DEFAULT,
  ringColor = FAINT_RING_DEFAULT,
  activeSectorFill = ACTIVE_SECTOR_FILL_DEFAULT,
  ascendantDegree = 0,
}: PlacementFocusChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.32;
  const innerR = size * 0.2;
  const planetR = size * 0.43;
  const signGlyphSize = size * 0.075;
  const planetGlyphSize = size * 0.13;

  // If sign is unknown (e.g. SynP-/CompP- without scored-item enrichment),
  // place the planet glyph at the top so the card still has visual presence.
  const lon = planet.sign
    ? absoluteLongitudeFromSign(planet.sign, planet.degree) ?? 0
    : 90;
  const planetPos = polarToCartesian(cx, cy, planetR, lon, ascendantDegree);

  const activeSign = planet.sign;
  const PlanetIcon = getPlanetIconFromConstant(planet.name);
  const houseLabel =
    typeof planet.house === 'number' && planet.house > 0 ? `H${planet.house}` : null;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {SIGN_NAMES.map((sign, i) => {
          if (sign !== activeSign) return null;
          const startDeg = i * 30;
          const endDeg = startDeg + 30;
          return (
            <Path
              key={`sector-${i}`}
              d={arcPath(cx, cy, outerR, innerR, startDeg, endDeg, ascendantDegree)}
              fill={activeSectorFill}
              stroke="none"
            />
          );
        })}

        <Circle cx={cx} cy={cy} r={outerR} fill="none" stroke={ringColor} strokeWidth={0.8} />
        <Circle cx={cx} cy={cy} r={innerR} fill="none" stroke={ringColor} strokeWidth={0.6} />

        {SIGN_NAMES.map((sign, i) => {
          const cuspDeg = i * 30;
          const cuspStart = polarToCartesian(cx, cy, innerR, cuspDeg, ascendantDegree);
          const cuspEnd = polarToCartesian(cx, cy, outerR, cuspDeg, ascendantDegree);
          const labelPos = polarToCartesian(
            cx,
            cy,
            (innerR + outerR) / 2,
            cuspDeg + 15,
            ascendantDegree
          );
          const isActive = sign === activeSign;
          const fill = isActive ? activeSignColor : inactiveSignColor;
          const SignIcon = getZodiacIconFromConstant(sign);
          return (
            <G key={`sign-${i}`}>
              <Line
                x1={cuspStart.x}
                y1={cuspStart.y}
                x2={cuspEnd.x}
                y2={cuspEnd.y}
                stroke={ringColor}
                strokeWidth={0.4}
              />
              {SignIcon ? (
                <G
                  transform={`translate(${labelPos.x - signGlyphSize / 2}, ${labelPos.y - signGlyphSize / 2})`}
                >
                  <SignIcon
                    width={`${signGlyphSize}`}
                    height={`${signGlyphSize}`}
                    fill={fill}
                  />
                </G>
              ) : (
                <SvgText
                  x={labelPos.x}
                  y={labelPos.y + signGlyphSize * 0.35}
                  fontSize={signGlyphSize}
                  fill={fill}
                  textAnchor="middle"
                >
                  {sign.slice(0, 2)}
                </SvgText>
              )}
            </G>
          );
        })}

        {houseLabel ? (
          <SvgText
            x={cx}
            y={cy + size * 0.04}
            fontSize={size * 0.13}
            fill={activeSignColor}
            textAnchor="middle"
            fontWeight="600"
            opacity={0.7}
          >
            {houseLabel}
          </SvgText>
        ) : null}

        {PlanetIcon ? (
          <G
            transform={`translate(${planetPos.x - planetGlyphSize / 2}, ${planetPos.y - planetGlyphSize / 2})`}
          >
            <PlanetIcon
              width={`${planetGlyphSize}`}
              height={`${planetGlyphSize}`}
              fill={planetColor}
            />
          </G>
        ) : (
          <SvgText
            x={planetPos.x}
            y={planetPos.y + planetGlyphSize * 0.35}
            fontSize={planetGlyphSize}
            fill={planetColor}
            textAnchor="middle"
            fontWeight="700"
          >
            {planet.name.slice(0, 2)}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}
