import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

interface RomanticSummaryCardProps {
  summary: string;
  onPressFullReading: () => void;
  clampLines?: number;
}

export function RomanticSummaryCard({
  summary,
  onPressFullReading,
  clampLines = 4,
}: RomanticSummaryCardProps) {
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Celestial Blueprint</Text>
        <TouchableOpacity onPress={onPressFullReading} activeOpacity={0.7}>
          <Text style={[styles.link, { color: colors.primary }]}>Full reading →</Text>
        </TouchableOpacity>
      </View>
      <Text
        style={[styles.summary, { color: colors.textMuted }]}
        numberOfLines={clampLines}
      >
        {summary}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  link: {
    fontSize: 12,
    fontWeight: '600',
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
