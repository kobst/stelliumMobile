import React from 'react';
import {
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
import type { CelebAspectMatch } from '../../../shared/api/onboarding';

type Props = StackScreenProps<RelationshipRootParamList, 'ProfileReveal'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 24;
const PHOTO_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;
const PHOTO_HEIGHT = PHOTO_WIDTH * 1.2;

interface CelebCardProps {
  match: CelebAspectMatch;
  aspect: TopAspect;
  onTapScore: (celebId: string) => void;
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

function formatScore(score: number | undefined): string {
  if (score === undefined || score === null) {
    return '--';
  }
  return String(Math.round(score * 100));
}

const CelebCard: React.FC<CelebCardProps> = ({ match, aspect, onTapScore }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.celebCard, { backgroundColor: colors.surfaceLow }]}
      onPress={() => onTapScore(match.celebId)}
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
        <View style={styles.celebCardInfo}>
          <Text style={[styles.celebAspectLabel, { color: colors.accent }]}>
            {aspect.label}
          </Text>
          <Text style={[styles.celebCardName, { color: colors.text }]}>
            {match.celebName ?? 'Unknown'}
          </Text>
        </View>
        <View style={styles.celebScoreBlock}>
          <Text style={[styles.celebScoreLabel, { color: colors.textMuted }]}>
            TEASER SCORE
          </Text>
          <Text style={[styles.celebScoreValue, { color: colors.accent }]}>
            {formatScore(aspect.score)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ProfileRevealScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const profileReveal = useRelationshipAppStore((state) => state.profileReveal);
  const guestProfileDraft = useRelationshipAppStore((state) => state.guestProfileDraft);
  const authStatus = useRelationshipAppStore((state) => state.authStatus);

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

  const handleTapCelebScore = (_celebId: string) => {
    if (authStatus === 'signedIn') {
      return;
    }
    navigation.navigate('SaveProfile');
  };

  const celebCards: Array<{ match: CelebAspectMatch; aspect: TopAspect }> = [];
  for (const aspect of profileReveal.topAspects) {
    for (const match of aspect.matches) {
      celebCards.push({ match, aspect });
    }
  }

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

        {celebCards.length > 0 ? (
          <View style={styles.matchesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Celestial{'\n'}Matches
            </Text>

            {celebCards.map(({ match, aspect }) => (
              <CelebCard
                key={`${aspect.aspectType}-${match.celebId}`}
                match={match}
                aspect={aspect}
                onTapScore={handleTapCelebScore}
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

  matchesSection: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 16,
    paddingTop: 14,
  },
  celebCardInfo: {
    flex: 1,
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
  celebScoreBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  celebScoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  celebScoreValue: {
    fontSize: 32,
    fontWeight: '800',
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
