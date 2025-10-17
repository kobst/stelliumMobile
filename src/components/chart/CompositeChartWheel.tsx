import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import type { ReactElement } from 'react';
import { useTheme } from '../../theme';
import { PlanetName, ZodiacSign } from '../../types';
import { CompositeChart } from '../../api/relationships';
import {
  CHART_DIMENSIONS,
  PLANET_COLORS,
  ZODIAC_COLORS,
  getCirclePosition,
  getPlanetGlyph,
  getZodiacGlyph,
  filterPlanets,
  getAspectColor,
  getAspectStrength,
} from './ChartUtils';
import { zodiacIcons, planetIcons } from '../../../utils/astrologyIcons';

interface CompositeChartWheelProps {
  compositeChart: CompositeChart;
  title?: string;
}

const CompositeChartWheel: React.FC<CompositeChartWheelProps> = ({
  compositeChart,
  title,
}) => {
  const { colors } = useTheme();
  const { size, centerX, centerY, outerRadius, innerRadius, planetRadius, houseRadius, houseOuterRadius } = CHART_DIMENSIONS;

  // Overlap detection config
  const ICON_SIZE = 18;
  const BG_RADIUS = 12;
  const RADIAL_PUSH_INCREMENT = 8;
  const MAX_ADJUSTMENT_ATTEMPTS = 3;
  const MAX_PUSH = RADIAL_PUSH_INCREMENT * MAX_ADJUSTMENT_ATTEMPTS;

  // Calculate viewBox to accommodate planets pushed outward
  const neededRadius = planetRadius + MAX_PUSH + BG_RADIUS;
  const overshoot = Math.max(0, neededRadius - Math.min(centerX, centerY));
  const viewBox = overshoot > 0
    ? `-${overshoot} -${overshoot} ${size + overshoot * 2} ${size + overshoot * 2}`
    : `0 0 ${size} ${size}`;

  // Get ascendant degree from the first house for proper chart orientation
  const ascendantDegree = useMemo(() => {
    if (!compositeChart.houses?.length) {return 0;}
    return compositeChart.houses[0]?.degree || 0;
  }, [compositeChart.houses]);

  // Convert composite chart planets to BackendPlanet format for filtering
  const convertedPlanets = useMemo(() => {
    return compositeChart.planets.map(planet => ({
      name: planet.name,
      full_degree: planet.full_degree,
      norm_degree: planet.norm_degree,
      sign: planet.sign,
      house: planet.house,
      is_retro: false, // Composite charts don't have retrograde planets
    }));
  }, [compositeChart.planets]);

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

    // Zodiac sign divisions (12 houses of 30° each)
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
          strokeWidth="1"
        />
      );

      // Zodiac sign symbols
      const signNames: ZodiacSign[] = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
      ];

      const signDegree = degree + 15;
      const signRadius = (innerRadius + outerRadius) / 2;
      const { x: signX, y: signY } = getCirclePosition(signDegree, signRadius, centerX, centerY, ascendantDegree);

      const ZodiacIconComponent = zodiacIcons[signNames[i].toLowerCase() as keyof typeof zodiacIcons];
      if (ZodiacIconComponent) {
        elements.push(
          <G key={`zodiac-symbol-${i}`} x={signX - 9} y={signY - 9}>
            <ZodiacIconComponent width={18} height={18} fill={colors.onSurface} />
          </G>
        );
      }
    }

    return elements;
  };

  // Render house cusps
  const renderHouses = (): ReactElement[] | null => {
    if (!compositeChart.houses?.length) {return null;}

    const elements: ReactElement[] = [];

    compositeChart.houses.forEach((house) => {
      if (!house.degree || isNaN(house.degree)) {return;}

      const { x: x1, y: y1 } = getCirclePosition(house.degree, outerRadius, centerX, centerY, ascendantDegree);
      const { x: x2, y: y2 } = getCirclePosition(house.degree, houseOuterRadius, centerX, centerY, ascendantDegree);

      const houseNumber = parseInt(house.house);
      const isAngular = houseNumber === 1 || houseNumber === 4 || houseNumber === 7 || houseNumber === 10;

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

  // Render composite planets with overlap detection
  const renderCompositePlanets = (): ReactElement[] | null => {
    if (!compositeChart.planets?.length) {return null;}

    const elements: ReactElement[] = [];
    const filteredPlanets = filterPlanets(convertedPlanets);
    const sortedPlanets = [...filteredPlanets].sort((a, b) => a.full_degree - b.full_degree);

    // Overlap detection
    const BOX_SIZE = Math.max(ICON_SIZE, BG_RADIUS * 2) + 6;
    const ANGLE_OFFSETS = [4, -4, 8, -8, 12, -12];

    type Box = { x: number; y: number; w: number; h: number };
    const occupied: Box[] = [];
    const overlaps = (a: Box, b: Box) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

    sortedPlanets.forEach((planet) => {
      let finalDegree = planet.full_degree;
      let adjustedRadius = planetRadius;
      let attempts = 0;
      let pos = getCirclePosition(finalDegree, adjustedRadius, centerX, centerY, ascendantDegree);
      let box: Box = { x: pos.x - BOX_SIZE / 2, y: pos.y - BOX_SIZE / 2, w: BOX_SIZE, h: BOX_SIZE };
      let collided = occupied.some((b) => overlaps(box, b));

      // Push radially if overlapping
      while (collided && attempts < MAX_ADJUSTMENT_ATTEMPTS) {
        adjustedRadius += RADIAL_PUSH_INCREMENT;
        pos = getCirclePosition(finalDegree, adjustedRadius, centerX, centerY, ascendantDegree);
        box = { x: pos.x - BOX_SIZE / 2, y: pos.y - BOX_SIZE / 2, w: BOX_SIZE, h: BOX_SIZE };
        collided = occupied.some((b) => overlaps(box, b));
        attempts += 1;
      }

      // Try angular offsets if still colliding
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
        }
      }

      occupied.push(box);
      const planetX = pos.x;
      const planetY = pos.y;

      // Planet symbol
      const PlanetIconComponent = planetIcons[planet.name.toLowerCase() as keyof typeof planetIcons];
      if (PlanetIconComponent) {
        elements.push(
          <G key={`composite-planet-${planet.name}`} x={planetX - ICON_SIZE / 2} y={planetY - ICON_SIZE / 2}>
            <PlanetIconComponent width={ICON_SIZE} height={ICON_SIZE} fill={colors.onSurface} />
          </G>
        );
      }

      // Planet degree marker - from house outer circle to planet
      const { x: markerX1, y: markerY1 } = getCirclePosition(planet.full_degree, houseOuterRadius, centerX, centerY, ascendantDegree);

      elements.push(
        <Line
          key={`composite-planet-marker-${planet.name}`}
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
    if (!compositeChart.aspects?.length || !compositeChart.planets?.length) {return null;}

    const elements: ReactElement[] = [];
    const filteredPlanets = filterPlanets(convertedPlanets);

    compositeChart.aspects.forEach((aspect, index) => {
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

      const { x: x1, y: y1 } = getCirclePosition(planet1.full_degree, innerRadius, centerX, centerY, ascendantDegree);
      const { x: x2, y: y2 } = getCirclePosition(planet2.full_degree, innerRadius, centerX, centerY, ascendantDegree);

      elements.push(
        <Line
          key={`aspect-${index}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={aspectColor}
          strokeWidth={aspectStrength === 'strong' ? '1.5' : '0.8'}
          opacity={aspectStrength === 'strong' ? '0.7' : '0.4'}
        />
      );
    });

    return elements;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {title && <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>}

      <View style={styles.chartContainer}>
        <Svg width={size} height={size} viewBox={viewBox}>
          {/* Background circles and zodiac wheel */}
          {renderZodiacWheel()}

          {/* House cusps */}
          {renderHouses()}

          {/* Aspect lines */}
          {renderAspects()}

          {/* Composite planets (drawn last, on top) */}
          {renderCompositePlanets()}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: colors.primary + '33', borderColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.onSurfaceVariant }]}>Composite Chart Planets</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  legendText: {
    fontSize: 12,
  },
});

export default CompositeChartWheel;
