import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

interface SynastryRingProps {
  pct: number;
  size?: number;
}

export function SynastryRing({ pct, size = 44 }: SynastryRingProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const r = size * 0.39;
  const c = 2 * Math.PI * r;
  const dash = (c * clamped) / 100;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.ghostBorder}
          strokeWidth={2}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </Svg>
      <View style={styles.label} pointerEvents="none">
        <Text style={[styles.value, { color: colors.accent }]}>{clamped}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  label: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 11,
    fontWeight: '700',
  },
});
