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
  const { size, centerX, centerY, outerRadius, innerRadius, planetRadius, houseRadius } = CHART_DIMENSIONS;

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

      elements.push(
        <SvgText
          key={`zodiac-symbol-${i}`}
          x={signX}
          y={signY}
          fontSize="18"
          fill={ZODIAC_COLORS[signNames[i]] || colors.onSurface}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {getZodiacGlyph(signNames[i])}
        </SvgText>
      );
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
      const { x: x2, y: y2 } = getCirclePosition(house.degree, houseRadius, centerX, centerY, ascendantDegree);

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

      // House numbers
      const houseNumberRadius = houseRadius + 15;
      const { x: numX, y: numY } = getCirclePosition(house.degree + 15, houseNumberRadius, centerX, centerY, ascendantDegree);

      elements.push(
        <SvgText
          key={`house-number-${house.house}`}
          x={numX}
          y={numY}
          fontSize="12"
          fill={colors.onSurfaceVariant}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {house.house}
        </SvgText>
      );
    });

    return elements;
  };

  // Render planets
  const renderPlanets = (): ReactElement[] | null => {
    if (!birthChart?.planets?.length) {return null;}

    const elements: ReactElement[] = [];
    const filteredPlanets = filterPlanets(birthChart.planets);

    // Sort planets by degree to handle overlaps
    const sortedPlanets = [...filteredPlanets].sort((a, b) => a.full_degree - b.full_degree);

    sortedPlanets.forEach((planet, index) => {
      const planetColor = PLANET_COLORS[planet.name as PlanetName] || '#ffffff';

      // Planet position (with slight offset to avoid overlaps)
      let adjustedRadius = planetRadius;
      const { x: planetX, y: planetY } = getCirclePosition(
        planet.full_degree,
        adjustedRadius,
        centerX,
        centerY,
        ascendantDegree
      );

      // Planet background circle
      elements.push(
        <Circle
          key={`planet-bg-${planet.name}`}
          cx={planetX}
          cy={planetY}
          r="12"
          fill={colors.background + 'CC'}
          stroke={planetColor}
          strokeWidth="2"
        />
      );

      // Planet symbol
      elements.push(
        <SvgText
          key={`planet-${planet.name}`}
          x={planetX}
          y={planetY}
          fontSize="14"
          fill={planetColor}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontWeight="bold"
        >
          {getPlanetGlyph(planet.name as PlanetName)}
        </SvgText>
      );

      // Planet degree marker on the wheel
      const { x: markerX1, y: markerY1 } = getCirclePosition(planet.full_degree, outerRadius, centerX, centerY, ascendantDegree);
      const { x: markerX2, y: markerY2 } = getCirclePosition(planet.full_degree, outerRadius + 10, centerX, centerY, ascendantDegree);

      elements.push(
        <Line
          key={`planet-marker-${planet.name}`}
          x1={markerX1}
          y1={markerY1}
          x2={markerX2}
          y2={markerY2}
          stroke={planetColor}
          strokeWidth="2"
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
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
    padding: 16,
    margin: 8,
    borderWidth: 1,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChartWheel;
