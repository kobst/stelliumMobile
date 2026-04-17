import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';

interface CreditPillProps {
  balance: number | null;
  onPress: () => void;
}

export function CreditPill({ balance, onPress }: CreditPillProps) {
  const { colors } = useTheme();
  const display = balance === null ? '—' : balance.toLocaleString();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Credit balance ${display}. Tap to buy credits.`}
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.pill}
    >
      <Text style={[styles.diamond, { color: colors.accent }]}>◆</Text>
      <Text style={[styles.value, { color: colors.accent }]}>{display}</Text>
    </TouchableOpacity>
  );
}

const ACCENT_FILL = 'rgba(233, 195, 73, 0.15)';
const ACCENT_BORDER = 'rgba(233, 195, 73, 0.25)';

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: ACCENT_FILL,
    borderColor: ACCENT_BORDER,
  },
  diamond: {
    fontSize: 12,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
  },
});
