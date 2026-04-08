import React from 'react';
import {
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

type Props = StackScreenProps<RelationshipRootParamList, 'ProfileReveal'>;

interface AspectCardProps {
  aspect: TopAspect;
  onTapScore: (celebId: string) => void;
}

const AspectCard: React.FC<AspectCardProps> = ({ aspect, onTapScore }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.aspectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.aspectHeader}>
        <View style={styles.aspectLabelRow}>
          <Text style={[styles.aspectLabel, { color: colors.primary }]}>{aspect.label}</Text>
          <Text style={[styles.clusterBadge, { color: colors.textMuted }]}>
            {aspect.primaryCluster}
          </Text>
        </View>
      </View>

      {aspect.matches.map((match) => (
        <View key={match.celebId} style={styles.celebRow}>
          <Text style={[styles.celebName, { color: colors.text }]}>{match.celebName}</Text>
          <TouchableOpacity
            style={[styles.scoreButton, { backgroundColor: colors.primary }]}
            onPress={() => onTapScore(match.celebId)}
          >
            <Text style={styles.scoreButtonText}>Score</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export const ProfileRevealScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const profileReveal = useRelationshipAppStore((state) => state.profileReveal);
  const guestProfileDraft = useRelationshipAppStore((state) => state.guestProfileDraft);
  const authStatus = useRelationshipAppStore((state) => state.authStatus);

  if (!profileReveal || !guestProfileDraft) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Profile</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            No profile generated yet.
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Complete your birth profile to see your romantic profile and celebrity matches.
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.replace('CreateSelfProfile')}
          >
            <Text style={styles.primaryButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleTapCelebScore = (_celebId: string) => {
    if (authStatus === 'signedIn') {
      // TODO: Navigate to credits check / celeb scoring flow
      return;
    }
    navigation.navigate('SaveProfile');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Your romantic profile</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {guestProfileDraft.firstName}, here's what the stars say.
          </Text>
        </View>

        {profileReveal.overview ? (
          <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.profileText, { color: colors.text }]}>
              {profileReveal.overview}
            </Text>
            <View style={[styles.teaseFade, { backgroundColor: colors.surface }]} />
          </View>
        ) : null}

        {profileReveal.topAspects.length > 0 ? (
          <View style={styles.celebSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your top celebrity matches
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Based on your strongest shared aspects
            </Text>
            {profileReveal.topAspects.map((aspect) => (
              <AspectCard
                key={aspect.aspectType}
                aspect={aspect}
                onTapScore={handleTapCelebScore}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('SaveProfile')}
        >
          <Text style={styles.primaryButtonText}>Save Your Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 20,
  },
  emptyState: {
    flex: 1,
    gap: 12,
    padding: 24,
    justifyContent: 'center',
  },
  headerBlock: {
    gap: 10,
    paddingTop: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  profileCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  profileText: {
    fontSize: 16,
    lineHeight: 26,
  },
  teaseFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    opacity: 0.8,
  },
  celebSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  aspectCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  aspectHeader: {
    gap: 4,
  },
  aspectLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aspectLabel: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  clusterBadge: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  celebRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  celebName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  scoreButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scoreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    gap: 12,
    padding: 20,
    paddingTop: 12,
  },
  primaryButton: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
