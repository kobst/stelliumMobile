import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { onboardingApi } from '../api';
import { CelebMatchSkeleton } from '../components/CelebMatchSkeleton';
import { FeaturesPreview } from '../components/FeaturesPreview';
import type {
  ClusterScores,
  OnboardingPreviewCelebResponse,
  OnboardingPreviewResponse,
  TopCelebMatch,
} from '../../../shared/api/onboarding';

type Props = StackScreenProps<RelationshipRootParamList, 'ProfileReveal'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 24;
const CAROUSEL_CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.72);
const CAROUSEL_CARD_GAP = 14;
const CAROUSEL_SNAP_INTERVAL = CAROUSEL_CARD_WIDTH + CAROUSEL_CARD_GAP;
const PHOTO_WIDTH = CAROUSEL_CARD_WIDTH;
const PHOTO_HEIGHT = Math.round(CAROUSEL_CARD_WIDTH * 0.95);
const MAX_CAROUSEL_MATCHES = 3;
const MATCHES_SKELETON_MIN_MS = 1200;

interface CelebCardProps {
  match: TopCelebMatch;
  onPress?: (celebId: string) => void;
  annotationLoading?: boolean;
}

const CLUSTER_NAMES: Array<keyof Omit<ClusterScores, 'overall'>> = [
  'Harmony',
  'Passion',
  'Connection',
  'Stability',
  'Growth',
];

const HIDDEN_SCORE_BLUR_LAYERS = [
  { dx: -2.2, dy: 0, opacity: 0.18 },
  { dx: 2.2, dy: 0, opacity: 0.18 },
  { dx: 0, dy: -1.4, opacity: 0.16 },
  { dx: 0, dy: 1.4, opacity: 0.16 },
  { dx: -1.2, dy: -0.8, opacity: 0.14 },
  { dx: 1.2, dy: 0.8, opacity: 0.14 },
  { dx: 0, dy: 0, opacity: 0.16 },
];

function getInitials(name: string | null): string {
  if (!name) {
    return '?';
  }
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getPlacementText(
  placement?: { compactDisplay?: string; display?: string } | null
): string | null {
  if (!placement) {
    return null;
  }

  return placement.compactDisplay ?? placement.display ?? null;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.trunc(hash * 31 + input.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(hash);
}

function pickRevealedCluster(
  celebId: string,
  scores: ClusterScores | null,
): { name: string; value: number } | null {
  if (!scores) {
    return null;
  }
  const index = hashString(celebId) % CLUSTER_NAMES.length;
  const name = CLUSTER_NAMES[index];
  return { name, value: scores[name] };
}

function roundScore(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return Math.round(value);
}

interface ScorePillProps {
  label: string;
  value: number | null;
  revealed: boolean;
}

const ScorePill: React.FC<ScorePillProps> = ({ label, value, revealed }) => {
  const { colors } = useTheme();
  const valueText = value ?? '--';
  const hiddenValueColorStyle = { color: colors.text };

  return (
    <View style={styles.scorePill}>
      <View style={styles.scorePillContent}>
        <View style={styles.scorePillValueWrap}>
          {revealed ? (
            <Text
              style={[styles.scorePillValue, { color: colors.primary }]}
              numberOfLines={1}
            >
              {valueText}
            </Text>
          ) : (
            <View style={styles.scorePillBlurStack}>
              {HIDDEN_SCORE_BLUR_LAYERS.map((layer, index) => (
                <Text
                  key={`${label}-blur-${index}`}
                  style={[
                    styles.scorePillValue,
                    styles.scorePillValueBlurLayer,
                    hiddenValueColorStyle,
                    {
                      opacity: layer.opacity,
                      transform: [{ translateX: layer.dx }, { translateY: layer.dy }],
                    },
                  ]}
                  numberOfLines={1}
                >
                  {valueText}
                </Text>
              ))}
            </View>
          )}
        </View>
        <Text
          style={[
            styles.scorePillLabel,
            { color: revealed ? colors.textMuted : colors.textSubtle },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
  );
};

const CelebCard: React.FC<CelebCardProps> = ({ match, onPress, annotationLoading }) => {
  const { colors } = useTheme();
  const aspect = match.selectedAspect;
  const userPlacement = getPlacementText(aspect.userPlacement);
  const celebPlacement = getPlacementText(aspect.celebPlacement);
  const placementSummary =
    userPlacement && celebPlacement
      ? `${userPlacement} • ${celebPlacement}`
      : userPlacement ?? celebPlacement;
  const annotation = match.annotation ?? aspect.annotation;
  const hasAnnotation = Boolean(annotation);
  const aspectTitle =
    annotation?.title ?? [aspect.label, aspect.shortMeaning].filter(Boolean).join(' · ');
  const aspectSentence = annotation?.sentence;

  const archetype = match.archetype;
  const revealedCluster = pickRevealedCluster(match.celebId, match.clusterScores);
  const roundedScores = CLUSTER_NAMES.map((name) => ({
    name,
    value: roundScore(match.clusterScores?.[name]),
    revealed: revealedCluster?.name === name,
  }));

  const cardBody = (
    <>
      {match.profilePhotoUrl ? (
        <Image
          source={{ uri: match.profilePhotoUrl }}
          style={styles.celebPhoto}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.celebPhotoPlaceholder, { backgroundColor: colors.surfaceHigh }]}>
          <Text style={[styles.celebInitials, { color: colors.textMuted }]}>
            {getInitials(match.celebName)}
          </Text>
        </View>
      )}

      <View style={styles.celebCardFooter}>
        <View style={styles.celebCardHeader}>
          <View style={styles.celebCardHeaderRow}>
            <Text
              style={[styles.celebAspectLabel, { color: colors.accent }]}
              numberOfLines={1}
            >
              {aspect.label}
            </Text>
          </View>
          <Text style={[styles.celebCardName, { color: colors.text }]} numberOfLines={1}>
            {match.celebName ?? 'Unknown'}
          </Text>
          {archetype ? (
            <Text
              style={[styles.archetypeLabel, { color: colors.primary }]}
              numberOfLines={1}
            >
              {archetype.label}
            </Text>
          ) : null}
        </View>
        {aspectTitle ? (
          <Text style={[styles.annotationTitle, { color: colors.text }]} numberOfLines={2}>
            {aspectTitle}
          </Text>
        ) : null}
        {placementSummary ? (
          <Text style={[styles.placementSummary, { color: colors.textSubtle }]} numberOfLines={1}>
            {placementSummary}
          </Text>
        ) : null}
        {aspectSentence ? (
          <View style={styles.annotationSentenceWrap}>
            <Text style={[styles.annotationSentence, { color: colors.textMuted }]}>
              {aspectSentence}
            </Text>
            <View pointerEvents="none" style={styles.annotationFade}>
              <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <Defs>
                  <SvgLinearGradient id="annotationFade" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={colors.surfaceLow} stopOpacity="0" />
                    <Stop offset="1" stopColor={colors.surfaceLow} stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100" height="100" fill="url(#annotationFade)" />
              </Svg>
            </View>
          </View>
        ) : annotationLoading && !hasAnnotation ? (
          <View style={styles.annotationLoadingRow}>
            <ActivityIndicator size="small" color={colors.textSubtle} />
            <Text style={[styles.annotationLoadingText, { color: colors.textSubtle }]}>
              Writing annotation...
            </Text>
          </View>
        ) : null}
        <View
          style={[
            styles.scorePillsRow,
            { backgroundColor: colors.surfaceHigh, borderColor: colors.ghostBorder },
          ]}
        >
          {roundedScores.map((score, index) => (
            <View
              key={score.name}
              style={[
                styles.scorePillColumn,
                index < roundedScores.length - 1 && {
                  borderRightWidth: StyleSheet.hairlineWidth,
                  borderRightColor: colors.ghostBorder,
                },
              ]}
            >
              <ScorePill
                label={score.name}
                value={score.value}
                revealed={score.revealed}
              />
            </View>
          ))}
        </View>
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.celebCard, { backgroundColor: colors.surfaceLow }]}>
        {cardBody}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.celebCard, { backgroundColor: colors.surfaceLow }]}
      onPress={() => onPress(match.celebId)}
      activeOpacity={0.85}
    >
      {cardBody}
    </TouchableOpacity>
  );
};

export const ProfileRevealScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const profileReveal = useRelationshipAppStore((state) => state.profileReveal);
  const guestProfileDraft = useRelationshipAppStore((state) => state.guestProfileDraft);
  const updateProfileReveal = useRelationshipAppStore((state) => state.updateProfileReveal);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchesStartedRef = useRef<string | null>(null);
  const annotationsStartedRef = useRef<string | null>(null);
  const [canRevealMatches, setCanRevealMatches] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanRevealMatches(true), MATCHES_SKELETON_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  const applyCelebResponse = useCallback((
    response: OnboardingPreviewCelebResponse,
    baseFullResponse: OnboardingPreviewResponse
  ) => {
    const nextFullResponse: OnboardingPreviewResponse = {
      ...baseFullResponse,
      celebMatchesStatus: response.celebMatchesStatus,
      celebAnnotationsStatus: response.celebAnnotationsStatus,
      celebAspectBank: response.celebAspectBank,
      topAspects: response.topAspects,
      topCelebMatches: response.topCelebMatches,
      status: baseFullResponse.status,
    };

    updateProfileReveal({
      previewId: response.previewId,
      value: {
        topAspects: response.topAspects,
        topCelebMatches: response.topCelebMatches ?? [],
        celebAspectBank: response.celebAspectBank,
        celebMatchesStatus: response.celebMatchesStatus,
        celebAnnotationsStatus: response.celebAnnotationsStatus,
        fullResponse: nextFullResponse,
      },
    });
  }, [updateProfileReveal]);

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!profileReveal) {
      matchesStartedRef.current = null;
      annotationsStartedRef.current = null;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      return;
    }

    if (matchesStartedRef.current !== profileReveal.previewId) {
      matchesStartedRef.current = null;
      annotationsStartedRef.current = null;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    }
  }, [profileReveal]);

  useEffect(() => {
    if (!profileReveal) {
      return;
    }

    const { previewId, claimToken, celebMatchesStatus, celebAnnotationsStatus } = profileReveal;
    const isLocalCompleted =
      celebMatchesStatus?.status === 'completed' && celebAnnotationsStatus?.status === 'completed';

    if (previewId === 'local-preview-id' || isLocalCompleted) {
      return;
    }

    const startMatches = async () => {
      matchesStartedRef.current = previewId;
      console.log('[celeb-matches] startCelebMatches request:', { previewId });
      try {
        const response = await onboardingApi.startCelebMatches(previewId, claimToken);
        console.log('[celeb-matches] startCelebMatches response:', JSON.stringify(response, null, 2));
        applyCelebResponse(response, profileReveal.fullResponse);
      } catch (error) {
        if (matchesStartedRef.current === previewId) {
          matchesStartedRef.current = null;
        }
        console.error('Failed to start celeb matches:', error);
      }
    };

    const startAnnotations = async () => {
      annotationsStartedRef.current = previewId;
      console.log('[celeb-annotations] startCelebAnnotations request:', { previewId });
      try {
        const response = await onboardingApi.startCelebAnnotations(previewId, claimToken);
        console.log(
          '[celeb-annotations] startCelebAnnotations response:',
          JSON.stringify(response, null, 2),
        );
        applyCelebResponse(response, profileReveal.fullResponse);
      } catch (error) {
        if (annotationsStartedRef.current === previewId) {
          annotationsStartedRef.current = null;
        }
        console.error('Failed to start celeb annotations:', error);
      }
    };

    const schedulePoll = () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }

      pollTimeoutRef.current = setTimeout(async () => {
        console.log('[celeb-matches] getCelebMatches poll request:', { previewId });
        try {
          const latest = await onboardingApi.getCelebMatches(previewId, claimToken);
          console.log(
            '[celeb-matches] getCelebMatches poll response:',
            JSON.stringify(latest, null, 2),
          );
          applyCelebResponse(latest, profileReveal.fullResponse);
        } catch (error) {
          console.error('Failed to poll celeb matches:', error);
        }
      }, 2500);
    };

    if (
      (!celebMatchesStatus || celebMatchesStatus.status === 'pending') &&
      matchesStartedRef.current !== previewId
    ) {
      startMatches();
      return;
    }

    if (celebMatchesStatus?.status === 'running') {
      schedulePoll();
      return;
    }

    if (
      celebMatchesStatus?.status === 'completed' &&
      (!celebAnnotationsStatus || celebAnnotationsStatus.status === 'pending') &&
      annotationsStartedRef.current !== previewId
    ) {
      startAnnotations();
      return;
    }

    if (celebAnnotationsStatus?.status === 'running') {
      schedulePoll();
      return;
    }

    if (celebAnnotationsStatus?.status === 'completed' || celebAnnotationsStatus?.status === 'failed') {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    }
  }, [applyCelebResponse, profileReveal]);

  const celebCards: TopCelebMatch[] = (profileReveal?.topCelebMatches ?? []).slice(
    0,
    MAX_CAROUSEL_MATCHES,
  );

  const matchesStatus = profileReveal?.celebMatchesStatus?.status ?? 'pending';
  const annotationsStatus = profileReveal?.celebAnnotationsStatus?.status ?? 'pending';
  const isMatchesLoading = matchesStatus === 'pending' || matchesStatus === 'running';
  const isAnnotationsLoading = annotationsStatus === 'pending' || annotationsStatus === 'running';
  const annotationsFailed = annotationsStatus === 'failed';
  const showMatchesSkeleton = isMatchesLoading || !canRevealMatches;
  const showMatchesCards = !showMatchesSkeleton && celebCards.length > 0;

  if (!profileReveal || !guestProfileDraft) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Profile</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            No profile generated yet.
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Complete your birth profile to see your romantic profile and celebrity matches.
          </Text>
        </View>
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.replace('CreateSelfProfile')}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.headerBlock}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            A First Glance{'\n'}at You in Love
          </Text>
        </View>

        {profileReveal.romanticProfileBlurb ? (
          <View style={[styles.quoteCard, { backgroundColor: colors.surfaceLow }]}>
            <Text style={[styles.quoteText, { color: colors.text }]}>
              {profileReveal.romanticProfileBlurb}
            </Text>
          </View>
        ) : null}

        {showMatchesSkeleton || showMatchesCards ? (
          <View style={styles.matchesSection}>
            <View style={styles.matchesHeader}>
              <Text style={[styles.matchesHeading, { color: colors.text }]}>
                Your Chart{'\n'}in the Wild
              </Text>
            </View>

            {showMatchesSkeleton ? (
              <>
                <Text style={[styles.matchesLoadingCaption, { color: colors.textMuted }]}>
                  Finding your strongest aspect overlaps...
                </Text>
                <CelebMatchSkeleton
                  baseColor={colors.surfaceHigh}
                  highlightColor={colors.surfaceHighest}
                />
              </>
            ) : null}

            {showMatchesCards && annotationsFailed ? (
              <View style={[styles.inlineStatusCard, { backgroundColor: colors.surfaceLow }]}>
                <Text style={[styles.inlineStatusTitle, { color: colors.text }]}>
                  Match annotations unavailable
                </Text>
                <Text style={[styles.inlineStatusBody, { color: colors.textMuted }]}>
                  Your matches are still usable, but the extra annotation copy could not be loaded right now.
                </Text>
              </View>
            ) : null}

            {showMatchesCards ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={CAROUSEL_SNAP_INTERVAL}
                snapToAlignment="start"
                style={styles.carouselScroll}
                contentContainerStyle={styles.carouselContent}
              >
                {celebCards.map((match, index) => (
                  <View
                    key={match.key}
                    style={[
                      styles.carouselItem,
                      index === celebCards.length - 1 && styles.carouselItemLast,
                    ]}
                  >
                    <CelebCard
                      match={match}
                      annotationLoading={isAnnotationsLoading}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : null}

        <FeaturesPreview />

        <View style={[styles.claimCard, { backgroundColor: colors.surfaceLow }]}>
          <Text style={[styles.claimTitle, { color: colors.text }]}>
            Save your blueprint
          </Text>
          <Text style={[styles.claimBody, { color: colors.textMuted }]}>
            Keep your profile. Run full reports on anyone.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('CreateAccount')}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Save Your Profile</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 48,
    gap: 28,
  },
  emptyState: {
    flex: 1,
    gap: 12,
    padding: 24,
    justifyContent: 'center',
  },
  bottomActions: {
    padding: 20,
    paddingBottom: 12,
  },

  headerBlock: {
    gap: 10,
    paddingTop: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: 'Georgia',
    fontSize: 38,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  body: {
    fontFamily: 'Georgia',
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
  },

  quoteCard: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 22,
  },
  quoteText: {
    fontFamily: 'Georgia',
    fontSize: 17,
    lineHeight: 27,
    fontStyle: 'italic',
  },
  matchesSection: {
    gap: 20,
  },
  matchesLoadingCaption: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -8,
  },
  matchesHeader: {
    gap: 10,
  },
  matchesHeading: {
    fontFamily: 'Georgia',
    fontSize: 30,
    fontWeight: '500',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  inlineStatusCard: {
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  inlineStatusTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  inlineStatusBody: {
    fontSize: 13,
    lineHeight: 20,
  },

  carouselScroll: {
    marginHorizontal: -CARD_PADDING,
  },
  carouselContent: {
    paddingHorizontal: CARD_PADDING,
  },
  carouselItem: {
    width: CAROUSEL_CARD_WIDTH,
    marginRight: CAROUSEL_CARD_GAP,
  },
  carouselItemLast: {
    marginRight: 0,
  },
  celebCard: {
    borderRadius: 20,
    overflow: 'hidden',
    width: CAROUSEL_CARD_WIDTH,
  },
  celebPhoto: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  celebPhotoPlaceholder: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebInitials: {
    fontSize: 40,
    fontWeight: '700',
  },
  celebCardFooter: {
    padding: 14,
    paddingTop: 12,
    gap: 6,
  },
  celebCardHeader: {
    gap: 2,
  },
  celebCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  celebAspectLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  celebCardName: {
    fontSize: 17,
    fontWeight: '700',
  },
  archetypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  annotationTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  scorePillsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 2,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  scorePillColumn: {
    flex: 1,
  },
  scorePill: {
    flex: 1,
    minWidth: 0,
  },
  scorePillContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 2,
  },
  scorePillLabel: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  scorePillValueWrap: {
    position: 'relative',
    minWidth: 26,
    minHeight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePillValue: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  scorePillBlurStack: {
    position: 'relative',
    width: '100%',
    minHeight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePillValueBlurLayer: {
    position: 'absolute',
  },
  placementSummary: {
    fontSize: 11,
    lineHeight: 16,
  },
  annotationSentenceWrap: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 36,
    maxHeight: 42,
  },
  annotationSentence: {
    fontSize: 12,
    lineHeight: 18,
  },
  annotationFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 22,
  },
  annotationLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  annotationLoadingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },

  claimCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 14,
  },
  claimTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  claimBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
