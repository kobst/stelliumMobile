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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import {
  relationshipHoroscopesApi,
  type MoonPhase,
  type RomanceHoroscopeDocument,
  type RomanceTransit,
  type TransitToTransitAspect,
} from '../api';
import {
  buildTimelineBuckets,
  classifyAspect,
  composeHoroscopeHeadline,
  derivePlanetActivity,
  formatExactMonthDay,
  formatHoroscopeDateRange,
  formatSkyPatternLabel,
  getPlanetSpeed,
  pickPrimaryMoonPhase,
  splitInterpretationParagraphs,
  transitInvolvesPlanet,
  type AspectNature,
  type DayBucket,
  type FullMoonSummary,
  type PlanetActivity,
} from '../utils/horoscopeFormat';
import { CreditPill } from '../components/CreditPill';
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

const FALLBACK_HEADLINE = 'Your weekly love forecast';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type Navigation = StackNavigationProp<RelationshipRootParamList, 'WeeklyHoroscopeDetail'>;

function natureColors(nature: AspectNature, themeColors: ReturnType<typeof useTheme>['colors']) {
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

export const WeeklyHoroscopeDetailScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { colors } = useTheme();
  const userId = useRelationshipAppStore((state) => state.profile?.id ?? null);
  const credits = useRelationshipAppStore((state) => state.credits);

  const [horoscope, setHoroscope] = useState<RomanceHoroscopeDocument | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

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

  const romanceTransits: RomanceTransit[] = useMemo(
    () =>
      horoscope?.components?.romanceTransits ??
      horoscope?.transitData?.romanceTransits ??
      [],
    [horoscope]
  );

  const moonPhases: MoonPhase[] = useMemo(
    () => horoscope?.components?.moonPhases ?? [],
    [horoscope]
  );

  const skyPatterns: TransitToTransitAspect[] = useMemo(
    () => horoscope?.components?.transitToTransitAspects ?? [],
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

  const planetActivity: PlanetActivity[] = useMemo(
    () => derivePlanetActivity(romanceTransits),
    [romanceTransits]
  );

  const filteredTransits = useMemo(() => {
    if (!selectedPlanet) return romanceTransits;
    return romanceTransits.filter((t) => transitInvolvesPlanet(t, selectedPlanet));
  }, [romanceTransits, selectedPlanet]);

  const fullMoon: FullMoonSummary | null = useMemo(() => pickPrimaryMoonPhase(moonPhases), [moonPhases]);

  const handlePlanetTap = useCallback((name: string) => {
    setSelectedPlanet((prev) => (prev === name ? null : name));
  }, []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} activeOpacity={0.7}>
          <Text style={[styles.backLabel, { color: colors.textMuted }]}>← Home</Text>
        </TouchableOpacity>
        <CreditPill balance={credits?.balance ?? null} onPress={() => {}} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <View style={styles.eyebrowRow}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>Your Week in Love</Text>
            {dateRange ? (
              <Text style={[styles.dateRange, { color: colors.textSubtle }]}>{dateRange}</Text>
            ) : null}
          </View>
          <Text style={[styles.headline, { color: colors.text }]}>{headline}.</Text>
        </View>

        {state === 'loading' && !horoscope ? (
          <View style={styles.loadingBlock}>
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
            <TimelineStrip buckets={timeline} colors={colors} />

            {planetActivity.length > 0 ? (
              <View style={styles.planetSection}>
                <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
                  Your planets this week
                </Text>
                <View style={styles.planetRow}>
                  {planetActivity.map((entry) => (
                    <PlanetTile
                      key={entry.planet}
                      activity={entry}
                      selected={selectedPlanet === entry.planet}
                      onPress={() => handlePlanetTap(entry.planet)}
                      colors={colors}
                    />
                  ))}
                </View>
                <View style={styles.filterIndicator}>
                  {selectedPlanet ? (
                    <View style={styles.filterRow}>
                      <Text style={[styles.filterText, { color: colors.primary }]}>
                        {filteredTransits.length} transit
                        {filteredTransits.length !== 1 ? 's' : ''} involving {selectedPlanet}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedPlanet(null)} hitSlop={8}>
                        <Text style={[styles.filterClear, { color: colors.textMuted }]}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={[styles.filterHint, { color: colors.textMuted }]}>
                      Tap a planet to filter · {romanceTransits.length} transits total
                    </Text>
                  )}
                </View>
              </View>
            ) : null}

            <View style={[styles.readingCard, { backgroundColor: colors.surface, borderColor: colors.ghostBorder }]}>
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

            {romanceTransits.length > 0 ? (
              <View>
                <Text style={[styles.sectionLabel, styles.sectionLabelGold, { color: colors.accent }]}>
                  Romance Transits
                </Text>
                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                  {selectedPlanet
                    ? `Filtered to transits involving ${selectedPlanet}.`
                    : 'Active transits to your natal chart this week.'}
                </Text>
                <View style={[styles.transitList, { backgroundColor: colors.surface, borderColor: colors.ghostBorder }]}>
                  {filteredTransits.length === 0 ? (
                    <Text style={[styles.transitEmpty, { color: colors.textMuted }]}>
                      No romance transits for {selectedPlanet}
                    </Text>
                  ) : (
                    filteredTransits.map((transit, index) => (
                      <TransitRow
                        key={`${transit.transitingPlanet}-${transit.aspect}-${transit.targetPlanet}-${index}`}
                        transit={transit}
                        colors={colors}
                        selectedPlanet={selectedPlanet}
                        isLast={index === filteredTransits.length - 1}
                      />
                    ))
                  )}
                </View>
              </View>
            ) : null}

            {skyPatterns.length > 0 ? (
              <View>
                <Text style={[styles.sectionLabel, { color: colors.textSubtle }]}>
                  Background Sky Patterns
                </Text>
                <View style={[styles.skyList, { backgroundColor: colors.surface, borderColor: colors.ghostBorder }]}>
                  {skyPatterns.map((aspect, index) => (
                    <SkyPatternRow
                      key={`${aspect.transitingPlanet}-${aspect.aspect}-${aspect.targetPlanet}-${index}`}
                      aspect={aspect}
                      isLast={index === skyPatterns.length - 1}
                      colors={colors}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

interface PlanetTileProps {
  activity: PlanetActivity;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function PlanetTile({ activity, selected, onPress, colors }: PlanetTileProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.planetTile,
        {
          backgroundColor: selected ? 'rgba(202, 190, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
          borderColor: selected ? colors.primary : colors.ghostBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.planetGlyph,
          { color: selected ? colors.primary : colors.textMuted },
        ]}
      >
        {planetGlyph(activity.planet)}
      </Text>
      <Text
        style={[
          styles.planetName,
          { color: selected ? colors.text : colors.textMuted, fontWeight: selected ? '700' : '500' },
        ]}
      >
        {activity.planet}
      </Text>
      <Text style={[styles.planetCount, { color: selected ? colors.primary : colors.textSubtle }]}>
        {activity.count}
      </Text>
    </TouchableOpacity>
  );
}

interface TimelineStripProps {
  buckets: DayBucket[];
  colors: ReturnType<typeof useTheme>['colors'];
}

function TimelineStrip({ buckets, colors }: TimelineStripProps) {
  return (
    <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.ghostBorder }]}>
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
                <Text style={[styles.timelineDate, { color: colors.textSubtle }]}>{bucket.dayOfMonth}</Text>
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
          outline
            ? { borderWidth: 1, borderColor: dotColor }
            : { backgroundColor: dotColor },
        ]}
      />
      <Text style={[styles.legendLabel, { color: colors.textSubtle }]}>{label}</Text>
    </View>
  );
}

interface TransitRowProps {
  transit: RomanceTransit;
  isLast: boolean;
  selectedPlanet: string | null;
  colors: ReturnType<typeof useTheme>['colors'];
}

function TransitRow({ transit, isLast, selectedPlanet, colors }: TransitRowProps) {
  const nature = classifyAspect(transit.aspect);
  const palette = natureColors(nature, colors);
  const speed = getPlanetSpeed(transit.transitingPlanet);
  const exact = formatExactMonthDay(transit.exact);
  const transitingIsTarget = selectedPlanet === transit.transitingPlanet;
  const natalIsTarget = selectedPlanet === transit.targetPlanet;
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
          <Text
            style={[
              styles.transitGlyphText,
              { color: selectedPlanet && transitingIsTarget ? colors.primary : palette.fg },
            ]}
          >
            {planetGlyph(transit.transitingPlanet)}
          </Text>
          <Text style={[styles.transitAspectGlyph, { color: colors.textSubtle }]}>
            {aspectGlyph(transit.aspect) || (transit.aspect ?? '').toLowerCase()}
          </Text>
          <Text
            style={[
              styles.transitGlyphText,
              { color: selectedPlanet && natalIsTarget ? colors.primary : colors.text },
            ]}
          >
            {planetGlyph(transit.targetPlanet)}
          </Text>
          <View style={[styles.naturePill, { backgroundColor: palette.bg }]}>
            <Text style={[styles.naturePillText, { color: palette.fg }]}>{palette.label}</Text>
          </View>
        </View>
        <Text style={[styles.transitName, { color: colors.text }]}>
          <Text
            style={{
              color: selectedPlanet && transitingIsTarget ? colors.primary : colors.text,
              fontWeight: selectedPlanet && transitingIsTarget ? '700' : '600',
            }}
          >
            {transit.transitingPlanet}
          </Text>
          <Text style={{ color: colors.textMuted, fontWeight: '400' }}>
            {' '}
            {(transit.aspect ?? '').toLowerCase()}{' '}
          </Text>
          <Text
            style={{
              color: selectedPlanet && natalIsTarget ? colors.primary : colors.text,
              fontWeight: selectedPlanet && natalIsTarget ? '700' : '600',
            }}
          >
            {transit.targetPlanet}
          </Text>
        </Text>
        <Text style={[styles.transitMeta, { color: colors.textSubtle }]}>
          {transit.transitingSign ? `${transit.transitingSign} · ` : ''}
          {transit.transitingHouse ? `${ordinal(transit.transitingHouse)} house → ` : ''}
          {transit.targetSign ? `${transit.targetSign}` : ''}
          {transit.targetHouse ? ` · ${ordinal(transit.targetHouse)} house` : ''}
        </Text>
        <Text style={[styles.transitMetaSecondary, { color: colors.textSubtle }]}>
          {exact ? `Exact ${exact}` : ''}
          {exact && speed ? ' · ' : ''}
          {speed}
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
    ? `${capitalize(summary.natalAspect.aspect)} your natal ${summary.natalAspect.planet}`
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

interface SkyPatternRowProps {
  aspect: TransitToTransitAspect;
  isLast: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

function SkyPatternRow({ aspect, isLast, colors }: SkyPatternRowProps) {
  const label = formatSkyPatternLabel(aspect);
  return (
    <View
      style={[
        styles.skyRow,
        !isLast ? { borderBottomColor: colors.ghostBorder, borderBottomWidth: 1 } : null,
      ]}
    >
      <View style={[styles.skyDot, { backgroundColor: colors.textSubtle }]} />
      <View style={styles.skyBody}>
        <Text style={[styles.skyLabel, { color: colors.textMuted }]}>{label}</Text>
        {aspect.description ? (
          <Text style={[styles.skySub, { color: colors.textSubtle }]}>{aspect.description}</Text>
        ) : null}
      </View>
    </View>
  );
}

function ordinal(n: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]}`;
}

function capitalize(input: string): string {
  if (!input) return '';
  return input.charAt(0).toUpperCase() + input.slice(1);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 20,
  },
  headerBlock: {
    gap: 8,
  },
  eyebrowRow: {
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
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  loadingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
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
  timelineCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  timelineDots: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
  },
  timelineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  timelineDotMuted: {
    opacity: 0.4,
    width: 5,
    height: 5,
  },
  timelineMoon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineMoonGlyph: {
    fontSize: 10,
  },
  timelineDay: {
    fontSize: 10,
  },
  timelineDate: {
    fontSize: 9,
  },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 9,
  },
  planetSection: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionLabelGold: {
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  planetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  planetTile: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  planetGlyph: {
    fontSize: 18,
  },
  planetName: {
    fontSize: 9,
  },
  planetCount: {
    fontSize: 9,
  },
  filterIndicator: {
    minHeight: 18,
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterClear: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  filterHint: {
    fontSize: 11,
  },
  readingCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  readingParagraph: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
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
  moonGlyph: {
    fontSize: 20,
    color: '#1a1530',
  },
  moonBody: {
    flex: 1,
    gap: 4,
  },
  moonDate: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  moonTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  moonDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  transitList: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  transitEmpty: {
    paddingVertical: 24,
    textAlign: 'center',
    fontSize: 12,
  },
  transitRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    gap: 12,
  },
  transitAccent: {
    width: 3,
    borderRadius: 2,
  },
  transitBody: {
    flex: 1,
    gap: 4,
  },
  transitGlyphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  transitGlyphText: {
    fontSize: 16,
    fontWeight: '600',
  },
  transitAspectGlyph: {
    fontSize: 12,
  },
  naturePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  naturePillText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transitName: {
    fontSize: 13,
  },
  transitMeta: {
    fontSize: 11,
  },
  transitMetaSecondary: {
    fontSize: 11,
  },
  skyList: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  skyRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 10,
  },
  skyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  skyBody: {
    flex: 1,
    gap: 2,
  },
  skyLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  skySub: {
    fontSize: 11,
    lineHeight: 15,
  },
});
