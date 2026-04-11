import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface PulsingHeroIconProps {
  glyph?: string;
  backgroundColor: string;
  glyphColor: string;
  haloColor: string;
}

export function PulsingHeroIcon({
  glyph = '✦✦',
  backgroundColor,
  glyphColor,
  haloColor,
}: PulsingHeroIconProps): React.ReactElement {
  const innerScale = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const innerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(innerScale, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(innerScale, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloScale, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(haloScale, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    innerLoop.start();
    haloLoop.start();

    return () => {
      innerLoop.stop();
      haloLoop.stop();
    };
  }, [innerScale, haloScale]);

  const innerStyle = {
    transform: [
      {
        scale: innerScale.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08],
        }),
      },
    ],
    opacity: innerScale.interpolate({
      inputRange: [0, 1],
      outputRange: [0.92, 1],
    }),
  };

  const haloStyle = {
    transform: [
      {
        scale: haloScale.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1.55],
        }),
      },
    ],
    opacity: haloScale.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0, 0.35, 0],
    }),
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, { backgroundColor: haloColor }, haloStyle]}
      />
      <Animated.View style={[styles.icon, { backgroundColor }, innerStyle]}>
        <Text style={[styles.glyph, { color: glyphColor }]}>{glyph}</Text>
      </Animated.View>
    </View>
  );
}

const ICON_SIZE = 96;

const styles = StyleSheet.create({
  wrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 32,
    letterSpacing: 2,
  },
});
