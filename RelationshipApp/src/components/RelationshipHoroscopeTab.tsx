import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import {
  relationshipHoroscopesApi,
  relationshipsApi,
  WEEKLY_HOROSCOPE_COST_CREDITS,
  type RelationshipHoroscopeDocument,
} from '../api';
import type {
  HoroscopeDisabledReason,
  UserCompositeChart,
} from '../../../shared/api/relationships';
import {
  composeHoroscopeHeadline,
  deriveTransitHighlights,
  formatHoroscopeDateRange,
  splitInterpretationParagraphs,
  type DerivedTransitHighlight,
  type HighlightNature,
} from '../utils/horoscopeFormat';
import { ensureCanAffordOrPaywall, presentPaywallIfInsufficient } from '../api/paywall';
import { SectionLabel } from './SectionLabel';

interface RelationshipHoroscopeTabProps {
  relationship: UserCompositeChart;
  partnerName: string;
  onUpdated: (relationship: UserCompositeChart) => void;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const SUPPORT_FILL = 'rgba(130, 200, 180, 0.12)';
const TENSION_FILL = 'rgba(232, 133, 107, 0.12)';
const FUSION_FILL = 'rgba(184, 160, 232, 0.12)';
const SUPPORT_COLOR = '#82C8B4';
const TENSION_COLOR = '#E8856B';
const FUSION_COLOR = '#B8A0E8';

function natureColors(nature: HighlightNature) {
  if (nature === 'support') return { color: SUPPORT_COLOR, fill: SUPPORT_FILL, label: 'Flowing' };
  if (nature === 'tension') return { color: TENSION_COLOR, fill: TENSION_FILL, label: 'Tension' };
  return { color: FUSION_COLOR, fill: FUSION_FILL, label: 'Fusion' };
}

function disabledReasonCopy(
  reason: HoroscopeDisabledReason | null | undefined
): { headline: string; body: string } | null {
  if (!reason) return null;
  if (reason === 'credit_deduction_failed') {
    return {
      headline: "Last week's forecast couldn't be generated.",
      body: 'We couldn\'t deduct the weekly credits. Add credits, then re-enable to resume.',
    };
  }
  if (reason === 'missing_charge_user') {
    return {
      headline: 'Horoscope generation is paused.',
      body: 'We need a billing source on this account before we can generate forecasts again.',
    };
  }
  return null;
}

type Navigation = StackNavigationProp<
  RelationshipRootParamList,
  'WeeklyRelationshipHoroscopeDetail'
>;

export function RelationshipHoroscopeTab({
  relationship,
  partnerName,
  onUpdated,
}: RelationshipHoroscopeTabProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<Navigation>();
  const [horoscope, setHoroscope] = useState<RelationshipHoroscopeDocument | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [toggleBusy, setToggleBusy] = useState(false);

  const compositeChartId = relationship._id;
  const horoscopeEnabled = relationship.horoscopeEnabled === true;
  const freeTrialUsed = relationship.horoscopeFreeTrialUsed === true;
  const disabledReason = relationship.horoscopeDisabledReason ?? null;
  const reasonCopy = disabledReasonCopy(disabledReason);

  const loadCurrent = useCallback(async () => {
    if (!compositeChartId) return;
    setState('loading');
    setError(null);
    try {
      const result = await relationshipHoroscopesApi.ensureCurrentRelationshipUnified(
        compositeChartId,
        'weekly'
      );
      setHoroscope(result);
      setState('ready');
    } catch (err: unknown) {
      if (
        presentPaywallIfInsufficient(err, {
          label: "get this week's forecast",
          cost: WEEKLY_HOROSCOPE_COST_CREDITS,
        })
      ) {
        setState('idle');
        return;
      }
      const message = err instanceof Error ? err.message : 'Could not load this week';
      setError(message);
      setState('error');
    }
  }, [compositeChartId]);

  useEffect(() => {
    if (horoscopeEnabled) {
      loadCurrent();
    } else {
      setHoroscope(null);
      setState('idle');
      setError(null);
    }
  }, [horoscopeEnabled, loadCurrent]);

  const applyEnabled = useCallback(
    async (next: boolean) => {
      if (toggleBusy) return;
      setToggleBusy(true);
      try {
        const response = await relationshipsApi.updateHoroscopeSettings(compositeChartId, next);
        onUpdated({
          ...relationship,
          horoscopeEnabled: response.relationship.horoscopeEnabled,
          horoscopeFreeTrialUsed: response.relationship.horoscopeFreeTrialUsed,
          horoscopeDisabledReason: response.relationship.horoscopeDisabledReason,
          horoscopeLastBillingFailureAt: response.relationship.horoscopeLastBillingFailureAt,
          horoscopeLastBillingFailureMessage: response.relationship.horoscopeLastBillingFailureMessage,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not update setting';
        setError(message);
      } finally {
        setToggleBusy(false);
      }
    },
    [compositeChartId, onUpdated, relationship, toggleBusy]
  );

  const setEnabled = useCallback(
    (next: boolean) => {
      // Turning on a paid week (free trial already used) routes through the
      // paywall when the user can't cover it, then enables automatically once
      // they buy. Turning off, or the free first week, is never gated.
      if (
        next &&
        freeTrialUsed &&
        !ensureCanAffordOrPaywall(WEEKLY_HOROSCOPE_COST_CREDITS, 'turn on weekly forecasts', () => {
          applyEnabled(true);
        })
      ) {
        return;
      }
      applyEnabled(next);
    },
    [applyEnabled, freeTrialUsed]
  );

  if (!horoscopeEnabled) {
    return (
      <View style={styles.root}>
        {reasonCopy ? (
          <View style={[styles.notice, { backgroundColor: TENSION_FILL, borderColor: TENSION_FILL }]}>
            <Text style={[styles.noticeHeadline, { color: TENSION_COLOR }]}>
              {reasonCopy.headline}
            </Text>
            <Text style={[styles.noticeBody, { color: colors.textMuted }]}>{reasonCopy.body}</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.promoCard,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <Text style={[styles.promoEyebrow, { color: colors.accent }]}>Weekly Horoscope</Text>
          <Text style={[styles.promoTitle, { color: colors.text }]}>
            See how the week's transits affect you and {partnerName}.
          </Text>
          <View style={styles.bulletList}>
            {[
              'Fresh forecast every Monday morning',
              'Transit-by-transit breakdown for your specific aspects',
              'Day-by-day highlights with Ask Iris follow-ups',
            ].map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                <Text style={[styles.bulletText, { color: colors.textMuted }]}>{bullet}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setEnabled(true)}
            disabled={toggleBusy}
            style={[styles.cta, { backgroundColor: colors.primary }]}
          >
            {toggleBusy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
                {freeTrialUsed ? 'Enable weekly horoscopes' : 'Try free this week'}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={[styles.ctaCost, { color: colors.textSubtle }]}>
            {freeTrialUsed
              ? `◆ ${WEEKLY_HOROSCOPE_COST_CREDITS}/week · Toggle off anytime`
              : `First week free · then ◆ ${WEEKLY_HOROSCOPE_COST_CREDITS}/week`}
          </Text>

          {error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  const headline = horoscope
    ? composeHoroscopeHeadline(horoscope.analysis?.keyThemes, '')
    : '';
  const paragraphs = splitInterpretationParagraphs(horoscope?.interpretation);
  const previewParagraph = paragraphs[0] ?? null;
  const dateRange = formatHoroscopeDateRange(horoscope?.startDate, horoscope?.endDate);
  const highlights = deriveTransitHighlights(horoscope?.analysis?.keyThemes, 3);

  return (
    <View style={styles.root}>
      <View style={styles.statusRow}>
        <View style={styles.statusCopy}>
          <SectionLabel>This Week</SectionLabel>
          {dateRange ? (
            <Text style={[styles.dateRange, { color: colors.textSubtle }]}>{dateRange}</Text>
          ) : null}
        </View>
        <View style={styles.toggleRow}>
          <Text style={[styles.costInline, { color: colors.textSubtle }]}>
            ◆ {WEEKLY_HOROSCOPE_COST_CREDITS}/week
          </Text>
          <Switch
            value={horoscopeEnabled}
            onValueChange={(next) => setEnabled(next)}
            disabled={toggleBusy}
          />
        </View>
      </View>

      {state === 'loading' && !horoscope ? (
        <View
          style={[
            styles.loadingCard,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Generating this week's forecast…
          </Text>
        </View>
      ) : null}

      {state === 'error' ? (
        <View
          style={[
            styles.loadingCard,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error ?? 'Could not load this week.'}
          </Text>
          <TouchableOpacity onPress={loadCurrent}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {horoscope ? (
        <View
          style={[
            styles.forecastCard,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          {headline ? (
            <Text style={[styles.headline, { color: colors.text }]}>{headline}.</Text>
          ) : null}
          {previewParagraph ? (
            <View style={styles.bodyBlock}>
              <Text
                style={[styles.body, { color: colors.textMuted }]}
                numberOfLines={4}
                ellipsizeMode="tail"
              >
                {previewParagraph}
              </Text>
            </View>
          ) : null}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('WeeklyRelationshipHoroscopeDetail', {
                compositeChartId,
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Read full forecast"
          >
            <Text style={[styles.expandToggle, { color: colors.primary }]}>
              Read full forecast →
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {highlights.length > 0 ? (
        <View style={styles.highlightsBlock}>
          <SectionLabel>Key days this week</SectionLabel>
          <View
            style={[
              styles.highlightsCard,
              { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
            ]}
          >
            {highlights.map((highlight, index) => (
              <HighlightRow
                key={highlight.key}
                highlight={highlight}
                isLast={index === highlights.length - 1}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

interface HighlightRowProps {
  highlight: DerivedTransitHighlight;
  isLast: boolean;
}

function HighlightRow({ highlight, isLast }: HighlightRowProps) {
  const { colors } = useTheme();
  const tint = natureColors(highlight.nature);
  return (
    <View
      style={[
        styles.highlightRow,
        !isLast && { borderBottomColor: colors.ghostBorder, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <View style={[styles.highlightStripe, { backgroundColor: tint.color }]} />
      <View style={styles.highlightCopy}>
        <View style={styles.highlightHeader}>
          {highlight.day ? (
            <Text style={[styles.highlightDay, { color: colors.text }]}>{highlight.day}</Text>
          ) : null}
          <View style={[styles.naturePill, { backgroundColor: tint.fill }]}>
            <Text style={[styles.natureText, { color: tint.color }]}>{tint.label}</Text>
          </View>
        </View>
        <Text style={[styles.highlightTransit, { color: colors.textMuted }]}>
          {highlight.transit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  notice: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  noticeHeadline: {
    fontSize: 13,
    fontWeight: '600',
  },
  noticeBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  promoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  promoEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  cta: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
  },
  ctaCost: {
    fontSize: 12,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusCopy: {
    gap: 2,
  },
  dateRange: {
    fontSize: 11,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  costInline: {
    fontSize: 11,
  },
  loadingCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  errorText: {
    fontSize: 12,
  },
  forecastCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  headline: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
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
  highlightsBlock: {
    gap: 10,
  },
  highlightsCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  highlightStripe: {
    width: 4,
    borderRadius: 2,
  },
  highlightCopy: {
    flex: 1,
    gap: 4,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightDay: {
    fontSize: 13,
    fontWeight: '600',
  },
  naturePill: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  natureText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  highlightTransit: {
    fontSize: 12,
    lineHeight: 18,
  },
});
