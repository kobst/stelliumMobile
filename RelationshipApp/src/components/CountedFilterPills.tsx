import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

export interface CountedPillOption<T extends string> {
  key: T;
  label: string;
  count: number;
}

interface CountedFilterPillsProps<T extends string> {
  options: readonly CountedPillOption<T>[];
  selected: T;
  onSelect: (key: T) => void;
}

export function CountedFilterPills<T extends string>({
  options,
  selected,
  onSelect,
}: CountedFilterPillsProps<T>) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isActive = option.key === selected;
        return (
          <TouchableOpacity
            key={option.key}
            activeOpacity={0.8}
            onPress={() => onSelect(option.key)}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? colors.surfaceHigh : colors.surface,
                borderColor: isActive ? colors.ghostBorder : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.text : colors.textMuted,
                  fontWeight: isActive ? '600' : '500',
                },
              ]}
            >
              {option.label} ({option.count})
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  label: {
    fontSize: 12.5,
  },
});
