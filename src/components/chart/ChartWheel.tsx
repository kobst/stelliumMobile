import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Path } from 'react-native-svg';
import type { ReactElement } from 'react';
import { useTheme } from '../../theme';
import {
  BirthChart,
  BackendPlanet,
  BackendHouse,
  BackendAspect,
  PlanetName,
  ZodiacSign,
} from '../../types';
import {
  CHART_DIMENSIONS,
  PLANET_COLORS,
  ZODIAC_COLORS,
  getCirclePosition,
  getAspectColor,
  getPlanetGlyph,
  getZodiacGlyph,
  filterPlanets,
  getAspectStrength,
  hexToRgba,
} from './ChartUtils';
import { ChartSVGIcon, hasSVGPath } from './ChartSVGIcons';
import { getZodiacIconFromConstant, getPlanetIconFromConstant } from '../../../utils/astrologyIcons';

interface ChartWheelProps {
  birthChart?: BirthChart;
  showAspects?: boolean;
  showHouses?: boolean;
  rotation?: number;
}

const ChartWheel: React.FC<ChartWheelProps> = ({
  birthChart,
  showAspects = true,
  showHouses = true,
  rotation = 0,
}) => {
  const { colors } = useTheme();
  const { size, centerX, centerY, outerRadius, innerRadius, planetRadius, houseRadius, houseOuterRadius } = CHART_DIMENSIONS;
  // Overlap + visibility config (keep in sync with renderPlanets logic)
  // Notes on tuning:
  // - ICON_SIZE and BG_RADIUS affect collision box size; increase if icons grow.
  // - RADIAL_PUSH_INCREMENT and MAX_ADJUSTMENT_ATTEMPTS control how far icons move out radially.
  // - ANGLE_OFFSETS (in renderPlanets) are small angle jitters used if radial pushes still collide.
  // - viewBox expands automatically based on MAX_PUSH to avoid clipping moved icons.
  const ICON_SIZE = 18; // planet icon size
  const BG_RADIUS = 12; // background circle radius
  const RADIAL_PUSH_INCREMENT = 8; // px per push when resolving overlaps
  const MAX_ADJUSTMENT_ATTEMPTS = 3; // max pushes
  const MAX_PUSH = RADIAL_PUSH_INCREMENT * MAX_ADJUSTMENT_ATTEMPTS;
  // Compute viewBox margin needed so pushed-out planets are still visible.
  // Increase MAX_ADJUSTMENT_ATTEMPTS or RADIAL_PUSH_INCREMENT? viewBox will grow to fit automatically.
  const neededRadius = planetRadius + MAX_PUSH + BG_RADIUS;
  const overshoot = Math.max(0, neededRadius - Math.min(centerX, centerY));
  const viewBox = overshoot > 0
    ? `-${overshoot} -${overshoot} ${size + overshoot * 2} ${size + overshoot * 2}`
    : `0 0 ${size} ${size}`;

  // Get ascendant degree for proper chart orientation
  const ascendantDegree = useMemo(() => {
    if (!birthChart?.houses?.length) {return 0;}
    return birthChart.houses[0]?.degree || 0;
  }, [birthChart?.houses]);

  // Render zodiac wheel background
  const renderZodiacWheel = (): ReactElement[] => {
    const elements: ReactElement[] = [];

    // Outer circle
    elements.push(
      <Circle
        key="outer-circle"
        cx={centerX}
        cy={centerY}
        r={outerRadius}
        fill="none"
        stroke={colors.onSurface}
        strokeWidth="2"
      />
    );

    // House outer circle (for house number ring)
    elements.push(
      <Circle
        key="house-outer-circle"
        cx={centerX}
        cy={centerY}
        r={houseOuterRadius}
        fill="none"
        stroke={colors.onSurface}
        strokeWidth="2"
      />
    );

    // Inner circle
    elements.push(
      <Circle
        key="inner-circle"
        cx={centerX}
        cy={centerY}
        r={innerRadius}
        fill="none"
        stroke={colors.onSurface}
        strokeWidth="2"
      />
    );

    // Zodiac sign divisions (12 houses of 30° each) - Rotate with ascendant
    for (let i = 0; i < 12; i++) {
      const degree = i * 30;
      // Zodiac signs rotate with ascendant to match birth chart orientation
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
          strokeWidth="1"
        />
      );

      // Zodiac sign symbols - Rotate with ascendant
      const signNames: ZodiacSign[] = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
      ];

      const signDegree = degree + 15; // Center of sign
      const signRadius = (innerRadius + outerRadius) / 2;
      const { x: signX, y: signY } = getCirclePosition(signDegree, signRadius, centerX, centerY, ascendantDegree);

      const SignIcon = getZodiacIconFromConstant(signNames[i]);
      const iconSize = 18;

      if (SignIcon) {
        elements.push(
          <G
            key={`zodiac-symbol-${i}`}
            transform={`translate(${signX - iconSize / 2}, ${signY - iconSize / 2})`}
          >
            <SignIcon
              width={`${iconSize}`}
              height={`${iconSize}`}
              fill={colors.onSurface}
            />
          </G>
        );
      } else {
        elements.push(
          <SvgText
            key={`zodiac-symbol-${i}`}
            x={signX}
            y={signY}
            fontSize="18"
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

  // Render house cusps
  const renderHouses = (): ReactElement[] | null => {
    if (!showHouses || !birthChart?.houses?.length) {return null;}

    const elements: ReactElement[] = [];

    birthChart.houses.forEach((house, index) => {
      if (!house.degree || isNaN(house.degree)) {return;}

      const { x: x1, y: y1 } = getCirclePosition(house.degree, outerRadius, centerX, centerY, ascendantDegree);
      const { x: x2, y: y2 } = getCirclePosition(house.degree, houseOuterRadius, centerX, centerY, ascendantDegree);

      // Thicker lines for 1st and 10th houses (Ascendant and Midheaven)
      const isAngular = house.house === 1 || house.house === 10;

      elements.push(
        <Line
          key={`house-${house.house}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={colors.onSurface}
          strokeWidth={isAngular ? '3' : '1'}
        />
      );

      // House numbers - positioned in the ring between outerRadius and houseOuterRadius
      const houseNumberRadius = (outerRadius + houseOuterRadius) / 2;
      const { x: numX, y: numY } = getCirclePosition(house.degree + 15, houseNumberRadius, centerX, centerY, ascendantDegree);

      elements.push(
        <SvgText
          key={`house-number-${house.house}`}
          x={numX}
          y={numY}
          fontSize="12"
          fill={colors.onSurface}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {house.house}
        </SvgText>
      );
    });

    return elements;
  };

  // Render planets with simple overlap avoidance
  const renderPlanets = (): ReactElement[] | null => {
    if (!birthChart?.planets?.length) {return null;}

    const elements: ReactElement[] = [];
    const filteredPlanets = filterPlanets(birthChart.planets);

    // Sort planets by degree to handle overlaps
    const sortedPlanets = [...filteredPlanets].sort((a, b) => a.full_degree - b.full_degree);

    // Overlap avoidance config
    const ICON_SIZE = 18; // size of planet glyphs (keep in sync)
    const BG_RADIUS = 12; // radius of background circle (keep in sync)
    // Bounding box used to detect icon collisions. Increase padding if icons still visually overlap.
    const BOX_SIZE = Math.max(ICON_SIZE, BG_RADIUS * 2) + 6;
    const RADIAL_PUSH_INCREMENT = 8; // px to push outward when overlapping (keep in sync)
    const MAX_ADJUSTMENT_ATTEMPTS = 3; // limit pushes to keep inside viewBox (keep in sync)
    // Small angular jitters to try if radial pushes still collide. Adjust order/magnitude for aesthetics.
    const ANGLE_OFFSETS = [4, -4, 8, -8, 12, -12]; // degrees

    type Box = { x: number; y: number; w: number; h: number };
    const occupied: Box[] = [];
    const overlaps = (a: Box, b: Box) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

    sortedPlanets.forEach((planet) => {
      const planetColor = colors.onSurface; // Always black for birth chart planets

      // Find a non-overlapping position by pushing radially outward if needed
      let finalDegree = planet.full_degree; // Track the final degree used for positioning
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

      // If still colliding at max radial push, try small angular offsets with minimal radius first
      if (collided) {
        let resolved = false;
        for (const offset of ANGLE_OFFSETS) {
          // Try with base radius to keep icons closer to wheel
          let testPos = getCirclePosition(planet.full_degree + offset, planetRadius, centerX, centerY, ascendantDegree);
          let testBox: Box = { x: testPos.x - BOX_SIZE / 2, y: testPos.y - BOX_SIZE / 2, w: BOX_SIZE, h: BOX_SIZE };
          if (!occupied.some((b) => overlaps(testBox, b))) {
            pos = testPos;
            box = testBox;
            adjustedRadius = planetRadius;
            finalDegree = planet.full_degree + offset; // Update final degree
            resolved = true;
            break;
          }
          // Try with adjusted radius
          testPos = getCirclePosition(planet.full_degree + offset, adjustedRadius, centerX, centerY, ascendantDegree);
          testBox = { x: testPos.x - BOX_SIZE / 2, y: testPos.y - BOX_SIZE / 2, w: BOX_SIZE, h: BOX_SIZE };
          if (!occupied.some((b) => overlaps(testBox, b))) {
            pos = testPos;
            box = testBox;
            finalDegree = planet.full_degree + offset; // Update final degree
            resolved = true;
            break;
          }
        }
        // If not resolved, we keep the last computed pos/box (might slightly overlap in worst case)
      }

      // Reserve this position
      occupied.push(box);

      const planetX = pos.x;
      const planetY = pos.y;

      // Planet icon (SVG preferred)
      const PlanetIcon = getPlanetIconFromConstant(planet.name);
      if (PlanetIcon) {
        elements.push(
          <G
            key={`planet-${planet.name}-${planet.full_degree}`}
            transform={`translate(${planetX - ICON_SIZE / 2}, ${planetY - ICON_SIZE / 2})`}
          >
            <PlanetIcon width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} fill={planetColor} />
          </G>
        );
      } else if (hasSVGPath(planet.name)) {
        elements.push(
          <ChartSVGIcon
            key={`planet-${planet.name}-${planet.full_degree}`}
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
            key={`planet-${planet.name}-${planet.full_degree}`}
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

      // Degree hash mark extending from outer edge to planet
      // Use finalDegree so line starts from the actual angular position of adjusted planets
      const { x: markerX1, y: markerY1 } = getCirclePosition(finalDegree, outerRadius, centerX, centerY, ascendantDegree);
      elements.push(
        <Line
          key={`planet-marker-${planet.name}-${planet.full_degree}`}
          x1={markerX1}
          y1={markerY1}
          x2={planetX}
          y2={planetY}
          stroke={colors.onSurfaceVariant}
          strokeWidth="1"
          opacity="0.3"
        />
      );
    });

    return elements;
  };

  // Render aspect lines
  const renderAspects = (): ReactElement[] | null => {
    if (!showAspects || !birthChart?.aspects?.length || !birthChart?.planets?.length) {return null;}

    const elements: ReactElement[] = [];
    const filteredPlanets = filterPlanets(birthChart.planets);

    birthChart.aspects.forEach((aspect, index) => {
      // Skip aspects with excluded planets
      if (['South Node', 'Part of Fortune', 'Chiron'].includes(aspect.aspectedPlanet) ||
          ['South Node', 'Part of Fortune', 'Chiron'].includes(aspect.aspectingPlanet)) {
        return;
      }

      const aspectColor = getAspectColor(aspect.aspectType);
      const aspectStrength = getAspectStrength(aspect.orb);

      // Find planet positions
      const planet1 = filteredPlanets.find(p => p.name === aspect.aspectedPlanet);
      const planet2 = filteredPlanets.find(p => p.name === aspect.aspectingPlanet);

      if (!planet1 || !planet2) {return;}

      const { x: x1, y: y1 } = getCirclePosition(planet1.full_degree, innerRadius - 5, centerX, centerY, ascendantDegree);
      const { x: x2, y: y2 } = getCirclePosition(planet2.full_degree, innerRadius - 5, centerX, centerY, ascendantDegree);

      elements.push(
        <Line
          key={`aspect-${index}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={hexToRgba(aspectColor, aspectStrength * 0.8)}
          strokeWidth={aspectStrength * 2}
        />
      );
    });

    return elements;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size} viewBox={viewBox}>
          {/* Background circles and zodiac wheel */}
          {renderZodiacWheel()}

          {/* House cusps */}
          {renderHouses()}

          {/* Planets */}
          {renderPlanets()}

          {/* Aspect lines (drawn last, on top) */}
          {renderAspects()}
        </Svg>
      </View>
    </View>
  );
};

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

export default ChartWheel;
