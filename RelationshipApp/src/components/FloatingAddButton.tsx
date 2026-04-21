import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '../theme';

interface FloatingAddButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  /** Optional extra bottom offset (e.g. for screens with no tab bar). */
  bottomInset?: number;
}

const SIZE = 60;

export function FloatingAddButton({
  onPress,
  accessibilityLabel = 'Add',
  bottomInset = 24,
}: FloatingAddButtonProps) {
  const { colors } = useTheme();
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: bottomInset }]}
    >
      <View style={[styles.shadowCarrier, shadowStyle]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={styles.button}
        >
          <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="fabGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#E0D4FF" stopOpacity="1" />
                <Stop offset="100%" stopColor="#9B7DD4" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="url(#fabGradient)" />
          </Svg>
          <Text style={[styles.glyph, { color: colors.onPrimary }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const shadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  android: {
    elevation: 8,
  },
  default: {},
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
  },
  shadowCarrier: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#9B7DD4',
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glyph: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
    marginTop: -2,
  },
});
