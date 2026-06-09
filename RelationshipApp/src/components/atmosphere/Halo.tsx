import React from 'react';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

interface HaloProps {
  color?: string;
  size?: number;
  opacity?: number;
  top?: number;
  left?: DimensionValue;
  right?: DimensionValue;
  bottom?: number;
}

let haloId = 0;

export function Halo({
  color = '#cabeff',
  size = 360,
  opacity = 0.16,
  top = -80,
  left,
  right,
  bottom,
}: HaloProps) {
  const id = React.useMemo(() => `halo-${++haloId}`, []);
  const positionStyle: ViewStyle = {
    width: size,
    height: size,
    top,
    bottom,
  };
  if (left !== undefined) {
    positionStyle.left = left;
    if (typeof left === 'string' && left.endsWith('%')) {
      positionStyle.transform = [{ translateX: -size / 2 }];
    }
  }
  if (right !== undefined) {
    positionStyle.right = right;
  }

  return (
    <View pointerEvents="none" style={[styles.halo, positionStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="60%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
  },
});
