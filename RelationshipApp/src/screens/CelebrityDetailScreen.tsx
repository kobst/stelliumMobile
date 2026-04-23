import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Celebrity, relationshipsApi } from '../api';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { Avatar } from '../components/Avatar';
import { celebrityToSubject, getCelebritySunSign } from '../utils/mainShell';
import { startRelationshipPreview } from './previewFlow';

type Props = StackScreenProps<RelationshipRootParamList, 'CelebrityDetail'>;

type CelebPlanet = { name?: string; sign?: string | null };

function getPlanets(celeb: Celebrity): CelebPlanet[] {
  const planets = (celeb.birthChart as { planets?: CelebPlanet[] } | undefined)?.planets;
  return Array.isArray(planets) ? planets : [];
}

function getPlanetSign(celeb: Celebrity, planet: string): string | null {
  const match = getPlanets(celeb).find((p) => p.name === planet);
  return typeof match?.sign === 'string' ? match.sign : null;
}

export const CelebrityDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const celebrity = route.params?.celebrity;

  const profile = useRelationshipAppStore((state) => state.profile);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const setActiveTargetType = useRelationshipAppStore((state) => state.setActiveTargetType);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setActiveRelationshipId = useRelationshipAppStore((state) => state.setActiveRelationshipId);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);

  const [isStartingPreview, setIsStartingPreview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!celebrity) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            We couldn't find that celebrity.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const photoUri = celebrity.profilePhotoUrl ?? celebrity.photoUrl ?? null;
  const fullName = `${celebrity.firstName ?? ''} ${celebrity.lastName ?? ''}`.trim();
  const initial = celebrity.firstName?.charAt(0) ?? '?';
  const sunSign = getCelebritySunSign(celebrity);
  const moonSign = getPlanetSign(celebrity, 'Moon');
  const venusSign = getPlanetSign(celebrity, 'Venus');
  const marsSign = getPlanetSign(celebrity, 'Mars');
  const blurb = celebrity.romanticProfileBlurb?.trim() || null;
  const overview = celebrity.romanticOverview?.trim() || null;

  const handleCreateConnection = async () => {
    if (!profile) {
      Alert.alert('Create your profile first', 'Finish onboarding before starting a connection.');
      return;
    }

    const targetSubject = celebrityToSubject(celebrity);

    try {
      setIsStartingPreview(true);
      setError(null);

      const { preview, updatedHistory } = await startRelationshipPreview(
        {
          selfProfile: profile,
          targetSubject,
          targetType: 'celebrity',
          isLocalUxMode,
          relationshipHistory,
        },
        {
          enhancedRelationshipAnalysis: relationshipsApi.enhancedRelationshipAnalysis,
        }
      );

      setActiveTargetType('celebrity');
      setActiveTargetSubject(targetSubject);
      setPreviewAnalysis(preview);
      setActiveRelationshipId(preview.compositeChartId);
      if (isLocalUxMode) {
        setRelationshipHistory({ relationshipHistory: updatedHistory });
      }
      navigation.replace('RelationshipPreview');
    } catch (previewError) {
      const message =
        previewError instanceof Error ? previewError.message : 'Could not start the preview.';
      setError(message);
      Alert.alert('Celebrity preview failed', message);
    } finally {
      setIsStartingPreview(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Celebrity</Text>

        <View style={styles.heroRow}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.heroPhoto} resizeMode="cover" />
          ) : (
            <View style={styles.heroPhoto}>
              <Avatar size={140} gradient="gold" fallbackInitial={initial} />
            </View>
          )}
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{fullName || 'Unknown'}</Text>

        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {celebrity.dateOfBirth}
          {celebrity.time ? ` · ${celebrity.time}` : ''}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>{celebrity.placeOfBirth}</Text>

        <View style={styles.pillRow}>
          {sunSign ? (
            <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.pillText, { color: colors.text }]}>{sunSign} Sun</Text>
            </View>
          ) : null}
          {moonSign ? (
            <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.pillText, { color: colors.text }]}>{moonSign} Moon</Text>
            </View>
          ) : null}
          {venusSign ? (
            <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.pillText, { color: colors.text }]}>{venusSign} Venus</Text>
            </View>
          ) : null}
          {marsSign ? (
            <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.pillText, { color: colors.text }]}>{marsSign} Mars</Text>
            </View>
          ) : null}
        </View>

        {blurb ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardEyebrow, { color: colors.accent }]}>Romantic Profile</Text>
            <Text style={[styles.cardBody, { color: colors.text }]}>{blurb}</Text>
          </View>
        ) : null}

        {overview && overview !== blurb ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardEyebrow, { color: colors.accent }]}>Overview</Text>
            <Text style={[styles.cardBody, { color: colors.text }]}>{overview}</Text>
          </View>
        ) : null}

        {!blurb && !overview ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              No romantic blurb available for this celebrity yet.
            </Text>
          </View>
        ) : null}

        {error ? (
          <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text>
        ) : null}
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: colors.surfaceLow, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: isStartingPreview ? colors.primaryMuted : colors.primary }]}
          onPress={() => {
            handleCreateConnection().catch(() => undefined);
          }}
          disabled={isStartingPreview}
        >
          {isStartingPreview ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              Create Connection
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
          disabled={isStartingPreview}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroRow: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  heroPhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'center',
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
    marginTop: 6,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  actionBar: {
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
