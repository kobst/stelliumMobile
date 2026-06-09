import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';

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
    <View style={[styles.card, { backgroundColor: colors.surfaceLow }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Celestial Blueprint</Text>
        <TouchableOpacity onPress={onPressFullReading} activeOpacity={0.7}>
          <Text style={[styles.link, { color: colors.primary }]}>Full reading →</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Your romantic and intimate nature
      </Text>
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
    borderRadius: 24,
    padding: 22,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.4,
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontStyle: 'italic',
    color: 'rgba(236,232,255,0.62)',
  },
  summary: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
