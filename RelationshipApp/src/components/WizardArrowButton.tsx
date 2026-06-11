import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

interface WizardArrowButtonProps {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const SIZE = 66;

export function WizardArrowButton({
  onPress,
  disabled = false,
  accessibilityLabel = 'Continue',
}: WizardArrowButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.button, disabled ? styles.buttonDisabled : null]}
    >
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="wizardArrowGrad" cx="32%" cy="30%" r="75%">
            <Stop offset="0" stopColor="#d8e7ff" />
            <Stop offset="0.45" stopColor="#b8c2ff" />
            <Stop offset="1" stopColor="#cabeff" />
          </RadialGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2} fill="url(#wizardArrowGrad)" />
        <Path
          d="M23 33 H43 M35 25 L43 33 L35 41"
          stroke="#1a142e"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b8c2ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 17,
    elevation: 10,
  },
  buttonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
});
