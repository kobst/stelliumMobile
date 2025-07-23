import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface SegmentedControlOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  style?: any;
  accessibilityLabel?: string;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  style,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceVariant, borderColor: colors.strokeSubtle },
        style,
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option, index) => {
        const isSelected = value === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? colors.accentPrimary : 'transparent',
                borderColor: colors.strokeSubtle,
              },
              isFirst && styles.firstOption,
              isLast && styles.lastOption,
              !isLast && styles.optionBorder,
            ]}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: isSelected ? colors.onAccent : colors.onSurfaceMed,
                  fontWeight: isSelected ? '600' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    padding: 2,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  firstOption: {
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
  },
  lastOption: {
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  optionBorder: {
    borderRightWidth: 1,
    borderRightColor: 'transparent', // Will be overridden by borderColor prop
  },
  optionText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SegmentedControl;
