import React from 'react';
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
import { useTheme, type RelationshipTheme } from '../theme';
import { ChartWheel } from '../../../shared/components/chart/ChartWheel';
import type {
  BackendAspect,
  BackendHouse,
  BackendPlanet,
  BirthChart,
  ChartColorTokens,
} from '../../../shared/components/chart/chartTypes';

const SUPPORT_COLOR = '#82C8B4';
const CHALLENGE_COLOR = '#E8856B';
const FUSION_COLOR = '#D4A843';

const HARMONIOUS = new Set(['trine', 'sextile']);
const HARD = new Set(['square', 'opposition', 'quincunx']);
const FUSION = new Set(['conjunction']);

function aspectColor(aspectType?: string): string {
  const t = (aspectType ?? '').toLowerCase();
  if (HARMONIOUS.has(t)) return SUPPORT_COLOR;
  if (HARD.has(t)) return CHALLENGE_COLOR;
  if (FUSION.has(t)) return FUSION_COLOR;
  return CHALLENGE_COLOR;
}

function isDashedAspect(aspectType?: string): boolean {
  const t = (aspectType ?? '').toLowerCase();
  return HARD.has(t);
}

function normalizeBirthChart(raw: unknown): BirthChart | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as { planets?: unknown; houses?: unknown; aspects?: unknown };
  const planetsIn = Array.isArray(r.planets) ? r.planets : [];
  const housesIn = Array.isArray(r.houses) ? r.houses : [];
  const aspectsIn = Array.isArray(r.aspects) ? r.aspects : [];

  const planets: BackendPlanet[] = planetsIn.map((p: any) => ({
    name: p?.name ?? '',
    full_degree: typeof p?.full_degree === 'number' ? p.full_degree : 0,
    norm_degree: typeof p?.norm_degree === 'number' ? p.norm_degree : undefined,
    sign: typeof p?.sign === 'string' ? p.sign : null,
    house: typeof p?.house === 'number' ? p.house : undefined,
    is_retro: Boolean(p?.is_retro),
  }));
  const houses: BackendHouse[] = housesIn.map((h: any) => ({
    house:
      typeof h?.house === 'number'
        ? h.house
        : Number.parseInt(String(h?.house ?? ''), 10) || 0,
    degree: typeof h?.degree === 'number' ? h.degree : 0,
    sign: typeof h?.sign === 'string' ? h.sign : undefined,
  }));
  const aspects: BackendAspect[] = aspectsIn.map((a: any) => ({
    aspectingPlanet: a?.aspectingPlanet ?? '',
    aspectedPlanet: a?.aspectedPlanet ?? '',
    aspectingPlanetDegree:
      typeof a?.aspectingPlanetDegree === 'number' ? a.aspectingPlanetDegree : undefined,
    aspectedPlanetDegree:
      typeof a?.aspectedPlanetDegree === 'number' ? a.aspectedPlanetDegree : undefined,
    aspectType: a?.aspectType ?? '',
    orb: typeof a?.orb === 'number' ? a.orb : 0,
  }));
  if (!planets.length) return null;
  return { planets, houses, aspects };
}

interface SingleChartModalProps {
  visible: boolean;
  onClose: () => void;
  subjectName: string;
  birthChart: unknown;
  // Optional tint for this subject's planets in the wheel.
  planetColor?: string;
}

export function SingleChartModal({
  visible,
  onClose,
  subjectName,
  birthChart,
  planetColor,
}: SingleChartModalProps) {
  const { colors } = useTheme();
  const normalized = normalizeBirthChart(birthChart);

  const chartColors: ChartColorTokens = {
    surface: colors.surface,
    border: colors.ghostBorder,
    onSurface: colors.text,
    onSurfaceVariant: colors.textMuted,
  };

  const tint = planetColor ?? colors.primary;

  const aspectsForList = (normalized?.aspects ?? [])
    .slice()
    .sort((a, b) => (a?.orb ?? 99) - (b?.orb ?? 99))
    .map((a) => ({
      p1: String(a.aspectingPlanet ?? ''),
      p2: String(a.aspectedPlanet ?? ''),
      type: String(a.aspectType ?? ''),
      color: aspectColor(a.aspectType),
    }))
    .filter((a) => a.p1 && a.p2 && a.type);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View
        style={[
          styles.root,
          { backgroundColor: colors.background, paddingTop: HEADER_TOP_INSET },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Text style={[styles.backText, { color: colors.text }]}>← Back</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Birth Chart</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.identityRow}>
            <View style={styles.identityChip}>
              <View style={[styles.identityDot, { backgroundColor: tint }]} />
              <Text style={[styles.identityName, { color: tint }]}>{subjectName}</Text>
            </View>
          </View>

          <View style={styles.chartFrame}>
            {normalized ? (
              <ChartWheel
                birthChart={normalized}
                size={320}
                colors={chartColors}
                getPlanetColor={() => tint}
              />
            ) : (
              <View style={[styles.chartFallback, { borderColor: colors.ghostBorder }]}>
                <Text style={[styles.fallbackText, { color: colors.textMuted }]}>
                  Birth chart isn't available yet.
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.legendCard,
              { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
            ]}
          >
            <Text style={[styles.legendEyebrow, { color: colors.textSubtle }]}>Legend</Text>
            <View style={styles.legendRingRow}>
              <LegendChip color={tint} label={`${subjectName}'s planets`} />
            </View>

            <View style={[styles.legendDivider, { backgroundColor: colors.ghostBorder }]} />

            <Text style={[styles.legendEyebrow, { color: colors.textSubtle }]}>Aspect Lines</Text>
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
                color={FUSION_COLOR}
                desc="Fusion"
                label="Conjunction"
                colors={colors}
              />
            </View>
          </View>

          <Text style={[styles.summaryEyebrow, { color: colors.accent }]}>Natal Aspects</Text>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
            ]}
          >
            {aspectsForList.length === 0 ? (
              <Text style={[styles.summaryEmpty, { color: colors.textMuted }]}>
                No aspects available for this chart.
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
                  <View style={[styles.summaryDot, { backgroundColor: a.color }]} />
                  <Text style={[styles.summaryText, { color: colors.text }]}>
                    <Text style={{ color: tint, fontWeight: '600' }}>{a.p1}</Text>
                    <Text style={{ color: colors.textSubtle }}> {a.type} </Text>
                    <Text style={{ color: tint, fontWeight: '600' }}>{a.p2}</Text>
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
      <View style={[styles.legendChipDot, { borderColor: color }]} />
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
  chartFrame: {
    alignItems: 'center',
    marginBottom: 18,
  },
  chartFallback: {
    width: 320,
    height: 320,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackText: {
    textAlign: 'center',
    fontSize: 14,
  },
  legendCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    gap: 10,
  },
  legendEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  legendRingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendChipDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  legendChipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  legendDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  legendAspectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  legendAspectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendAspectLine: {
    width: 28,
  },
  legendAspectDesc: {
    fontSize: 12,
    fontWeight: '600',
  },
  legendAspectSubLabel: {
    fontSize: 10,
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
  },
  summaryEmpty: {
    fontSize: 13,
    padding: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
  },
  summaryLine: {
    width: 36,
  },
});
