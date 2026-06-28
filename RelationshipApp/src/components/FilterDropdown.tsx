import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';

interface FilterDropdownProps {
  label: string;
  active: boolean;
  onPress: () => void;
  // Dropdowns (identity filter) show a caret; toggle chips (sorts) do not.
  showCaret?: boolean;
}

export function FilterDropdown({ label, active, onPress, showCaret = true }: FilterDropdownProps) {
  const { colors } = useTheme();
  const accentBorder = active
    ? 'rgba(202, 190, 255, 0.35)'
    : 'rgba(202, 190, 255, 0.12)';
  const fill = active ? 'rgba(202, 190, 255, 0.10)' : 'rgba(255, 255, 255, 0.025)';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: fill,
          borderColor: accentBorder,
          opacity: pressed ? 0.78 : 1,
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
      {showCaret ? (
        <Text style={[styles.caret, { color: active ? colors.text : colors.textMuted }]}>
          ▾
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.05,
  },
  caret: {
    fontSize: 10,
    marginTop: 1,
    opacity: 0.7,
  },
});
