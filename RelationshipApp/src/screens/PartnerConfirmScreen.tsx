import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import { useRelationshipAppStore, type PartnerDraft } from '../store';
import { SettingsNavBar } from '../components/SettingsNavBar';
import { Avatar } from '../components/Avatar';
import { SubmittingOverlay } from '../components/SubmittingOverlay';
import { ProgressDashes } from '../components/ProgressDashes';
import { WizardArrowButton } from '../components/WizardArrowButton';
import { externalApi, relationshipsApi, relationshipUsersApi } from '../api';
import { submitPartnerPreview } from './createPartnerFlow';
import { startRelationshipPreview } from './previewFlow';
import { relationshipAppEnv } from '../config/env';
import { createLocalPartnerSubject } from '../mocks/demoData';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  const monthIndex = Number(month) - 1;
  const dayNum = Number(day);
  if (!year || monthIndex < 0 || monthIndex > 11 || Number.isNaN(dayNum)) {
    return iso;
  }
  return `${MONTHS[monthIndex]} ${dayNum}, ${year}`;
}

function formatTime(time: string, unknown: boolean): string {
  if (unknown) {
    return 'Unknown';
  }
  const [rawHours, rawMinutes] = time.split(':').map(Number);
  if (!Number.isFinite(rawHours) || !Number.isFinite(rawMinutes)) {
    return time;
  }
  const ampm = rawHours >= 12 ? 'PM' : 'AM';
  const hours12 = rawHours % 12 || 12;
  return `${hours12}:${String(rawMinutes).padStart(2, '0')} ${ampm}`;
}

function toLegacyDraft(draft: PartnerDraft) {
  return {
    firstName: draft.firstName,
    lastName: draft.lastName,
    gender: draft.gender,
    dateOfBirth: draft.dateOfBirth,
    timeOfBirth: draft.time,
    birthTimeUnknown: draft.birthTimeUnknown,
    placeOfBirth: draft.placeOfBirth,
    latitude: draft.latitude !== null ? String(draft.latitude) : '',
    longitude: draft.longitude !== null ? String(draft.longitude) : '',
    timezoneOffset: draft.totalOffsetHours !== null ? String(draft.totalOffsetHours) : '',
  };
}

export function PartnerConfirmScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { colors } = useTheme();
  const draft = useRelationshipAppStore((state) => state.partnerDraft);
  const selfProfile = useRelationshipAppStore((state) => state.profile);
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const setActiveTargetType = useRelationshipAppStore((state) => state.setActiveTargetType);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);
  const setActiveRelationshipId = useRelationshipAppStore((state) => state.setActiveRelationshipId);
  const setActivePartnerRomanticAssets = useRelationshipAppStore(
    (state) => state.setActivePartnerRomanticAssets
  );
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);
  const clearPartnerDraft = useRelationshipAppStore((state) => state.clearPartnerDraft);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canUseGoogleServices = Boolean(relationshipAppEnv.googleApiKey);

  const fullName = useMemo(() => {
    if (!draft) {
      return 'Your connection';
    }
    return [draft.firstName, draft.lastName].filter(Boolean).join(' ').trim() || 'Your connection';
  }, [draft]);

  const canSubmit = Boolean(
    draft &&
      draft.firstName.trim() &&
      draft.dateOfBirth &&
      draft.placeOfBirth.trim() &&
      selfProfile &&
      selfProfileId
  );

  const handleCreate = useCallback(async () => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[PartnerConfirmScreen.handleCreate] preflight', {
        hasDraft: Boolean(draft),
        hasSelfProfile: Boolean(selfProfile),
        selfProfileIdFromStore: selfProfileId,
        selfProfileIdFromProfile: selfProfile?.id,
        selfProfileFirebaseUid: selfProfile?.firebaseUid,
        idsMatch: selfProfile?.id === selfProfileId,
        isSubmitting,
        isLocalUxMode,
      });
    }
    if (!draft || !selfProfile || !selfProfileId || isSubmitting) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[PartnerConfirmScreen.handleCreate] aborted', {
          reason: !draft
            ? 'missing draft'
            : !selfProfile
              ? 'missing selfProfile'
              : !selfProfileId
                ? 'missing selfProfileId'
                : 'already submitting',
        });
      }
      return;
    }
    setIsSubmitting(true);
    try {
      setActiveTargetType('person');
      const legacyDraft = toLegacyDraft(draft);
      if (isLocalUxMode) {
        const localPartner = createLocalPartnerSubject({
          firstName: draft.firstName,
          lastName: draft.lastName,
          dateOfBirth: draft.dateOfBirth,
          placeOfBirth: draft.placeOfBirth,
          time: draft.birthTimeUnknown ? undefined : draft.time,
          birthTimeUnknown: draft.birthTimeUnknown,
          ownerUserId: selfProfileId,
        });
        const { preview, updatedHistory } = await startRelationshipPreview(
          {
            selfProfile,
            targetSubject: localPartner,
            targetType: 'person',
            isLocalUxMode,
            relationshipHistory,
          },
          {
            enhancedRelationshipAnalysis: relationshipsApi.enhancedRelationshipAnalysis,
          }
        );
        setActiveTargetSubject(localPartner);
        setPreviewAnalysis(preview);
        setActiveRelationshipId(preview.compositeChartId);
        setRelationshipHistory({
          relationshipHistory: updatedHistory,
        });
      } else {
        const { partner, romanticAssets } = await submitPartnerPreview(
          legacyDraft,
          {
            id: selfProfileId,
            firebaseUid: selfProfile.firebaseUid,
          },
          {
            canUseGoogleServices,
            geocodeLocation: externalApi.geocodeLocation,
            fetchTimeZone: externalApi.fetchTimeZone,
            createGuestSubjectRomantic: relationshipUsersApi.createGuestSubjectRomantic,
            createGuestSubjectUnknownTimeRomantic:
              relationshipUsersApi.createGuestSubjectUnknownTimeRomantic,
          }
        );
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[PartnerConfirmScreen.handleCreate] partner created', {
            partnerId: partner._id,
            partnerKind: partner.kind,
            romanticAssetsStatus: romanticAssets.status,
            hasRomanticOverview: Boolean(romanticAssets.overview),
            hasRomanticBlurb: Boolean(romanticAssets.romanticProfileBlurb),
            selfProfileId: selfProfile.id,
            aboutToCallEnhancedWith: {
              userIdA: selfProfile.id,
              userIdB: partner._id,
              ownerUserId: selfProfile.id,
            },
          });
        }
        setActiveTargetSubject(partner);
        setActivePartnerRomanticAssets(romanticAssets);
        const { preview, updatedHistory } = await startRelationshipPreview(
          {
            selfProfile,
            targetSubject: partner,
            targetType: 'person',
            isLocalUxMode,
            relationshipHistory,
          },
          {
            enhancedRelationshipAnalysis: relationshipsApi.enhancedRelationshipAnalysis,
          }
        );
        setPreviewAnalysis(preview);
        setActiveRelationshipId(preview.compositeChartId);
        setRelationshipHistory({
          relationshipHistory: updatedHistory,
        });
      }
      clearPartnerDraft();
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Main', params: { screen: 'RelationshipsTab' } },
          { name: 'RelationshipPreview' },
        ],
      });
    } catch (error) {
      Alert.alert(
        'Could not create connection',
        error instanceof Error ? error.message : 'Please try again shortly.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canUseGoogleServices,
    clearPartnerDraft,
    draft,
    isLocalUxMode,
    isSubmitting,
    navigation,
    relationshipHistory,
    selfProfile,
    selfProfileId,
    setActivePartnerRomanticAssets,
    setActiveRelationshipId,
    setActiveTargetSubject,
    setActiveTargetType,
    setPreviewAnalysis,
    setRelationshipHistory,
  ]);

  if (isSubmitting) {
    return (
      <SubmittingOverlay
        title="Iris is reading their chart"
        subtitle="Mapping your compatibility across every dimension of connection."
      />
    );
  }

  if (!draft) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
        <SettingsNavBar title="Confirm" backLabel="Back" />
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Go back and fill in the partner details first.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const rows: readonly { key: string; label: string; value: string }[] = [
    { key: 'gender', label: 'Identify as', value: genderLabel(draft.gender) },
    { key: 'dob', label: 'Birth Date', value: formatDate(draft.dateOfBirth) },
    {
      key: 'time',
      label: 'Birth Time',
      value: formatTime(draft.time, draft.birthTimeUnknown),
    },
    { key: 'city', label: 'Birth City', value: draft.placeOfBirth || 'Not set' },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Confirm" backLabel="Back" />
      <View style={styles.progressWrap}>
        <ProgressDashes current={4} total={5} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Avatar
            size={88}
            gradient="green"
            photoUri={draft.photoUri}
            fallbackInitial={draft.firstName.charAt(0) || 'A'}
          />
          <Text style={[styles.heroName, { color: colors.text }]}>{fullName}</Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          {rows.map((row, index) => {
            const isLast = index === rows.length - 1;
            return (
              <View
                key={row.key}
                style={[
                  styles.row,
                  isLast
                    ? null
                    : { borderBottomColor: colors.ghostBorder, borderBottomWidth: 1 },
                ]}
              >
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>
                  {row.label}
                </Text>
                <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={1}>
                  {row.value}
                </Text>
              </View>
            );
          })}
        </View>

        <View
          style={[
            styles.tierCard,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <Text style={[styles.tierHeader, { color: colors.textSubtle }]}>
            What you'll get
          </Text>
          {[
            { glyph: '✓', text: 'Relationship archetype & aspect match', paid: false },
            { glyph: '✓', text: 'Short romantic blurb (free)', paid: false },
            { glyph: '◆', text: '5-dimension scores & overview (1 credit)', paid: true },
            { glyph: '◆', text: 'Full synastry & composite analysis (3 credits)', paid: true },
          ].map((item) => (
            <View key={item.text} style={styles.tierRow}>
              <Text
                style={[
                  styles.tierGlyph,
                  { color: item.paid ? colors.accent : colors.success },
                ]}
              >
                {item.glyph}
              </Text>
              <Text
                style={[
                  styles.tierText,
                  { color: item.paid ? colors.textMuted : colors.text },
                ]}
              >
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={[styles.caption, { color: colors.textSubtle }]}>
          Short blurb and archetype are free
        </Text>
        <View style={styles.footerActions}>
          <WizardArrowButton
            onPress={handleCreate}
            disabled={!canSubmit || isSubmitting}
            accessibilityLabel="Create Connection"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function genderLabel(g: PartnerDraft['gender']): string {
  if (g === 'female') {
    return 'Female';
  }
  if (g === 'male') {
    return 'Male';
  }
  return 'Other';
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rowLabel: {
    width: 110,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  rowValue: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
  },
  tierCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  tierHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tierGlyph: {
    fontSize: 12,
    marginTop: 2,
    width: 14,
  },
  tierText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 10,
  },
  footerActions: {
    alignItems: 'flex-end',
  },
  caption: {
    fontSize: 12,
    textAlign: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
