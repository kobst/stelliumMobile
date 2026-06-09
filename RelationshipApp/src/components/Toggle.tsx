import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

interface ToggleProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const KNOB_SIZE = 24;
const PADDING = 2;

export function Toggle({ value, onValueChange, disabled, accessibilityLabel }: ToggleProps) {
  const { colors } = useTheme();

  const translateX = value ? TRACK_WIDTH - KNOB_SIZE - PADDING * 2 : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onValueChange?.(!value)}
      style={[
        styles.track,
        {
          backgroundColor: value ? colors.primary : colors.surfaceHigh,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.knob,
          {
            backgroundColor: value ? colors.onPrimary : colors.textSubtle,
            transform: [{ translateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
  },
});
