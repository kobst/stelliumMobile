import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { relationshipHoroscopesApi, type RomanceHoroscopeDocument } from '../api';
import {
  composeHoroscopeHeadline,
  formatHoroscopeDateRange,
  splitInterpretationParagraphs,
} from '../utils/horoscopeFormat';

interface PersonalHoroscopeCardProps {
  userId: string | null;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const FALLBACK_HEADLINE = 'Your weekly love forecast';

export function PersonalHoroscopeCard({ userId }: PersonalHoroscopeCardProps) {
  const { colors } = useTheme();
  const [horoscope, setHoroscope] = useState<RomanceHoroscopeDocument | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

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
  const visibleParagraphs = expanded ? paragraphs : paragraphs.slice(0, 1);
  const hasMore = paragraphs.length > 1;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
      ]}
    >
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

          <View style={styles.bodyBlock}>
            {visibleParagraphs.map((paragraph, index) => (
              <Text
                key={`para-${index}`}
                style={[styles.body, { color: colors.textMuted }]}
              >
                {paragraph}
              </Text>
            ))}
          </View>

          {hasMore ? (
            <TouchableOpacity
              onPress={() => setExpanded((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Show less' : 'Read full forecast'}
            >
              <Text style={[styles.expandToggle, { color: colors.primary }]}>
                {expanded ? 'Show less' : 'Read full forecast →'}
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
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
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dateRange: {
    fontSize: 11,
  },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  bodyBlock: {
    gap: 10,
  },
  body: {
    fontSize: 14,
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
