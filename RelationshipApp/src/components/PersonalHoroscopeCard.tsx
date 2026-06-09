import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { relationshipHoroscopesApi, type RomanceHoroscopeDocument } from '../api';
import {
  composeHoroscopeHeadline,
  formatHoroscopeDateRange,
  splitInterpretationParagraphs,
} from '../utils/horoscopeFormat';
import type { RelationshipRootParamList } from '../navigation/RootNavigator';
import { Halo } from './atmosphere/Halo';

interface PersonalHoroscopeCardProps {
  userId: string | null;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const FALLBACK_HEADLINE = 'Your weekly love forecast';
const PREVIEW_LINE_COUNT = 3;

type Navigation = StackNavigationProp<RelationshipRootParamList>;

export function PersonalHoroscopeCard({ userId }: PersonalHoroscopeCardProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<Navigation>();
  const [horoscope, setHoroscope] = useState<RomanceHoroscopeDocument | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setState('loading');
    setError(null);
    try {
      const result = await relationshipHoroscopesApi.ensureCurrentRomance(userId, 'weekly');
      setHoroscope(result);
      setState('ready');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load horoscope';
      setError(message);
      setState('error');
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const headline = horoscope
    ? composeHoroscopeHeadline(horoscope.analysis?.keyThemes, FALLBACK_HEADLINE)
    : FALLBACK_HEADLINE;
  const paragraphs = splitInterpretationParagraphs(horoscope?.interpretation);
  const dateRange = formatHoroscopeDateRange(horoscope?.startDate, horoscope?.endDate);
  const previewText = paragraphs[0] ?? '';

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceLow }]}>
      <Halo color={colors.primary} size={220} opacity={0.12} top={-60} right={-60} />
      <View style={styles.headerRow}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Your Week in Love</Text>
        {dateRange ? (
          <Text style={[styles.dateRange, { color: colors.textSubtle }]}>{dateRange}</Text>
        ) : null}
      </View>

      {state === 'loading' && !horoscope ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Reading the week's transits…
          </Text>
        </View>
      ) : null}

      {state === 'error' ? (
        <View style={styles.errorBlock}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error ?? 'Something went wrong loading your horoscope.'}
          </Text>
          <TouchableOpacity onPress={load} accessibilityRole="button">
            <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {horoscope ? (
        <>
          <Text style={[styles.headline, { color: colors.text }]}>{headline}.</Text>

          {previewText ? (
            <Text
              style={[styles.body, { color: colors.textMuted }]}
              numberOfLines={PREVIEW_LINE_COUNT}
              ellipsizeMode="tail"
            >
              {previewText}
            </Text>
          ) : null}

          {paragraphs.length > 0 ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('WeeklyHoroscopeDetail')}
              accessibilityRole="button"
              accessibilityLabel="Read full forecast"
            >
              <Text style={[styles.expandToggle, { color: colors.primary }]}>
                Read full forecast →
              </Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 22,
    gap: 12,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  dateRange: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
  headline: {
    fontFamily: SERIF_FONT,
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  expandToggle: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  loadingText: {
    fontSize: 13,
  },
  errorBlock: {
    gap: 6,
  },
  errorText: {
    fontSize: 13,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
