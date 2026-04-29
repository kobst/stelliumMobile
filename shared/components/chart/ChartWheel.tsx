import React, { useMemo } from 'react';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import {
  CHART_DIMENSIONS,
  filterPlanets,
  getAspectColor,
  getAspectStrength,
  getCirclePosition,
  getPlanetGlyph,
  getZodiacGlyph,
  hexToRgba,
} from './ChartUtils';
import { ChartSVGIcon, hasSVGPath } from './ChartSVGIcons';
import {
  getPlanetIconFromConstant,
  getZodiacIconFromConstant,
} from '../../utils/astrologyIcons';
import type {
  BackendPlanet,
  BirthChart,
  ChartColorTokens,
  PlanetName,
  ZodiacSign,
} from './chartTypes';

export interface ChartAspectStyle {
  color: string;
  dashed?: boolean;
}

export interface ChartWheelProps {
  birthChart?: BirthChart;
  showAspects?: boolean;
  showHouses?: boolean;
  rotation?: number;
  colors: ChartColorTokens;
  size?: number;
  containerBackground?: string;
  containerBorderColor?: string;
  // Optional per-planet color override. Receives the planet record and its
  // index in the (filtered, by-degree-sorted) planet list. Return undefined
  // to fall back to colors.onSurface.
  getPlanetColor?: (planet: BackendPlanet, index: number) => string | undefined;
  // Optional per-aspect-line style override. When provided, replaces the
  // built-in red/blue scheme so callers (e.g. composite charts) can opt into
  // the semantic Flowing/Tension/Fusion palette used by SynastryWheel.
  getAspectStyle?: (aspectType: string) => ChartAspectStyle | undefined;
  // When true, render without the boxed card chrome and use the lighter
  // stroke / opacity treatment that matches SynastryWheel. Use this whenever
  // the chart needs to sit visually side-by-side with a synastry wheel
  // (e.g. composite tab in FullChartModal, single-subject SingleChartModal).
  frameless?: boolean;
}

export function ChartWheel({
  birthChart,
  showAspects = true,
  showHouses = true,
  colors,
  size: sizeOverride,
  containerBackground,
  containerBorderColor,
  getPlanetColor,
  getAspectStyle,
  frameless = false,
}: ChartWheelProps) {
  const sizeBase = sizeOverride ?? CHART_DIMENSIONS.size;
  const scale = sizeBase / CHART_DIMENSIONS.size;
  const size = CHART_DIMENSIONS.size * scale;
  const centerX = CHART_DIMENSIONS.centerX * scale;
  const centerY = CHART_DIMENSIONS.centerY * scale;
  const outerRadius = CHART_DIMENSIONS.outerRadius * scale;
  const innerRadius = CHART_DIMENSIONS.innerRadius * scale;
  const planetRadius = CHART_DIMENSIONS.planetRadius * scale;
  const houseOuterRadius = CHART_DIMENSIONS.houseOuterRadius * scale;

  const ICON_SIZE = 18 * scale;
  const BG_RADIUS = 12 * scale;
  const RADIAL_PUSH_INCREMENT = 8 * scale;
  const MAX_ADJUSTMENT_ATTEMPTS = 3;
  const MAX_PUSH = RADIAL_PUSH_INCREMENT * MAX_ADJUSTMENT_ATTEMPTS;
  const neededRadius = planetRadius + MAX_PUSH + BG_RADIUS;
  const overshoot = Math.max(0, neededRadius - Math.min(centerX, centerY));
  const viewBox =
    overshoot > 0
      ? `-${overshoot} -${overshoot} ${size + overshoot * 2} ${size + overshoot * 2}`
      : `0 0 ${size} ${size}`;

  const ascendantDegree = useMemo(() => {
    if (!birthChart?.houses?.length) return 0;
    return birthChart.houses[0]?.degree || 0;
  }, [birthChart?.houses]);

  const renderZodiacWheel = (): ReactElement[] => {
    const elements: ReactElement[] = [];
    const outerStrokeWidth = frameless ? 1.2 * scale : 2;
    const innerStrokeWidth = frameless ? 1 * scale : 2;
    const innerStrokeOpacity = frameless ? 0.5 : 1;
    elements.push(
      <Circle
        key="outer-circle"
        cx={centerX}
        cy={centerY}
        r={outerRadius}
        fill="none"
        stroke={colors.onSurface}
        strokeWidth={outerStrokeWidth}
      />
    );
    elements.push(
      <Circle
        key="house-outer-circle"
        cx={centerX}
        cy={centerY}
        r={houseOuterRadius}
        fill="none"
        stroke={colors.onSurface}
        strokeWidth={innerStrokeWidth}
        opacity={innerStrokeOpacity}
      />
    );
    elements.push(
      <Circle
        key="inner-circle"
        cx={centerX}
        cy={centerY}
        r={innerRadius}
        fill="none"
        stroke={colors.onSurface}
        strokeWidth={innerStrokeWidth}
        opacity={innerStrokeOpacity}
      />
    );

    const signNames: ZodiacSign[] = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ];

    for (let i = 0; i < 12; i++) {
      const degree = i * 30;
      const { x: x1, y: y1 } = getCirclePosition(degree, innerRadius, centerX, centerY, ascendantDegree);
      const { x: x2, y: y2 } = getCirclePosition(degree, outerRadius, centerX, centerY, ascendantDegree);
      elements.push(
        <Line
          key={`zodiac-line-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={colors.onSurface}
          strokeWidth={frameless ? 0.6 * scale : 1}
          opacity={frameless ? 0.6 : 1}
        />
      );

      const signDegree = degree + 15;
      const signRadius = (innerRadius + outerRadius) / 2;
      const { x: signX, y: signY } = getCirclePosition(
        signDegree,
        signRadius,
        centerX,
        centerY,
        ascendantDegree
      );

      const SignIcon = getZodiacIconFromConstant(signNames[i]);
      const iconSize = 18 * scale;

      if (SignIcon) {
        elements.push(
          <G
            key={`zodiac-symbol-${i}`}
            transform={`translate(${signX - iconSize / 2}, ${signY - iconSize / 2})`}
          >
            <SignIcon width={`${iconSize}`} height={`${iconSize}`} fill={colors.onSurface} />
          </G>
        );
      } else {
        elements.push(
          <SvgText
            key={`zodiac-symbol-${i}`}
            x={signX}
            y={signY}
            fontSize={18 * scale}
            fill={colors.onSurface}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {getZodiacGlyph(signNames[i])}
          </SvgText>
        );
      }
    }
    return elements;
  };

  const renderHouses = (): ReactElement[] | null => {
    if (!showHouses || !birthChart?.houses?.length) return null;
    const elements: ReactElement[] = [];
    birthChart.houses.forEach((house) => {
      if (typeof house.degree !== 'number' || isNaN(house.degree)) return;
      const { x: x1, y: y1 } = getCirclePosition(house.degree, outerRadius, centerX, centerY, ascendantDegree);
      const { x: x2, y: y2 } = getCirclePosition(house.degree, houseOuterRadius, centerX, centerY, ascendantDegree);
      const isAngular = house.house === 1 || house.house === 10;
      const houseStrokeWidth = frameless
        ? (isAngular ? 1.6 : 0.6) * scale
        : (isAngular ? 3 : 1);
      const houseStrokeOpacity = frameless ? (isAngular ? 0.85 : 0.55) : 1;
      elements.push(
        <Line
          key={`house-${house.house}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={colors.onSurface}
          strokeWidth={houseStrokeWidth}
          opacity={houseStrokeOpacity}
        />
      );
      const houseNumberRadius = (outerRadius + houseOuterRadius) / 2;
      const { x: numX, y: numY } = getCirclePosition(
        house.degree + 15,
        houseNumberRadius,
        centerX,
        centerY,
        ascendantDegree
      );
      elements.push(
        <SvgText
          key={`house-number-${house.house}`}
          x={numX}
          y={numY}
          fontSize={frameless ? 10 * scale : 12 * scale}
          fill={frameless ? colors.onSurfaceVariant : colors.onSurface}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {house.house}
        </SvgText>
      );
    });
    return elements;
  };

  const renderPlanets = (): ReactElement[] | null => {
    if (!birthChart?.planets?.length) return null;
    const elements: ReactElement[] = [];
    const filteredPlanets = filterPlanets(birthChart.planets as BackendPlanet[]);
    const sortedPlanets = [...filteredPlanets].sort((a, b) => a.full_degree - b.full_degree);

    const BOX_SIZE = Math.max(ICON_SIZE, BG_RADIUS * 2) + 6;
    const ANGLE_OFFSETS = [4, -4, 8, -8, 12, -12];
    type Box = { x: number; y: number; w: number; h: number };
    const occupied: Box[] = [];
    const overlaps = (a: Box, b: Box) =>
      !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

    sortedPlanets.forEach((planet, planetIdx) => {
      let finalDegree = planet.full_degree;
      let adjustedRadius = planetRadius;
      let attempts = 0;
      let pos = getCirclePosition(finalDegree, adjustedRadius, centerX, centerY, ascendantDegree);
      let box: Box = { x: pos.x - BOX_SIZE / 2, y: pos.y - BOX_SIZE / 2, w: BOX_SIZE, h: BOX_SIZE };
      let collided = occupied.some((b) => overlaps(box, b));
      while (collided && attempts < MAX_ADJUSTMENT_ATTEMPTS) {
        adjustedRadius += RADIAL_PUSH_INCREMENT;
        pos = getCirclePosition(finalDegree, adjustedRadius, centerX, centerY, ascendantDegree);
        box = { x: pos.x - BOX_SIZE / 2, y: pos.y - BOX_SIZE / 2, w: BOX_SIZE, h: BOX_SIZE };
        collided = occupied.some((b) => overlaps(box, b));
        attempts += 1;
      }
      if (collided) {
        for (const offset of ANGLE_OFFSETS) {
          let testPos = getCirclePosition(planet.full_degree + offset, planetRadius, centerX, centerY, ascendantDegree);
          let testBox: Box = { x: testPos.x - BOX_SIZE / 2, y: testPos.y - BOX_SIZE / 2, w: BOX_SIZE, h: BOX_SIZE };
          if (!occupied.some((b) => overlaps(testBox, b))) {
            pos = testPos;
            box = testBox;
            adjustedRadius = planetRadius;
            finalDegree = planet.full_degree + offset;
            break;
          }
          testPos = getCirclePosition(planet.full_degree + offset, adjustedRadius, centerX, centerY, ascendantDegree);
          testBox = { x: testPos.x - BOX_SIZE / 2, y: testPos.y - BOX_SIZE / 2, w: BOX_SIZE, h: BOX_SIZE };
          if (!occupied.some((b) => overlaps(testBox, b))) {
            pos = testPos;
            box = testBox;
            finalDegree = planet.full_degree + offset;
            break;
          }
        }
      }
      occupied.push(box);

      const planetX = pos.x;
      const planetY = pos.y;
      const overrideColor = getPlanetColor ? getPlanetColor(planet, planetIdx) : undefined;
      const planetColor = overrideColor ?? colors.onSurface;
      const PlanetIcon = getPlanetIconFromConstant(planet.name);
      if (PlanetIcon) {
        elements.push(
          <G
            key={`planet-${planetIdx}-${planet.name}-${planet.full_degree}`}
            transform={`translate(${planetX - ICON_SIZE / 2}, ${planetY - ICON_SIZE / 2})`}
          >
            <PlanetIcon width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} fill={planetColor} />
          </G>
        );
      } else if (hasSVGPath(planet.name)) {
        elements.push(
          <ChartSVGIcon
            key={`planet-${planetIdx}-${planet.name}-${planet.full_degree}`}
            planetName={planet.name}
            x={planetX}
            y={planetY}
            size={ICON_SIZE}
            fill={planetColor}
          />
        );
      } else {
        elements.push(
          <SvgText
            key={`planet-${planetIdx}-${planet.name}-${planet.full_degree}`}
            x={planetX}
            y={planetY}
            fontSize={`${ICON_SIZE}`}
            fill={planetColor}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontWeight="bold"
          >
            {getPlanetGlyph(planet.name as PlanetName)}
          </SvgText>
        );
      }
      const { x: markerX1, y: markerY1 } = getCirclePosition(
        finalDegree,
        outerRadius,
        centerX,
        centerY,
        ascendantDegree
      );
      elements.push(
        <Line
          key={`planet-marker-${planetIdx}-${planet.name}-${planet.full_degree}`}
          x1={markerX1}
          y1={markerY1}
          x2={planetX}
          y2={planetY}
          stroke={frameless ? planetColor : colors.onSurfaceVariant}
          strokeWidth={frameless ? 0.8 * scale : 1}
          opacity={frameless ? 0.4 : 0.3}
        />
      );
    });
    return elements;
  };

  const renderAspects = (): ReactElement[] | null => {
    if (!showAspects || !birthChart?.aspects?.length || !birthChart?.planets?.length) return null;
    const elements: ReactElement[] = [];
    const filteredPlanets = filterPlanets(birthChart.planets as BackendPlanet[]);
    birthChart.aspects.forEach((aspect, index) => {
      if (
        ['South Node', 'Part of Fortune', 'Chiron'].includes(aspect.aspectedPlanet as string) ||
        ['South Node', 'Part of Fortune', 'Chiron'].includes(aspect.aspectingPlanet as string)
      ) {
        return;
      }
      const overrideStyle = getAspectStyle?.(aspect.aspectType);
      const aspectColor = overrideStyle?.color ?? getAspectColor(aspect.aspectType);
      const isDashed = overrideStyle?.dashed ?? false;
      const aspectStrength = getAspectStrength(aspect.orb);
      const planet1 = filteredPlanets.find((p) => p.name === aspect.aspectedPlanet);
      const planet2 = filteredPlanets.find((p) => p.name === aspect.aspectingPlanet);
      if (!planet1 || !planet2) return;
      const { x: x1, y: y1 } = getCirclePosition(planet1.full_degree, innerRadius - 5, centerX, centerY, ascendantDegree);
      const { x: x2, y: y2 } = getCirclePosition(planet2.full_degree, innerRadius - 5, centerX, centerY, ascendantDegree);
      const dashArray = isDashed ? `${4 * scale},${3 * scale}` : undefined;
      const stroke = frameless
        ? aspectColor
        : hexToRgba(aspectColor, aspectStrength * 0.85);
      const strokeWidth = frameless ? 1.1 * scale : aspectStrength * 2.2;
      const strokeOpacity = frameless ? 0.55 : 1;
      elements.push(
        <Line
          key={`aspect-${index}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          opacity={strokeOpacity}
        />
      );
    });
    return elements;
  };

  if (frameless) {
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={viewBox}>
          {renderZodiacWheel()}
          {renderHouses()}
          {renderPlanets()}
          {renderAspects()}
        </Svg>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: containerBackground ?? colors.surface,
          borderColor: containerBorderColor ?? colors.border,
        },
      ]}
    >
      <View style={styles.chartContainer}>
        <Svg width={size} height={size} viewBox={viewBox}>
          {renderZodiacWheel()}
          {renderHouses()}
          {renderPlanets()}
          {renderAspects()}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 8,
    margin: 4,
    borderWidth: 1,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
