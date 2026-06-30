import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Polygon,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { StackScreenProps } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { useRelationshipAppStore } from '../store';
import { Avatar } from '../components/Avatar';
import { CreditPill } from '../components/CreditPill';
import { AskIrisCard } from '../components/AskIrisCard';
import { ModifierChipRow } from '../components/shape/ModifierChipRow';
import {
  FlavorTag,
  PatternDetailCard,
} from '../components/strength/RelationshipStrength';
import { DetailArchetypeLabel } from '../components/strength/DetailArchetypeLabel';
import { CompositeChip } from '../components/strength/CompositeChip';
import { scoreColor, HEAT_STOPS } from '../components/strength/heat';
import { buildStrengthModel } from '../components/strength/strengthModel';
import { Stardust } from '../components/atmosphere/Stardust';
import { Halo } from '../components/atmosphere/Halo';
import { relationshipUsersApi } from '../../../shared/api/relationshipUsers';
import { relationshipsApi, discoverApi } from '../api';
import { useRelationshipAnalysisWorkflow } from '../hooks/useRelationshipAnalysisWorkflow';
import { useRelationshipHistory } from '../hooks/useRelationshipHistory';
import { FullAnalysisSection } from '../components/FullAnalysisSection';

type Props = StackScreenProps<RelationshipRootParamList, 'RelationshipPreview'>;

type Stage = 1 | 2 | 3 | 4;

const CLUSTER_ORDER: readonly ('Harmony' | 'Passion' | 'Connection' | 'Stability' | 'Growth')[] = [
  'Harmony',
  'Passion',
  'Connection',
  'Stability',
  'Growth',
];

const FULL_RELATIONSHIP_ANALYSIS_COST = 60;

// What generating the full reading unlocks — shown in the locked gate.
const FULL_ANALYSIS_UNLOCKS = [
  'The full written overview of how your charts work together',
  'The composite chart — the relationship read as its own entity',
  'Cluster-by-cluster breakdown of what works and what’s difficult',
  'Your keystone and double-whammy aspects',
];

const RELATIONSHIP_ASK_COPY = {
  title: 'Questions about this connection',
  subtitle: 'Insights grounded in your synastry',
  inputPlaceholder: 'Ask anything about this relationship…',
  suggestions: [
    'What is the strongest part of this connection?',
    'Where are we most likely to misunderstand each other?',
    'What should I pay attention to before getting more invested?',
  ],
} as const;

function toPercent(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getInitial(name?: string | null): string {
  if (!name) return '·';
  const trimmed = name.trim();
  return trimmed.charAt(0).toUpperCase() || '·';
}

export const RelationshipPreviewScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const previewAnalysis = useRelationshipAppStore((state) => state.previewAnalysis);
  const activeTargetSubject = useRelationshipAppStore((state) => state.activeTargetSubject);
  const activePartnerRomanticAssets = useRelationshipAppStore(
    (state) => state.activePartnerRomanticAssets
  );
  const fullAnalysis = useRelationshipAppStore((state) => state.fullAnalysis);
  const workflowPhase = useRelationshipAppStore((state) => state.workflowPhase);
  const workflowError = useRelationshipAppStore((state) => state.workflowError);
  const profile = useRelationshipAppStore((state) => state.profile);
  const credits = useRelationshipAppStore((state) => state.credits);
  const clearActiveRelationshipFlow = useRelationshipAppStore(
    (state) => state.clearActiveRelationshipFlow
  );
  const setActivePartnerRomanticAssets = useRelationshipAppStore(
    (state) => state.setActivePartnerRomanticAssets
  );
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setFullAnalysis = useRelationshipAppStore((state) => state.setFullAnalysis);
  const askThreads = useRelationshipAppStore((state) => state.askThreads);
  const activeRelationshipId = useRelationshipAppStore((state) => state.activeRelationshipId);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const upsertRelationshipInHistory = useRelationshipAppStore(
    (state) => state.upsertRelationshipInHistory
  );
  const { startFullAnalysis } = useRelationshipAnalysisWorkflow(activeRelationshipId);
  const { refreshHistory } = useRelationshipHistory(false);
  const didRefreshAfterCompletionRef = useRef<string | null>(null);

  useEffect(() => {
    if (workflowPhase !== 'completed') return;
    const idToRefresh = activeRelationshipId ?? previewAnalysis?.compositeChartId ?? null;
    if (!idToRefresh) return;
    if (didRefreshAfterCompletionRef.current === idToRefresh) return;
    didRefreshAfterCompletionRef.current = idToRefresh;
    refreshHistory(true).catch(() => undefined);
  }, [activeRelationshipId, previewAnalysis?.compositeChartId, refreshHistory, workflowPhase]);

  const partnerIdForHydration = previewAnalysis?.userB?.id ?? null;
  const isCelebrityRelationship = Boolean(
    previewAnalysis?.metadata?.isCelebrityRelationship
  );

  useEffect(() => {
    if (activePartnerRomanticAssets) return;
    if (!partnerIdForHydration) return;

    let cancelled = false;

    const loader = isCelebrityRelationship
      ? discoverApi.getCelebrityProfile(partnerIdForHydration).then((result) => ({
          birthChart: (result.birthChart ?? null) as Record<string, unknown> | null,
          overview: result.overview ?? null,
          romanticProfileBlurb: result.romanticProfileBlurb ?? null,
          referencedCodes: result.referencedCodes ?? [],
          overviewMode: result.overviewMode ?? null,
          status: 'celeb_profile_loaded' as const,
        }))
      : relationshipUsersApi.getGuestSubjectRomantic(partnerIdForHydration).then((result) => ({
          birthChart: result.birthChart,
          overview: result.overview,
          romanticProfileBlurb: result.romanticProfileBlurb,
          referencedCodes: result.referencedCodes,
          overviewMode: result.overviewMode,
          status: result.status,
        }));

    loader
      .then((assets) => {
        if (cancelled) return;
        setActivePartnerRomanticAssets(assets);
      })
      .catch((error) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[RelationshipPreviewScreen] hydrate romantic assets failed', {
            partnerIdForHydration,
            isCelebrityRelationship,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activePartnerRomanticAssets,
    partnerIdForHydration,
    isCelebrityRelationship,
    setActivePartnerRomanticAssets,
  ]);

  const hasInitialOverview = Boolean(previewAnalysis?.initialOverview?.trim());
  const hasFullAnalysisInStore = Boolean(fullAnalysis);
  const compositeChartIdForHydration = previewAnalysis?.compositeChartId ?? activeRelationshipId ?? null;
  const hydratedRef = useRef<string | null>(null);
  const previewAnalysisRef = useRef(previewAnalysis);
  previewAnalysisRef.current = previewAnalysis;

  useEffect(() => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[RelationshipPreviewScreen] hydrate effect fire', {
        compositeChartIdForHydration,
        hasInitialOverview,
        hasFullAnalysisInStore,
        hydratedRefCurrent: hydratedRef.current,
        willSkip:
          !compositeChartIdForHydration ||
          (hasInitialOverview && hasFullAnalysisInStore) ||
          hydratedRef.current === compositeChartIdForHydration,
      });
    }
    if (!compositeChartIdForHydration) return;
    // If both pieces of data are already present, nothing to hydrate.
    if (hasInitialOverview && hasFullAnalysisInStore) return;
    if (hydratedRef.current === compositeChartIdForHydration) return;

    let cancelled = false;
    hydratedRef.current = compositeChartIdForHydration;
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[RelationshipPreviewScreen] hydrate fetch start', {
        compositeChartIdForHydration,
      });
    }

    relationshipsApi
      .fetchRelationshipAnalysis(compositeChartIdForHydration)
      .then((result) => {
        if (cancelled) return;
        const current = previewAnalysisRef.current;
        if (current && current.compositeChartId !== compositeChartIdForHydration) return;

        const fetchedOverview = result?.initialOverview?.trim();
        const hasCompleteAnalysis =
          Boolean((result as any)?.completeAnalysis) &&
          Object.keys(((result as any)?.completeAnalysis ?? {})).length > 0;
        const workflowDone = (result as any)?.workflowStatus?.status === 'completed';

        // Patch initialOverview and chart payloads into previewAnalysis when
        // the saved row didn't carry them. The Full Chart modal reads
        // compositeChart and synastryAspects from previewAnalysis first, so
        // celebrity-relationship rows that come back without them otherwise
        // render the "isn't available" empty state.
        // NOTE: store's setPreviewAnalysis side-effect resets fullAnalysis to null,
        // so we always re-apply setFullAnalysis below when the response has it.
        if (current) {
          const patches: Partial<typeof current> = {};
          if (fetchedOverview && !current.initialOverview?.trim()) {
            patches.initialOverview = fetchedOverview;
          }
          const fetchedComposite = (result as any)?.compositeChart;
          if (
            fetchedComposite &&
            !Array.isArray((current.compositeChart as any)?.planets)
          ) {
            patches.compositeChart =
              fetchedComposite as typeof current.compositeChart;
          }
          const fetchedSynastry = (result as any)?.synastryAspects;
          if (
            Array.isArray(fetchedSynastry) &&
            (!Array.isArray(current.synastryAspects) ||
              current.synastryAspects.length === 0)
          ) {
            patches.synastryAspects =
              fetchedSynastry as typeof current.synastryAspects;
          }
          const fetchedHouses = (result as any)?.synastryHousePlacements;
          if (
            fetchedHouses &&
            !current.synastryHousePlacements
          ) {
            patches.synastryHousePlacements =
              fetchedHouses as typeof current.synastryHousePlacements;
          }
          // compositeCharacter is a top-level field only on the analysis read (not on the
          // create response the store was seeded with), so patch it in here.
          const fetchedCompositeCharacter = (result as any)?.compositeCharacter;
          if (fetchedCompositeCharacter && !current.compositeCharacter) {
            patches.compositeCharacter =
              fetchedCompositeCharacter as typeof current.compositeCharacter;
          }
          if (Object.keys(patches).length > 0) {
            setPreviewAnalysis({
              ...current,
              ...patches,
            });
          }
        }

        // Always restore/set fullAnalysis when the saved analysis is complete,
        // regardless of the closure's hasFullAnalysisInStore.
        if (hasCompleteAnalysis || workflowDone) {
          setFullAnalysis(result);
        }

        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[RelationshipPreviewScreen] hydrate result', {
            compositeChartId: compositeChartIdForHydration,
            hasCompleteAnalysis,
            workflowDone,
            hadInitialOverview: hasInitialOverview,
            patchedInitialOverview: Boolean(fetchedOverview && !current?.initialOverview?.trim()),
            calledSetFullAnalysis: hasCompleteAnalysis || workflowDone,
          });
        }
      })
      .catch((error) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[RelationshipPreviewScreen] hydrate failed', {
            compositeChartId: compositeChartIdForHydration,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        if (hydratedRef.current === compositeChartIdForHydration) {
          hydratedRef.current = null;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    compositeChartIdForHydration,
    hasInitialOverview,
    hasFullAnalysisInStore,
    setPreviewAnalysis,
    setFullAnalysis,
  ]);

  const stage: Stage = useMemo(() => {
    if (fullAnalysis) return 4;
    if (previewAnalysis && (workflowPhase === 'starting' || workflowPhase === 'polling')) return 3;
    if (previewAnalysis) return 2;
    return 1;
  }, [fullAnalysis, previewAnalysis, workflowPhase]);

  if (__DEV__) {
    console.log('[RelationshipPreviewScreen] stage', {
      stage,
      fullAnalysis: fullAnalysis === null || fullAnalysis === undefined ? 'null' : 'truthy',
      previewAnalysis: previewAnalysis === null || previewAnalysis === undefined ? 'null' : 'truthy',
      workflowPhase,
      previewCompositeChartId: previewAnalysis?.compositeChartId,
      fullAnalysisKeys: fullAnalysis ? Object.keys(fullAnalysis as object) : null,
    });
  }

  const partnerName = previewAnalysis?.userB.name ?? (activeTargetSubject?.firstName ?? 'Your partner');
  const selfName = previewAnalysis?.userA.name ?? (profile?.firstName ?? 'You');
  const partnerInitial = getInitial(partnerName);
  const selfInitial = getInitial(selfName);
  // For celeb-celeb relationships the signed-in user isn't either side of the
  // pair, so show both names rather than the pronoun "You".
  const isCelebPairRelationship = Boolean(
    previewAnalysis?.metadata?.isCelebrityRelationship &&
      previewAnalysis?.userA?.id &&
      previewAnalysis?.userA?.id !== profile?.id
  );
  const pairTitle = isCelebPairRelationship
    ? `${selfName} & ${partnerName}`
    : `You & ${partnerName}`;
  // userA/userB in a celeb-pair preview carry profilePhotoUrl (set in DiscoverScreen
  // when building the preview from /getCelebRelationships). Fall back to
  // activeTargetSubject.profilePhotoUrl for the user-owned flow, and to the
  // signed-in profile photo for the self side.
  const userAPhotoUrl =
    (previewAnalysis?.userA as { profilePhotoUrl?: string | null } | undefined)?.profilePhotoUrl ??
    null;
  const userBPhotoUrl =
    (previewAnalysis?.userB as { profilePhotoUrl?: string | null } | undefined)?.profilePhotoUrl ??
    null;
  const selfPhotoUri =
    userAPhotoUrl ??
    (profile?.subject as { profilePhotoUrl?: string | null } | undefined)?.profilePhotoUrl ??
    null;
  const partnerPhotoUri =
    userBPhotoUrl ??
    (activeTargetSubject as { profilePhotoUrl?: string | null } | null)?.profilePhotoUrl ??
    null;

  const overallSummary = previewAnalysis?.overall?.summary ?? null;
  // Prefer the detail-tier archetype (Common Cause, Fated Bond, Bedrock, …); Mosaic (suppressed)
  // falls back to the legacy cluster archetype label.
  const detailArchetype = overallSummary?.detailArchetype ?? null;
  const archetypeLabel =
    detailArchetype?.label && !detailArchetype.suppressed
      ? detailArchetype.label
      : overallSummary?.label ?? null;
  const archetypeBlurb = overallSummary?.blurb ?? null;
  // Composite "character" coordinate — the relationship as an entity (element + dominant planet).
  // Top-level on the analysis read; fall back to fullAnalysis when present.
  const compositeCharacter =
    previewAnalysis?.compositeCharacter ?? (fullAnalysis as any)?.compositeCharacter ?? null;
  const shapeKind = overallSummary?.shapeKind ?? null;
  const modifiers = overallSummary?.modifiers ?? [];
  // Strength-first model: a continuous Relationship Strength reading (unweighted
  // mean of the five pillars) leads; the archetype is demoted to a detail card.
  const strengthModel = buildStrengthModel(previewAnalysis?.clusters, overallSummary);
  const keyAspect = previewAnalysis?.overall?.keystoneAspects?.[0] ?? null;
  const initialOverview = previewAnalysis?.initialOverview ?? null;
  const romanticBlurb = activePartnerRomanticAssets?.romanticProfileBlurb ?? null;

  const relationshipThreadKey = useMemo(() => {
    const id = activeRelationshipId ?? previewAnalysis?.compositeChartId ?? null;
    return id ? `relationship:${id}` : null;
  }, [activeRelationshipId, previewAnalysis?.compositeChartId]);

  const relationshipThread = useMemo(
    () => (relationshipThreadKey ? askThreads[relationshipThreadKey] ?? [] : []),
    [askThreads, relationshipThreadKey]
  );
  const lastRelationshipUserMessage = useMemo(
    () => [...relationshipThread].reverse().find((message) => message.role === 'user') ?? null,
    [relationshipThread]
  );
  const lastRelationshipIrisMessage = useMemo(
    () => [...relationshipThread].reverse().find((message) => message.role === 'iris') ?? null,
    [relationshipThread]
  );

  const openRelationshipAsk = useCallback(
    (prefill?: string) => {
      navigation.navigate('AskIris', {
        context: 'relationship',
        relationshipLabel: `${selfName} + ${partnerName}`,
        threadKey: relationshipThreadKey ?? undefined,
        prefill,
      });
    },
    [navigation, partnerName, relationshipThreadKey, selfName]
  );

  const clusterScores = useMemo(() => {
    if (!previewAnalysis) {
      return CLUSTER_ORDER.map((label) => ({ label, value: 0 }));
    }
    return CLUSTER_ORDER.map((label) => ({
      label,
      value: toPercent(previewAnalysis.clusters?.[label]?.score),
    }));
  }, [previewAnalysis]);

  // Guard AFTER all hooks so the hook order stays stable across renders
  // (react-hooks/rules-of-hooks). Every const/hook above is null-safe.
  if (!previewAnalysis && !activeTargetSubject) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>Preview</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No preview is loaded yet.
          </Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            Create a partner profile first so Iris can calculate the connection.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.replace('AddConnection')}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              Create Partner
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Stardust density={60} seed={4} color={colors.primary} />
      </View>
      <Halo color={colors.primary} size={460} opacity={0.1} top={120} left="50%" />
      <View style={styles.navBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            // Prefer a plain pop so we land back on whichever tab the user came
            // from (Discover for Famous Connections, Relationships for history
            // items, etc). Reset only when the stack is empty.
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main', params: { screen: 'RelationshipsTab' } }],
            });
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.navBackLabel, { color: colors.textMuted }]}>← Back</Text>
        </TouchableOpacity>
        <CreditPill
          balance={credits?.balance ?? null}
          onPress={() => navigation.navigate('Main', { screen: 'Profile' } as never)}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity header */}
        <View style={styles.identityHeader}>
          <View style={styles.avatarPair}>
            <View style={[styles.avatarWrap, styles.avatarLeft, { borderColor: colors.background }]}>
              <Avatar
                size={56}
                gradient="lavender"
                fallbackInitial={selfInitial}
                photoUri={selfPhotoUri}
              />
            </View>
            <View style={[styles.avatarWrap, styles.avatarRight, { borderColor: colors.background }]}>
              <Avatar
                size={56}
                gradient="green"
                fallbackInitial={partnerInitial}
                photoUri={partnerPhotoUri}
              />
            </View>
          </View>
          <Text style={[styles.identityTitle, { color: colors.text }]}>
            {pairTitle}
          </Text>
          {stage >= 2 && keyAspect ? (
            <Text style={[styles.identitySubtitle, { color: colors.textSubtle }]}>
              {keyAspect.description}
            </Text>
          ) : stage < 2 ? (
            <Text style={[styles.identitySubtitleItalic, { color: colors.textSubtle }]}>
              Analyzing charts…
            </Text>
          ) : null}
        </View>

        {/* Stage 1: loading shimmer while scores compute */}
        {stage === 1 ? (
          <View
            style={[
              styles.loadingCard,
              { backgroundColor: colors.surfaceLow },
            ]}
          >
            <PulseDots color={colors.primary} />
            <Text style={[styles.serifItalicCenter, { color: colors.textMuted }]}>
              Calculating your connection…
            </Text>
            <Text style={[styles.loadingHint, { color: colors.textSubtle }]}>
              Analyzing aspects across both charts
            </Text>
          </View>
        ) : null}

        {/* Stage 2+ content */}
        {stage >= 2 && previewAnalysis ? (
          <>
            <Divider color={colors.ghostBorder} />

            {/* Unified hero: the pentagon radar IS the five pillars (per-axis
                numbers), and carries the overall Relationship Strength score in
                its center core — one screenshottable visual, nothing twice. */}
            {strengthModel ? (
              <View style={styles.heroGroup}>
                <RadarHero
                  data={clusterScores}
                  strengthScore={strengthModel.strengthScore}
                  colors={colors}
                />
                <Text style={[styles.strengthCaption, { color: colors.textMuted }]}>
                  RELATIONSHIP STRENGTH
                </Text>
                <HeatLegend />
                <View style={styles.flavorCenter}>
                  <FlavorTag
                    flavorPresent={strengthModel.flavorPresent}
                    flavorCluster={strengthModel.flavorCluster}
                  />
                </View>
              </View>
            ) : null}

            {/* Reading headline: detail archetype (3) + composite character chip
                (4) + unlock status — the Overview's identity section. */}
            {archetypeLabel || compositeCharacter ? (
              <View style={styles.readingHeadline}>
                {archetypeLabel ? (
                  <DetailArchetypeLabel
                    detail={detailArchetype}
                    fallbackLabel={archetypeLabel}
                    size="lg"
                  />
                ) : null}
                {compositeCharacter ? (
                  <View style={styles.readingChip}>
                    <CompositeChip composite={compositeCharacter} />
                  </View>
                ) : null}
                {hasFullAnalysisInStore ? (
                  <View style={styles.unlockedPill}>
                    <Text style={styles.unlockedPillText}>✓ Full analysis unlocked</Text>
                  </View>
                ) : (
                  <View style={styles.notGeneratedPill}>
                    <Text style={styles.notGeneratedPillText}>Full analysis not generated yet</Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* Texture chips (energy modifiers) */}
            {modifiers.length > 0 ? (
              <ModifierChipRow
                modifiers={modifiers}
                max={4}
                align="center"
                style={styles.modifierRow}
              />
            ) : null}

            {/* The reading — titled with the DETAIL archetype so it matches its
                blurb (which is the detail-archetype copy). The cluster/shape name
                (summary.label) is intentionally NOT shown as a name here — the
                "Broad across the five pillars" strength pill conveys the shape. */}
            {archetypeLabel || archetypeBlurb ? (
              <PatternDetailCard
                pattern={archetypeLabel}
                blurb={archetypeBlurb}
                shapeKind={shapeKind}
              />
            ) : null}

            {/* Composite character phrase — the "what the relationship is" entity
                description. The short label itself is shown as the chip above, so
                this card carries only the longer phrase. */}
            {compositeCharacter?.phrase ? (
              <View
                style={[
                  styles.compositeCharacterCard,
                  { backgroundColor: colors.surfaceLow, borderColor: colors.ghostBorder },
                ]}
              >
                <Text style={[styles.compositeCharacterEyebrow, { color: colors.textSubtle }]}>
                  The relationship itself
                </Text>
                <Text style={[styles.compositeCharacterPhrase, { color: colors.textMuted }]}>
                  {compositeCharacter.phrase}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}

        {/* Stage 2: unlock CTA — single tap starts workflow inline */}
        {stage === 2 ? (
          <>
            <Divider color={colors.ghostBorder} />
            <View
              style={[
                styles.unlockCard,
                { backgroundColor: colors.surfaceLow, borderColor: 'rgba(202, 190, 255, 0.20)' },
              ]}
            >
              <Text style={[styles.unlockTitle, { color: colors.text }]}>
                Generate the full reading
              </Text>
              <View style={styles.unlockList}>
                {FULL_ANALYSIS_UNLOCKS.map((item) => (
                  <View key={item} style={styles.unlockItem}>
                    <Text style={[styles.unlockBullet, { color: colors.accent }]}>◆</Text>
                    <Text style={[styles.unlockItemText, { color: colors.textMuted }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.unlockButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  startFullAnalysis().catch(() => undefined);
                }}
              >
                <Text style={[styles.unlockButtonText, { color: colors.onPrimary }]}>
                  {`Unlock Full Analysis · ◆ ${FULL_RELATIONSHIP_ANALYSIS_COST}`}
                </Text>
              </TouchableOpacity>
              {workflowPhase === 'error' && workflowError ? (
                <Text style={[styles.unlockError, { color: colors.error }]}>
                  {workflowError}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Stage 3: workflow running — show initial reading + loading icon below */}
        {stage === 3 ? (
          <>
            <Divider color={colors.ghostBorder} />
            {workflowPhase === 'starting' || !initialOverview ? (
              <View
                style={[
                  styles.progressCard,
                  { backgroundColor: colors.surfaceLow },
                ]}
              >
                <PulseDots color={colors.primary} />
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  Starting full analysis…
                </Text>
              </View>
            ) : (
              <>
                <View>
                  <SectionLabel color={colors.accent}>Initial Reading</SectionLabel>
                  <ExpandableReading text={initialOverview} />
                </View>
                <View
                  style={[
                    styles.progressCard,
                    { backgroundColor: colors.surfaceLow },
                  ]}
                >
                  <PulseDots color={colors.primary} />
                  <Text style={[styles.progressTitle, { color: colors.text }]}>
                    Generating full analysis…
                  </Text>
                  <Text style={[styles.progressHint, { color: colors.textMuted }]}>
                    Usually 30–60 seconds
                  </Text>
                </View>
              </>
            )}
          </>
        ) : null}

        {/* Stage 4: unlocked full analysis */}
        {stage === 4 ? (
          <FullAnalysisSection
            colors={colors}
            initialOverview={initialOverview}
            fullAnalysis={fullAnalysis}
            previewAnalysis={previewAnalysis}
            personAName={selfName}
            personBName={partnerName}
            selfBirthChart={profile?.subject?.birthChart as any}
            partnerBirthChart={activePartnerRomanticAssets?.birthChart as any}
            relationship={
              relationshipHistory.find((entry) => entry._id === activeRelationshipId) ?? null
            }
            onRelationshipUpdated={upsertRelationshipInHistory}
            isCelebPair={isCelebPairRelationship}
          />
        ) : null}

        {/* Individual romantic profile — about ONE person, not the couple.
            Lives below the couple reading, clearly labelled, so it is never
            mistaken for the relationship's own identity. */}
        {romanticBlurb ? (
          <View>
            <SectionLabel color={colors.accent}>
              {partnerName.split(' ')[0]}&apos;s Romantic Profile
            </SectionLabel>
            <View style={[styles.softCard, { backgroundColor: colors.surfaceLow }]}>
              <Text style={[styles.serifItalic, { color: colors.text }]}>{romanticBlurb}</Text>
            </View>
            <Text style={[styles.individualProfileCaption, { color: colors.textSubtle }]}>
              Reads {partnerName.split(' ')[0]}&apos;s chart on its own — independent of your synastry.
            </Text>
          </View>
        ) : null}

        {/* Ask Iris card — normalized entry point */}
        {stage >= 2 ? (
          <View style={styles.askBlock}>
            <SectionLabel color={colors.accent}>Ask Iris About This Relationship</SectionLabel>
            <AskIrisCard
              copy={RELATIONSHIP_ASK_COPY}
              lastUserMessage={lastRelationshipUserMessage}
              lastIrisMessage={lastRelationshipIrisMessage}
              onPressInput={openRelationshipAsk}
              onPressContinue={() => openRelationshipAsk()}
            />
          </View>
        ) : null}

        {/* Secondary actions — always at the bottom of the scroll content */}
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.ghostBorder }]}
            onPress={() => {
              clearActiveRelationshipFlow();
              navigation.replace('AddConnection');
            }}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Start Another Preview
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Subcomponents ─────────────────────────────────────────────────────────

interface SectionLabelProps {
  children: React.ReactNode;
  color: string;
}

function SectionLabel({ children, color }: SectionLabelProps) {
  return <Text style={[styles.sectionEyebrow, { color }]}>{children}</Text>;
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

const READING_COLLAPSED_LINES = 6;

function ExpandableReading({ text }: { text: string }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);

  return (
    <View
      style={[
        styles.softCard,
        { backgroundColor: colors.surfaceLow },
      ]}
    >
      <Text
        style={[styles.serifItalic, { color: colors.text }]}
        numberOfLines={expanded ? undefined : READING_COLLAPSED_LINES}
        onTextLayout={(event) => {
          if (!expanded && event.nativeEvent.lines.length >= READING_COLLAPSED_LINES) {
            setNeedsToggle(true);
          }
        }}
      >
        {text}
      </Text>
      {needsToggle ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpanded((prev) => !prev)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={styles.expandToggle}
        >
          <Text style={[styles.expandToggleText, { color: colors.primary }]}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// Animated pulsing dots (stage 1 loader, stage 3 progress)
function PulseDots({ color }: { color: string }) {
  const pulses = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    const loops = pulses.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(value, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [pulses]);

  return (
    <View style={styles.pulseRow}>
      {pulses.map((value, i) => (
        <Animated.View
          key={i}
          style={[
            styles.pulseDot,
            {
              backgroundColor: color,
              opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
              transform: [
                {
                  scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

// Compact heat key — decodes the radar's colour melange (cool → hot).
function HeatLegend() {
  const { colors } = useTheme();
  return (
    <View style={styles.heatLegend}>
      <Text style={[styles.heatLegendCap, { color: colors.textSubtle }]}>COOL</Text>
      <Svg width={132} height={6} viewBox="0 0 132 6">
        <Defs>
          <LinearGradient id="heatKey" x1="0" y1="0" x2="132" y2="0" gradientUnits="userSpaceOnUse">
            {HEAT_STOPS.map((c, i) => (
              <Stop key={c} offset={`${(i / (HEAT_STOPS.length - 1)) * 100}%`} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={132} height={6} rx={3} fill="url(#heatKey)" />
      </Svg>
      <Text style={[styles.heatLegendCap, { color: colors.textSubtle }]}>HOT</Text>
    </View>
  );
}

// ── Radar chart ───────────────────────────────────────────────────────────
interface RadarChartProps {
  data: { label: string; value: number }[];
  colors: ReturnType<typeof useTheme>['colors'];
  // Keeps every vertex outside the center core so a single low score can't
  // pinch the shape into a notch. Per-axis numbers stay truthful.
  floor?: number;
}

const RADAR_WIDTH = 300;
const RADAR_HEIGHT = 260;
const RADAR_CENTER_X = RADAR_WIDTH / 2;
const RADAR_CENTER_Y = RADAR_HEIGHT / 2;
const RADAR_MAX_R = 86;
const RADAR_RINGS = 3;

function polarToCartesian(index: number, count: number, radius: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: RADAR_CENTER_X + Math.cos(angle) * radius,
    y: RADAR_CENTER_Y + Math.sin(angle) * radius,
  };
}

function RadarChart({ data, colors, floor = 0 }: RadarChartProps) {
  const count = data.length;
  const valueRadius = (value: number) =>
    (floor + (1 - floor) * (Math.max(0, Math.min(100, value)) / 100)) * RADAR_MAX_R;

  const ringPolygons = Array.from({ length: RADAR_RINGS }).map((_, ringIndex) => {
    const radius = (RADAR_MAX_R * (ringIndex + 1)) / RADAR_RINGS;
    return data
      .map((_, i) => {
        const point = polarToCartesian(i, count, radius);
        return `${point.x},${point.y}`;
      })
      .join(' ');
  });

  const axisLines = data.map((_, i) => polarToCartesian(i, count, RADAR_MAX_R));

  // Per-vertex heat colours + coordinates. The coloured edges (gradient between
  // adjacent vertex colours) carry the signal; the body fill stays soft.
  const cols = data.map((entry) => scoreColor(entry.value));
  const dataPoints = data.map((entry, i) =>
    polarToCartesian(i, count, valueRadius(entry.value))
  );
  const dataPointsStr = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const labelOffsets: { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }[] = [
    { dx: 0, dy: -14, anchor: 'middle' },
    { dx: 18, dy: 4, anchor: 'start' },
    { dx: 12, dy: 18, anchor: 'start' },
    { dx: -12, dy: 18, anchor: 'end' },
    { dx: -18, dy: 4, anchor: 'end' },
  ];

  return (
    <Svg width="100%" height={RADAR_HEIGHT} viewBox={`0 0 ${RADAR_WIDTH} ${RADAR_HEIGHT}`}>
      <Defs>
        {dataPoints.map((p, i) => {
          const n = dataPoints[(i + 1) % dataPoints.length];
          return (
            <LinearGradient
              key={`edge-grad-${i}`}
              id={`radEdge${i}`}
              gradientUnits="userSpaceOnUse"
              x1={p.x}
              y1={p.y}
              x2={n.x}
              y2={n.y}
            >
              <Stop offset="0%" stopColor={cols[i]} />
              <Stop offset="100%" stopColor={cols[(i + 1) % cols.length]} />
            </LinearGradient>
          );
        })}
      </Defs>
      {ringPolygons.map((points, i) => (
        <Polygon
          key={`ring-${i}`}
          points={points}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.8}
          fill="none"
        />
      ))}
      {axisLines.map((endPoint, i) => (
        <Line
          key={`axis-${i}`}
          x1={RADAR_CENTER_X}
          y1={RADAR_CENTER_Y}
          x2={endPoint.x}
          y2={endPoint.y}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={0.8}
        />
      ))}
      {/* Body fill — soft, lets the coloured edges carry the signal */}
      <Polygon points={dataPointsStr} fill="rgba(202, 190, 255, 0.10)" stroke="none" />
      {/* Per-edge gradient strokes = the colour melange */}
      {dataPoints.map((p, i) => {
        const n = dataPoints[(i + 1) % dataPoints.length];
        return (
          <Line
            key={`edge-${i}`}
            x1={p.x}
            y1={p.y}
            x2={n.x}
            y2={n.y}
            stroke={`url(#radEdge${i})`}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        );
      })}
      {dataPoints.map((point, i) => (
        <Circle
          key={`dot-${i}`}
          cx={point.x}
          cy={point.y}
          r={4.5}
          fill={cols[i]}
          stroke="#12121a"
          strokeWidth={1.5}
        />
      ))}
      {data.map((entry, i) => {
        const point = polarToCartesian(i, count, RADAR_MAX_R);
        const off = labelOffsets[i] ?? labelOffsets[0];
        return (
          <React.Fragment key={`label-${i}`}>
            <SvgText
              x={point.x + off.dx}
              y={point.y + off.dy}
              fontSize={11}
              fill={colors.textMuted}
              fontWeight="500"
              textAnchor={off.anchor}
            >
              {entry.label}
            </SvgText>
            <SvgText
              x={point.x + off.dx}
              y={point.y + off.dy + 14}
              fontSize={14}
              fill={cols[i]}
              fontWeight="700"
              textAnchor={off.anchor}
            >
              {entry.value}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ── Radar hero ────────────────────────────────────────────────────────────
// The ONE screenshottable visual: the pentagon radar (= the five pillars with
// per-axis numbers) with the overall Relationship Strength score in its center
// core. Replaces the separate strength ring + pillar bars + spider so nothing
// is shown twice.
interface RadarHeroProps {
  data: { label: string; value: number }[];
  strengthScore: number;
  colors: ReturnType<typeof useTheme>['colors'];
}

function RadarHero({ data, strengthScore, colors }: RadarHeroProps) {
  const heat = scoreColor(strengthScore);
  return (
    <View style={styles.radarHero}>
      <RadarChart data={data} colors={colors} floor={0.42} />
      <View style={styles.radarHeroCoreWrap} pointerEvents="none">
        <View style={[styles.radarHeroCore, { backgroundColor: colors.background }]}>
          <Text
            style={[
              styles.radarHeroScore,
              { color: heat, textShadowColor: `${heat}66` },
            ]}
          >
            {Math.round(strengthScore)}
          </Text>
          <Text style={[styles.radarHeroCoreLabel, { color: colors.textMuted }]}>
            STRENGTH
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  navBackLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 18,
  },
  emptyState: {
    flex: 1,
    padding: 24,
    gap: 14,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  identityHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  avatarPair: {
    width: 96,
    height: 64,
    position: 'relative',
  },
  avatarWrap: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLeft: {
    left: 0,
    top: 0,
    zIndex: 2,
  },
  avatarRight: {
    right: 0,
    top: 6,
    zIndex: 1,
  },
  identityTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 28,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: -0.3,
    marginTop: 8,
  },
  identitySubtitle: {
    fontSize: 12,
    letterSpacing: 0.4,
    textAlign: 'center',
    marginHorizontal: 24,
  },
  identitySubtitleItalic: {
    fontFamily: SERIF_FONT,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionEyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  softCard: {
    borderRadius: 22,
    padding: 22,
  },
  serifItalic: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  expandToggle: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  expandToggleText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  serifItalicCenter: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingCard: {
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  loadingHint: {
    fontSize: 11.5,
    textAlign: 'center',
  },
  pulseRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  modifierRow: {
    marginTop: 4,
    marginBottom: 2,
  },
  heroGroup: {
    alignItems: 'center',
  },
  radarHero: {
    width: '100%',
    height: RADAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarHeroCoreWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarHeroCore: {
    // Diameter stays inside the floor ring (0.42 * RADAR_MAX_R ≈ 36px radius)
    // so a low pillar vertex is never hidden behind the core.
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(202,190,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarHeroScore: {
    fontFamily: SERIF_FONT,
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 28,
    letterSpacing: -0.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  radarHeroCoreLabel: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
  strengthCaption: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    textAlign: 'center',
    marginTop: 4,
  },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 14,
  },
  heatLegendCap: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  flavorCenter: {
    alignItems: 'center',
    marginTop: 14,
  },
  individualProfileCaption: {
    fontFamily: SERIF_FONT,
    fontSize: 11.5,
    fontStyle: 'italic',
    paddingLeft: 2,
    marginTop: 8,
  },
  compositeCharacterCard: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  compositeCharacterEyebrow: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  compositeCharacterPhrase: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  readingHeadline: {
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  readingChip: {
    alignItems: 'center',
  },
  unlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(165, 227, 184, 0.40)',
    backgroundColor: 'rgba(165, 227, 184, 0.10)',
  },
  unlockedPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: '#A5E3B8',
  },
  notGeneratedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(233, 195, 73, 0.40)',
    backgroundColor: 'rgba(233, 195, 73, 0.10)',
  },
  notGeneratedPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: '#e9c349',
  },
  unlockCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  unlockTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  unlockList: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 4,
    marginBottom: 14,
  },
  unlockItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  unlockBullet: {
    fontSize: 11,
    lineHeight: 19,
  },
  unlockItemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  unlockButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  unlockButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  unlockError: {
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 8,
  },
  progressCard: {
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressHint: {
    fontSize: 12,
  },
  askBlock: {
    paddingTop: 4,
  },
  footerActions: {
    gap: 12,
    paddingTop: 8,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
