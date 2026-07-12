import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

export type TabIconKind = 'home' | 'rel' | 'discover' | 'iris' | 'profile';

interface TabIconProps {
  kind: TabIconKind;
  color: string;
  size?: number;
}

function IrisTabIcon({ color, size }: Pick<TabIconProps, 'color'> & { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 5.5 H17.2 A2.8 2.8 0 0 1 20 8.3 V14 A2.8 2.8 0 0 1 17.2 16.8 H10 L5 20 V16.75 A2.8 2.8 0 0 1 2.8 14 V8.2 A2.7 2.7 0 0 1 5.5 5.5 Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path
        d="M13.7 8 L14.35 9.85 L16.2 10.5 L14.35 11.15 L13.7 13 L13.05 11.15 L11.2 10.5 L13.05 9.85 Z"
        stroke={color}
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TabIcon({ kind, color, size = 24 }: TabIconProps) {
  const stroke = 1.6;

  if (kind === 'home') {
    const rays = [0, 45, 90, 135, 180, 225, 270, 315];
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={3.6} stroke={color} strokeWidth={stroke} />
        {rays.map((deg) => {
          const a = (deg * Math.PI) / 180;
          const x1 = 12 + Math.cos(a) * 6.4;
          const y1 = 12 + Math.sin(a) * 6.4;
          const x2 = 12 + Math.cos(a) * 9.4;
          const y2 = 12 + Math.sin(a) * 9.4;
          return (
            <Line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    );
  }

  if (kind === 'rel') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={9} cy={12} r={5.4} stroke={color} strokeWidth={stroke} />
        <Circle cx={15} cy={12} r={5.4} stroke={color} strokeWidth={stroke} />
      </Svg>
    );
  }

  if (kind === 'discover') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2.5 L13.6 10.4 L21.5 12 L13.6 13.6 L12 21.5 L10.4 13.6 L2.5 12 L10.4 10.4 Z"
          stroke={color}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (kind === 'iris') {
    return <IrisTabIcon color={color} size={size} />;
  }

  if (kind === 'profile') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M19.5 14.6 A 8.6 8.6 0 1 1 9.4 4.5 A 6.6 6.6 0 0 0 19.5 14.6 Z"
          stroke={color}
          strokeWidth={stroke}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  return null;
}
