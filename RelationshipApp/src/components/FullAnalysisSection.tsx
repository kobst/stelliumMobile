import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RelationshipTheme } from '../theme';

const SUPPORT_COLOR = '#82C8B4';
const SUPPORT_BG = 'rgba(130, 200, 180, 0.12)';
const SUPPORT_BORDER = 'rgba(130, 200, 180, 0.18)';
const CHALLENGE_COLOR = '#E8856B';
const CHALLENGE_BG = 'rgba(232, 133, 107, 0.12)';
const CHALLENGE_BORDER = 'rgba(232, 133, 107, 0.18)';
const SYNTH_BG = 'rgba(202, 190, 255, 0.12)';
const SYNTH_BORDER = 'rgba(202, 190, 255, 0.18)';

const CLUSTER_ORDER = ['Harmony', 'Passion', 'Connection', 'Stability', 'Growth'] as const;
type ClusterName = (typeof CLUSTER_ORDER)[number];

const CLUSTER_ICONS: Record<ClusterName, string> = {
  Harmony: '\u2764',
  Passion: '\uD83D\uDD25',
  Connection: '\uD83E\uDDE0',
  Stability: '\uD83D\uDC8E',
  Growth: '\uD83C\uDF31',
};

interface PanelData {
  supportPanel?: string | null;
  challengePanel?: string | null;
  synthesisPanel?: string | null;
}

interface ClusterCompleteAnalysis {
  synastry?: PanelData;
  composite?: PanelData;
}

interface ClusterMetrics {
  score?: number;
  supportPct?: number;
  challengePct?: number;
}

interface KeystoneAspect {
  description?: string;
  rank?: number;
  impact?: string;
  type?: string;
  cluster?: string;
}

function inferKeystoneType(impact?: string): string | undefined {
  if (!impact) return undefined;
  const lower = impact.toLowerCase();
  if (lower.includes('support')) return 'Support';
  if (lower.includes('challenge')) return 'Challenge';
  return 'Mixed';
}

function stripPointsFromImpact(impact?: string): string {
  if (!impact) return '';
  return impact.replace(/\s*\([^)]*pts?\)\s*$/i, '').trim();
}

function aggregateKeystoneAspects(
  fullAnalysis: any,
  maxCount: number = 6
): KeystoneAspect[] {
  const collected: KeystoneAspect[] = [];
  const tfKeystones = Array.isArray(fullAnalysis?.tensionFlowAnalysis?.keystoneAspects)
    ? fullAnalysis.tensionFlowAnalysis.keystoneAspects
    : [];
  for (const ka of tfKeystones) {
    collected.push({
      description: ka?.description,
      rank: typeof ka?.rank === 'number' ? ka.rank : undefined,
      impact: ka?.impact,
      type: ka?.type ?? inferKeystoneType(ka?.impact),
      cluster: ka?.cluster,
    });
  }
  const clusters = fullAnalysis?.clusterAnalysis?.clusters ?? {};
  for (const [clusterName, cluster] of Object.entries(clusters)) {
    const clusterKa = (cluster as any)?.keystoneAspects;
    if (!Array.isArray(clusterKa)) continue;
    for (const ka of clusterKa) {
      collected.push({
        description: ka?.description,
        rank: typeof ka?.rank === 'number' ? ka.rank : undefined,
        impact: ka?.impact,
        type: ka?.type ?? inferKeystoneType(ka?.impact),
        cluster: clusterName,
      });
    }
  }
  // Dedupe by description, prefer the entry with the lowest rank
  const byDesc = new Map<string, KeystoneAspect>();
  for (const ka of collected) {
    const key = ka.description ?? '';
    if (!key) continue;
    const existing = byDesc.get(key);
    if (!existing) {
      byDesc.set(key, ka);
      continue;
    }
    const existingRank = existing.rank ?? Number.POSITIVE_INFINITY;
    const candidateRank = ka.rank ?? Number.POSITIVE_INFINITY;
    if (candidateRank < existingRank) {
      byDesc.set(key, ka);
    }
  }
  const deduped = Array.from(byDesc.values());
  deduped.sort((a, b) => {
    const ar = a.rank ?? Number.POSITIVE_INFINITY;
    const br = b.rank ?? Number.POSITIVE_INFINITY;
    return ar - br;
  });
  return deduped.slice(0, maxCount);
}

interface FullAnalysisSectionProps {
  colors: RelationshipTheme['colors'];
  initialOverview: string | null;
  fullAnalysis: any;
}

type TabKey = 'overview' | 'clusters' | 'keyAspects';

export function FullAnalysisSection({ colors, initialOverview, fullAnalysis }: FullAnalysisSectionProps) {
  const [openCluster, setOpenCluster] = useState<ClusterName | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const overall = fullAnalysis?.overall ?? null;
  const tier = overall?.tier ?? null;
  const overallScore = typeof overall?.score === 'number' ? Math.round(overall.score) : null;
  const dominantCluster = overall?.dominantCluster ?? null;
  const challengeCluster = overall?.challengeCluster ?? null;
  const holisticOverview =
    fullAnalysis?.holisticOverview?.trim?.() ||
    initialOverview ||
    null;

  const tensionFlow = fullAnalysis?.tensionFlowAnalysis ?? null;
  const tensionQuadrant = tensionFlow?.quadrant ?? null;
  const supportDensityPct =
    typeof tensionFlow?.supportDensity === 'number'
      ? Math.round(tensionFlow.supportDensity * 100)
      : null;
  const challengeDensityPct =
    typeof tensionFlow?.challengeDensity === 'number'
      ? Math.round(tensionFlow.challengeDensity * 100)
      : null;
  const polarityRatio =
    typeof tensionFlow?.polarityRatio === 'number'
      ? Number(tensionFlow.polarityRatio.toFixed(2))
      : null;

  const completeAnalysis = fullAnalysis?.completeAnalysis ?? null;
  const clusterMetrics = fullAnalysis?.clusterAnalysis?.clusters ?? null;
  const keystoneAspects: KeystoneAspect[] = aggregateKeystoneAspects(fullAnalysis);

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[FullAnalysisSection] keystone debug', {
      tfKeystoneCount: Array.isArray(tensionFlow?.keystoneAspects)
        ? tensionFlow.keystoneAspects.length
        : 'not-array',
      clusterKeystoneCounts: clusterMetrics
        ? Object.fromEntries(
            Object.entries(clusterMetrics).map(([k, v]) => [
              k,
              Array.isArray((v as any)?.keystoneAspects)
                ? (v as any).keystoneAspects.length
                : 'not-array',
            ])
          )
        : null,
      aggregatedCount: keystoneAspects.length,
      firstAggregated: keystoneAspects[0] ?? null,
    });
  }

  const clusterCounts: Record<ClusterName, number> = {
    Harmony: 0,
    Passion: 0,
    Connection: 0,
    Stability: 0,
    Growth: 0,
  };
  let supportCount = 0;
  let challengeCount = 0;
  let mixedCount = 0;
  for (const ka of keystoneAspects) {
    if (ka.cluster && ka.cluster in clusterCounts) {
      clusterCounts[ka.cluster as ClusterName] += 1;
    }
    if (ka.type === 'Support') supportCount += 1;
    else if (ka.type === 'Challenge') challengeCount += 1;
    else mixedCount += 1;
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'clusters', label: 'Clusters' },
    { key: 'keyAspects', label: 'Key Aspects' },
  ];

  return (
    <>
      <View style={styles.unlockedPillRow}>
        <View
          style={[
            styles.unlockedPill,
            { backgroundColor: SUPPORT_BG, borderColor: SUPPORT_BORDER },
          ]}
        >
          <Text style={[styles.unlockedPillText, { color: SUPPORT_COLOR }]}>
            ✓ Full analysis unlocked
          </Text>
        </View>
      </View>

      <View style={[styles.tabBar, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.85}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabButton,
                {
                  backgroundColor: isActive ? colors.surface : 'transparent',
                  borderColor: isActive ? colors.ghostBorder : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: isActive ? colors.text : colors.textSubtle },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'overview' ? (
        <>
          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>Overall Reading</Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
              ]}
            >
              <View style={styles.badgeRow}>
                {tier || overallScore !== null ? (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: 'rgba(202, 190, 255, 0.12)',
                        borderColor: 'rgba(202, 190, 255, 0.2)',
                      },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {tier ?? 'Tier'}
                      {overallScore !== null ? ` · ${overallScore}/100` : ''}
                    </Text>
                  </View>
                ) : null}
                {dominantCluster ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: SUPPORT_BG, borderColor: SUPPORT_BORDER },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: SUPPORT_COLOR }]}>
                      Strongest: {dominantCluster}
                    </Text>
                  </View>
                ) : null}
                {challengeCluster ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: CHALLENGE_BG, borderColor: CHALLENGE_BORDER },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: CHALLENGE_COLOR }]}>
                      Weakest: {challengeCluster}
                    </Text>
                  </View>
                ) : null}
              </View>
              {holisticOverview ? (
                <Text style={[styles.cardBody, { color: colors.text }]}>{holisticOverview}</Text>
              ) : null}
            </View>
          </View>

          {tensionQuadrant || supportDensityPct !== null || polarityRatio !== null ? (
            <View>
              <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>Tension Flow</Text>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <View style={styles.pillWrap}>
                  {tensionQuadrant ? (
                    <View
                      style={[styles.pill, { backgroundColor: 'rgba(202, 190, 255, 0.12)' }]}
                    >
                      <Text style={[styles.pillText, { color: colors.primary }]}>
                        {tensionQuadrant}
                      </Text>
                    </View>
                  ) : null}
                  {supportDensityPct !== null ? (
                    <View style={[styles.pill, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                      <Text style={[styles.pillText, { color: colors.textSubtle }]}>
                        Support {supportDensityPct}%
                      </Text>
                    </View>
                  ) : null}
                  {challengeDensityPct !== null ? (
                    <View style={[styles.pill, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                      <Text style={[styles.pillText, { color: colors.textSubtle }]}>
                        Challenge {challengeDensityPct}%
                      </Text>
                    </View>
                  ) : null}
                  {polarityRatio !== null ? (
                    <View style={[styles.pill, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                      <Text style={[styles.pillText, { color: colors.textSubtle }]}>
                        Polarity {polarityRatio}x
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}
        </>
      ) : null}

      {activeTab === 'clusters' ? (
        <View>
          <Text style={[styles.sectionSub, { color: colors.textSubtle }]}>
            Tap any cluster to read the full synastry and composite breakdown.
          </Text>
          {CLUSTER_ORDER.map((name) => {
          const ca: ClusterCompleteAnalysis = completeAnalysis?.[name] ?? {};
          const cm: ClusterMetrics = clusterMetrics?.[name] ?? {};
          const score = typeof cm.score === 'number' ? Math.round(cm.score) : null;
          const supportPct = typeof cm.supportPct === 'number' ? Math.round(cm.supportPct) : null;
          const challengePct = typeof cm.challengePct === 'number' ? Math.round(cm.challengePct) : null;
          const isOpen = openCluster === name;
          const hasContent = Boolean(ca.synastry || ca.composite);

          return (
            <View
              key={name}
              style={[
                styles.clusterCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isOpen ? 'rgba(202, 190, 255, 0.18)' : colors.ghostBorder,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setOpenCluster(isOpen ? null : name)}
                style={styles.clusterHeader}
                disabled={!hasContent}
              >
                <View
                  style={[
                    styles.clusterIcon,
                    {
                      backgroundColor: isOpen
                        ? 'rgba(202, 190, 255, 0.12)'
                        : 'rgba(255, 255, 255, 0.04)',
                    },
                  ]}
                >
                  <Text style={styles.clusterIconText}>{CLUSTER_ICONS[name]}</Text>
                </View>
                <View style={styles.clusterMeta}>
                  <View style={styles.clusterTitleRow}>
                    <Text style={[styles.clusterName, { color: colors.text }]}>{name}</Text>
                    {score !== null ? (
                      <Text style={[styles.clusterScore, { color: colors.primary }]}>{score}</Text>
                    ) : null}
                  </View>
                  {supportPct !== null && challengePct !== null ? (
                    <View style={styles.barRow}>
                      <View
                        style={[
                          styles.barTrack,
                          { backgroundColor: 'rgba(255, 255, 255, 0.06)' },
                        ]}
                      >
                        <View style={styles.barFill}>
                          <View
                            style={{
                              flex: supportPct,
                              backgroundColor: SUPPORT_COLOR,
                            }}
                          />
                          <View
                            style={{
                              flex: challengePct,
                              backgroundColor: CHALLENGE_COLOR,
                            }}
                          />
                        </View>
                      </View>
                      <Text style={[styles.barLabel, { color: colors.textSubtle }]}>
                        {supportPct}% / {challengePct}%
                      </Text>
                    </View>
                  ) : null}
                </View>
                {hasContent ? (
                  <Text
                    style={[styles.chevron, { color: colors.textSubtle }, isOpen && styles.chevronOpen]}
                  >
                    ›
                  </Text>
                ) : null}
              </TouchableOpacity>

              {isOpen && hasContent ? (
                <View style={styles.clusterBody}>
                  {ca.synastry ? (
                    <View style={styles.subSection}>
                      <Text style={[styles.subSectionLabel, { color: colors.textSubtle }]}>
                        Synastry
                      </Text>
                      <ClusterPanel kind="support" text={ca.synastry.supportPanel} />
                      <ClusterPanel kind="challenge" text={ca.synastry.challengePanel} />
                      <ClusterPanel kind="synthesis" text={ca.synastry.synthesisPanel} colors={colors} />
                    </View>
                  ) : null}
                  {ca.composite ? (
                    <View style={styles.subSection}>
                      <Text style={[styles.subSectionLabel, { color: colors.textSubtle }]}>
                        Composite
                      </Text>
                      <ClusterPanel kind="support" text={ca.composite.supportPanel} />
                      <ClusterPanel kind="challenge" text={ca.composite.challengePanel} />
                      <ClusterPanel kind="synthesis" text={ca.composite.synthesisPanel} colors={colors} />
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
        </View>
      ) : null}

      {activeTab === 'keyAspects' ? (
        <>
          <Text style={[styles.sectionSub, { color: colors.textSubtle }]}>
            The highest-impact planetary interactions shaping this relationship, ranked by influence.
          </Text>
          {keystoneAspects.length > 0 ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.ghostBorder, paddingHorizontal: 16, paddingVertical: 6 },
              ]}
            >
              {keystoneAspects.map((ka, i) => {
                const aspectLabel = ka.description ?? '';
                const impactLabel = stripPointsFromImpact(ka.impact);
                const type = ka.type ?? null;
                const typeColor =
                  type === 'Support'
                    ? SUPPORT_COLOR
                    : type === 'Challenge'
                    ? CHALLENGE_COLOR
                    : colors.accent;
                const typeBg =
                  type === 'Support'
                    ? SUPPORT_BG
                    : type === 'Challenge'
                    ? CHALLENGE_BG
                    : 'rgba(233, 195, 73, 0.14)';
                return (
                  <View
                    key={`${aspectLabel}-${i}`}
                    style={[
                      styles.keystoneRow,
                      i < keystoneAspects.length - 1 && styles.keystoneRowDivider,
                      i < keystoneAspects.length - 1 && {
                        borderBottomColor: 'rgba(255, 255, 255, 0.04)',
                      },
                    ]}
                  >
                    <View style={[styles.keystoneAccent, { backgroundColor: typeColor }]} />
                    <View style={styles.keystoneBody}>
                      <View style={styles.keystoneTitleRow}>
                        <Text
                          style={[styles.keystoneTitle, { color: colors.text }]}
                          numberOfLines={2}
                        >
                          {aspectLabel || 'Keystone aspect'}
                        </Text>
                        {type ? (
                          <View style={[styles.typeBadge, { backgroundColor: typeBg }]}>
                            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{type}</Text>
                          </View>
                        ) : null}
                      </View>
                      {impactLabel ? (
                        <Text style={[styles.keystoneImpact, { color: colors.textMuted }]}>
                          {impactLabel}
                        </Text>
                      ) : null}
                      {ka.cluster ? (
                        <Text style={[styles.keystoneCluster, { color: colors.textSubtle }]}>
                          {ka.cluster}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
              ]}
            >
              <Text style={[styles.cardBody, { color: colors.textMuted }]}>
                No keystone aspects available for this relationship yet.
              </Text>
            </View>
          )}

          {keystoneAspects.length > 0 ? (
            <View>
              <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>
                Aspect Distribution
              </Text>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <View style={styles.distributionRow}>
                  <View
                    style={[
                      styles.distributionCard,
                      { backgroundColor: SUPPORT_BG },
                    ]}
                  >
                    <Text style={[styles.distributionCount, { color: SUPPORT_COLOR }]}>
                      {supportCount}
                    </Text>
                    <Text style={[styles.distributionLabel, { color: colors.textSubtle }]}>
                      Support
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.distributionCard,
                      { backgroundColor: CHALLENGE_BG },
                    ]}
                  >
                    <Text style={[styles.distributionCount, { color: CHALLENGE_COLOR }]}>
                      {challengeCount}
                    </Text>
                    <Text style={[styles.distributionLabel, { color: colors.textSubtle }]}>
                      Challenge
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.distributionCard,
                      { backgroundColor: 'rgba(233, 195, 73, 0.14)' },
                    ]}
                  >
                    <Text style={[styles.distributionCount, { color: colors.accent }]}>
                      {mixedCount}
                    </Text>
                    <Text style={[styles.distributionLabel, { color: colors.textSubtle }]}>
                      Mixed
                    </Text>
                  </View>
                </View>
                <View style={styles.clusterPillWrap}>
                  {CLUSTER_ORDER.map((name) => (
                    <View
                      key={name}
                      style={[
                        styles.clusterCountPill,
                        { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
                      ]}
                    >
                      <Text style={[styles.clusterCountPillText, { color: colors.textSubtle }]}>
                        {name}: {clusterCounts[name]} aspect
                        {clusterCounts[name] !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </>
  );
}

interface ClusterPanelProps {
  kind: 'support' | 'challenge' | 'synthesis';
  text?: string | null;
  colors?: RelationshipTheme['colors'];
}

function ClusterPanel({ kind, text, colors }: ClusterPanelProps) {
  if (!text) return null;
  const styleMap = {
    support: { bg: SUPPORT_BG, border: SUPPORT_BORDER, accent: SUPPORT_COLOR, label: 'What works' },
    challenge: {
      bg: CHALLENGE_BG,
      border: CHALLENGE_BORDER,
      accent: CHALLENGE_COLOR,
      label: "What's difficult",
    },
    synthesis: {
      bg: SYNTH_BG,
      border: SYNTH_BORDER,
      accent: colors?.primary ?? '#cabeff',
      label: 'The full picture',
    },
  } as const;
  const s = styleMap[kind];
  return (
    <View style={[styles.panel, { backgroundColor: s.bg, borderColor: s.border }]}>
      <View style={styles.panelLabelRow}>
        <View style={[styles.panelDot, { backgroundColor: s.accent }]} />
        <Text style={[styles.panelLabel, { color: s.accent }]}>{s.label}</Text>
      </View>
      <Text style={styles.panelText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  unlockedPillRow: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  distributionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  distributionCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  distributionCount: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  distributionLabel: {
    fontSize: 10,
  },
  clusterPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  clusterCountPill: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clusterCountPillText: {
    fontSize: 10.5,
  },
  keystoneCluster: {
    fontSize: 10,
    marginTop: 4,
  },
  unlockedPill: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  unlockedPillText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  sectionDividerLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  sectionEyebrow: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12.5,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  tinyEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cardBody: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  clusterCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  clusterIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterIconText: {
    fontSize: 18,
  },
  clusterMeta: {
    flex: 1,
    gap: 6,
  },
  clusterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clusterName: {
    fontSize: 15,
    fontWeight: '600',
  },
  clusterScore: {
    fontFamily: 'Georgia',
    fontSize: 18,
    fontWeight: '700',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    width: 160,
    height: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    flex: 1,
    flexDirection: 'row',
    height: 4,
  },
  barLabel: {
    fontSize: 9,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '500',
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  clusterBody: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  subSection: {
    marginTop: 10,
  },
  subSectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingTop: 6,
  },
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  panelLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  panelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  panelLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  panelText: {
    fontFamily: 'Georgia',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    color: 'rgba(232, 228, 240, 0.78)',
  },
  keystoneRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  keystoneRowDivider: {
    borderBottomWidth: 1,
  },
  keystoneAccent: {
    width: 6,
    minHeight: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  keystoneBody: {
    flex: 1,
  },
  keystoneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  keystoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  typeBadge: {
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  keystoneImpact: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
