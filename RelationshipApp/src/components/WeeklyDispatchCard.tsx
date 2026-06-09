import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import type { WeeklyArticle } from '../api';
import type { WeeklyArticleLoadState } from '../hooks/useWeeklyArticle';
import { Stardust } from './atmosphere/Stardust';

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
  if (PLANET_GLYPHS[token]) {
    return PLANET_GLYPHS[token];
  }
  const aspect = ASPECT_GLYPHS[token.toLowerCase()];
  if (aspect) {
    return aspect;
  }
  return token;
}

function isPlanet(token: string): boolean {
  return Boolean(PLANET_GLYPHS[token]);
}

function isAspect(token: string): boolean {
  return Boolean(ASPECT_GLYPHS[token.toLowerCase()]);
}

function firstParagraph(body: string | undefined): string {
  if (!body) {
    return '';
  }
  const trimmed = body.trim();
  const split = trimmed.split(/\n\s*\n/);
  return split[0] ?? '';
}

interface WeeklyDispatchCardProps {
  article: WeeklyArticle | null;
  state: WeeklyArticleLoadState;
  onPress?: () => void;
}

interface HeroTokens {
  left: string | null;
  aspect: string | null;
  right: string | null;
  rawSymbols: string[];
}

function buildHeroTokens(article: WeeklyArticle | null): HeroTokens {
  const raw = article?.content.heroSymbols;
  const symbols: string[] = Array.isArray(raw) ? raw.filter((value): value is string => typeof value === 'string') : [];
  const planets = symbols.filter(isPlanet);
  const aspect = symbols.find(isAspect) ?? null;
  return {
    left: planets[0] ?? null,
    aspect,
    right: planets[1] ?? null,
    rawSymbols: symbols,
  };
}

export function WeeklyDispatchCard({ article, state, onPress }: WeeklyDispatchCardProps) {
  const { colors } = useTheme();

  const hero = useMemo(() => buildHeroTokens(article), [article]);
  const aspectName = hero.aspect ? hero.aspect.toLowerCase() : '';
  const symbolLabel = article?.topic.transitReference ?? '';
  const title = article?.content.headline ?? article?.topic.title ?? '';
  const preview = useMemo(() => firstParagraph(article?.content.body), [article]);
  const readMinutes = article?.topic.readTimeMinutes ?? 5;

  const renderHero = () => (
    <View style={[styles.imageBlock, { backgroundColor: colors.surfaceHigh }]}>
      <Stardust density={32} seed={3} color={colors.primary} />
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 360 200"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFillObject}
      >
        <Circle cx="180" cy="115" r="92" fill="none" stroke="rgba(202,190,255,0.16)" strokeWidth="0.6" />
        <Circle cx="180" cy="115" r="140" fill="none" stroke="rgba(202,190,255,0.08)" strokeWidth="0.6" />
        <Circle
          cx="180"
          cy="115"
          r="62"
          fill="none"
          stroke="rgba(233,195,73,0.18)"
          strokeWidth="0.6"
          strokeDasharray="2 4"
        />
      </Svg>
      <View style={styles.heroContent} pointerEvents="none">
        {hero.left || hero.right || hero.aspect ? (
          <View style={styles.glyphRow}>
            {hero.left ? (
              <Text style={[styles.heroGlyph, { color: colors.primary }]}>
                {tokenToGlyph(hero.left)}
              </Text>
            ) : null}
            {hero.aspect ? (
              <Text style={[styles.aspectGlyph, { color: colors.text }]}>
                {tokenToGlyph(hero.aspect)}
              </Text>
            ) : null}
            {hero.right ? (
              <Text style={[styles.heroGlyph, { color: colors.primary }]}>
                {tokenToGlyph(hero.right)}
              </Text>
            ) : null}
          </View>
        ) : hero.rawSymbols.length > 0 ? (
          <Text style={[styles.symbolGlyph, { color: colors.text }]}>
            {hero.rawSymbols.map(tokenToGlyph).join(' ')}
          </Text>
        ) : null}
        {symbolLabel ? (
          <Text style={[styles.heroLabel, { color: colors.textMuted }]}>
            {hero.left ? `${hero.left} ` : ''}
            {aspectName ? (
              <Text style={{ color: colors.accent }}>{aspectName}</Text>
            ) : null}
            {hero.right ? ` ${hero.right}` : ''}
            {!hero.left && !hero.right ? symbolLabel.toUpperCase() : ''}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (state === 'loading' || state === 'idle') {
    return (
      <View style={[styles.card, { backgroundColor: colors.surfaceLow }]}>
        <View style={[styles.imageBlock, { backgroundColor: colors.surfaceHigh }]}>
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
      <View style={[styles.card, { backgroundColor: colors.surfaceLow }]}>
        <View style={[styles.imageBlock, { backgroundColor: colors.surfaceHigh }]}>
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
      <View style={[styles.card, { backgroundColor: colors.surfaceLow }]}>
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
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, { backgroundColor: colors.surfaceLow }]}
    >
      {renderHero()}

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

        <Text style={[styles.cta, { color: colors.primary }]}>Read article →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  imageBlock: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  glyphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  heroGlyph: {
    fontSize: 38,
    fontWeight: '300',
  },
  aspectGlyph: {
    fontSize: 24,
    fontWeight: '300',
    opacity: 0.92,
  },
  symbolGlyph: {
    fontSize: 36,
    letterSpacing: 6,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  body: {
    padding: 22,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
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
    fontFamily: SERIF_FONT,
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  preview: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  cta: {
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 4,
  },
  statusText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
});
