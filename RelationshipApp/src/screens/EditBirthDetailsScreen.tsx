import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import {
  getBirthEditsRemaining,
  updateBirthDetails,
  updateGender,
  updateName,
} from '../api/profile';
import { SettingsNavBar } from '../components/SettingsNavBar';
import type { BirthDetailsDraft, ProfileGender } from '../store';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateOnly(value: string | undefined): string {
  if (!value) {
    return '';
  }
  return value.split('T')[0] ?? value;
}

function formatDate(iso: string): string {
  const dateOnly = toDateOnly(iso);
  if (!dateOnly) {
    return 'Not set';
  }
  const [year, month, day] = dateOnly.split('-');
  const monthIndex = Number(month) - 1;
  const dayNum = Number(day);
  if (!year || monthIndex < 0 || monthIndex > 11 || Number.isNaN(dayNum)) {
    return dateOnly;
  }
  return `${MONTH_NAMES[monthIndex]} ${dayNum}, ${year}`;
}

function formatTime(time: string, unknown: boolean): string {
  if (unknown) {
    return 'Unknown';
  }
  if (!time) {
    return 'Not set';
  }
  const [rawHours, rawMinutes] = time.split(':').map(Number);
  if (!Number.isFinite(rawHours) || !Number.isFinite(rawMinutes)) {
    return time;
  }
  const ampm = rawHours >= 12 ? 'PM' : 'AM';
  const hours12 = rawHours % 12 || 12;
  return `${hours12}:${String(rawMinutes).padStart(2, '0')} ${ampm}`;
}

function normalizeGender(raw: string | undefined): ProfileGender {
  if (raw === 'male' || raw === 'female') {
    return raw;
  }
  return 'other';
}

function genderLabel(value: ProfileGender): string {
  if (value === 'female') {
    return 'Female';
  }
  if (value === 'male') {
    return 'Male';
  }
  return 'Other';
}

function buildDraftFromProfile(
  profile: ReturnType<typeof useRelationshipAppStore.getState>['profile']
): BirthDetailsDraft {
  return {
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    gender: normalizeGender(profile?.subject?.gender),
    dateOfBirth: toDateOnly(profile?.dateOfBirth) || '1995-01-01',
    time: profile?.time ? profile.time.slice(0, 5) : '12:00',
    birthTimeUnknown: Boolean(profile?.birthTimeUnknown),
    placeOfBirth: profile?.placeOfBirth ?? '',
    latitude: null,
    longitude: null,
    totalOffsetHours:
      typeof profile?.totalOffsetHours === 'number' ? profile.totalOffsetHours : null,
  };
}

function birthDataChanged(a: BirthDetailsDraft, b: BirthDetailsDraft): boolean {
  return (
    a.dateOfBirth !== b.dateOfBirth ||
    a.time !== b.time ||
    a.birthTimeUnknown !== b.birthTimeUnknown ||
    a.placeOfBirth !== b.placeOfBirth ||
    a.latitude !== b.latitude ||
    a.longitude !== b.longitude ||
    a.totalOffsetHours !== b.totalOffsetHours
  );
}

function metadataChanged(a: BirthDetailsDraft, b: BirthDetailsDraft): boolean {
  return (
    a.firstName !== b.firstName ||
    a.lastName !== b.lastName ||
    a.gender !== b.gender
  );
}

export function EditBirthDetailsScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { colors } = useTheme();
  const profile = useRelationshipAppStore((state) => state.profile);
  const draft = useRelationshipAppStore((state) => state.birthDetailsDraft);
  const setDraft = useRelationshipAppStore((state) => state.setBirthDetailsDraft);
  const clearDraft = useRelationshipAppStore((state) => state.clearBirthDetailsDraft);
  const editsRemaining = useRelationshipAppStore((state) => state.birthEditsRemaining);
  const setEditsRemaining = useRelationshipAppStore((state) => state.setBirthEditsRemaining);

  const [isSaving, setIsSaving] = useState(false);

  const baseline = useMemo(() => buildDraftFromProfile(profile), [profile]);

  const hasSeededRef = useRef(false);
  useEffect(() => {
    if (hasSeededRef.current) {
      return;
    }
    if (!profile) {
      return;
    }
    hasSeededRef.current = true;
    setDraft(buildDraftFromProfile(profile));
  }, [profile, setDraft]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const remaining = await getBirthEditsRemaining();
        if (active) {
          setEditsRemaining(remaining);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[EditBirthDetailsScreen] edits lookup failed', error);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [setEditsRemaining]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      clearDraft();
    });
    return unsubscribe;
  }, [clearDraft, navigation]);

  const exhausted = editsRemaining !== null && editsRemaining <= 0;
  const current = draft ?? baseline;
  const birthDirty = birthDataChanged(current, baseline);
  const metaDirty = metadataChanged(current, baseline);
  const dirty = birthDirty || metaDirty;
  const birthDataBlocked = exhausted && birthDirty;

  const runSave = useCallback(
    async (activeDraft: BirthDetailsDraft) => {
      setIsSaving(true);
      try {
        const needsBirthUpdate = birthDataChanged(activeDraft, baseline);
        const needsMetaUpdate = metadataChanged(activeDraft, baseline);

        if (needsMetaUpdate) {
          if (
            activeDraft.firstName !== baseline.firstName ||
            activeDraft.lastName !== baseline.lastName
          ) {
            await updateName(activeDraft.firstName, activeDraft.lastName);
          }
          if (activeDraft.gender !== baseline.gender) {
            await updateGender(activeDraft.gender);
          }
        }

        if (needsBirthUpdate) {
          const { remaining } = await updateBirthDetails({
            dateOfBirth: activeDraft.dateOfBirth,
            time: activeDraft.birthTimeUnknown ? null : activeDraft.time,
            placeOfBirth: activeDraft.placeOfBirth,
            latitude: activeDraft.latitude,
            longitude: activeDraft.longitude,
            totalOffsetHours: activeDraft.totalOffsetHours,
          });
          setEditsRemaining(remaining);
        }

        clearDraft();
        Alert.alert(
          'Saved',
          needsBirthUpdate
            ? 'Your chart is being recalculated.'
            : 'Your profile has been updated.'
        );
      } catch (error) {
        Alert.alert(
          'Save failed',
          error instanceof Error ? error.message : 'Please try again shortly.'
        );
      } finally {
        setIsSaving(false);
      }
    },
    [baseline, clearDraft, setEditsRemaining]
  );

  const handleSave = useCallback(() => {
    if (!dirty || isSaving || !draft || birthDataBlocked) {
      return;
    }
    if (birthDirty) {
      Alert.alert(
        'Save birth details?',
        'This will recalculate your profile and every relationship score.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            style: 'default',
            onPress: () => {
              runSave(draft);
            },
          },
        ]
      );
      return;
    }
    runSave(draft);
  }, [birthDataBlocked, birthDirty, dirty, draft, isSaving, runSave]);

  const handleDiscard = useCallback(() => {
    if (!dirty) {
      return;
    }
    Alert.alert('Discard changes?', 'Your edits will not be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setDraft(baseline);
        },
      },
    ]);
  }, [baseline, dirty, setDraft]);

  const fullName = [current.firstName, current.lastName].filter(Boolean).join(' ').trim();
  const fields: readonly {
    key: string;
    label: string;
    value: string;
    route?: keyof RelationshipRootParamList;
    locked?: boolean;
  }[] = [
    {
      key: 'name',
      label: 'Name',
      value: fullName || 'Not set',
      route: 'EditName',
    },
    {
      key: 'gender',
      label: 'Identify as',
      value: genderLabel(current.gender),
      route: 'EditGender',
    },
    {
      key: 'dateOfBirth',
      label: 'Birth Date',
      value: formatDate(current.dateOfBirth),
      route: 'EditBirthDate',
      locked: exhausted,
    },
    {
      key: 'time',
      label: 'Birth Time',
      value: formatTime(current.time, current.birthTimeUnknown),
      route: 'EditBirthTime',
      locked: exhausted,
    },
    {
      key: 'placeOfBirth',
      label: 'Birth City',
      value: current.placeOfBirth || 'Not set',
      route: 'EditBirthCity',
      locked: exhausted,
    },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="My Details" backLabel="Profile" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {exhausted ? (
          <View
            style={[
              styles.notice,
              {
                backgroundColor: 'rgba(255, 180, 171, 0.08)',
                borderColor: 'rgba(255, 180, 171, 0.2)',
              },
            ]}
          >
            <Text style={[styles.noticeIcon, { color: colors.error }]}>⚠︎</Text>
            <Text style={[styles.noticeText, { color: colors.error }]}>
              No birth-data edits remaining. Name and gender can still be updated.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.notice,
              {
                backgroundColor: 'rgba(202, 190, 255, 0.1)',
                borderColor: 'rgba(202, 190, 255, 0.2)',
              },
            ]}
          >
            <Text style={[styles.noticeIcon, { color: colors.primary }]}>ℹ</Text>
            <Text style={[styles.noticeText, { color: colors.primary }]}>
              You can update your birth data{' '}
              <Text style={styles.noticeStrong}>
                {editsRemaining === null
                  ? 'a few'
                  : `${editsRemaining} more time${editsRemaining === 1 ? '' : 's'}`}
              </Text>
              . Changes to date, time, or place recalculate your profile and all relationship
              scores. Name and gender updates are unlimited.
            </Text>
          </View>
        )}

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          {fields.map((field, index) => {
            const isLast = index === fields.length - 1;
            const disabled = field.locked || exhausted || !field.route;
            const rowContent = (
              <View
                style={[
                  styles.row,
                  isLast ? null : { borderBottomColor: colors.ghostBorder, borderBottomWidth: 1 },
                ]}
              >
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{field.label}</Text>
                <Text
                  style={[
                    styles.rowValue,
                    { color: disabled ? colors.textSubtle : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {field.value}
                </Text>
                {!disabled && field.route ? (
                  <Text style={[styles.rowChev, { color: colors.textSubtle }]}>›</Text>
                ) : null}
              </View>
            );
            if (disabled || !field.route) {
              return <View key={field.key}>{rowContent}</View>;
            }
            const targetRoute = field.route;
            return (
              <TouchableOpacity
                key={field.key}
                activeOpacity={0.75}
                onPress={() => navigation.navigate(targetRoute as 'EditBirthDate')}
              >
                {rowContent}
              </TouchableOpacity>
            );
          })}
        </View>

        {dirty ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDiscard}
            style={styles.discardLink}
          >
            <Text style={[styles.discardLinkText, { color: colors.textSubtle }]}>
              Discard changes
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={handleSave}
          disabled={!dirty || isSaving || birthDataBlocked}
          activeOpacity={0.85}
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              opacity: !dirty || isSaving || birthDataBlocked ? 0.4 : 1,
            },
          ]}
        >
          <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
        {birthDirty ? (
          <Text style={[styles.saveCaption, { color: colors.textSubtle }]}>
            Saving will recalculate all your data
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 18,
  },
  notice: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  noticeStrong: {
    fontWeight: '700',
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
    paddingVertical: 16,
  },
  rowLabel: {
    width: 100,
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
  rowChev: {
    fontSize: 18,
  },
  discardLink: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  discardLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveCaption: {
    fontSize: 12,
    textAlign: 'center',
  },
});
