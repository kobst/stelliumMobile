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
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { StackScreenProps } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import { Avatar } from '../components/Avatar';
import { CreditPill } from '../components/CreditPill';
import { AskIrisCard } from '../components/AskIrisCard';
import { relationshipUsersApi } from '../../../shared/api/relationshipUsers';

type Props = StackScreenProps<RelationshipRootParamList, 'RelationshipPreview'>;

type Stage = 1 | 2 | 3 | 4;

const CLUSTER_ORDER: readonly ('Harmony' | 'Passion' | 'Connection' | 'Stability' | 'Growth')[] = [
  'Harmony',
  'Passion',
  'Connection',
  'Stability',
  'Growth',
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
  const profile = useRelationshipAppStore((state) => state.profile);
  const credits = useRelationshipAppStore((state) => state.credits);
  const clearActiveRelationshipFlow = useRelationshipAppStore(
    (state) => state.clearActiveRelationshipFlow
  );
  const setActivePartnerRomanticAssets = useRelationshipAppStore(
    (state) => state.setActivePartnerRomanticAssets
  );
  const askThreads = useRelationshipAppStore((state) => state.askThreads);
  const activeRelationshipId = useRelationshipAppStore((state) => state.activeRelationshipId);

  const partnerIdForHydration = previewAnalysis?.userB?.id ?? null;
  const isCelebrityRelationship = Boolean(
    previewAnalysis?.metadata?.isCelebrityRelationship
  );

  useEffect(() => {
    if (activePartnerRomanticAssets) return;
    if (!partnerIdForHydration) return;
    if (isCelebrityRelationship) return;

    let cancelled = false;

    relationshipUsersApi
      .getGuestSubjectRomantic(partnerIdForHydration)
      .then((result) => {
        if (cancelled) return;
        setActivePartnerRomanticAssets({
          birthChart: result.birthChart,
          overview: result.overview,
          romanticProfileBlurb: result.romanticProfileBlurb,
          referencedCodes: result.referencedCodes,
          overviewMode: result.overviewMode,
          status: result.status,
        });
      })
      .catch((error) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[RelationshipPreviewScreen] hydrate romantic assets failed', {
            partnerIdForHydration,
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

  const stage: Stage = useMemo(() => {
    if (fullAnalysis) return 4;
    if (previewAnalysis && (workflowPhase === 'starting' || workflowPhase === 'polling')) return 3;
    if (previewAnalysis) return 2;
    return 1;
  }, [fullAnalysis, previewAnalysis, workflowPhase]);

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

  const partnerName = previewAnalysis?.userB.name ?? (activeTargetSubject?.firstName ?? 'Your partner');
  const selfName = previewAnalysis?.userA.name ?? (profile?.firstName ?? 'You');
  const partnerInitial = getInitial(partnerName);
  const selfInitial = getInitial(selfName);
  const partnerPhotoUri =
    (activeTargetSubject as { profilePhotoUrl?: string | null } | null)?.profilePhotoUrl ?? null;

  const archetypeLabel = previewAnalysis?.overall?.summary?.label ?? null;
  const archetypeBlurb = previewAnalysis?.overall?.summary?.blurb ?? null;
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

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.navBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main', params: { screen: 'RelationshipsTab' } }],
            })
          }
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
              <Avatar size={56} gradient="lavender" fallbackInitial={selfInitial} />
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
            You &amp; {partnerName}
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

        {/* Partner romantic blurb — always visible from stage 1 */}
        {romanticBlurb ? (
          <View>
            <SectionLabel color={colors.accent}>
              {partnerName.split(' ')[0]}&apos;s Romantic Profile
            </SectionLabel>
            <View
              style={[
                styles.softCard,
                { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
              ]}
            >
              <Text style={[styles.serifItalic, { color: colors.text }]}>{romanticBlurb}</Text>
            </View>
          </View>
        ) : null}

        {/* Stage 1: loading shimmer while scores compute */}
        {stage === 1 ? (
          <View
            style={[
              styles.loadingCard,
              { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
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

            {/* Archetype */}
            {archetypeLabel || archetypeBlurb ? (
              <View style={styles.archetypeBlock}>
                <SectionLabelCentered color={colors.accent}>
                  Your Connection
                </SectionLabelCentered>
                {archetypeLabel ? (
                  <Text style={[styles.archetypeLabel, { color: colors.text }]}>
                    {archetypeLabel}
                  </Text>
                ) : null}
                {archetypeBlurb ? (
                  <Text style={[styles.archetypeBlurb, { color: colors.textMuted }]}>
                    {archetypeBlurb}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Key aspect badge card */}
            {keyAspect ? (
              <View
                style={[
                  styles.keyAspectCard,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <View
                  style={[
                    styles.keyAspectBadge,
                    { backgroundColor: 'rgba(233, 195, 73, 0.14)' },
                  ]}
                >
                  <Text style={[styles.keyAspectBadgeText, { color: colors.accent }]}>
                    {keyAspect.cluster}
                  </Text>
                </View>
                <Text
                  style={[styles.keyAspectDesc, { color: colors.textMuted }]}
                  numberOfLines={3}
                >
                  {keyAspect.description}
                </Text>
              </View>
            ) : null}

            {/* Compatibility radar */}
            <View>
              <SectionLabel color={colors.accent}>Compatibility Shape</SectionLabel>
              <View
                style={[
                  styles.softCard,
                  styles.radarCard,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <RadarChart data={clusterScores} colors={colors} />
              </View>
            </View>

            {/* Initial reading */}
            {initialOverview ? (
              <View>
                <SectionLabel color={colors.accent}>Initial Reading</SectionLabel>
                <ExpandableReading text={initialOverview} />
              </View>
            ) : null}
          </>
        ) : null}

        {/* Stage 2 only: unlock CTA */}
        {stage === 2 ? (
          <>
            <Divider color={colors.ghostBorder} />
            <View
              style={[
                styles.unlockCard,
                { backgroundColor: colors.surface, borderColor: 'rgba(202, 190, 255, 0.15)' },
              ]}
            >
              <Text style={[styles.unlockTitle, { color: colors.text }]}>Go deeper</Text>
              <Text style={[styles.unlockCopy, { color: colors.textMuted }]}>
                Unlock full synastry and composite analysis across all 5 dimensions.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.unlockButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Unlock')}
              >
                <Text style={[styles.unlockButtonText, { color: colors.onPrimary }]}>
                  Unlock Full Analysis · ◆ 3
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {/* Stage 3: async workflow running (UI placeholder — workflow not wired yet) */}
        {stage === 3 ? (
          <>
            <Divider color={colors.ghostBorder} />
            <View
              style={[
                styles.progressCard,
                { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
              ]}
            >
              <PulseDots color={colors.primary} />
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                Full analysis in progress
              </Text>
              <Text style={[styles.progressHint, { color: colors.textMuted }]}>
                Usually 30–60 seconds
              </Text>
            </View>
          </>
        ) : null}

        {/* Stage 4: full analysis (placeholder — wire when workflow lands) */}
        {stage === 4 ? (
          <>
            <Divider color={colors.ghostBorder} />
            <View>
              <SectionLabel color={colors.accent}>The Full Picture</SectionLabel>
              <View
                style={[
                  styles.softCard,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <Text style={[styles.serifItalic, { color: colors.text }]}>
                  Full reading available. Deeper synastry, composite, and Ask Iris coming to this
                  screen.
                </Text>
              </View>
            </View>
          </>
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

function SectionLabelCentered({ children, color }: SectionLabelProps) {
  return <Text style={[styles.sectionEyebrowCentered, { color }]}>{children}</Text>;
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
        { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
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

// ── Radar chart ───────────────────────────────────────────────────────────
interface RadarChartProps {
  data: { label: string; value: number }[];
  colors: ReturnType<typeof useTheme>['colors'];
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

function RadarChart({ data, colors }: RadarChartProps) {
  const count = data.length;

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

  const dataPointsStr = data
    .map((entry, i) => {
      const radius = (entry.value / 100) * RADAR_MAX_R;
      const point = polarToCartesian(i, count, radius);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  const labelOffsets: { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }[] = [
    { dx: 0, dy: -14, anchor: 'middle' },
    { dx: 18, dy: 4, anchor: 'start' },
    { dx: 12, dy: 18, anchor: 'start' },
    { dx: -12, dy: 18, anchor: 'end' },
    { dx: -18, dy: 4, anchor: 'end' },
  ];

  return (
    <Svg width="100%" height={RADAR_HEIGHT} viewBox={`0 0 ${RADAR_WIDTH} ${RADAR_HEIGHT}`}>
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
      <Polygon
        points={dataPointsStr}
        fill="rgba(202, 190, 255, 0.2)"
        stroke={colors.primary}
        strokeWidth={2}
      />
      {data.map((entry, i) => {
        const radius = (entry.value / 100) * RADAR_MAX_R;
        const point = polarToCartesian(i, count, radius);
        return (
          <Circle
            key={`dot-${i}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={colors.primary}
            stroke={colors.background}
            strokeWidth={1.5}
          />
        );
      })}
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
              fontSize={13}
              fill={colors.primary}
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
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 0.2,
    marginTop: 4,
  },
  identitySubtitle: {
    fontSize: 12,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  identitySubtitleItalic: {
    fontSize: 12,
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
  sectionEyebrowCentered: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  softCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  radarCard: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  serifItalic: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 23,
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
    borderRadius: 18,
    borderWidth: 1,
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
  archetypeBlock: {
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  archetypeLabel: {
    fontSize: 28,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  archetypeBlurb: {
    fontSize: 14.5,
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 10,
    maxWidth: 320,
  },
  keyAspectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  keyAspectBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  keyAspectBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  keyAspectDesc: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  unlockCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  unlockTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  unlockCopy: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 12,
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
  progressCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 20,
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
