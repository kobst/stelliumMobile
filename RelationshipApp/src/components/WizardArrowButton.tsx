import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

interface WizardArrowButtonProps {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const SIZE = 64;

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
          <SvgLinearGradient id="wizardArrowGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#9FE4FF" />
            <Stop offset="1" stopColor="#A78BFA" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2} fill="url(#wizardArrowGrad)" />
        <Path
          d="M22 32 H42 M34 24 L42 32 L34 40"
          stroke="#0B1228"
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
    shadowColor: '#9FE4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 10,
  },
  buttonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
});
