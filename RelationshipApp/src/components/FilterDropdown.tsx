import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

interface FilterDropdownProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function FilterDropdown({ label, active, onPress }: FilterDropdownProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: active ? colors.surfaceHigh : colors.surface,
          borderColor: active ? colors.ghostBorder : 'transparent',
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: active ? colors.text : colors.textMuted,
            fontWeight: active ? '600' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text style={[styles.caret, { color: active ? colors.text : colors.textMuted }]}>
        ▾
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  label: {
    fontSize: 12.5,
  },
  caret: {
    fontSize: 10,
    marginTop: 1,
  },
});
