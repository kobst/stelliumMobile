import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import type { ReactElement } from 'react';
import {
  CHART_DIMENSIONS,
  filterPlanets,
  getCirclePosition,
} from './ChartUtils';
import {
  getPlanetIconFromConstant,
  getZodiacIconFromConstant,
} from '../../utils/astrologyIcons';
import type {
  BackendAspect,
  BackendPlanet,
  BirthChart,
  ChartColorTokens,
  ZodiacSign,
} from './chartTypes';

const SIGN_NAMES: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const HARMONIOUS = new Set(['trine', 'sextile']);
const HARD = new Set(['square', 'opposition', 'quincunx']);

const SUPPORT_COLOR = '#82C8B4';
const CHALLENGE_COLOR = '#E8856B';
const NEUTRAL_LINE_COLOR = 'rgba(202, 190, 255, 0.5)';

function aspectStyleFor(aspectType: string): { color: string; dashed: boolean } {
  const a = aspectType.toLowerCase();
  if (HARMONIOUS.has(a)) return { color: SUPPORT_COLOR, dashed: false };
  if (HARD.has(a)) return { color: CHALLENGE_COLOR, dashed: true };
  return { color: NEUTRAL_LINE_COLOR, dashed: false };
}

export interface SynastrySimpleAspect {
  planet1: string;
  planet1Degree: number;
  planet1Sign?: string;
  planet2: string;
  planet2Degree: number;
  planet2Sign?: string;
  aspectType: string;
  orb?: number;
}

export interface SynastryWheelProps {
  // Person A's chart (inner ring + drives the ASC-rotated frame).
  personA: BirthChart;
  // Person B's chart (outer ring overlay).
  personB: BirthChart;
  // Cross-chart aspects to draw between planet positions.
  synastryAspects?: Array<SynastrySimpleAspect | BackendAspect>;
  colors: ChartColorTokens;
  size?: number;
  planetAColor?: string;
  planetBColor?: string;
  showHouses?: boolean;
  showAspects?: boolean;
}

export function SynastryWheel({
  personA,
  personB,
  synastryAspects,
  colors,
  size: sizeOverride,
  planetAColor = '#cabeff',
  planetBColor = SUPPORT_COLOR,
  showHouses = true,
  showAspects = true,
}: SynastryWheelProps) {
  const sizeBase = sizeOverride ?? CHART_DIMENSIONS.size;
  const scale = sizeBase / CHART_DIMENSIONS.size;
  const size = CHART_DIMENSIONS.size * scale;
  const centerX = CHART_DIMENSIONS.centerX * scale;
  const centerY = CHART_DIMENSIONS.centerY * scale;
  const outerRadius = CHART_DIMENSIONS.outerRadius * scale;
  const innerRadius = CHART_DIMENSIONS.innerRadius * scale;
  const planetRadius = CHART_DIMENSIONS.planetRadius * scale;
  const houseOuterRadius = CHART_DIMENSIONS.houseOuterRadius * scale;

  // Person B sits on a slightly larger ring than Person A.
  const transitRadius = planetRadius + 26 * scale;
  const ICON_SIZE_A = 18 * scale;
  const ICON_SIZE_B = 16 * scale;

  const overshoot = Math.max(0, transitRadius + ICON_SIZE_B / 2 - Math.min(centerX, centerY));
  const viewBox =
    overshoot > 0
      ? `-${overshoot} -${overshoot} ${size + overshoot * 2} ${size + overshoot * 2}`
      : `0 0 ${size} ${size}`;

  const ascendantDegree = useMemo(() => {
    if (!personA?.houses?.length) return 0;
    return personA.houses[0]?.degree || 0;
  }, [personA?.houses]);

  const planetsA = useMemo(
    () => filterPlanets(personA?.planets ?? []),
    [personA?.planets]
  );
  const planetsB = useMemo(
    () => filterPlanets(personB?.planets ?? []),
    [personB?.planets]
  );

  // Quick lookup for aspect endpoints.
  const planetByName = (list: BackendPlanet[]) => {
    const m: Record<string, BackendPlanet> = {};
    for (const p of list) m[p.name] = p;
    return m;
  };
  const aPlanetMap = useMemo(() => planetByName(planetsA), [planetsA]);
  const bPlanetMap = useMemo(() => planetByName(planetsB), [planetsB]);

  // Zodiac wheel
  const zodiacElements: ReactElement[] = [];
  zodiacElements.push(
    <Circle
      key="outer"
      cx={centerX}
      cy={centerY}
      r={outerRadius}
      fill="none"
      stroke={colors.onSurface}
      strokeWidth={1.2 * scale}
    />
  );
  zodiacElements.push(
    <Circle
      key="house-outer"
      cx={centerX}
      cy={centerY}
      r={houseOuterRadius}
      fill="none"
      stroke={colors.onSurface}
      strokeWidth={1 * scale}
      opacity={0.5}
    />
  );
  zodiacElements.push(
    <Circle
      key="inner"
      cx={centerX}
      cy={centerY}
      r={innerRadius}
      fill="none"
      stroke={colors.onSurface}
      strokeWidth={1 * scale}
      opacity={0.5}
    />
  );

  for (let i = 0; i < 12; i++) {
    const cuspDeg = i * 30;
    const start = getCirclePosition(cuspDeg, innerRadius, centerX, centerY, ascendantDegree);
    const end = getCirclePosition(cuspDeg, outerRadius, centerX, centerY, ascendantDegree);
    zodiacElements.push(
      <Line
        key={`sign-cusp-${i}`}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={colors.onSurface}
        strokeWidth={0.6 * scale}
        opacity={0.6}
      />
    );

    const labelDeg = cuspDeg + 15;
    const labelR = (innerRadius + outerRadius) / 2;
    const labelPos = getCirclePosition(labelDeg, labelR, centerX, centerY, ascendantDegree);
    const SignIcon = getZodiacIconFromConstant(SIGN_NAMES[i]);
    if (SignIcon) {
      zodiacElements.push(
        <G
          key={`sign-glyph-${i}`}
          transform={`translate(${labelPos.x - 9 * scale}, ${labelPos.y - 9 * scale})`}
        >
          <SignIcon width={18 * scale} height={18 * scale} fill={colors.onSurface} />
        </G>
      );
    } else {
      zodiacElements.push(
        <SvgText
          key={`sign-text-${i}`}
          x={labelPos.x}
          y={labelPos.y + 4 * scale}
          fontSize={12 * scale}
          fill={colors.onSurface}
          textAnchor="middle"
        >
          {SIGN_NAMES[i].slice(0, 2)}
        </SvgText>
      );
    }
  }

  // House cusps + numbers (Person A's houses)
  const houseElements: ReactElement[] = [];
  if (showHouses && personA?.houses?.length) {
    for (const house of personA.houses) {
      if (!Number.isFinite(house.degree)) continue;
      const start = getCirclePosition(house.degree, outerRadius, centerX, centerY, ascendantDegree);
      const end = getCirclePosition(
        house.degree,
        houseOuterRadius,
        centerX,
        centerY,
        ascendantDegree
      );
      const isAngular = house.house === 1 || house.house === 10;
      houseElements.push(
        <Line
          key={`house-cusp-${house.house}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={colors.onSurface}
          strokeWidth={(isAngular ? 1.6 : 0.6) * scale}
          opacity={isAngular ? 0.85 : 0.55}
        />
      );
      const numberRadius = (outerRadius + houseOuterRadius) / 2;
      const numPos = getCirclePosition(
        house.degree + 15,
        numberRadius,
        centerX,
        centerY,
        ascendantDegree
      );
      houseElements.push(
        <SvgText
          key={`house-number-${house.house}`}
          x={numPos.x}
          y={numPos.y + 4 * scale}
          fontSize={10 * scale}
          fill={colors.onSurfaceVariant}
          textAnchor="middle"
        >
          {String(house.house)}
        </SvgText>
      );
    }
  }

  // Planet glyph + radial marker
  const renderPlanet = (
    planet: BackendPlanet,
    radius: number,
    iconSize: number,
    color: string,
    keyPrefix: string
  ): ReactElement[] => {
    const out: ReactElement[] = [];
    const pos = getCirclePosition(
      planet.full_degree,
      radius,
      centerX,
      centerY,
      ascendantDegree
    );
    const PlanetIcon = getPlanetIconFromConstant(planet.name);
    const markerOuter = getCirclePosition(
      planet.full_degree,
      outerRadius,
      centerX,
      centerY,
      ascendantDegree
    );
    out.push(
      <Line
        key={`${keyPrefix}-marker-${planet.name}`}
        x1={markerOuter.x}
        y1={markerOuter.y}
        x2={pos.x}
        y2={pos.y}
        stroke={color}
        strokeWidth={0.8 * scale}
        opacity={0.4}
      />
    );
    if (PlanetIcon) {
      out.push(
        <G
          key={`${keyPrefix}-glyph-${planet.name}`}
          transform={`translate(${pos.x - iconSize / 2}, ${pos.y - iconSize / 2})`}
        >
          <PlanetIcon width={iconSize} height={iconSize} fill={color} />
        </G>
      );
    } else {
      out.push(
        <SvgText
          key={`${keyPrefix}-text-${planet.name}`}
          x={pos.x}
          y={pos.y + iconSize * 0.35}
          fontSize={iconSize * 0.85}
          fill={color}
          textAnchor="middle"
          fontWeight="700"
        >
          {planet.name.slice(0, 2)}
        </SvgText>
      );
    }
    return out;
  };

  // Cross-chart aspect lines (drawn behind planet glyphs)
  const aspectElements: ReactElement[] = [];
  if (showAspects && Array.isArray(synastryAspects)) {
    synastryAspects.forEach((aspect, i) => {
      const aspectType = (aspect as any).aspectType ?? (aspect as any).type;
      const planet1Name = (aspect as any).planet1 ?? (aspect as any).aspectingPlanet;
      const planet2Name = (aspect as any).planet2 ?? (aspect as any).aspectedPlanet;
      const planet1Deg =
        (aspect as any).planet1Degree ?? (aspect as any).aspectingPlanetDegree;
      const planet2Deg =
        (aspect as any).planet2Degree ?? (aspect as any).aspectedPlanetDegree;
      if (
        typeof aspectType !== 'string' ||
        typeof planet1Name !== 'string' ||
        typeof planet2Name !== 'string'
      ) {
        return;
      }
      // Synastry aspects connect Person A's planet1 to Person B's planet2.
      const p1 = aPlanetMap[planet1Name];
      const p2 = bPlanetMap[planet2Name];
      const fallbackP1Deg = typeof planet1Deg === 'number' ? planet1Deg : p1?.full_degree;
      const fallbackP2Deg = typeof planet2Deg === 'number' ? planet2Deg : p2?.full_degree;
      if (typeof fallbackP1Deg !== 'number' || typeof fallbackP2Deg !== 'number') return;
      // Anchor both endpoints just inside the inner ring so the line is a
      // chord that stays inside the wheel, matching ChartWheel's aspect
      // rendering (innerRadius - 5).
      const chordRadius = innerRadius - 5 * scale;
      const start = getCirclePosition(
        fallbackP1Deg,
        chordRadius,
        centerX,
        centerY,
        ascendantDegree
      );
      const end = getCirclePosition(
        fallbackP2Deg,
        chordRadius,
        centerX,
        centerY,
        ascendantDegree
      );
      const style = aspectStyleFor(aspectType);
      aspectElements.push(
        <Line
          key={`syn-aspect-${i}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={style.color}
          strokeWidth={1.1 * scale}
          opacity={0.55}
          strokeDasharray={style.dashed ? `${4 * scale},${3 * scale}` : undefined}
        />
      );
    });
  }

  const planetElementsA: ReactElement[] = [];
  for (const p of planetsA) {
    planetElementsA.push(
      ...renderPlanet(p, planetRadius, ICON_SIZE_A, planetAColor, 'a')
    );
  }
  const planetElementsB: ReactElement[] = [];
  for (const p of planetsB) {
    planetElementsB.push(
      ...renderPlanet(p, transitRadius, ICON_SIZE_B, planetBColor, 'b')
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={viewBox}>
        {zodiacElements}
        {houseElements}
        {aspectElements}
        {planetElementsA}
        {planetElementsB}
      </Svg>
    </View>
  );
}
