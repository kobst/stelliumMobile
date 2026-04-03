import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { externalApi, relationshipsApi, usersApi } from '../api';
import { relationshipAppEnv } from '../config/env';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import {
  resolvePartnerLocationFields,
  submitPartnerPreview,
  validatePartnerDraft,
} from './createPartnerFlow';

type Props = StackScreenProps<RelationshipRootParamList, 'CreatePartner'>;

export const CreatePartnerScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const selfProfile = useRelationshipAppStore((state) => state.profile);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setActiveRelationshipId = useRelationshipAppStore((state) => state.setActiveRelationshipId);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('other');
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [timeOfBirth, setTimeOfBirth] = useState('12:00');
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [timezoneOffset, setTimezoneOffset] = useState('');
  const [isAutofillingLocation, setIsAutofillingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canUseGoogleServices = Boolean(relationshipAppEnv.googleApiKey);
  const draft = {
    firstName,
    lastName,
    gender,
    dateOfBirth,
    timeOfBirth,
    birthTimeUnknown,
    placeOfBirth,
    latitude,
    longitude,
    timezoneOffset,
  };

  const resolveLocationFields = async () => {
    const resolved = await resolvePartnerLocationFields(draft, {
      canUseGoogleServices,
      geocodeLocation: externalApi.geocodeLocation,
      fetchTimeZone: externalApi.fetchTimeZone,
    });

    if (resolved.lat !== null) {
      setLatitude(String(resolved.lat));
    }

    if (resolved.lon !== null) {
      setLongitude(String(resolved.lon));
    }

    if (resolved.tzone !== null) {
      setTimezoneOffset(String(resolved.tzone));
    }

    if (resolved.placeOfBirth) {
      setPlaceOfBirth(resolved.placeOfBirth);
    }

    return resolved;
  };

  const handleAutofillLocation = async () => {
    if (!placeOfBirth.trim()) {
      Alert.alert('Location required', 'Enter a city or place name first.');
      return;
    }

    if (!canUseGoogleServices) {
      Alert.alert(
        'Google API key missing',
        'Manual latitude, longitude, and timezone entry is required until the relationship app environment includes GOOGLE_API_KEY.'
      );
      return;
    }

    try {
      setIsAutofillingLocation(true);
      const resolved = await resolveLocationFields();
      if (resolved.lat === null || resolved.lon === null || resolved.tzone === null) {
        throw new Error('Could not resolve the full location payload.');
      }
    } catch (error) {
      Alert.alert(
        'Location lookup failed',
        error instanceof Error ? error.message : 'Could not resolve this location.'
      );
    } finally {
      setIsAutofillingLocation(false);
    }
  };

  const handleSubmit = async () => {
    const validationError = validatePartnerDraft(
      draft,
      selfProfileId && selfProfile
        ? { id: selfProfileId, firebaseUid: selfProfile.firebaseUid }
        : null
    );
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const { partner, preview, resolvedLocation } = await submitPartnerPreview(
        draft,
        { id: selfProfileId as string, firebaseUid: selfProfile?.firebaseUid ?? null },
        {
          canUseGoogleServices,
          geocodeLocation: externalApi.geocodeLocation,
          fetchTimeZone: externalApi.fetchTimeZone,
          createGuestSubject: usersApi.createGuestSubject,
          createGuestSubjectUnknownTime: usersApi.createGuestSubjectUnknownTime,
          enhancedRelationshipAnalysis: relationshipsApi.enhancedRelationshipAnalysis,
        }
      );

      setPlaceOfBirth(resolvedLocation.placeOfBirth);
      setLatitude(String(resolvedLocation.lat));
      setLongitude(String(resolvedLocation.lon));
      setTimezoneOffset(String(resolvedLocation.tzone));

      setActiveTargetSubject(partner);
      setPreviewAnalysis(preview);
      setActiveRelationshipId(preview.compositeChartId);
      navigation.replace('RelationshipPreview');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create the partner preview.';
      setSubmitError(message);
      Alert.alert('Preview generation failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Real Person</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Create a partner profile and request the first live compatibility preview.
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            This uses the existing guest-subject backend path, then immediately runs the
            shared relationship preview analysis against your saved self profile.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Partner identity</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <TextInput
            value={gender}
            onChangeText={setGender}
            placeholder="Gender"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Birth data</Text>
          <TextInput
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />

          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Birth time unknown</Text>
              <Text style={[styles.helper, { color: colors.textMuted }]}>
                If enabled, the guest profile is created through the unknown-time path.
              </Text>
            </View>
            <Switch
              value={birthTimeUnknown}
              onValueChange={setBirthTimeUnknown}
              thumbColor={colors.surface}
              trackColor={{ false: colors.surfaceMuted, true: colors.primaryMuted }}
            />
          </View>

          {!birthTimeUnknown ? (
            <TextInput
              value={timeOfBirth}
              onChangeText={setTimeOfBirth}
              placeholder="HH:MM"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Birth location</Text>
          <TextInput
            value={placeOfBirth}
            onChangeText={setPlaceOfBirth}
            placeholder="City, state, country"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <TouchableOpacity
            style={[styles.utilityButton, { borderColor: colors.border }]}
            onPress={handleAutofillLocation}
            disabled={isAutofillingLocation}
          >
            <Text style={[styles.utilityButtonText, { color: colors.text }]}>
              {isAutofillingLocation ? 'Resolving Location...' : 'Autofill Coordinates + Timezone'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.helper, { color: colors.textMuted }]}>
            {canUseGoogleServices
              ? 'If the Google API key is configured, this will geocode the location and derive timezone automatically.'
              : 'GOOGLE_API_KEY is not configured for RelationshipApp yet, so enter latitude, longitude, and timezone manually.'}
          </Text>

          <TextInput
            value={latitude}
            onChangeText={setLatitude}
            placeholder="Latitude"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <TextInput
            value={longitude}
            onChangeText={setLongitude}
            placeholder="Longitude"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <TextInput
            value={timezoneOffset}
            onChangeText={setTimezoneOffset}
            placeholder="Timezone offset hours, ex: -5"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        </View>

        {submitError ? (
          <Text style={[styles.errorText, { color: colors.primary }]}>{submitError}</Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Generating Preview...' : 'Generate Preview'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
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
    padding: 20,
    paddingBottom: 40,
    gap: 16,
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
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchCopy: {
    flex: 1,
    gap: 4,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
  },
  utilityButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  utilityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  primaryButtonText: {
    color: '#FFF9F0',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
