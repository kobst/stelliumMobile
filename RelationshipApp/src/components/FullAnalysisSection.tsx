import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RelationshipTheme } from '../theme';
import { decodeAstroCode } from '../utils/astroCode';

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
  cluster?: string;
}

function aggregateKeystoneAspects(
  fullAnalysis: any,
  maxCount: number = 6
): KeystoneAspect[] {
  // Rank by the dominant cluster contribution magnitude per scored item.
  const scoredItems = Array.isArray(fullAnalysis?.scoredItems)
    ? fullAnalysis.scoredItems
    : Array.isArray(fullAnalysis?.clusterScoring?.scoredItems)
    ? fullAnalysis.clusterScoring.scoredItems
    : [];

  type Ranked = KeystoneAspect & { magnitude: number };
  const ranked: Ranked[] = [];

  for (const item of scoredItems) {
    const description: string | undefined = item?.description;
    if (!description) continue;
    const contributions = Array.isArray(item?.clusterContributions)
      ? item.clusterContributions
      : [];
    if (contributions.length === 0) continue;

    let dominantCluster: string | undefined;
    let dominantMagnitude = -Infinity;
    for (const c of contributions) {
      const score = typeof c?.score === 'number' ? c.score : 0;
      if (score === 0 || !c?.cluster) continue;
      const magnitude = Math.abs(score);
      if (magnitude > dominantMagnitude) {
        dominantMagnitude = magnitude;
        dominantCluster = c.cluster;
      }
    }
    if (dominantMagnitude <= 0) continue;

    ranked.push({
      description,
      cluster: dominantCluster,
      magnitude: dominantMagnitude,
    });
  }

  const byDesc = new Map<string, Ranked>();
  for (const ka of ranked) {
    const key = ka.description ?? '';
    if (!key) continue;
    const existing = byDesc.get(key);
    if (!existing || ka.magnitude > existing.magnitude) {
      byDesc.set(key, ka);
    }
  }
  const deduped = Array.from(byDesc.values());
  deduped.sort((a, b) => b.magnitude - a.magnitude);
  return deduped.slice(0, maxCount).map(({ magnitude, ...rest }) => rest);
}

interface FullAnalysisSectionProps {
  colors: RelationshipTheme['colors'];
  initialOverview: string | null;
  fullAnalysis: any;
}

type TabKey = 'overview' | 'clusters' | 'keyAspects';

type LensKey = 'between' | 'relationship';

export function FullAnalysisSection({ colors, initialOverview, fullAnalysis }: FullAnalysisSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [activeCluster, setActiveCluster] = useState<ClusterName>('Harmony');
  const [activeLens, setActiveLens] = useState<LensKey>('between');

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

  const scoredItemsAll = Array.isArray(fullAnalysis?.scoredItems)
    ? fullAnalysis.scoredItems
    : Array.isArray(fullAnalysis?.clusterScoring?.scoredItems)
    ? fullAnalysis.clusterScoring.scoredItems
    : [];
  const codeToDescription: Record<string, string> = {};
  for (const item of scoredItemsAll) {
    if (typeof item?.code === 'string' && typeof item?.description === 'string') {
      codeToDescription[item.code] = item.description;
    }
  }
  const personANameForCodes: string =
    fullAnalysis?.userA?.name ?? fullAnalysis?.userA_name ?? 'Person 1';
  const personBNameForCodes: string =
    fullAnalysis?.userB?.name ?? fullAnalysis?.userB_name ?? 'Person 2';

  const aspectMix = (() => {
    const tfTotal = typeof tensionFlow?.totalAspects === 'number' ? tensionFlow.totalAspects : null;
    const tfSupport =
      typeof tensionFlow?.supportAspects === 'number' ? tensionFlow.supportAspects : null;
    const tfChallenge =
      typeof tensionFlow?.challengeAspects === 'number' ? tensionFlow.challengeAspects : null;
    if (tfTotal !== null || tfSupport !== null || tfChallenge !== null) {
      return { total: tfTotal, support: tfSupport, challenge: tfChallenge };
    }
    // Fallback: derive from scoredItems by dominant clusterContribution valence.
    const items = Array.isArray(fullAnalysis?.scoredItems)
      ? fullAnalysis.scoredItems
      : Array.isArray(fullAnalysis?.clusterScoring?.scoredItems)
      ? fullAnalysis.clusterScoring.scoredItems
      : [];
    if (items.length === 0) return null;
    let support = 0;
    let challenge = 0;
    for (const item of items) {
      const contributions = Array.isArray(item?.clusterContributions)
        ? item.clusterContributions
        : [];
      let dominantValence: number | undefined;
      let dominantMagnitude = -Infinity;
      for (const c of contributions) {
        const score = typeof c?.score === 'number' ? c.score : 0;
        const magnitude = Math.abs(score);
        if (magnitude > dominantMagnitude) {
          dominantMagnitude = magnitude;
          dominantValence = c?.valence;
        }
      }
      if (dominantValence === 1) support += 1;
      else if (dominantValence === -1) challenge += 1;
    }
    return { total: items.length, support, challenge };
  })();

  const doubleWhammyAspects = (() => {
    const items = Array.isArray(fullAnalysis?.scoredItems)
      ? fullAnalysis.scoredItems
      : Array.isArray(fullAnalysis?.clusterScoring?.scoredItems)
      ? fullAnalysis.clusterScoring.scoredItems
      : [];
    const dedup = new Map<
      string,
      {
        description?: string;
        partnerDescription?: string;
        theme?: string;
        complexity?: string;
        combinedMagnitude?: number;
        dominantValence?: number;
      }
    >();
    for (const item of items) {
      const dw = item?.doubleWhammy;
      if (!dw || dw.isDoubleWhammy !== true) continue;
      const desc: string | undefined = item?.description;
      const partnerDesc: string | undefined = dw.partnerDescription;
      const pairKey = [desc, partnerDesc]
        .filter((v): v is string => typeof v === 'string')
        .sort()
        .join(' | ');
      if (!pairKey || dedup.has(pairKey)) continue;
      dedup.set(pairKey, {
        description: desc,
        partnerDescription: partnerDesc,
        theme: dw.theme,
        complexity: dw.complexity,
        combinedMagnitude:
          typeof dw.combinedMagnitude === 'number' ? dw.combinedMagnitude : undefined,
        dominantValence:
          typeof dw.dominantValence === 'number' ? dw.dominantValence : undefined,
      });
    }
    return Array.from(dedup.values()).sort(
      (a, b) => (b.combinedMagnitude ?? 0) - (a.combinedMagnitude ?? 0)
    );
  })();


  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'clusters', label: 'Breakdown' },
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
        <ClustersTab
          colors={colors}
          completeAnalysis={completeAnalysis}
          clusterMetrics={clusterMetrics}
          activeCluster={activeCluster}
          setActiveCluster={setActiveCluster}
          activeLens={activeLens}
          setActiveLens={setActiveLens}
          codeToDescription={codeToDescription}
          personAName={personANameForCodes}
          personBName={personBNameForCodes}
        />
      ) : null}

      {activeTab === 'keyAspects' ? (
        <>
          <Text style={[styles.sectionSub, { color: colors.textSubtle }]}>
            The highest-impact planetary interactions shaping this relationship, ranked by influence.
          </Text>

          {aspectMix ? (
            <View>
              <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>
                Aspect Mix
              </Text>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <View style={styles.aspectMixRow}>
                  <View
                    style={[
                      styles.aspectMixCard,
                      { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
                    ]}
                  >
                    <Text style={[styles.aspectMixCount, { color: colors.text }]}>
                      {aspectMix.total ?? '—'}
                    </Text>
                    <Text style={[styles.aspectMixLabel, { color: colors.textSubtle }]}>
                      Total
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.aspectMixCard,
                      { backgroundColor: SUPPORT_BG },
                    ]}
                  >
                    <Text style={[styles.aspectMixCount, { color: SUPPORT_COLOR }]}>
                      {aspectMix.support ?? '—'}
                    </Text>
                    <Text style={[styles.aspectMixLabel, { color: colors.textSubtle }]}>
                      Support
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.aspectMixCard,
                      { backgroundColor: CHALLENGE_BG },
                    ]}
                  >
                    <Text style={[styles.aspectMixCount, { color: CHALLENGE_COLOR }]}>
                      {aspectMix.challenge ?? '—'}
                    </Text>
                    <Text style={[styles.aspectMixLabel, { color: colors.textSubtle }]}>
                      Challenge
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>
              Keystone Aspects
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textSubtle }]}>
              The strongest individual aspects driving this connection.
            </Text>
          </View>

          {keystoneAspects.length > 0 ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.ghostBorder, paddingHorizontal: 16, paddingVertical: 6 },
              ]}
            >
              {keystoneAspects.map((ka, i) => {
                const aspectLabel = ka.description ?? '';
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
                    <View style={[styles.keystoneAccent, { backgroundColor: colors.accent }]} />
                    <View style={styles.keystoneBody}>
                      <Text
                        style={[styles.keystoneTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {aspectLabel || 'Keystone aspect'}
                      </Text>
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

          {doubleWhammyAspects.length > 0 ? (
            <View>
              <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>
                Double Whammy Aspects
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textSubtle }]}>
                Mirrored aspect pairs that reinforce a single theme between you.
              </Text>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder, paddingHorizontal: 16, paddingVertical: 6 },
                ]}
              >
                {doubleWhammyAspects.map((dw, i) => {
                  const accent =
                    dw.dominantValence === 1
                      ? SUPPORT_COLOR
                      : dw.dominantValence === -1
                      ? CHALLENGE_COLOR
                      : colors.accent;
                  return (
                    <View
                      key={`${dw.description ?? ''}-${i}`}
                      style={[
                        styles.keystoneRow,
                        i < doubleWhammyAspects.length - 1 && styles.keystoneRowDivider,
                        i < doubleWhammyAspects.length - 1 && {
                          borderBottomColor: 'rgba(255, 255, 255, 0.04)',
                        },
                      ]}
                    >
                      <View style={[styles.keystoneAccent, { backgroundColor: accent }]} />
                      <View style={styles.keystoneBody}>
                        {dw.theme ? (
                          <Text style={[styles.dwTheme, { color: colors.text }]}>{dw.theme}</Text>
                        ) : null}
                        {dw.description ? (
                          <Text style={[styles.dwAspectLine, { color: colors.textMuted }]}>
                            {dw.description}
                          </Text>
                        ) : null}
                        {dw.partnerDescription ? (
                          <Text style={[styles.dwAspectLine, { color: colors.textMuted }]}>
                            {dw.partnerDescription}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </>
  );
}

interface ClusterKeyAspectsLensSection {
  codes?: string[];
}

interface ClusterKeyAspectsBlock {
  synastry?: ClusterKeyAspectsLensSection;
  composite?: ClusterKeyAspectsLensSection;
}

interface ClustersTabProps {
  colors: RelationshipTheme['colors'];
  completeAnalysis: Partial<Record<ClusterName, ClusterCompleteAnalysis & { keyAspects?: ClusterKeyAspectsBlock }>> | null;
  clusterMetrics: Partial<Record<ClusterName, ClusterMetrics>> | null;
  activeCluster: ClusterName;
  setActiveCluster: (name: ClusterName) => void;
  activeLens: LensKey;
  setActiveLens: (lens: LensKey) => void;
  codeToDescription: Record<string, string>;
  personAName: string;
  personBName: string;
}

function ClustersTab({
  colors,
  completeAnalysis,
  clusterMetrics,
  activeCluster,
  setActiveCluster,
  activeLens,
  setActiveLens,
  codeToDescription,
  personAName,
  personBName,
}: ClustersTabProps) {
  // When the user picks a different cluster, snap the lens back to "between"
  // (matches the mock's behavior).
  useEffect(() => {
    setActiveLens('between');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCluster]);

  const ca = completeAnalysis?.[activeCluster] ?? {};
  const cm: ClusterMetrics = clusterMetrics?.[activeCluster] ?? {};
  const activeScore = typeof cm.score === 'number' ? Math.round(cm.score) : null;
  const lensSource = activeLens === 'between' ? ca.synastry : ca.composite;
  const lensKeyAspectCodes: string[] =
    (activeLens === 'between'
      ? ca.keyAspects?.synastry?.codes
      : ca.keyAspects?.composite?.codes) ?? [];
  const subtitle =
    activeLens === 'between'
      ? 'How your charts interact with each other'
      : 'What the relationship creates as its own entity';

  const lensTabs: { key: LensKey; label: string }[] = [
    { key: 'between', label: 'Between You' },
    { key: 'relationship', label: 'The Relationship Itself' },
  ];

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillScrollContent}
        style={styles.pillScroll}
      >
        {CLUSTER_ORDER.map((name) => {
          const isActive = activeCluster === name;
          const score =
            typeof clusterMetrics?.[name]?.score === 'number'
              ? Math.round(clusterMetrics[name]!.score!)
              : null;
          return (
            <TouchableOpacity
              key={name}
              activeOpacity={0.85}
              onPress={() => setActiveCluster(name)}
              style={[
                styles.clusterPill,
                {
                  backgroundColor: isActive ? colors.surface : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isActive ? colors.ghostBorder : 'rgba(255, 255, 255, 0.04)',
                },
              ]}
            >
              <Text style={styles.pillIcon}>{CLUSTER_ICONS[name]}</Text>
              <Text
                style={[
                  styles.pillName,
                  {
                    color: isActive ? colors.text : colors.textSubtle,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {name}
              </Text>
              {score !== null ? (
                <Text
                  style={[
                    styles.pillScore,
                    { color: isActive ? colors.primary : colors.textSubtle },
                  ]}
                >
                  {score}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.lensRow}>
        {lensTabs.map((lens) => {
          const isActive = activeLens === lens.key;
          return (
            <TouchableOpacity
              key={lens.key}
              activeOpacity={0.85}
              onPress={() => setActiveLens(lens.key)}
              style={[
                styles.lensTab,
                {
                  backgroundColor: isActive ? 'rgba(202, 190, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isActive ? 'rgba(202, 190, 255, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                },
              ]}
            >
              <Text
                style={[
                  styles.lensTabText,
                  { color: isActive ? colors.primary : colors.textSubtle },
                ]}
              >
                {lens.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.clusterHeaderRow}>
        <View
          style={[
            styles.clusterHeaderIcon,
            { backgroundColor: 'rgba(202, 190, 255, 0.12)' },
          ]}
        >
          <Text style={styles.clusterHeaderIconText}>{CLUSTER_ICONS[activeCluster]}</Text>
        </View>
        <View style={styles.clusterHeaderMeta}>
          <View style={styles.clusterHeaderTitleRow}>
            <Text style={[styles.clusterHeaderName, { color: colors.text }]}>{activeCluster}</Text>
            {activeScore !== null ? (
              <Text style={[styles.clusterHeaderScore, { color: colors.primary }]}>
                {activeScore}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.clusterHeaderSubtitle, { color: colors.textSubtle }]}>
            {subtitle}
          </Text>
        </View>
      </View>

      {lensSource &&
      (lensSource.supportPanel || lensSource.challengePanel || lensSource.synthesisPanel) ? (
        <>
          <ClusterPanel kind="support" text={lensSource.supportPanel} />
          <ClusterPanel kind="challenge" text={lensSource.challengePanel} />
          <ClusterPanel kind="synthesis" text={lensSource.synthesisPanel} colors={colors} />
        </>
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            Long-form analysis isn't available for this view yet.
          </Text>
        </View>
      )}

      {lensKeyAspectCodes.length > 0 ? (
        <AspectsConsidered
          colors={colors}
          codes={lensKeyAspectCodes}
          codeToDescription={codeToDescription}
          personAName={personAName}
          personBName={personBName}
        />
      ) : null}
    </View>
  );
}

interface AspectsConsideredProps {
  colors: RelationshipTheme['colors'];
  codes: string[];
  codeToDescription: Record<string, string>;
  personAName: string;
  personBName: string;
}

function AspectsConsidered({
  colors,
  codes,
  codeToDescription,
  personAName,
  personBName,
}: AspectsConsideredProps) {
  const [expanded, setExpanded] = useState(false);

  const items = codes.map((code) => {
    const known = codeToDescription[code];
    if (known) return { code, label: known };
    const decoded = decodeAstroCode(code, {
      person1Name: personAName,
      person2Name: personBName,
    });
    if (decoded?.pretty) return { code, label: decoded.pretty };
    return { code, label: code };
  });

  return (
    <View style={styles.aspectsConsideredWrap}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpanded((prev) => !prev)}
        style={[
          styles.aspectsConsideredHeader,
          { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
        ]}
      >
        <Text style={[styles.aspectsConsideredLabel, { color: colors.textSubtle }]}>
          Aspects considered · {items.length}
        </Text>
        <Text
          style={[
            styles.aspectsConsideredChevron,
            { color: colors.textSubtle },
            expanded && styles.aspectsConsideredChevronOpen,
          ]}
        >
          ›
        </Text>
      </TouchableOpacity>
      {expanded ? (
        <View
          style={[
            styles.aspectsConsideredBody,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          {items.map((it, i) => (
            <Text
              key={`${it.code}-${i}`}
              style={[styles.aspectsConsideredItem, { color: colors.textMuted }]}
            >
              • {it.label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
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
  keystoneCluster: {
    fontSize: 10,
    marginTop: 4,
  },
  aspectMixRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aspectMixCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  aspectMixCount: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  aspectMixLabel: {
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dwTheme: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  dwAspectLine: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
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
  pillScroll: {
    marginHorizontal: -20,
    marginBottom: 14,
  },
  pillScrollContent: {
    paddingHorizontal: 20,
    gap: 6,
  },
  clusterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  pillIcon: {
    fontSize: 14,
  },
  pillName: {
    fontSize: 12.5,
  },
  pillScore: {
    fontFamily: 'Georgia',
    fontSize: 14,
    fontWeight: '700',
  },
  lensRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  lensTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  lensTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clusterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  clusterHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterHeaderIconText: {
    fontSize: 22,
  },
  clusterHeaderMeta: {
    flex: 1,
  },
  clusterHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clusterHeaderName: {
    fontSize: 18,
    fontWeight: '700',
  },
  clusterHeaderScore: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
  },
  clusterHeaderSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  aspectsConsideredWrap: {
    marginTop: 6,
  },
  aspectsConsideredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  aspectsConsideredLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  aspectsConsideredChevron: {
    fontSize: 18,
    fontWeight: '500',
  },
  aspectsConsideredChevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  aspectsConsideredBody: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  aspectsConsideredItem: {
    fontSize: 12.5,
    lineHeight: 18,
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
  keystoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    marginBottom: 3,
  },
});
