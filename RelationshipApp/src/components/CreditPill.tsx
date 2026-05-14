import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

interface CreditPillProps {
  balance: number | null;
  onPress: () => void;
}

export function CreditPill({ balance, onPress }: CreditPillProps) {
  const { colors } = useTheme();
  const display = balance === null ? '—' : balance.toLocaleString();

  return (
    <View style={styles.glowWrap}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Credit balance ${display}. Tap to buy credits.`}
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.pill}
      >
        <Text style={[styles.diamond, { color: colors.accent }]}>◆</Text>
        <Text style={[styles.value, { color: colors.accent }]}>{display}</Text>
      </TouchableOpacity>
    </View>
  );
}

const ACCENT_FILL = 'rgba(233, 195, 73, 0.13)';
const ACCENT_BORDER = 'rgba(233, 195, 73, 0.32)';

const styles = StyleSheet.create({
  glowWrap: {
    borderRadius: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#e9c349',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        // Android shadows for non-rectangular shapes are limited; rely on color glow only.
      },
    }),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 100,
    paddingLeft: 11,
    paddingRight: 14,
    paddingVertical: 7,
    backgroundColor: ACCENT_FILL,
    borderColor: ACCENT_BORDER,
  },
  diamond: {
    fontSize: 12,
  },
  value: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
