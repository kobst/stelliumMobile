import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import {
  relationshipHoroscopesApi,
  type RelationshipHoroscopeDocument,
} from '../api';
import {
  buildLensTransits,
  buildRelationshipKeyDays,
  buildTimelineBuckets,
  composeHoroscopeHeadline,
  flattenUnifiedTransitsForTimeline,
  formatExactMonthDay,
  formatHoroscopeDateRange,
  pickPrimaryMoonPhase,
  splitInterpretationParagraphs,
  type AspectNature,
  type DayBucket,
  type FullMoonSummary,
  type KeyDayRow,
  type LensTransitRow,
  type RelationshipTransitLens,
} from '../utils/horoscopeFormat';
import { CreditPill } from '../components/CreditPill';
import { AvatarPair } from '../components/AvatarPair';
import { getInitials, getRelationshipArchetypeLabel } from '../utils/mainShell';
import type { RelationshipRootParamList } from '../navigation/RootNavigator';

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
  Ascendant: 'AC',
  Midheaven: 'MC',
};

const ASPECT_GLYPHS: Record<string, string> = {
  conjunction: '☌',
  opposition: '☍',
  square: '□',
  trine: '△',
  sextile: '⚹',
  quincunx: '⊻',
};

const FALLBACK_HEADLINE = 'A week of shared weather';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type Props = StackScreenProps<
  RelationshipRootParamList,
  'WeeklyRelationshipHoroscopeDetail'
>;

function natureColors(
  nature: AspectNature,
  themeColors: ReturnType<typeof useTheme>['colors']
) {
  if (nature === 'support') {
    return { fg: themeColors.success, bg: 'rgba(76, 175, 125, 0.14)', label: 'Flowing' };
  }
  if (nature === 'tension') {
    return { fg: themeColors.error, bg: 'rgba(255, 180, 171, 0.14)', label: 'Tension' };
  }
  return { fg: themeColors.accent, bg: 'rgba(233, 195, 73, 0.14)', label: 'Dynamic' };
}

function planetGlyph(name: string | undefined | null): string {
  if (!name) return '';
  return PLANET_GLYPHS[name] ?? name.slice(0, 2);
}

function aspectGlyph(name: string | undefined | null): string {
  if (!name) return '';
  return ASPECT_GLYPHS[name.toLowerCase()] ?? '';
}

export const WeeklyRelationshipHoroscopeDetailScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const compositeChartId = route.params?.compositeChartId;

  const credits = useRelationshipAppStore((state) => state.credits);
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const relationship = useRelationshipAppStore((state) =>
    state.relationshipHistory.find((row) => row._id === compositeChartId) ?? null
  );

  const [horoscope, setHoroscope] = useState<RelationshipHoroscopeDocument | null>(null);
  const [past, setPast] = useState<RelationshipHoroscopeDocument[]>([]);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lens, setLens] = useState<RelationshipTransitLens>('between');

  const sides = useMemo(() => {
    if (!relationship) return null;
    const selfIsA = Boolean(selfProfileId) && relationship.userA_id === selfProfileId;
    const selfName = selfIsA ? relationship.userA_name : relationship.userB_name;
    const partnerName = selfIsA ? relationship.userB_name : relationship.userA_name;
    const selfPhoto = selfIsA
      ? relationship.userA_profilePhotoUrl ?? relationship.userA_photoUrl
      : relationship.userB_profilePhotoUrl ?? relationship.userB_photoUrl;
    const partnerPhoto = selfIsA
      ? relationship.userB_profilePhotoUrl ?? relationship.userB_photoUrl
      : relationship.userA_profilePhotoUrl ?? relationship.userA_photoUrl;
    return {
      selfIsA,
      selfName: selfName ?? 'You',
      partnerName: partnerName ?? 'Partner',
      selfPhotoUri: selfPhoto ?? null,
      partnerPhotoUri: partnerPhoto ?? null,
    };
  }, [relationship, selfProfileId]);

  const archetype = useMemo(
    () => (relationship ? getRelationshipArchetypeLabel(relationship) : null),
    [relationship]
  );

  const load = useCallback(async () => {
    if (!compositeChartId) return;
    setState('loading');
    setError(null);
    try {
      const [current, history] = await Promise.all([
        relationshipHoroscopesApi.ensureCurrentRelationshipUnified(compositeChartId, 'weekly'),
        relationshipHoroscopesApi
          .listRelationship(compositeChartId, { period: 'weekly', mode: 'unified', limit: 6 })
          .catch(() => [] as RelationshipHoroscopeDocument[]),
      ]);
      setHoroscope(current);
      // Drop the current week from past list — match by _id since startDate may be normalized differently.
      setPast(history.filter((row) => row._id !== current._id));
      setState('ready');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load this week';
      setError(message);
      setState('error');
    }
  }, [compositeChartId]);

  useEffect(() => {
    load();
  }, [load]);

  const headline = useMemo(() => {
    if (!horoscope) return FALLBACK_HEADLINE;
    return composeHoroscopeHeadline(horoscope.analysis?.keyThemes, FALLBACK_HEADLINE);
  }, [horoscope]);

  const dateRange = useMemo(
    () => formatHoroscopeDateRange(horoscope?.startDate, horoscope?.endDate),
    [horoscope]
  );

  const paragraphs = useMemo(
    () => splitInterpretationParagraphs(horoscope?.interpretation),
    [horoscope]
  );

  const { romanceTransits, moonPhases } = useMemo(
    () => flattenUnifiedTransitsForTimeline(horoscope?.transitData),
    [horoscope]
  );

  const timeline: DayBucket[] = useMemo(
    () =>
      buildTimelineBuckets({
        weekStartIso: horoscope?.startDate ?? null,
        romanceTransits,
        moonPhases,
      }),
    [horoscope?.startDate, romanceTransits, moonPhases]
  );

  const fullMoon: FullMoonSummary | null = useMemo(
    () => pickPrimaryMoonPhase(moonPhases),
    [moonPhases]
  );

  const lensTransits = useMemo(
    () =>
      buildLensTransits(
        horoscope,
        lens,
        sides?.selfIsA ? horoscope?.userAName : horoscope?.userBName,
        sides?.selfIsA ? horoscope?.userBName : horoscope?.userAName
      ),
    [horoscope, lens, sides?.selfIsA]
  );

  const keyDays = useMemo(() => buildRelationshipKeyDays(horoscope), [horoscope]);

  const handleAskIris = useCallback(() => {
    navigation.navigate('AskIris', {
      context: 'relationship',
      relationshipLabel: sides ? `You & ${sides.partnerName}` : undefined,
    });
  }, [navigation, sides]);

  if (!compositeChartId) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.errorBlock}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            We couldn't find that relationship.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} activeOpacity={0.7}>
          <Text style={[styles.backLabel, { color: colors.textMuted }]}>← Back</Text>
        </TouchableOpacity>
        <CreditPill balance={credits?.balance ?? null} onPress={() => {}} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {sides ? (
          <View style={styles.identityRow}>
            <AvatarPair
              leftPhotoUri={sides.selfPhotoUri}
              leftInitial={getInitials(sides.selfName) || 'Y'}
              rightPhotoUri={sides.partnerPhotoUri}
              rightInitial={getInitials(sides.partnerName) || 'P'}
              leftGradient="lavender"
              rightGradient="green"
              size={40}
              ringColor={colors.background}
            />
            <View style={styles.identityCopy}>
              <Text style={[styles.pairLabel, { color: colors.text }]}>
                You & {sides.partnerName}
              </Text>
              {archetype ? (
                <Text style={[styles.archetype, { color: colors.accent }]}>{archetype}</Text>
              ) : null}
            </View>
            {dateRange ? (
              <Text style={[styles.dateRange, { color: colors.textSubtle }]}>{dateRange}</Text>
            ) : null}
          </View>
        ) : null}

        <Text style={[styles.headline, { color: colors.text }]}>{headline}.</Text>

        {state === 'loading' && !horoscope ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Reading this week's transits…
            </Text>
          </View>
        ) : null}

        {state === 'error' ? (
          <View style={styles.errorBlock}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error ?? 'Something went wrong loading this forecast.'}
            </Text>
            <TouchableOpacity onPress={load} accessibilityRole="button">
              <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {horoscope ? (
          <>
            <TimelineStrip buckets={timeline} colors={colors} />

            <View
              style={[
                styles.readingCard,
                { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
              ]}
            >
              <Text style={[styles.cardEyebrow, { color: colors.accent }]}>The Reading</Text>
              {paragraphs.map((para, index) => (
                <Text
                  key={`para-${index}`}
                  style={[
                    styles.readingParagraph,
                    { color: colors.text, marginTop: index === 0 ? 0 : 12 },
                  ]}
                >
                  {para}
                </Text>
              ))}
            </View>

            {fullMoon ? <FullMoonCard summary={fullMoon} colors={colors} /> : null}

            <View style={styles.transitsBlock}>
              <Text style={[styles.sectionLabel, { color: colors.accent }]}>
                Week's Transits
              </Text>
              <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                The planetary interactions shaping your connection this week.
              </Text>

              <View
                style={[
                  styles.lensTabs,
                  { backgroundColor: colors.surfaceLow, borderColor: colors.ghostBorder },
                ]}
              >
                {(['between', 'composite'] as RelationshipTransitLens[]).map((option) => {
                  const active = lens === option;
                  const label = option === 'between' ? 'Between You' : 'The Relationship Itself';
                  return (
                    <TouchableOpacity
                      key={option}
                      activeOpacity={0.85}
                      onPress={() => setLens(option)}
                      style={[
                        styles.lensTab,
                        active && {
                          backgroundColor: colors.surface,
                          borderColor: colors.ghostBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.lensTabLabel,
                          { color: active ? colors.text : colors.textSubtle },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.lensCopy, { color: colors.textSubtle }]}>
                {lens === 'between'
                  ? `Transits hitting ${sides?.selfName ?? 'your'} and ${sides?.partnerName ?? "your partner's"} natal charts this week.`
                  : 'Transits activating the composite chart — what the relationship as an entity is experiencing.'}
              </Text>

              {lensTransits.length === 0 ? (
                <Text style={[styles.transitEmpty, { color: colors.textMuted }]}>
                  No major transits in this lens this week.
                </Text>
              ) : (
                <View
                  style={[
                    styles.transitList,
                    { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                  ]}
                >
                  {lensTransits.map((row, index) => (
                    <TransitRow
                      key={row.id}
                      row={row}
                      isLast={index === lensTransits.length - 1}
                      colors={colors}
                    />
                  ))}
                </View>
              )}
            </View>

            {keyDays.length > 0 ? (
              <View>
                <Text style={[styles.sectionLabel, { color: colors.accent }]}>Key Days</Text>
                <View
                  style={[
                    styles.keyDaysCard,
                    { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                  ]}
                >
                  {keyDays.map((day, index) => (
                    <KeyDayRowView
                      key={day.key}
                      day={day}
                      isLast={index === keyDays.length - 1}
                      colors={colors}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {past.length > 0 ? (
              <View>
                <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
                  Past Forecasts
                </Text>
                <View
                  style={[
                    styles.pastList,
                    { backgroundColor: colors.surfaceLow, borderColor: colors.ghostBorder },
                  ]}
                >
                  {past.map((row, index) => (
                    <PastForecastRow
                      key={row._id}
                      row={row}
                      isLast={index === past.length - 1}
                      colors={colors}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAskIris}
              style={[
                styles.askCard,
                { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
              ]}
            >
              <View style={[styles.askGlyph, { backgroundColor: 'rgba(76, 175, 125, 0.12)' }]}>
                <Text style={[styles.askGlyphText, { color: colors.success }]}>✦</Text>
              </View>
              <View style={styles.askCopy}>
                <Text style={[styles.askTitle, { color: colors.text }]}>Ask about this week</Text>
                <Text style={[styles.askSub, { color: colors.textMuted }]}>
                  ◆ 1 per question
                </Text>
              </View>
              <Text style={[styles.askChevron, { color: colors.textSubtle }]}>›</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

interface TimelineStripProps {
  buckets: DayBucket[];
  colors: ReturnType<typeof useTheme>['colors'];
}

function TimelineStrip({ buckets, colors }: TimelineStripProps) {
  return (
    <View
      style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.ghostBorder }]}
    >
      <View style={styles.timelineRow}>
        {buckets.map((bucket) => {
          const hasTension = bucket.natures.includes('tension');
          const hasSupport = bucket.natures.includes('support');
          const hasFusion = bucket.natures.includes('fusion');
          const hasEvent = bucket.hasMoon || hasTension || hasSupport || hasFusion;
          return (
            <View key={bucket.index} style={styles.timelineCell}>
              <View style={styles.timelineDots}>
                {bucket.hasMoon ? (
                  <View
                    style={[
                      styles.timelineMoon,
                      { borderColor: colors.accent, backgroundColor: 'rgba(233, 195, 73, 0.18)' },
                    ]}
                  >
                    <Text style={[styles.timelineMoonGlyph, { color: colors.accent }]}>☽</Text>
                  </View>
                ) : null}
                {!bucket.hasMoon && hasEvent ? (
                  <View style={styles.dotRow}>
                    {hasTension ? (
                      <View style={[styles.timelineDot, { backgroundColor: colors.error }]} />
                    ) : null}
                    {hasSupport ? (
                      <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
                    ) : null}
                    {hasFusion ? (
                      <View style={[styles.timelineDot, { backgroundColor: colors.accent }]} />
                    ) : null}
                  </View>
                ) : null}
                {!hasEvent ? (
                  <View
                    style={[
                      styles.timelineDot,
                      styles.timelineDotMuted,
                      { backgroundColor: colors.textSubtle },
                    ]}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.timelineDay,
                  { color: hasEvent ? colors.text : colors.textSubtle, fontWeight: hasEvent ? '600' : '500' },
                ]}
              >
                {bucket.label}
              </Text>
              {bucket.dayOfMonth !== null ? (
                <Text style={[styles.timelineDate, { color: colors.textSubtle }]}>
                  {bucket.dayOfMonth}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={[styles.timelineLegend, { borderTopColor: colors.ghostBorder }]}>
        <LegendItem dotColor={colors.success} label="Flowing" colors={colors} />
        <LegendItem dotColor={colors.error} label="Tension" colors={colors} />
        <LegendItem dotColor={colors.accent} label="Moon" outline colors={colors} />
      </View>
    </View>
  );
}

interface LegendItemProps {
  dotColor: string;
  label: string;
  outline?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

function LegendItem({ dotColor, label, outline, colors }: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          outline ? { borderWidth: 1, borderColor: dotColor } : { backgroundColor: dotColor },
        ]}
      />
      <Text style={[styles.legendLabel, { color: colors.textSubtle }]}>{label}</Text>
    </View>
  );
}

interface TransitRowProps {
  row: LensTransitRow;
  isLast: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

function TransitRow({ row, isLast, colors }: TransitRowProps) {
  const palette = natureColors(row.nature, colors);
  const exact = formatExactMonthDay(row.exact);
  const ownerLabel = row.owner ? `${row.owner}'s ` : 'Composite ';
  return (
    <View
      style={[
        styles.transitRow,
        !isLast ? { borderBottomColor: colors.ghostBorder, borderBottomWidth: 1 } : null,
      ]}
    >
      <View style={[styles.transitAccent, { backgroundColor: palette.fg }]} />
      <View style={styles.transitBody}>
        <View style={styles.transitGlyphRow}>
          <Text style={[styles.transitGlyphText, { color: palette.fg }]}>
            {planetGlyph(row.transitingPlanet)}
          </Text>
          <Text style={[styles.transitAspectGlyph, { color: colors.textSubtle }]}>
            {aspectGlyph(row.aspect) || (row.aspect ?? '').toLowerCase()}
          </Text>
          <Text
            style={[
              styles.transitGlyphText,
              { color: row.owner ? colors.primary : colors.accent },
            ]}
          >
            {planetGlyph(row.targetPlanet)}
          </Text>
          <View style={[styles.naturePill, { backgroundColor: palette.bg }]}>
            <Text style={[styles.naturePillText, { color: palette.fg }]}>{palette.label}</Text>
          </View>
        </View>
        <Text style={[styles.transitName, { color: colors.text }]}>
          {row.transitingPlanet}{' '}
          <Text style={{ color: colors.textMuted, fontWeight: '400' }}>
            {(row.aspect ?? '').toLowerCase()}{' '}
          </Text>
          {ownerLabel}
          {row.targetPlanet}
        </Text>
        <Text style={[styles.transitMeta, { color: colors.textSubtle }]}>
          {exact ? `Exact ${exact}` : ''}
          {exact && row.speed ? ' · ' : ''}
          {capitalize(row.speed)}
        </Text>
      </View>
    </View>
  );
}

interface FullMoonCardProps {
  summary: FullMoonSummary;
  colors: ReturnType<typeof useTheme>['colors'];
}

function FullMoonCard({ summary, colors }: FullMoonCardProps) {
  const dateLabel = formatExactMonthDay(summary.exactIso);
  const titleParts = [summary.phase, summary.sign ? `in ${summary.sign}` : ''].filter(Boolean);
  const title = titleParts.join(' ');
  const natal = summary.natalAspect
    ? `${capitalize(summary.natalAspect.aspect)} your composite ${summary.natalAspect.planet}`
    : null;
  return (
    <View
      style={[
        styles.moonCard,
        { backgroundColor: 'rgba(233, 195, 73, 0.10)', borderColor: 'rgba(233, 195, 73, 0.28)' },
      ]}
    >
      <View style={[styles.moonGlyphCircle, { backgroundColor: colors.accent }]}>
        <Text style={styles.moonGlyph}>☽</Text>
      </View>
      <View style={styles.moonBody}>
        <Text style={[styles.moonDate, { color: colors.accent }]}>{dateLabel}</Text>
        <Text style={[styles.moonTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.moonDescription, { color: colors.textMuted }]}>
          {natal ? `${natal}. ` : ''}
          {summary.description ?? ''}
        </Text>
      </View>
    </View>
  );
}

interface KeyDayRowProps {
  day: KeyDayRow;
  isLast: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

function KeyDayRowView({ day, isLast, colors }: KeyDayRowProps) {
  const palette = natureColors(day.nature, colors);
  return (
    <View
      style={[
        styles.keyDayRow,
        !isLast ? { borderBottomColor: colors.ghostBorder, borderBottomWidth: 1 } : null,
      ]}
    >
      <View style={[styles.keyDayAccent, { backgroundColor: palette.fg }]} />
      <View style={styles.keyDayBody}>
        <View style={styles.keyDayHeader}>
          {day.weekday ? (
            <Text style={[styles.keyDayWeekday, { color: colors.text }]}>{day.weekday}</Text>
          ) : null}
          <Text style={[styles.keyDayDate, { color: colors.textSubtle }]}>{day.monthDay}</Text>
        </View>
        <Text style={[styles.keyDayDesc, { color: colors.textMuted }]}>{day.description}</Text>
      </View>
    </View>
  );
}

interface PastForecastRowProps {
  row: RelationshipHoroscopeDocument;
  isLast: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

function PastForecastRow({ row, isLast, colors }: PastForecastRowProps) {
  const range = formatHoroscopeDateRange(row.startDate, row.endDate);
  const headline = composeHoroscopeHeadline(row.analysis?.keyThemes, '');
  const fallback = (row.interpretation ?? '')
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .find(Boolean)
    ?.slice(0, 140);
  const subtitle = headline || fallback || 'Saved forecast';
  return (
    <View
      style={[
        styles.pastRow,
        !isLast ? { borderBottomColor: colors.ghostBorder, borderBottomWidth: 1 } : null,
      ]}
    >
      <View style={styles.pastBody}>
        {range ? <Text style={[styles.pastRange, { color: colors.textSubtle }]}>{range}</Text> : null}
        <Text style={[styles.pastHeadline, { color: colors.textMuted }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function capitalize(input: string | undefined | null): string {
  if (!input) return '';
  return input.charAt(0).toUpperCase() + input.slice(1);
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backLabel: { fontSize: 14, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingBottom: 48, gap: 20 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identityCopy: { flex: 1, gap: 2 },
  pairLabel: { fontSize: 16, fontWeight: '700' },
  archetype: { fontSize: 12, fontStyle: 'italic' },
  dateRange: { fontSize: 11 },
  headline: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  loadingBlock: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  loadingText: { fontSize: 13 },
  errorBlock: { gap: 6, padding: 20 },
  errorText: { fontSize: 13 },
  retryText: { fontSize: 13, fontWeight: '600' },
  timelineCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineCell: { flex: 1, alignItems: 'center', gap: 6 },
  timelineDots: { height: 22, alignItems: 'center', justifyContent: 'center' },
  dotRow: { flexDirection: 'row', gap: 3 },
  timelineDot: { width: 7, height: 7, borderRadius: 4 },
  timelineDotMuted: { opacity: 0.4, width: 5, height: 5 },
  timelineMoon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineMoonGlyph: { fontSize: 10 },
  timelineDay: { fontSize: 10 },
  timelineDate: { fontSize: 9 },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 4 },
  legendLabel: { fontSize: 9 },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  readingCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 8 },
  readingParagraph: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  moonCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  moonGlyphCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonGlyph: { fontSize: 20, color: '#1a1530' },
  moonBody: { flex: 1, gap: 4 },
  moonDate: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  moonTitle: { fontSize: 16, fontWeight: '700' },
  moonDescription: { fontSize: 12, lineHeight: 17 },
  transitsBlock: { gap: 10 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionHint: { fontSize: 12, marginTop: -4 },
  lensTabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  lensTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  lensTabLabel: { fontSize: 12, fontWeight: '600' },
  lensCopy: { fontSize: 12, fontStyle: 'italic' },
  transitEmpty: {
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 12,
  },
  transitList: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 16 },
  transitRow: { flexDirection: 'row', paddingVertical: 14, gap: 12 },
  transitAccent: { width: 3, borderRadius: 2 },
  transitBody: { flex: 1, gap: 4 },
  transitGlyphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  transitGlyphText: { fontSize: 16, fontWeight: '600' },
  transitAspectGlyph: { fontSize: 12 },
  naturePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  naturePillText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transitName: { fontSize: 13 },
  transitMeta: { fontSize: 11 },
  keyDaysCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginTop: 8 },
  keyDayRow: { flexDirection: 'row', paddingVertical: 12, gap: 12 },
  keyDayAccent: { width: 3, borderRadius: 2 },
  keyDayBody: { flex: 1, gap: 4 },
  keyDayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keyDayWeekday: { fontSize: 13, fontWeight: '600' },
  keyDayDate: { fontSize: 10 },
  keyDayDesc: { fontSize: 12, lineHeight: 17 },
  pastList: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, marginTop: 8 },
  pastRow: { paddingVertical: 14 },
  pastBody: { gap: 4 },
  pastRange: { fontSize: 10 },
  pastHeadline: { fontSize: 13, lineHeight: 18 },
  askCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  askGlyph: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askGlyphText: { fontSize: 16 },
  askCopy: { flex: 1, gap: 2 },
  askTitle: { fontSize: 14, fontWeight: '600' },
  askSub: { fontSize: 11 },
  askChevron: { fontSize: 18 },
});
