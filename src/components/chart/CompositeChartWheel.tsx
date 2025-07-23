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
} from './ChartUtils';

interface CompositeChartWheelProps {
  compositeChart: CompositeChart;
  title?: string;
}

const CompositeChartWheel: React.FC<CompositeChartWheelProps> = ({
  compositeChart,
  title,
}) => {
  const { colors } = useTheme();
  const { size, centerX, centerY, outerRadius, innerRadius, planetRadius, houseRadius } = CHART_DIMENSIONS;

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
    if (!compositeChart.houses?.length) {return null;}

    const elements: ReactElement[] = [];

    compositeChart.houses.forEach((house) => {
      if (!house.degree || isNaN(house.degree)) {return;}

      const { x: x1, y: y1 } = getCirclePosition(house.degree, outerRadius, centerX, centerY, ascendantDegree);
      const { x: x2, y: y2 } = getCirclePosition(house.degree, houseRadius, centerX, centerY, ascendantDegree);

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

  // Render composite planets
  const renderCompositePlanets = (): ReactElement[] | null => {
    if (!compositeChart.planets?.length) {return null;}

    const elements: ReactElement[] = [];
    const filteredPlanets = filterPlanets(convertedPlanets);

    filteredPlanets.forEach((planet) => {
      const planetColor = PLANET_COLORS[planet.name as PlanetName] || colors.onSurface;

      const { x: planetX, y: planetY } = getCirclePosition(
        planet.full_degree,
        planetRadius,
        centerX,
        centerY,
        ascendantDegree
      );

      // Planet background circle with composite-specific styling
      elements.push(
        <Circle
          key={`composite-planet-bg-${planet.name}`}
          cx={planetX}
          cy={planetY}
          r="14"
          fill={colors.background + 'DD'}
          stroke={planetColor}
          strokeWidth="2.5"
        />
      );

      // Planet symbol
      elements.push(
        <SvgText
          key={`composite-planet-${planet.name}`}
          x={planetX}
          y={planetY}
          fontSize="16"
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
      const { x: markerX2, y: markerY2 } = getCirclePosition(planet.full_degree, outerRadius + 12, centerX, centerY, ascendantDegree);

      elements.push(
        <Line
          key={`composite-planet-marker-${planet.name}`}
          x1={markerX1}
          y1={markerY1}
          x2={markerX2}
          y2={markerY2}
          stroke={planetColor}
          strokeWidth="2.5"
        />
      );
    });

    return elements;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {title && <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>}

      <View style={styles.chartContainer}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circles and zodiac wheel */}
          {renderZodiacWheel()}

          {/* House cusps */}
          {renderHouses()}

          {/* Composite planets */}
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
