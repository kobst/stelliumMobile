import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import type { WeeklyArticle } from '../api';
import type { WeeklyArticleLoadState } from '../hooks/useWeeklyArticle';

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
  Chiron: '⚷',
  Node: '☊',
  'True Node': '☊',
};

const ASPECT_GLYPHS: Record<string, string> = {
  conjunction: '☌',
  opposition: '☍',
  square: '□',
  trine: '△',
  sextile: '⚹',
  quincunx: '⊻',
};

function tokenToGlyph(token: string): string {
  if (PLANET_GLYPHS[token]) {return PLANET_GLYPHS[token];}
  const aspect = ASPECT_GLYPHS[token.toLowerCase()];
  if (aspect) {return aspect;}
  return token;
}

function buildHeroGlyphs(article: WeeklyArticle): string {
  const symbols = article.content.heroSymbols;
  if (Array.isArray(symbols) && symbols.length > 0) {
    return symbols.map(tokenToGlyph).join(' ');
  }
  return article.topic.transitReference ?? '';
}

function firstParagraph(body: string | undefined): string {
  if (!body) {return '';}
  const trimmed = body.trim();
  const split = trimmed.split(/\n\s*\n/);
  return split[0] ?? '';
}

interface WeeklyDispatchCardProps {
  article: WeeklyArticle | null;
  state: WeeklyArticleLoadState;
  onPress?: () => void;
}

export function WeeklyDispatchCard({ article, state, onPress }: WeeklyDispatchCardProps) {
  const { colors } = useTheme();

  const heroGlyphs = useMemo(
    () => (article ? buildHeroGlyphs(article) : ''),
    [article]
  );
  const symbolLabel = article?.topic.transitReference ?? '';
  const title = article?.content.headline ?? article?.topic.title ?? '';
  const preview = useMemo(() => firstParagraph(article?.content.body), [article]);
  const readMinutes = article?.topic.readTimeMinutes ?? 5;

  if (state === 'loading' || state === 'idle') {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
        ]}
      >
        <View style={[styles.imageBlock, { backgroundColor: colors.surfaceLow }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Weekly Dispatch</Text>
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            Pulling this week's dispatch…
          </Text>
        </View>
      </View>
    );
  }

  if (state === 'empty') {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
        ]}
      >
        <View style={[styles.imageBlock, { backgroundColor: colors.surfaceLow }]}>
          <Text style={[styles.symbolGlyph, { color: colors.textSubtle }]}>✦</Text>
        </View>
        <View style={styles.body}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Weekly Dispatch</Text>
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            No dispatch this week — check back Monday.
          </Text>
        </View>
      </View>
    );
  }

  if (state === 'error' || !article) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
        ]}
      >
        <View style={styles.body}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Weekly Dispatch</Text>
          <Text style={[styles.statusText, { color: colors.error }]}>
            Couldn't load this week's dispatch.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
      ]}
    >
      <View style={[styles.imageBlock, { backgroundColor: colors.surfaceLow }]}>
        {heroGlyphs ? (
          <Text style={[styles.symbolGlyph, { color: colors.text }]}>{heroGlyphs}</Text>
        ) : null}
        {symbolLabel ? (
          <Text style={[styles.symbolLabel, { color: colors.textSubtle }]}>
            {symbolLabel.toUpperCase()}
          </Text>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Weekly Dispatch</Text>
          <View style={[styles.dot, { backgroundColor: colors.textSubtle }]} />
          <Text style={[styles.metaText, { color: colors.textSubtle }]}>
            {readMinutes} min read
          </Text>
        </View>

        {title ? (
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        ) : null}
        {preview ? (
          <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={4}>
            {preview}
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Read article"
          disabled={!onPress}
        >
          <Text style={[styles.cta, { color: colors.primary }]}>Read article</Text>
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
  statusText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
});
