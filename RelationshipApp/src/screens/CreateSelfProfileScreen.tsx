import React, { useMemo, useState } from 'react';
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
import auth from '@react-native-firebase/auth';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceAutocompleteInput } from '../components/PlaceAutocompleteInput';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { RELATIONSHIP_APP_DOMAIN } from '../../../shared/domain/relationshipUser';
import { externalApi, PlaceDetails, relationshipUsersApi } from '../api';
import { relationshipAppEnv } from '../config/env';
import { createLocalRelationshipProfile } from '../mocks/demoData';
import {
  getEpochSeconds,
  isValidDate,
  isValidTime,
  parseNumberInput,
} from '../utils/birthData';

type Props = StackScreenProps<RelationshipRootParamList, 'CreateSelfProfile'>;

export const CreateSelfProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const setProfile = useRelationshipAppStore((state) => state.setProfile);
  const authStatus = useRelationshipAppStore((state) => state.authStatus);
  const firebaseEmail = useRelationshipAppStore((state) => state.firebaseEmail);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);

  const currentUser = isLocalUxMode ? null : auth().currentUser;
  const initialNames = useMemo(() => {
    const displayName = currentUser?.displayName || '';
    const parts = displayName.trim().split(/\s+/).filter(Boolean);

    return {
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' '),
    };
  }, [currentUser?.displayName]);

  const [firstName, setFirstName] = useState(initialNames.firstName);
  const [lastName, setLastName] = useState(initialNames.lastName);
  const [gender, setGender] = useState('other');
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [timeOfBirth, setTimeOfBirth] = useState('12:00');
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isAutofillingLocation, setIsAutofillingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canUseGoogleServices = Boolean(relationshipAppEnv.googleApiKey);

  const resolveLocationFields = async () => {
    let resolvedPlace = placeOfBirth.trim();
    let resolvedLat = parseNumberInput(latitude);
    let resolvedLon = parseNumberInput(longitude);
    let resolvedTzone: number | null = null;

    if ((resolvedLat === null || resolvedLon === null) && resolvedPlace && canUseGoogleServices) {
      const geocoded = await externalApi.geocodeLocation(resolvedPlace);
      resolvedLat = geocoded.lat;
      resolvedLon = geocoded.lng;
      resolvedPlace = geocoded.formattedAddress;
      setLatitude(String(geocoded.lat));
      setLongitude(String(geocoded.lng));
      setPlaceOfBirth(geocoded.formattedAddress);
    }

    if (resolvedTzone === null && resolvedLat !== null && resolvedLon !== null && canUseGoogleServices) {
      const timeForTimezone = birthTimeUnknown ? '12:00' : timeOfBirth;
      const epochTimeSeconds = getEpochSeconds(dateOfBirth, timeForTimezone);
      resolvedTzone = await externalApi.fetchTimeZone(resolvedLat, resolvedLon, epochTimeSeconds);
    }

    return {
      placeOfBirth: resolvedPlace,
      lat: resolvedLat,
      lon: resolvedLon,
      tzone: resolvedTzone,
    };
  };

  const handlePlaceResolved = async (nextPlace?: string) => {
    if (nextPlace && nextPlace !== placeOfBirth) {
      setPlaceOfBirth(nextPlace);
    }

    const targetPlace = (nextPlace ?? placeOfBirth).trim();
    if (!targetPlace || isAutofillingLocation || !canUseGoogleServices) {
      return;
    }

    try {
      setIsAutofillingLocation(true);
      await resolveLocationFields();
    } catch (error) {
      if (!isLocalUxMode) {
        setSubmitError(error instanceof Error ? error.message : 'Could not resolve this location.');
      }
    } finally {
      setIsAutofillingLocation(false);
    }
  };

  const handlePlaceSelected = async (selection: PlaceDetails) => {
    setPlaceOfBirth(selection.formattedAddress || selection.displayName || placeOfBirth);
    if (selection.lat !== null) {
      setLatitude(String(selection.lat));
    }
    if (selection.lng !== null) {
      setLongitude(String(selection.lng));
    }
  };

  const handleSubmit = async () => {
    if (!isLocalUxMode && (authStatus !== 'signedIn' || !currentUser)) {
      setSubmitError('A Firebase session is required before creating the relationship profile.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setSubmitError('First and last name are required.');
      return;
    }

    if (!isValidDate(dateOfBirth)) {
      setSubmitError('Date of birth must use YYYY-MM-DD and be a real date.');
      return;
    }

    if (!birthTimeUnknown && !isValidTime(timeOfBirth)) {
      setSubmitError('Birth time must use 24-hour HH:MM format.');
      return;
    }

    if (!placeOfBirth.trim()) {
      setSubmitError('Place of birth is required.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const resolved = isLocalUxMode
        ? {
            placeOfBirth: placeOfBirth.trim(),
            lat: null,
            lon: null,
            tzone: null,
          }
        : await resolveLocationFields();

      if (
        !isLocalUxMode &&
        resolved.lat === null ||
        !isLocalUxMode &&
        resolved.lon === null ||
        !isLocalUxMode &&
        resolved.tzone === null
      ) {
        throw new Error(
          'We could not resolve this birth location from Google. Check the API key or choose a clearer place.'
        );
      }

      const profile = isLocalUxMode
        ? createLocalRelationshipProfile({
            firstName,
            lastName,
            dateOfBirth,
            placeOfBirth: resolved.placeOfBirth,
            time: birthTimeUnknown ? undefined : timeOfBirth,
            birthTimeUnknown,
          })
        : birthTimeUnknown
          ? await relationshipUsersApi.createProfileUnknownTime({
              firebaseUid: currentUser?.uid ?? 'unknown',
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              gender,
              placeOfBirth: resolved.placeOfBirth,
              dateOfBirth,
              email: firebaseEmail ?? '',
              lat: resolved.lat,
              lon: resolved.lon,
              tzone: resolved.tzone,
            })
          : await relationshipUsersApi.createProfile({
              firebaseUid: currentUser?.uid ?? 'unknown',
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              dateOfBirth,
              placeOfBirth: resolved.placeOfBirth,
              time: timeOfBirth,
              lat: resolved.lat,
              lon: resolved.lon,
              tzone: resolved.tzone,
              gender,
              unknownTime: false,
            });

      setProfile(profile);
      navigation.replace('ChooseTargetType');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create the relationship profile.';
      setSubmitError(message);
      Alert.alert('Profile creation failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>You</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Create the one profile this app will reuse.
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            This is intentionally plain. The goal is to make the relationship-app
            account flow real before we commit to final onboarding design. Data
            is submitted into the dedicated {RELATIONSHIP_APP_DOMAIN} user domain.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Identity</Text>
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
          <Text style={[styles.helper, { color: colors.textMuted }]}>
            Firebase email: {firebaseEmail ?? 'not available on this session'}
          </Text>
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
                If enabled, we submit through the unknown-time backend path.
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
          <PlaceAutocompleteInput
            value={placeOfBirth}
            onChangeText={setPlaceOfBirth}
            onSelectSuggestion={async (selection) => {
              await handlePlaceSelected(selection);
            }}
            onBlur={() => {
              handlePlaceResolved().catch(() => undefined);
            }}
            canUseSuggestions={canUseGoogleServices}
            helperText={
              canUseGoogleServices
                ? 'Type at least 3 characters to see place suggestions. Selecting one will resolve the formatted location and timezone automatically.'
                : isLocalUxMode
                  ? 'Suggestions are unavailable without a valid Google key, but local UX mode can still continue with the typed place.'
                  : 'Suggestions are unavailable until GOOGLE_API_KEY is configured for RelationshipApp.'
            }
          />
          {isAutofillingLocation ? (
            <Text style={[styles.helper, { color: colors.textMuted }]}>Resolving location...</Text>
          ) : null}
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
              {isSubmitting ? 'Saving Profile...' : 'Save Profile'}
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
