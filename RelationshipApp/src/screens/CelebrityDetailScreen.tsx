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
import { Celebrity, CollectionCeleb, discoverApi, relationshipsApi } from '../api';
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

function getPlanetSignFromBirthChart(
  birthChart: Record<string, unknown> | null | undefined,
  planet: string
): string | null {
  const planets = (birthChart as { planets?: CelebPlanet[] } | undefined)?.planets;
  if (!Array.isArray(planets)) return null;
  const match = planets.find((p) => p.name === planet);
  return typeof match?.sign === 'string' ? match.sign : null;
}

export const CelebrityDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const passedCelebrity = route.params?.celebrity;
  const celebrityId = route.params?.celebrityId ?? passedCelebrity?._id ?? null;
  const preview: CollectionCeleb | undefined = route.params?.preview;

  const profile = useRelationshipAppStore((state) => state.profile);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const setActiveTargetType = useRelationshipAppStore((state) => state.setActiveTargetType);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setActiveRelationshipId = useRelationshipAppStore((state) => state.setActiveRelationshipId);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);

  const [hydratedBirthChart, setHydratedBirthChart] = React.useState<
    Record<string, unknown> | null
  >(null);
  const [hydratedBlurb, setHydratedBlurb] = React.useState<string | null>(null);
  const [hydratedOverview, setHydratedOverview] = React.useState<string | null>(null);
  const [hydratedPhoto, setHydratedPhoto] = React.useState<string | null>(null);
  const [isHydrating, setIsHydrating] = React.useState(false);
  const [isStartingPreview, setIsStartingPreview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!celebrityId) return;
    // If we already have a full Celebrity record, trust its fields and skip the fetch.
    if (passedCelebrity?.birthChart) return;
    let cancelled = false;
    setIsHydrating(true);
    discoverApi
      .getCelebrityProfile(celebrityId)
      .then((result) => {
        if (cancelled) return;
        setHydratedBirthChart(result.birthChart ?? null);
        setHydratedBlurb(result.romanticProfileBlurb?.trim() || null);
        setHydratedOverview(result.overview?.trim() || null);
        setHydratedPhoto(result.celebrity?.profilePhotoUrl ?? null);
      })
      .catch((hydrateError) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[CelebrityDetailScreen] hydrate failed', {
            celebrityId,
            error: hydrateError instanceof Error ? hydrateError.message : String(hydrateError),
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsHydrating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [celebrityId, passedCelebrity]);

  if (!celebrityId) {
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

  // ── Resolve display fields from whichever source we have ────────────────────
  const firstName = passedCelebrity?.firstName ?? preview?.firstName ?? '';
  const lastName = passedCelebrity?.lastName ?? preview?.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initial = firstName.charAt(0) || '?';
  const photoUri =
    passedCelebrity?.profilePhotoUrl ??
    passedCelebrity?.photoUrl ??
    hydratedPhoto ??
    preview?.profilePhotoUrl ??
    null;

  const sunSign =
    (passedCelebrity ? getCelebritySunSign(passedCelebrity) : null) ??
    getPlanetSignFromBirthChart(hydratedBirthChart, 'Sun') ??
    preview?.sunSign ??
    null;
  const moonSign =
    (passedCelebrity ? getPlanetSign(passedCelebrity, 'Moon') : null) ??
    getPlanetSignFromBirthChart(hydratedBirthChart, 'Moon') ??
    preview?.moonSign ??
    null;
  const venusSign =
    (passedCelebrity ? getPlanetSign(passedCelebrity, 'Venus') : null) ??
    getPlanetSignFromBirthChart(hydratedBirthChart, 'Venus') ??
    preview?.venusSign ??
    null;
  const marsSign =
    (passedCelebrity ? getPlanetSign(passedCelebrity, 'Mars') : null) ??
    getPlanetSignFromBirthChart(hydratedBirthChart, 'Mars') ??
    preview?.marsSign ??
    null;

  const blurb =
    passedCelebrity?.romanticProfileBlurb?.trim() ||
    hydratedBlurb ||
    preview?.romanticProfileBlurb?.trim() ||
    null;
  const overview = passedCelebrity?.romanticOverview?.trim() || hydratedOverview || null;

  const dateOfBirth = passedCelebrity?.dateOfBirth ?? null;
  const time = passedCelebrity?.time ?? null;
  const placeOfBirth = passedCelebrity?.placeOfBirth ?? null;

  const handleCreateConnection = async () => {
    if (!profile) {
      Alert.alert('Create your profile first', 'Finish onboarding before starting a connection.');
      return;
    }

    // Build a target subject from whichever source is richest. Collection-entry
    // celebs only have id/name/photo — that's enough for enhanced-relationship-analysis
    // since it resolves the real subject on the server by id.
    const targetSubject = passedCelebrity
      ? celebrityToSubject(passedCelebrity)
      : {
          _id: celebrityId,
          createdAt: '',
          updatedAt: '',
          kind: 'celebrity' as const,
          ownerUserId: null,
          isCelebrity: true,
          isReadOnly: true,
          firstName,
          lastName,
          gender: (preview?.gender as 'male' | 'female' | 'other' | undefined) ?? undefined,
          dateOfBirth: '',
          placeOfBirth: '',
          time: undefined,
          birthTimeUnknown: true,
          totalOffsetHours: 0,
          birthChart: hydratedBirthChart ?? undefined,
          profilePhotoUrl: photoUri ?? undefined,
          appDomain: null,
          firebaseUid: null,
        };

    try {
      setIsStartingPreview(true);
      setError(null);

      const { preview: previewAnalysis, updatedHistory } = await startRelationshipPreview(
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
      setPreviewAnalysis(previewAnalysis);
      setActiveRelationshipId(previewAnalysis.compositeChartId);
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

        {dateOfBirth ? (
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {dateOfBirth}
            {time ? ` · ${time}` : ''}
          </Text>
        ) : null}
        {placeOfBirth ? (
          <Text style={[styles.meta, { color: colors.textMuted }]}>{placeOfBirth}</Text>
        ) : null}

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

        {isHydrating && !blurb && !overview ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              Loading romantic profile…
            </Text>
          </View>
        ) : null}

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

        {!isHydrating && !blurb && !overview ? (
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
