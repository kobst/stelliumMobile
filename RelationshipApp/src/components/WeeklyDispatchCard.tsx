import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

const WEEKLY_DISPATCH = {
  eyebrow: 'Weekly Dispatch',
  readMinutes: 5,
  symbols: '♀ □ ♂',
  symbolLabel: 'Venus square Mars',
  title: 'When desire and friction share the same room',
  preview:
    "Venus square Mars is the aspect that makes you want someone and argue with them in the same breath. This week, it's active for everyone — here's what it means for your chart.",
  ctaLabel: 'Read article',
  // For v1 we hide the personalized hook because we don't have the per-relationship aspect index yet.
  showRelationshipHook: false,
};

interface WeeklyDispatchCardProps {
  onPress?: () => void;
}

export function WeeklyDispatchCard({ onPress }: WeeklyDispatchCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
      ]}
    >
      <View style={[styles.imageBlock, { backgroundColor: colors.surfaceLow }]}>
        <Text style={[styles.symbolGlyph, { color: colors.text }]}>{WEEKLY_DISPATCH.symbols}</Text>
        <Text style={[styles.symbolLabel, { color: colors.textSubtle }]}>
          {WEEKLY_DISPATCH.symbolLabel.toUpperCase()}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            {WEEKLY_DISPATCH.eyebrow}
          </Text>
          <View style={[styles.dot, { backgroundColor: colors.textSubtle }]} />
          <Text style={[styles.metaText, { color: colors.textSubtle }]}>
            {WEEKLY_DISPATCH.readMinutes} min read
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{WEEKLY_DISPATCH.title}</Text>
        <Text style={[styles.preview, { color: colors.textMuted }]}>
          {WEEKLY_DISPATCH.preview}
        </Text>

        <TouchableOpacity
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={WEEKLY_DISPATCH.ctaLabel}
          disabled={!onPress}
        >
          <Text style={[styles.cta, { color: colors.primary }]}>{WEEKLY_DISPATCH.ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageBlock: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  symbolGlyph: {
    fontSize: 36,
    letterSpacing: 6,
  },
  symbolLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  body: {
    padding: 18,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  metaText: {
    fontSize: 11,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  preview: {
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  cta: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});
