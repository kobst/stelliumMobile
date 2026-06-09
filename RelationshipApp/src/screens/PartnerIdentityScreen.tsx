import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import {
  EMPTY_PARTNER_DRAFT,
  type ProfileGender,
  useRelationshipAppStore,
} from '../store';
import { SettingsNavBar } from '../components/SettingsNavBar';
import { Avatar } from '../components/Avatar';
import { ProgressDashes } from '../components/ProgressDashes';
import { WizardArrowButton } from '../components/WizardArrowButton';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

const GENDER_OPTIONS: readonly { value: ProfileGender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

export function PartnerIdentityScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { colors } = useTheme();
  const draft = useRelationshipAppStore((state) => state.partnerDraft);
  const setDraft = useRelationshipAppStore((state) => state.setPartnerDraft);
  const updateDraft = useRelationshipAppStore((state) => state.updatePartnerDraft);
  const clearPartnerDraft = useRelationshipAppStore((state) => state.clearPartnerDraft);

  useEffect(() => {
    if (!draft) {
      setDraft({ ...EMPTY_PARTNER_DRAFT });
    }
  }, [draft, setDraft]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      clearPartnerDraft();
    });
    return unsubscribe;
  }, [navigation, clearPartnerDraft]);

  const current = draft ?? EMPTY_PARTNER_DRAFT;

  const [firstName, setFirstName] = useState(current.firstName);
  const [lastName, setLastName] = useState(current.lastName);
  const [gender, setGender] = useState<ProfileGender>(current.gender);
  const [photoAdded, setPhotoAdded] = useState(Boolean(current.photoUri));

  const canContinue = firstName.trim().length > 0;

  const handleContinue = useCallback(() => {
    if (!canContinue) {
      return;
    }
    updateDraft({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      photoUri: photoAdded ? 'local://photo-stub' : null,
    });
    navigation.navigate('PartnerBirthDate');
  }, [canContinue, firstName, gender, lastName, navigation, photoAdded, updateDraft]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Add Connection" backLabel="Cancel" />
      <View style={styles.progressWrap}>
        <ProgressDashes current={0} total={5} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Who are you adding?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Their details are private and only used to calculate the chart.
            </Text>
          </View>

          <View style={styles.photoSection}>
            <TouchableOpacity
              onPress={() => setPhotoAdded((v) => !v)}
              activeOpacity={0.85}
              style={styles.photoWrap}
            >
              {photoAdded ? (
                <Avatar
                  size={96}
                  gradient="green"
                  fallbackInitial={firstName.charAt(0) || 'A'}
                />
              ) : (
                <View
                  style={[
                    styles.photoPlaceholder,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.ghostBorder,
                    },
                  ]}
                >
                  <Text style={[styles.photoIcon, { color: colors.textSubtle }]}>📷</Text>
                </View>
              )}
              <View
                style={[
                  styles.photoBadge,
                  { backgroundColor: colors.primary, borderColor: colors.surfaceLow },
                ]}
              >
                <Text style={[styles.photoBadgeText, { color: colors.onPrimary }]}>
                  {photoAdded ? '✓' : '+'}
                </Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.photoCaption, { color: colors.textSubtle }]}>
              Add a photo (optional)
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="words"
              autoCorrect={false}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.ghostBorder,
                  color: colors.text,
                },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name (optional)"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="words"
              autoCorrect={false}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.ghostBorder,
                  color: colors.text,
                },
              ]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Identify as</Text>
            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map((option) => {
                const active = option.value === gender;
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.8}
                    onPress={() => setGender(option.value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? 'rgba(202, 190, 255, 0.14)'
                          : colors.surface,
                        borderColor: active
                          ? 'rgba(202, 190, 255, 0.35)'
                          : colors.ghostBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.primary : colors.textMuted },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <WizardArrowButton onPress={handleContinue} disabled={!canContinue} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    paddingTop: 6,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  photoSection: {
    alignItems: 'center',
    gap: 8,
  },
  photoWrap: {
    position: 'relative',
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 26,
  },
  photoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  photoCaption: {
    fontSize: 12,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
});
