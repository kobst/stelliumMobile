import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { ONB } from './atoms';

/**
 * Chart-reading loader emblem: a static gold dual-star core inside slowly
 * orbiting dashed rings + planet dots (faithful to OnbLoading, brought to life
 * with a gentle rotation on the orbit layer).
 */
export function LoaderEmblem({ size = 200 }: { size?: number }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ width: size, height: size }}>
      {/* rotating orbit layer */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Circle
            cx={100}
            cy={100}
            r={78}
            fill="none"
            stroke="rgba(233,195,73,0.22)"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
          <Circle cx={100} cy={100} r={60} fill="none" stroke="rgba(202,190,255,0.16)" strokeWidth={1} />
          <Circle cx={178} cy={100} r={3} fill={ONB.gold} />
          <Circle cx={40} cy={100} r={2.5} fill={ONB.primary} opacity={0.8} />
        </Svg>
      </Animated.View>

      {/* static core + dual star */}
      <Svg width={size} height={size} viewBox="0 0 200 200" style={StyleSheet.absoluteFill}>
        <Circle cx={100} cy={100} r={58} fill={ONB.surfaceLow} />
        <Circle cx={100} cy={100} r={58} fill="none" stroke="rgba(233,195,73,0.4)" strokeWidth={1} />
        <G transform="translate(72 80)">
          <Path d="M16 4 L19 16 L31 19 L19 22 L16 34 L13 22 L1 19 L13 16 Z" fill={ONB.gold} />
          <Path
            d="M40 8 L42.5 17 L51.5 19.5 L42.5 22 L40 31 L37.5 22 L28.5 19.5 L37.5 17 Z"
            fill={ONB.gold}
          />
        </G>
      </Svg>
    </View>
  );
}
