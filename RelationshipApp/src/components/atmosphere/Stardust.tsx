import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface StardustProps {
  density?: number;
  seed?: number;
  color?: string;
  width?: number;
  height?: number;
}

interface Dot {
  x: number;
  y: number;
  r: number;
  o: number;
}

function buildDots(density: number, seed: number): Dot[] {
  const rng = (i: number) => {
    const x = Math.sin((i + seed) * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  return Array.from({ length: density }).map((_, i) => ({
    x: rng(i * 2) * 100,
    y: rng(i * 2 + 1) * 100,
    r: rng(i * 3 + 5) * 1.2 + 0.3,
    o: rng(i * 4 + 11) * 0.5 + 0.05,
  }));
}

export function Stardust({
  density = 60,
  seed = 1,
  color = '#cabeff',
  width = 100,
  height = 100,
}: StardustProps) {
  const dots = useMemo(() => buildDots(density, seed), [density, seed]);

  return (
    <View pointerEvents="none" style={styles.absolute}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {dots.map((d, i) => (
          <Circle
            key={i}
            cx={d.x * (width / 100)}
            cy={d.y * (height / 100)}
            r={d.r * 0.18}
            fill={color}
            opacity={Platform.OS === 'android' ? Math.min(d.o, 0.45) : d.o}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
