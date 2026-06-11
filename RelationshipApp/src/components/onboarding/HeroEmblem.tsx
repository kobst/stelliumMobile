import React from 'react';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { ONB } from './atoms';

/**
 * Splash hero emblem: concentric orbit rings, orbiting planet dots, and a
 * gradient core with a four-point star. Static (faithful to OnbSplash).
 */
export function HeroEmblem({ size = 188 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 188 188">
      <Defs>
        <RadialGradient id="heroCore" cx="34%" cy="30%" r="75%">
          <Stop offset="0%" stopColor="#8475c8" />
          <Stop offset="55%" stopColor="#4a3a86" />
          <Stop offset="100%" stopColor="#271d4d" />
        </RadialGradient>
      </Defs>

      {/* orbit rings */}
      <Circle cx={94} cy={94} r={90} fill="none" stroke="rgba(202,190,255,0.16)" strokeWidth={1} />
      <Circle
        cx={94}
        cy={94}
        r={72}
        fill="none"
        stroke="rgba(233,195,73,0.18)"
        strokeWidth={1}
        strokeDasharray="2 7"
      />
      <Circle cx={94} cy={94} r={52} fill="none" stroke="rgba(202,190,255,0.12)" strokeWidth={1} />

      {/* orbiting bodies */}
      <Circle cx={184} cy={94} r={3.5} fill={ONB.gold} />
      <Circle cx={22} cy={94} r={2.5} fill={ONB.primary} opacity={0.85} />
      <Circle cx={94} cy={22} r={2} fill={ONB.cyan} opacity={0.7} />

      {/* core */}
      <Circle cx={94} cy={94} r={46} fill="url(#heroCore)" />
      <Circle cx={94} cy={94} r={46} fill="none" stroke="rgba(202,190,255,0.25)" strokeWidth={1} />

      {/* four-point star, centered */}
      <G transform="translate(73 75)">
        <Path
          d="M21 4 L23.4 16.6 L36 19 L23.4 21.4 L21 34 L18.6 21.4 L6 19 L18.6 16.6 Z"
          fill={ONB.primary}
        />
      </G>
    </Svg>
  );
}
