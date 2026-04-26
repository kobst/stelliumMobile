import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { absoluteLongitudeFromSign } from './ChartUtils';
import {
  getPlanetIconFromConstant,
  getZodiacIconFromConstant,
} from '../../utils/astrologyIcons';
import type { AspectType, PlanetName, ZodiacSign } from './chartTypes';

const SIGN_NAMES: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const SUPPORT_COLOR = '#82C8B4';
const CHALLENGE_COLOR = '#E8856B';
const NEUTRAL_COLOR = '#cabeff';

const HARMONIOUS = new Set(['trine', 'sextile']);
const HARD = new Set(['square', 'opposition', 'quincunx']);

const FAINT_RING_DEFAULT = 'rgba(255, 255, 255, 0.07)';
const INACTIVE_SIGN_DEFAULT = 'rgba(255, 255, 255, 0.12)';
const ACTIVE_SECTOR_FILL_DEFAULT = 'rgba(255, 255, 255, 0.04)';

export interface AspectFocusPlanet {
  name: PlanetName | string;
  sign: ZodiacSign | string;
  degree?: number;
  house?: number;
  isRetro?: boolean;
}

export interface AspectFocusChartProps {
  aspect: AspectType | string;
  planet1: AspectFocusPlanet;
  planet2: AspectFocusPlanet;
  source?: 'synastry' | 'composite' | 'natal';
  size?: number;
  // Per-person tints (for synastry); composite/natal share planet1Color.
  planet1Color?: string;
  planet2Color?: string;
  // Active sign-glyph color (the two signs the planets sit in).
  activeSignColor?: string;
  // Inactive sign-glyph color (the other ten).
  inactiveSignColor?: string;
  // Faint ring stroke for the outer/inner circles + cusp lines.
  ringColor?: string;
  // Subtle fill behind the two involved sign sectors.
  activeSectorFill?: string;
}

interface AspectStyle {
  color: string;
  dashed: boolean;
}

function aspectStyleFor(aspect: string): AspectStyle {
  const a = aspect.toLowerCase();
  if (HARMONIOUS.has(a)) return { color: SUPPORT_COLOR, dashed: false };
  if (HARD.has(a)) return { color: CHALLENGE_COLOR, dashed: true };
  return { color: NEUTRAL_COLOR, dashed: false };
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  // 0° Aries at 9 o'clock, increasing counter-clockwise (matches main-app
  // chart orientation).
  const adjusted = (180 - deg + 360) % 360;
  const rad = (adjusted * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function signIndexOf(sign: string): number {
  const i = SIGN_NAMES.indexOf(sign as ZodiacSign);
  return i < 0 ? 0 : i;
}

function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number
): string {
  const start1 = polarToCartesian(cx, cy, rOuter, startDeg);
  const end1 = polarToCartesian(cx, cy, rOuter, endDeg);
  const start2 = polarToCartesian(cx, cy, rInner, endDeg);
  const end2 = polarToCartesian(cx, cy, rInner, startDeg);
  const sweep = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  // The chart's polarToCartesian flips angle direction; with our 30° sectors
  // the small-arc sweep is 0 and we draw clockwise on the outer arc, then
  // counter-clockwise on the inner arc to close the wedge.
  return [
    `M ${start1.x} ${start1.y}`,
    `A ${rOuter} ${rOuter} 0 ${sweep} 0 ${end1.x} ${end1.y}`,
    `L ${start2.x} ${start2.y}`,
    `A ${rInner} ${rInner} 0 ${sweep} 1 ${end2.x} ${end2.y}`,
    'Z',
  ].join(' ');
}

export function AspectFocusChart({
  aspect,
  planet1,
  planet2,
  source = 'synastry',
  size = 150,
  planet1Color = NEUTRAL_COLOR,
  planet2Color = SUPPORT_COLOR,
  activeSignColor = '#e8e4f0',
  inactiveSignColor = INACTIVE_SIGN_DEFAULT,
  ringColor = FAINT_RING_DEFAULT,
  activeSectorFill = ACTIVE_SECTOR_FILL_DEFAULT,
}: AspectFocusChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  // Smaller sign band sits inside; planets ride the outer edge of the chart.
  const outerR = size * 0.32;
  const innerR = size * 0.2;
  const planetR = size * 0.43;
  const signGlyphSize = size * 0.075;
  const planetGlyphSize = size * 0.13;

  const lon1 =
    absoluteLongitudeFromSign(planet1.sign, planet1.degree) ??
    signIndexOf(planet1.sign) * 30 + 15;
  const lon2 =
    absoluteLongitudeFromSign(planet2.sign, planet2.degree) ??
    signIndexOf(planet2.sign) * 30 + 15;
  const p1Pos = polarToCartesian(cx, cy, planetR, lon1);
  const p2Pos = polarToCartesian(cx, cy, planetR, lon2);
  // Aspect line endpoints sit at the inner edge of the sign band so the line
  // forms a chord across the center, never overlapping the planet glyphs.
  const line1 = polarToCartesian(cx, cy, innerR, lon1);
  const line2 = polarToCartesian(cx, cy, innerR, lon2);

  const styleData = aspectStyleFor(aspect);
  const dashArray = styleData.dashed ? `${size * 0.04} ${size * 0.025}` : undefined;

  const useTwoTints = source === 'synastry';
  const p1Tint = planet1Color;
  const p2Tint = useTwoTints ? planet2Color : planet1Color;

  const involvedSigns = new Set([planet1.sign, planet2.sign]);

  const PlanetIcon1 = getPlanetIconFromConstant(planet1.name);
  const PlanetIcon2 = getPlanetIconFromConstant(planet2.name);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Active sign sector fills (subtle, behind everything else) */}
        {SIGN_NAMES.map((sign, i) => {
          if (!involvedSigns.has(sign)) return null;
          const startDeg = i * 30;
          const endDeg = startDeg + 30;
          return (
            <Path
              key={`sector-${i}`}
              d={arcPath(cx, cy, outerR, innerR, startDeg, endDeg)}
              fill={activeSectorFill}
              stroke="none"
            />
          );
        })}

        {/* Faint outer + inner circles */}
        <Circle cx={cx} cy={cy} r={outerR} fill="none" stroke={ringColor} strokeWidth={0.8} />
        <Circle cx={cx} cy={cy} r={innerR} fill="none" stroke={ringColor} strokeWidth={0.6} />

        {/* Cusp lines + sign glyphs */}
        {SIGN_NAMES.map((sign, i) => {
          const cuspDeg = i * 30;
          const cuspStart = polarToCartesian(cx, cy, innerR, cuspDeg);
          const cuspEnd = polarToCartesian(cx, cy, outerR, cuspDeg);
          const labelPos = polarToCartesian(
            cx,
            cy,
            (innerR + outerR) / 2,
            cuspDeg + 15
          );
          const isActive = involvedSigns.has(sign);
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

        {/* Aspect line — endpoints at the inner ring, not at the planets */}
        <Line
          x1={line1.x}
          y1={line1.y}
          x2={line2.x}
          y2={line2.y}
          stroke={styleData.color}
          strokeWidth={size * 0.018}
          strokeDasharray={dashArray}
          strokeLinecap="round"
        />

        {/* Planet glyphs */}
        {([
          { Icon: PlanetIcon1, name: planet1.name, pos: p1Pos, color: p1Tint },
          { Icon: PlanetIcon2, name: planet2.name, pos: p2Pos, color: p2Tint },
        ] as const).map((p, i) =>
          p.Icon ? (
            <G
              key={`planet-${i}`}
              transform={`translate(${p.pos.x - planetGlyphSize / 2}, ${p.pos.y - planetGlyphSize / 2})`}
            >
              <p.Icon
                width={`${planetGlyphSize}`}
                height={`${planetGlyphSize}`}
                fill={p.color}
              />
            </G>
          ) : (
            <SvgText
              key={`planet-${i}`}
              x={p.pos.x}
              y={p.pos.y + planetGlyphSize * 0.35}
              fontSize={planetGlyphSize}
              fill={p.color}
              textAnchor="middle"
              fontWeight="700"
            >
              {p.name.slice(0, 2)}
            </SvgText>
          )
        )}
      </Svg>
    </View>
  );
}
