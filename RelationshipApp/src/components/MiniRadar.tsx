import React from 'react';
import Svg, { Circle, Polygon } from 'react-native-svg';

export interface MiniRadarScores {
  Harmony: number;
  Passion: number;
  Connection: number;
  Stability: number;
  Growth: number;
}

interface MiniRadarProps {
  scores: MiniRadarScores;
  size?: number;
  fillColor?: string;
  strokeColor?: string;
  ringColor?: string;
}

const ORDER: (keyof MiniRadarScores)[] = [
  'Harmony',
  'Passion',
  'Connection',
  'Stability',
  'Growth',
];

function point(cx: number, cy: number, radius: number, index: number, count: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

function joinPolygon(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

export function MiniRadar({
  scores,
  size = 60,
  fillColor = 'rgba(202, 190, 255, 0.18)',
  strokeColor = '#cabeff',
  ringColor = 'rgba(255,255,255,0.06)',
}: MiniRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const count = ORDER.length;

  const outerPoints = ORDER.map((_, i) => point(cx, cy, maxR, i, count));
  const innerPoints = ORDER.map((_, i) => point(cx, cy, maxR * 0.5, i, count));

  const dataPoints = ORDER.map((label, i) => {
    const value = Math.max(0, Math.min(100, scores[label] ?? 0));
    return point(cx, cy, (value / 100) * maxR, i, count);
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon
        points={joinPolygon(outerPoints)}
        fill="none"
        stroke={ringColor}
        strokeWidth={0.6}
      />
      <Polygon
        points={joinPolygon(innerPoints)}
        fill="none"
        stroke={ringColor}
        strokeWidth={0.6}
      />
      <Polygon
        points={joinPolygon(dataPoints)}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {dataPoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={1.4} fill={strokeColor} />
      ))}
    </Svg>
  );
}
