import React, { useEffect, useRef } from 'react';
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
import type {
  CelebAspectMatch,
  OnboardingPreviewCelebResponse,
  OnboardingPreviewResponse,
} from '../../../shared/api/onboarding';

type Props = StackScreenProps<RelationshipRootParamList, 'ProfileReveal'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 24;
const PHOTO_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;
const PHOTO_HEIGHT = PHOTO_WIDTH * 1.2;

interface CelebCardProps {
  match: CelebAspectMatch;
  aspect: TopAspect;
  onPress: (celebId: string) => void;
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

const CelebCard: React.FC<CelebCardProps> = ({ match, aspect, onPress }) => {
  const { colors } = useTheme();
  const userPlacement = getPlacementText(match.userPlacement);
  const celebPlacement = getPlacementText(match.celebPlacement);
  const placementSummary =
    userPlacement && celebPlacement
      ? `${userPlacement} • ${celebPlacement}`
      : userPlacement ?? celebPlacement;
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
          <Text style={[styles.celebAspectLabel, { color: colors.accent }]}>
            {aspect.label}
          </Text>
          <Text style={[styles.celebCardName, { color: colors.text }]}>
            {match.celebName ?? 'Unknown'}
          </Text>
        </View>
        {aspectTitle ? (
          <Text style={[styles.annotationTitle, { color: colors.text }]}>
            {aspectTitle}
          </Text>
        ) : null}
        {placementSummary ? (
          <Text style={[styles.placementSummary, { color: colors.textSubtle }]}>
            {placementSummary}
          </Text>
        ) : null}
        {aspectSentence ? (
          <Text style={[styles.annotationSentence, { color: colors.textMuted }]}>
            {aspectSentence}
          </Text>
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
      try {
        const response = await onboardingApi.startCelebMatches(previewId, claimToken);
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
      try {
        const response = await onboardingApi.startCelebAnnotations(previewId, claimToken);
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
        try {
          const latest = await onboardingApi.getCelebMatches(previewId, claimToken);
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
    for (const match of aspect.matches) {
      celebCards.push({ match, aspect });
    }
  }

  const matchesStatus = profileReveal.celebMatchesStatus?.status ?? 'pending';
  const annotationsStatus = profileReveal.celebAnnotationsStatus?.status ?? 'pending';
  const isMatchesLoading = matchesStatus === 'pending' || matchesStatus === 'running';
  const isAnnotationsLoading = annotationsStatus === 'pending' || annotationsStatus === 'running';
  const annotationsFailed = annotationsStatus === 'failed';

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

        {profileReveal.overview ? (
          <View style={[styles.quoteCard, { backgroundColor: colors.surfaceLow }]}>
            <Text style={[styles.quoteText, { color: colors.text }]}>
              "{profileReveal.overview}"
            </Text>
          </View>
        ) : null}

        {isMatchesLoading ? (
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceLow }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingCardTitle, { color: colors.text }]}>
              Finding your celebrity matches
            </Text>
            <Text style={[styles.loadingCardBody, { color: colors.textMuted }]}>
              We&apos;re calculating your strongest aspect overlaps now.
            </Text>
          </View>
        ) : null}

        {celebCards.length > 0 ? (
          <View style={styles.matchesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Celestial{'\n'}Matches
            </Text>

            {isAnnotationsLoading ? (
              <View style={[styles.inlineStatusCard, { backgroundColor: colors.surfaceLow }]}>
                <Text style={[styles.inlineStatusTitle, { color: colors.text }]}>
                  Writing the match annotations
                </Text>
                <Text style={[styles.inlineStatusBody, { color: colors.textMuted }]}>
                  The match cards are ready. The detailed annotation copy will appear as soon as it finishes loading.
                </Text>
              </View>
            ) : null}

            {annotationsFailed ? (
              <View style={[styles.inlineStatusCard, { backgroundColor: colors.surfaceLow }]}>
                <Text style={[styles.inlineStatusTitle, { color: colors.text }]}>
                  Match annotations unavailable
                </Text>
                <Text style={[styles.inlineStatusBody, { color: colors.textMuted }]}>
                  Your matches are still usable, but the extra annotation copy could not be loaded right now.
                </Text>
              </View>
            ) : null}

            {celebCards.map(({ match, aspect }) => (
              <CelebCard
                key={`${aspect.aspectType}-${match.celebId}`}
                match={match}
                aspect={aspect}
                onPress={handlePressCelebCard}
              />
            ))}
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
  loadingCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingCardBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },

  matchesSection: {
    gap: 20,
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

  celebCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  celebPhoto: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  celebPhotoPlaceholder: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebInitials: {
    fontSize: 48,
    fontWeight: '700',
  },
  celebCardFooter: {
    padding: 16,
    paddingTop: 14,
    gap: 8,
  },
  celebCardHeader: {
    gap: 4,
  },
  celebAspectLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  celebCardName: {
    fontSize: 20,
    fontWeight: '700',
  },
  annotationTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  placementSummary: {
    fontSize: 12,
    lineHeight: 18,
  },
  annotationSentence: {
    fontSize: 14,
    lineHeight: 22,
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
