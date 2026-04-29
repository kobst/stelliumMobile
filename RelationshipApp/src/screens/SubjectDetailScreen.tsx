import React from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { relationshipsApi } from '../api';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { Avatar } from '../components/Avatar';
import { getBigThree, getRelationshipArchetypeLabel } from '../utils/mainShell';
import { startRelationshipPreview } from './previewFlow';
import { buildHistorySelectionState } from './historySelection';
import { relationshipUsersApi } from '../../../shared/api/relationshipUsers';
import type { OwnedGuestSubject } from '../../../shared/api/relationshipUsers';
import type { UserCompositeChart } from '../../../shared/api/relationships';
import {
  pickImageFromLibrary,
  pickImageFromCamera,
} from '../../../src/utils/imageHelpers';
import { uploadSubjectProfilePhoto } from '../utils/subjectPhotoUpload';
import { AstrologicalProfileView } from '../components/AstrologicalProfileView';
import { SingleChartModal } from '../components/SingleChartModal';
import { getRomanticPlacements } from '../utils/placements';

type Props = StackScreenProps<RelationshipRootParamList, 'SubjectDetail'>;

type SubjectPlanet = { name?: string; sign?: string | null };

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatDateOfBirth(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const datePart = raw.includes('T') ? raw.split('T')[0] : raw;
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return raw;
  const monthName = MONTH_NAMES[month - 1] ?? '';
  if (!monthName) return raw;
  return `${monthName} ${day}, ${year}`;
}

function formatBirthTime(time: string | null | undefined): string | null {
  if (!time) return null;
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, '0');
  return `${hour12}:${mm} ${period}`;
}

function getSubjectPlanets(subject: OwnedGuestSubject): SubjectPlanet[] {
  const planets = (subject.birthChart as { planets?: SubjectPlanet[] } | undefined)?.planets;
  return Array.isArray(planets) ? planets : [];
}

function getSubjectPlanetSign(subject: OwnedGuestSubject, planet: string): string | null {
  const match = getSubjectPlanets(subject).find((p) => p.name === planet);
  return typeof match?.sign === 'string' ? match.sign : null;
}

function findRelationshipForSubject(
  subject: OwnedGuestSubject,
  history: readonly UserCompositeChart[],
  selfProfileId: string | null
): UserCompositeChart | null {
  const lowerFullName = [subject.firstName, subject.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase();
  for (const row of history) {
    if (row.userA_id === subject._id || row.userB_id === subject._id) return row;
    const a = row.userA_name?.trim().toLowerCase() ?? '';
    const b = row.userB_name?.trim().toLowerCase() ?? '';
    const selfOwns = row.userA_id === selfProfileId || row.userB_id === selfProfileId;
    if (selfOwns && lowerFullName && (a === lowerFullName || b === lowerFullName)) {
      return row;
    }
  }
  return null;
}

export const SubjectDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const subject = route.params?.subject;

  const profile = useRelationshipAppStore((state) => state.profile);
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const setActiveTargetType = useRelationshipAppStore((state) => state.setActiveTargetType);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);
  const setActivePartnerRomanticAssets = useRelationshipAppStore(
    (state) => state.setActivePartnerRomanticAssets
  );
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setActiveRelationshipId = useRelationshipAppStore((state) => state.setActiveRelationshipId);
  const setFullAnalysis = useRelationshipAppStore((state) => state.setFullAnalysis);
  const setWorkflowState = useRelationshipAppStore((state) => state.setWorkflowState);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);
  const upsertOwnedSubject = useRelationshipAppStore((state) => state.upsertOwnedSubject);

  const [isStartingPreview, setIsStartingPreview] = React.useState(false);
  const [blurb, setBlurb] = React.useState<string | null>(null);
  const [overview, setOverview] = React.useState<string | null>(null);
  const [isBlurbLoading, setIsBlurbLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [photoOverride, setPhotoOverride] = React.useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [chartModalVisible, setChartModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (!subject?._id) return;
    let cancelled = false;
    setIsBlurbLoading(true);
    relationshipUsersApi
      .getGuestSubjectRomantic(subject._id)
      .then((result) => {
        if (cancelled) return;
        setBlurb(result.romanticProfileBlurb?.trim() || null);
        setOverview(result.overview?.trim() || null);
      })
      .catch((hydrateError) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[SubjectDetailScreen] hydrate blurb failed', {
            subjectId: subject._id,
            error: hydrateError instanceof Error ? hydrateError.message : String(hydrateError),
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsBlurbLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subject?._id]);

  if (!subject) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            We couldn't find that subject.
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

  const fullName = [subject.firstName, subject.lastName].filter(Boolean).join(' ').trim();
  const initial = subject.firstName?.charAt(0) ?? '?';
  const { sun: sunSign, moon: moonSign, rising: risingSign } = getBigThree(subject);
  const venusSign = getSubjectPlanetSign(subject, 'Venus');
  const marsSign = getSubjectPlanetSign(subject, 'Mars');

  const existingRelationship = findRelationshipForSubject(
    subject,
    relationshipHistory,
    selfProfileId
  );
  const archetype = existingRelationship
    ? getRelationshipArchetypeLabel(existingRelationship)
    : null;

  const handleOpenExisting = () => {
    if (!existingRelationship) return;
    const selectionState = buildHistorySelectionState(existingRelationship);
    setActivePartnerRomanticAssets(null);
    setPreviewAnalysis(selectionState.previewAnalysis);
    setActiveRelationshipId(existingRelationship._id);
    setFullAnalysis(selectionState.fullAnalysis);
    setWorkflowState({
      workflowStatus: null,
      workflowPhase: selectionState.workflowPhase,
      workflowError: null,
    });
    navigation.replace('RelationshipPreview');
  };

  const handleCreateConnection = async () => {
    if (!profile) {
      Alert.alert('Create your profile first', 'Finish onboarding before starting a connection.');
      return;
    }

    try {
      setIsStartingPreview(true);
      setError(null);

      const { preview, updatedHistory } = await startRelationshipPreview(
        {
          selfProfile: profile,
          targetSubject: subject,
          targetType: 'person',
          isLocalUxMode,
          relationshipHistory,
        },
        {
          enhancedRelationshipAnalysis: relationshipsApi.enhancedRelationshipAnalysis,
        }
      );

      setActiveTargetType('person');
      setActiveTargetSubject(subject);
      // Let RelationshipPreview hydrate the blurb via /getGuestSubjectRomantic on mount.
      setActivePartnerRomanticAssets(null);
      setPreviewAnalysis(preview);
      setActiveRelationshipId(preview.compositeChartId);
      setRelationshipHistory({ relationshipHistory: updatedHistory });
      navigation.replace('RelationshipPreview');
    } catch (previewError) {
      const message =
        previewError instanceof Error ? previewError.message : 'Could not start the preview.';
      setError(message);
      Alert.alert('Could not start preview', message);
    } finally {
      setIsStartingPreview(false);
    }
  };

  const runPhotoUpload = async (imageUri: string, mimeType: string) => {
    try {
      setIsUploadingPhoto(true);
      setError(null);
      const result = await uploadSubjectProfilePhoto(subject._id, imageUri, mimeType);
      setPhotoOverride(result.profilePhotoUrl);
      upsertOwnedSubject({
        ...subject,
        profilePhotoUrl: result.profilePhotoUrl,
      } as OwnedGuestSubject);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Photo upload failed.';
      Alert.alert('Upload failed', message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const runPhotoDelete = async () => {
    try {
      setIsUploadingPhoto(true);
      setError(null);
      await relationshipUsersApi.deleteSubjectProfilePhoto(subject._id);
      setPhotoOverride(null);
      upsertOwnedSubject({
        ...subject,
        profilePhotoUrl: undefined,
      } as OwnedGuestSubject);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Could not remove photo.';
      Alert.alert('Remove failed', message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const displayPhotoUri =
    photoOverride ?? (subject.profilePhotoUrl as string | null | undefined) ?? null;

  const handleChoosePhoto = () => {
    const hasPhoto = Boolean(displayPhotoUri);
    Alert.alert('Profile photo', 'Choose a source', [
      {
        text: 'Photo library',
        onPress: async () => {
          const picked = await pickImageFromLibrary();
          if (picked) {
            runPhotoUpload(picked.uri, picked.type).catch(() => undefined);
          }
        },
      },
      {
        text: 'Take photo',
        onPress: async () => {
          const picked = await pickImageFromCamera();
          if (picked) {
            runPhotoUpload(picked.uri, picked.type).catch(() => undefined);
          }
        },
      },
      ...(hasPhoto
        ? [
            {
              text: 'Remove photo',
              style: 'destructive' as const,
              onPress: () => {
                runPhotoDelete().catch(() => undefined);
              },
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const formattedDate = formatDateOfBirth(subject.dateOfBirth);
  const formattedTime = formatBirthTime(subject.time);
  const dateLine = [formattedDate, formattedTime].filter(Boolean).join(' · ');

  // Hero (photo + name + dates + chips). Replaces the default IdentityBlock.
  const identityOverride = (
    <View style={styles.identityWrap}>
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={handleChoosePhoto}
        disabled={isUploadingPhoto}
        accessibilityLabel="Change profile photo"
      >
        <Avatar
          size={120}
          gradient="green"
          fallbackInitial={initial}
          photoUri={displayPhotoUri}
        />
        <View
          style={[
            styles.photoEditBadge,
            { backgroundColor: colors.primary, borderColor: colors.surfaceLow },
          ]}
        >
          {isUploadingPhoto ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={[styles.photoEditBadgeText, { color: colors.onPrimary }]}>
              {displayPhotoUri ? 'Edit' : 'Add'}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>{fullName || 'Your person'}</Text>

      {dateLine ? (
        <Text style={[styles.meta, { color: colors.textMuted }]}>{dateLine}</Text>
      ) : null}
      {subject.placeOfBirth ? (
        <Text style={[styles.meta, { color: colors.textMuted }]}>{subject.placeOfBirth}</Text>
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
        {risingSign ? (
          <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.pillText, { color: colors.text }]}>{risingSign} Rising</Text>
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
    </View>
  );

  // Top-left back link plus optional "Your Connection" card sit above the
  // identity / tabs in the header slot, mirroring how RomanticProfileFullScreen
  // places its `← Profile` link at the top.
  const headerSlot = (
    <View style={styles.headerSlotStack}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.goBack()}
        style={styles.backLink}
        disabled={isStartingPreview}
      >
        <Text style={[styles.backLinkText, { color: colors.textMuted }]}>← Back</Text>
      </TouchableOpacity>
      {existingRelationship ? (
        <View style={[styles.connectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardEyebrow, { color: colors.accent }]}>Your Connection</Text>
          <Text style={[styles.cardBody, { color: colors.text }]}>
            {archetype ?? 'Compatibility read ready.'}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const overviewText = isBlurbLoading
    ? 'Loading romantic profile…'
    : overview ?? blurb ?? 'No romantic blurb stored yet for this person.';

  const placements = getRomanticPlacements(subject);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <View style={styles.body}>
        <AstrologicalProfileView
          variant="subject"
          name={fullName || 'Your person'}
          sun={sunSign}
          moon={moonSign}
          rising={risingSign}
          source={subject}
          placements={placements}
          overview={overviewText}
          eyebrow="Your Person"
          headerSlot={headerSlot}
          identityOverride={identityOverride}
          onPressViewFullChart={
            subject.birthChart ? () => setChartModalVisible(true) : undefined
          }
        />
        {error ? (
          <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text>
        ) : null}
      </View>

      <View style={[styles.actionBar, { backgroundColor: colors.surfaceLow, borderTopColor: colors.border }]}>
        {existingRelationship ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleOpenExisting}
            disabled={isStartingPreview}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              Open Connection
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: isStartingPreview ? colors.primaryMuted : colors.primary },
            ]}
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
        )}
      </View>

      <SingleChartModal
        visible={chartModalVisible}
        onClose={() => setChartModalVisible(false)}
        subjectName={fullName || 'Your person'}
        birthChart={subject.birthChart}
        planetColor="#82C8B4"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
  headerSlotStack: {
    gap: 10,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  identityWrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 2,
    minWidth: 44,
    alignItems: 'center',
  },
  photoEditBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 4,
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
  connectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
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
