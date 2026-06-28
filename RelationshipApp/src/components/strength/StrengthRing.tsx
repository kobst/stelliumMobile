import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { SERIF_FONT } from '../../theme/typography';
import { scoreColor } from './heat';

interface StrengthRingProps {
  score: number;
  size?: number;
  stroke?: number;
}

/**
 * Relationship Strength as a single arc that fills proportionally. The colour is
 * a fixed lilac→cyan gradient regardless of value, so a low reading never reads
 * as a "fail" — only the score number itself takes the heat colour.
 */
export function StrengthRing({ score, size = 56, stroke = 5 }: StrengthRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = size / 2 - stroke / 2 - 1;
  const circ = 2 * Math.PI * r;
  const dash = (circ * clamped) / 100;
  const fontSize = size * 0.34;

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Defs>
          <LinearGradient id="strengthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#cabeff" />
            <Stop offset="55%" stopColor="#a9b6ff" />
            <Stop offset="100%" stopColor="#00dce5" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(202,190,255,0.12)"
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#strengthGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.value, { fontSize, color: scoreColor(clamped) }]}>{Math.round(clamped)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: SERIF_FONT,
    fontWeight: '500',
    letterSpacing: -0.4,
  },
});
