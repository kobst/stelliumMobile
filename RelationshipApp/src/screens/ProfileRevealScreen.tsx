import React, { useEffect, useRef, useState } from 'react';
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
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore, TopAspect } from '../store';
import { useTheme } from '../theme';
import { onboardingApi } from '../api';
import { CelebMatchSkeleton } from '../components/CelebMatchSkeleton';
import type {
  CelebAspectMatch,
  OnboardingPreviewCelebResponse,
  OnboardingPreviewResponse,
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
  match: CelebAspectMatch;
  aspect: TopAspect;
  onPress: (celebId: string) => void;
  annotationLoading?: boolean;
}

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

const CelebCard: React.FC<CelebCardProps> = ({ match, aspect, onPress, annotationLoading }) => {
  const { colors } = useTheme();
  const userPlacement = getPlacementText(match.userPlacement);
  const celebPlacement = getPlacementText(match.celebPlacement);
  const placementSummary =
    userPlacement && celebPlacement
      ? `${userPlacement} • ${celebPlacement}`
      : userPlacement ?? celebPlacement;
  const hasAnnotation = Boolean(match.annotation);
  const aspectTitle = match.annotation?.title ?? [aspect.label, aspect.shortMeaning].filter(Boolean).join(' · ');
  const aspectSentence = match.annotation?.sentence;

  return (
    <TouchableOpacity
      style={[styles.celebCard, { backgroundColor: colors.surfaceLow }]}
      onPress={() => onPress(match.celebId)}
      activeOpacity={0.85}
    >
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
          <Text style={[styles.celebAspectLabel, { color: colors.accent }]} numberOfLines={1}>
            {aspect.label}
          </Text>
          <Text style={[styles.celebCardName, { color: colors.text }]} numberOfLines={1}>
            {match.celebName ?? 'Unknown'}
          </Text>
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
          <Text style={[styles.annotationSentence, { color: colors.textMuted }]} numberOfLines={4}>
            {aspectSentence}
          </Text>
        ) : annotationLoading && !hasAnnotation ? (
          <View style={styles.annotationLoadingRow}>
            <ActivityIndicator size="small" color={colors.textSubtle} />
            <Text style={[styles.annotationLoadingText, { color: colors.textSubtle }]}>
              Writing annotation...
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export const ProfileRevealScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const profileReveal = useRelationshipAppStore((state) => state.profileReveal);
  const guestProfileDraft = useRelationshipAppStore((state) => state.guestProfileDraft);
  const authStatus = useRelationshipAppStore((state) => state.authStatus);
  const updateProfileReveal = useRelationshipAppStore((state) => state.updateProfileReveal);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchesStartedRef = useRef<string | null>(null);
  const annotationsStartedRef = useRef<string | null>(null);
  const [canRevealMatches, setCanRevealMatches] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanRevealMatches(true), MATCHES_SKELETON_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

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

  const handlePressCelebCard = (_celebId: string) => {
    if (authStatus === 'signedIn') {
      return;
    }
    navigation.navigate('SaveProfile');
  };

  const applyCelebResponse = (
    response: OnboardingPreviewCelebResponse,
    baseFullResponse: OnboardingPreviewResponse
  ) => {
    const nextFullResponse: OnboardingPreviewResponse = {
      ...baseFullResponse,
      celebMatchesStatus: response.celebMatchesStatus,
      celebAnnotationsStatus: response.celebAnnotationsStatus,
      celebAspectBank: response.celebAspectBank,
      topAspects: response.topAspects,
      status: baseFullResponse.status,
    };

    updateProfileReveal({
      previewId: response.previewId,
      value: {
        topAspects: response.topAspects,
        celebAspectBank: response.celebAspectBank,
        celebMatchesStatus: response.celebMatchesStatus,
        celebAnnotationsStatus: response.celebAnnotationsStatus,
        fullResponse: nextFullResponse,
      },
    });
  };

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
  }, [profileReveal?.previewId]);

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
      void startMatches();
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
      void startAnnotations();
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
  }, [profileReveal, updateProfileReveal]);

  const celebCards: Array<{ match: CelebAspectMatch; aspect: TopAspect }> = [];
  for (const aspect of profileReveal.topAspects) {
    const topMatch = aspect.matches[0];
    if (!topMatch) {
      continue;
    }
    celebCards.push({ match: topMatch, aspect });
    if (celebCards.length >= MAX_CAROUSEL_MATCHES) {
      break;
    }
  }

  const matchesStatus = profileReveal.celebMatchesStatus?.status ?? 'pending';
  const annotationsStatus = profileReveal.celebAnnotationsStatus?.status ?? 'pending';
  const isMatchesLoading = matchesStatus === 'pending' || matchesStatus === 'running';
  const isAnnotationsLoading = annotationsStatus === 'pending' || annotationsStatus === 'running';
  const annotationsFailed = annotationsStatus === 'failed';
  const showMatchesSkeleton = isMatchesLoading || !canRevealMatches;
  const showMatchesCards = !showMatchesSkeleton && celebCards.length > 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            Romantic Profile Revealed
          </Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Your Celestial{'\n'}Blueprint
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Celestial{'\n'}Matches
            </Text>

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
                {celebCards.map(({ match, aspect }, index) => (
                  <View
                    key={`${aspect.aspectType}-${match.celebId}`}
                    style={[
                      styles.carouselItem,
                      index === celebCards.length - 1 && styles.carouselItemLast,
                    ]}
                  >
                    <CelebCard
                      match={match}
                      aspect={aspect}
                      onPress={handlePressCelebCard}
                      annotationLoading={isAnnotationsLoading}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.claimCard, { backgroundColor: colors.surfaceLow }]}>
          <Text style={[styles.claimIcon, { color: colors.textSubtle }]}>&#x1F512;</Text>
          <Text style={[styles.claimTitle, { color: colors.text }]}>
            Claim Your Destiny
          </Text>
          <Text style={[styles.claimBody, { color: colors.textMuted }]}>
            Save your celestial blueprint and unlock full synastry reports for all matches.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('SaveProfile')}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Save Your Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('SaveProfile')}
          >
            <Text style={[styles.guestLink, { color: colors.textMuted }]}>
              CONTINUE AS GUEST
            </Text>
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
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },

  quoteCard: {
    borderRadius: 24,
    padding: 24,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 26,
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
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
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
  annotationTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  placementSummary: {
    fontSize: 11,
    lineHeight: 16,
  },
  annotationSentence: {
    fontSize: 12,
    lineHeight: 18,
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
  claimIcon: {
    fontSize: 24,
    marginBottom: 4,
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
  guestLink: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 4,
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
