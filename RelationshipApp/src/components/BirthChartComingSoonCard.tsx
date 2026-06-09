import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export function BirthChartComingSoonCard() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.ghostBorder,
        },
      ]}
    >
      <View
        style={[
          styles.badge,
          {
            backgroundColor: colors.surfaceHigh,
            borderColor: colors.ghostBorder,
          },
        ]}
      >
        <Text style={[styles.badgeText, { color: colors.textMuted }]}>Coming soon</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Your birth chart</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        We are building a full wheel view of your planets, houses, and aspects. You will be able to
        tap any placement to read what it means for you.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
