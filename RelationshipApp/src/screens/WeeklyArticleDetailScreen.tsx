import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import { useWeeklyArticle } from '../hooks/useWeeklyArticle';
import { CreditPill } from '../components/CreditPill';
import { formatHoroscopeDateRange } from '../utils/horoscopeFormat';
import type { RelationshipRootParamList } from '../navigation/RootNavigator';
import type { WeeklyArticle } from '../api';

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

function splitParagraphs(body: string | undefined): string[] {
  if (!body) {return [];}
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

type Navigation = StackNavigationProp<RelationshipRootParamList, 'WeeklyArticleDetail'>;

export const WeeklyArticleDetailScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { colors } = useTheme();
  const credits = useRelationshipAppStore((s) => s.credits);
  const { article, state, error } = useWeeklyArticle();

  const heroGlyphs = useMemo(
    () => (article ? buildHeroGlyphs(article) : ''),
    [article]
  );
  const symbolLabel = article?.topic.transitReference ?? '';
  const headline = article?.content.headline ?? article?.topic.title ?? '';
  const subtitle = article?.topic.subtitle ?? '';
  const readMinutes = article?.topic.readTimeMinutes ?? 5;
  const dateRange = useMemo(
    () => formatHoroscopeDateRange(article?.weekStartDate, article?.weekEndDate),
    [article]
  );
  const paragraphs = useMemo(
    () => splitParagraphs(article?.content.body),
    [article]
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} activeOpacity={0.7}>
          <Text style={[styles.backLabel, { color: colors.textMuted }]}>← Home</Text>
        </TouchableOpacity>
        <CreditPill balance={credits?.balance ?? null} onPress={() => {}} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>Weekly Dispatch</Text>

        {(state === 'loading' || state === 'idle') && !article ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Pulling this week's dispatch…
            </Text>
          </View>
        ) : null}

        {state === 'empty' ? (
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            No dispatch this week — check back Monday.
          </Text>
        ) : null}

        {state === 'error' ? (
          <Text style={[styles.statusText, { color: colors.error }]}>
            {error ?? "Couldn't load this week's dispatch."}
          </Text>
        ) : null}

        {article ? (
          <>
            <View style={[styles.heroBlock, { backgroundColor: colors.surfaceLow }]}>
              {heroGlyphs ? (
                <Text style={[styles.heroGlyph, { color: colors.text }]}>{heroGlyphs}</Text>
              ) : null}
              {symbolLabel ? (
                <Text style={[styles.heroLabel, { color: colors.textSubtle }]}>
                  {symbolLabel.toUpperCase()}
                </Text>
              ) : null}
            </View>

            {headline ? (
              <Text style={[styles.headline, { color: colors.text }]}>{headline}</Text>
            ) : null}
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.textSubtle }]}>
                {readMinutes} min read
              </Text>
              {dateRange ? (
                <>
                  <View style={[styles.dot, { backgroundColor: colors.textSubtle }]} />
                  <Text style={[styles.metaText, { color: colors.textSubtle }]}>{dateRange}</Text>
                </>
              ) : null}
            </View>

            <View style={styles.bodyBlock}>
              {paragraphs.map((p, idx) => (
                <Text key={idx} style={[styles.paragraph, { color: colors.text }]}>
                  {p}
                </Text>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroBlock: {
    borderRadius: 16,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroGlyph: {
    fontSize: 44,
    letterSpacing: 8,
  },
  heroLabel: {
    fontSize: 11,
    letterSpacing: 1.6,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  bodyBlock: {
    gap: 14,
    marginTop: 4,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 23,
  },
  loadingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 13,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 22,
    paddingVertical: 16,
  },
});
