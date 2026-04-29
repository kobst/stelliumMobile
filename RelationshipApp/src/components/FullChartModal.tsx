import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { RelationshipTheme } from '../theme';
import { ChartWheel } from '../../../shared/components/chart/ChartWheel';
import { SynastryWheel } from '../../../shared/components/chart/SynastryWheel';
import type {
  BackendPlanet,
  BirthChart,
  ChartColorTokens,
} from '../../../shared/components/chart/chartTypes';

const SUPPORT_COLOR = '#82C8B4';
const CHALLENGE_COLOR = '#E8856B';
const NEUTRAL_LINE_COLOR = 'rgba(202, 190, 255, 0.55)';
const COMPOSITE_GOLD = '#D4A843';

type ChartMode = 'synastry' | 'composite';

const HARMONIOUS = new Set(['trine', 'sextile']);
const HARD = new Set(['square', 'opposition', 'quincunx']);

function aspectColor(aspectType?: string): string {
  if (!aspectType) return NEUTRAL_LINE_COLOR;
  const a = aspectType.toLowerCase();
  if (HARMONIOUS.has(a)) return SUPPORT_COLOR;
  if (HARD.has(a)) return CHALLENGE_COLOR;
  return NEUTRAL_LINE_COLOR;
}

function isDashedAspect(aspectType?: string): boolean {
  if (!aspectType) return false;
  const a = aspectType.toLowerCase();
  return HARD.has(a);
}

interface FullChartModalProps {
  visible: boolean;
  onClose: () => void;
  colors: RelationshipTheme['colors'];
  personAName: string;
  personBName: string;
  personABirthChart?: BirthChart | null;
  personBBirthChart?: BirthChart | null;
  compositeChart?: any;
  synastryAspects?: any[];
}

export function FullChartModal({
  visible,
  onClose,
  colors,
  personAName,
  personBName,
  personABirthChart,
  personBBirthChart,
  compositeChart,
  synastryAspects,
}: FullChartModalProps) {
  const [mode, setMode] = useState<ChartMode>('synastry');

  const synastryAvailable =
    Array.isArray(personABirthChart?.planets) &&
    Array.isArray(personBBirthChart?.planets);
  const compositeAvailable = Array.isArray(compositeChart?.planets);

  const chartColors: ChartColorTokens = {
    surface: colors.surface,
    border: colors.ghostBorder,
    onSurface: colors.text,
    onSurfaceVariant: colors.textMuted,
  };

  const compositeBirthChart: BirthChart | null = compositeAvailable
    ? {
        planets: (compositeChart?.planets ?? []).map((p: any): BackendPlanet => ({
          name: p?.name,
          full_degree: typeof p?.full_degree === 'number' ? p.full_degree : 0,
          norm_degree: typeof p?.norm_degree === 'number' ? p.norm_degree : undefined,
          sign: typeof p?.sign === 'string' ? p.sign : null,
          house: typeof p?.house === 'number' ? p.house : undefined,
          is_retro: false,
        })),
        houses: (compositeChart?.houses ?? []).map((h: any) => ({
          house:
            typeof h?.house === 'number'
              ? h.house
              : Number.parseInt(String(h?.house ?? ''), 10) || 0,
          degree: typeof h?.degree === 'number' ? h.degree : 0,
          sign: typeof h?.sign === 'string' ? h.sign : undefined,
        })),
        aspects: Array.isArray(compositeChart?.aspects) ? compositeChart.aspects : [],
      }
    : null;

  const aspectsForList: Array<{
    p1: string;
    p2: string;
    type: string;
    color: string;
    p1Color: string;
    p2Color: string;
  }> = (() => {
    if (mode === 'synastry') {
      if (!Array.isArray(synastryAspects)) return [];
      return synastryAspects
        .slice()
        .sort((a: any, b: any) => (a?.orb ?? 99) - (b?.orb ?? 99))
        .map((a: any) => ({
          p1: String(a?.planet1 ?? ''),
          p2: String(a?.planet2 ?? ''),
          type: String(a?.aspectType ?? ''),
          color: aspectColor(a?.aspectType),
          p1Color: colors.primary,
          p2Color: SUPPORT_COLOR,
        }))
        .filter((a) => a.p1 && a.p2 && a.type);
    }
    const composedAspects = compositeChart?.aspects;
    if (!Array.isArray(composedAspects)) return [];
    return composedAspects
      .slice()
      .sort((a: any, b: any) => (a?.orb ?? 99) - (b?.orb ?? 99))
      .map((a: any) => ({
        p1: String(a?.aspectingPlanet ?? a?.planet1 ?? ''),
        p2: String(a?.aspectedPlanet ?? a?.planet2 ?? ''),
        type: String(a?.aspectType ?? ''),
        color: aspectColor(a?.aspectType),
        p1Color: COMPOSITE_GOLD,
        p2Color: COMPOSITE_GOLD,
      }))
      .filter((a) => a.p1 && a.p2 && a.type);
  })();

  const compositePlanetColor = (_p: BackendPlanet, _idx: number): string | undefined =>
    COMPOSITE_GOLD;

  const renderChart = () => {
    if (mode === 'synastry') {
      if (!synastryAvailable || !personABirthChart || !personBBirthChart) {
        return (
          <View style={[styles.chartFallback, { borderColor: colors.ghostBorder }]}>
            <Text style={[styles.fallbackText, { color: colors.textMuted }]}>
              Synastry chart isn't available for this relationship yet.
            </Text>
          </View>
        );
      }
      return (
        <SynastryWheel
          personA={personABirthChart}
          personB={personBBirthChart}
          synastryAspects={synastryAspects ?? []}
          colors={chartColors}
          size={320}
          planetAColor={colors.primary}
          planetBColor={SUPPORT_COLOR}
        />
      );
    }
    if (!compositeBirthChart) {
      return (
        <View style={[styles.chartFallback, { borderColor: colors.ghostBorder }]}>
          <Text style={[styles.fallbackText, { color: colors.textMuted }]}>
            Composite chart isn't available for this relationship yet.
          </Text>
        </View>
      );
    }
    return (
      <ChartWheel
        birthChart={compositeBirthChart}
        size={320}
        colors={chartColors}
        getPlanetColor={compositePlanetColor}
        getAspectStyle={(aspectType) => ({
          color: aspectColor(aspectType),
          dashed: isDashedAspect(aspectType),
        })}
        frameless
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: HEADER_TOP_INSET }]}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Text style={[styles.backText, { color: colors.text }]}>← Back</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Full Chart</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Identity row */}
          <View style={styles.identityRow}>
            <View style={styles.identityChip}>
              <View
                style={[
                  styles.identityDot,
                  { backgroundColor: colors.primary },
                ]}
              />
              <Text style={[styles.identityName, { color: colors.primary }]}>
                {personAName}
              </Text>
            </View>
            <Text style={[styles.identitySep, { color: colors.textSubtle }]}>&</Text>
            <View style={styles.identityChip}>
              <View
                style={[
                  styles.identityDot,
                  { backgroundColor: SUPPORT_COLOR },
                ]}
              />
              <Text style={[styles.identityName, { color: SUPPORT_COLOR }]}>
                {personBName}
              </Text>
            </View>
          </View>

          {/* Mode toggle */}
          <View
            style={[
              styles.toggleRow,
              { backgroundColor: 'rgba(255,255,255,0.03)' },
            ]}
          >
            {(['synastry', 'composite'] as ChartMode[]).map((m) => {
              const active = mode === m;
              const label = m === 'synastry' ? 'Synastry' : 'Composite';
              const subtitle = m === 'synastry' ? 'Between you' : 'The relationship';
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  style={({ pressed }) => [
                    styles.toggleButton,
                    {
                      backgroundColor: active ? colors.surface : 'transparent',
                      borderColor: active ? colors.ghostBorder : 'transparent',
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleLabel,
                      { color: active ? colors.text : colors.textSubtle },
                    ]}
                  >
                    {label}
                  </Text>
                  <Text
                    style={[
                      styles.toggleSubtitle,
                      { color: active ? colors.textMuted : colors.textSubtle },
                    ]}
                  >
                    {subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Chart */}
          <View style={styles.chartFrame}>{renderChart()}</View>

          {/* Legend */}
          <View
            style={[
              styles.legendCard,
              { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
            ]}
          >
            <Text style={[styles.legendEyebrow, { color: colors.textSubtle }]}>Legend</Text>
            <View style={styles.legendRingRow}>
              {mode === 'synastry' ? (
                <>
                  <LegendChip color={colors.primary} label={`${personAName}'s planets`} />
                  <LegendChip color={SUPPORT_COLOR} label={`${personBName}'s planets`} />
                </>
              ) : (
                <LegendChip color={COMPOSITE_GOLD} label="Composite planets" />
              )}
            </View>

            <View style={[styles.legendDivider, { backgroundColor: colors.ghostBorder }]} />

            <Text style={[styles.legendEyebrow, { color: colors.textSubtle }]}>
              Aspect Lines
            </Text>
            <View style={styles.legendAspectRow}>
              <LegendAspect
                color={SUPPORT_COLOR}
                desc="Flowing"
                label="Trine / Sextile"
                colors={colors}
              />
              <LegendAspect
                color={CHALLENGE_COLOR}
                desc="Tension"
                label="Square / Opposition"
                dashed
                colors={colors}
              />
              <LegendAspect
                color={NEUTRAL_LINE_COLOR}
                desc="Fusion"
                label="Conjunction"
                colors={colors}
              />
            </View>
          </View>

          {/* Aspect summary list */}
          <Text style={[styles.summaryEyebrow, { color: colors.accent }]}>
            {mode === 'synastry' ? 'Synastry Aspects' : 'Composite Aspects'}
          </Text>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
            ]}
          >
            {aspectsForList.length === 0 ? (
              <Text style={[styles.summaryEmpty, { color: colors.textMuted }]}>
                No aspects available for this view.
              </Text>
            ) : (
              aspectsForList.map((a, i) => (
                <View
                  key={`${a.p1}-${a.type}-${a.p2}-${i}`}
                  style={[
                    styles.summaryRow,
                    i < aspectsForList.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255,255,255,0.04)',
                    },
                  ]}
                >
                  <View
                    style={[styles.summaryDot, { backgroundColor: a.color }]}
                  />
                  <Text style={[styles.summaryText, { color: colors.text }]}>
                    <Text style={{ color: a.p1Color, fontWeight: '600' }}>{a.p1}</Text>
                    <Text style={{ color: colors.textSubtle }}> {a.type} </Text>
                    <Text style={{ color: a.p2Color, fontWeight: '600' }}>{a.p2}</Text>
                  </Text>
                  <View
                    style={[
                      styles.summaryLine,
                      isDashedAspect(a.type)
                        ? { borderTopColor: a.color, borderTopWidth: 1.5, borderStyle: 'dashed' }
                        : { borderTopColor: a.color, borderTopWidth: 1.5 },
                    ]}
                  />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// iOS notched-device top inset is consistently ~54pt for the status-bar
// region; non-notched is 20pt. Using a generous fallback keeps the back
// button safely below the clock without depending on SafeAreaContext
// (which doesn't extend into a fullScreen Modal scene).
const HEADER_TOP_INSET = Platform.select({
  ios: 54,
  android: (StatusBar.currentHeight ?? 24) + 4,
  default: 24,
});

interface LegendChipProps {
  color: string;
  label: string;
}
function LegendChip({ color, label }: LegendChipProps) {
  return (
    <View style={styles.legendChip}>
      <View
        style={[styles.legendChipDot, { borderColor: color }]}
      />
      <Text style={[styles.legendChipLabel, { color }]}>{label}</Text>
    </View>
  );
}

interface LegendAspectProps {
  color: string;
  desc: string;
  label: string;
  dashed?: boolean;
  colors: RelationshipTheme['colors'];
}
function LegendAspect({ color, desc, label, dashed, colors }: LegendAspectProps) {
  return (
    <View style={styles.legendAspectItem}>
      <View
        style={[
          styles.legendAspectLine,
          dashed
            ? { borderTopColor: color, borderTopWidth: 2, borderStyle: 'dashed' }
            : { borderTopColor: color, borderTopWidth: 2 },
        ]}
      />
      <View>
        <Text style={[styles.legendAspectDesc, { color: colors.text }]}>{desc}</Text>
        <Text style={[styles.legendAspectSubLabel, { color: colors.textSubtle }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
    paddingLeft: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  headerTitle: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 50,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 18,
  },
  identityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  identityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  identityName: {
    fontSize: 13,
    fontWeight: '500',
  },
  identitySep: {
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  chartFrame: {
    alignItems: 'center',
    marginBottom: 18,
  },
  chartFallback: {
    width: '100%',
    minHeight: 220,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackText: {
    fontSize: 13,
    textAlign: 'center',
  },
  legendCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  legendEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  legendRingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 4,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendChipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  legendChipLabel: {
    fontSize: 11.5,
  },
  legendDivider: {
    height: 1,
    marginVertical: 12,
  },
  legendAspectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendAspectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendAspectLine: {
    width: 20,
    height: 0,
  },
  legendAspectDesc: {
    fontSize: 11,
  },
  legendAspectSubLabel: {
    fontSize: 9.5,
  },
  summaryEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
  summaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  summaryText: {
    flex: 1,
    fontSize: 12.5,
  },
  summaryLine: {
    width: 16,
    height: 0,
  },
  summaryEmpty: {
    fontSize: 12.5,
    paddingVertical: 14,
    textAlign: 'center',
  },
});
