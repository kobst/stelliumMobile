import React, { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceAutocompleteInput } from '../components/PlaceAutocompleteInput';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { externalApi, PlaceDetails, relationshipsApi, usersApi } from '../api';
import { relationshipAppEnv } from '../config/env';
import {
  createLocalPartnerSubject,
} from '../mocks/demoData';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { startRelationshipPreview } from './previewFlow';
import {
  resolvePartnerLocationFields,
  submitPartnerPreview,
  validatePartnerDraft,
} from './createPartnerFlow';

type Props = StackScreenProps<RelationshipRootParamList, 'CreatePartner'>;

function parseDateString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year || 1995, (month || 1) - 1, day || 1);
}

function parseTimeString(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date(2000, 0, 1);
  date.setHours(hours || 12, minutes || 0, 0, 0);
  return date;
}

export const CreatePartnerScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const selfProfile = useRelationshipAppStore((state) => state.profile);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setActiveRelationshipId = useRelationshipAppStore((state) => state.setActiveRelationshipId);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
  const currentDate = useMemo(() => parseDateString(dateOfBirth), [dateOfBirth]);
  const currentTime = useMemo(() => parseTimeString(timeOfBirth), [timeOfBirth]);
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
    timezoneOffset: '',
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
      // Timezone is resolved for backend submission but not exposed in the UI.
    }

    if (resolved.placeOfBirth) {
      setPlaceOfBirth(resolved.placeOfBirth);
    }

    return resolved;
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

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    setDateOfBirth(`${year}-${month}-${day}`);
  };

  const handleTimeChange = (_event: unknown, selectedTime?: Date) => {
    if (!selectedTime) {
      return;
    }

    const hours = String(selectedTime.getHours()).padStart(2, '0');
    const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
    setTimeOfBirth(`${hours}:${minutes}`);
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
      const resolvedLocation = isLocalUxMode
        ? {
            placeOfBirth: placeOfBirth.trim(),
            lat: null,
            lon: null,
            tzone: null,
          }
        : await resolveLocationFields();

      if (
        !isLocalUxMode &&
        (resolvedLocation.lat === null ||
          resolvedLocation.lon === null ||
          resolvedLocation.tzone === null)
      ) {
        throw new Error(
          'We could not resolve this birth location from Google. Check the API key or choose a clearer place.'
        );
      }

      const localPartner = isLocalUxMode && selfProfile
        ? createLocalPartnerSubject({
            firstName,
            lastName,
            dateOfBirth,
            placeOfBirth: resolvedLocation.placeOfBirth,
            time: birthTimeUnknown ? undefined : timeOfBirth,
            birthTimeUnknown,
            ownerUserId: selfProfile.id,
          })
        : null;

      const { partner, preview, updatedHistory } = localPartner
        ? {
            partner: localPartner,
            ...(await startRelationshipPreview(
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
            )),
          }
        : await submitPartnerPreview(
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
          ).then(async ({ partner: createdPartner, resolvedLocation: createdPartnerLocation }) => {
            const previewResult = await startRelationshipPreview(
              {
                selfProfile: selfProfile as NonNullable<typeof selfProfile>,
                targetSubject: createdPartner,
                targetType: 'person',
                isLocalUxMode,
                relationshipHistory,
              },
              {
                enhancedRelationshipAnalysis: relationshipsApi.enhancedRelationshipAnalysis,
              }
            );

            return {
              partner: createdPartner,
              resolvedLocation: createdPartnerLocation,
              preview: previewResult.preview,
              updatedHistory: previewResult.updatedHistory,
            };
          });

      setPlaceOfBirth(resolvedLocation.placeOfBirth);
      if (resolvedLocation.lat !== null) {
        setLatitude(String(resolvedLocation.lat));
      }
      if (resolvedLocation.lon !== null) {
        setLongitude(String(resolvedLocation.lon));
      }

      setActiveTargetSubject(partner);
      setPreviewAnalysis(preview);
      setActiveRelationshipId(preview.compositeChartId);
      if (isLocalUxMode) {
        setRelationshipHistory({
          relationshipHistory: updatedHistory,
        });
      }
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
          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Birth date</Text>
            <DateTimePicker
              value={currentDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.timeHeaderRow}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Birth time</Text>
              <View style={styles.timeToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.togglePill,
                    {
                      borderColor: colors.border,
                      backgroundColor: !birthTimeUnknown ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setBirthTimeUnknown(false)}
                >
                  <Text
                    style={[
                      styles.togglePillText,
                      !birthTimeUnknown
                        ? styles.togglePillTextActive
                        : styles.togglePillTextInactive,
                    ]}
                  >
                    Known
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.togglePill,
                    {
                      borderColor: colors.border,
                      backgroundColor: birthTimeUnknown ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setBirthTimeUnknown(true)}
                >
                  <Text
                    style={[
                      styles.togglePillText,
                      birthTimeUnknown
                        ? styles.togglePillTextActive
                        : styles.togglePillTextInactive,
                    ]}
                  >
                    Unknown
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {!birthTimeUnknown ? (
              <View style={styles.timePickerContainer}>
                <DateTimePicker
                  value={currentTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  is24Hour={false}
                />
              </View>
            ) : (
              <View
                style={[
                  styles.infoContainer,
                  { backgroundColor: colors.surfaceMuted },
                ]}
              >
                <Text style={[styles.helper, { color: colors.textMuted }]}>
                  We&apos;ll use the unknown-time guest-subject path and remove house-dependent birth data.
                </Text>
              </View>
            )}
          </View>
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
          {placeOfBirth ? (
            <View
              style={[
                styles.selectedLocationContainer,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <View style={[styles.checkmarkContainer, { backgroundColor: colors.primary }]}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <View style={styles.selectedTextContainer}>
                <Text style={[styles.selectedLocationLabel, { color: colors.textMuted }]}>
                  Selected location
                </Text>
                <Text style={[styles.selectedLocationText, { color: colors.text }]}>
                  {placeOfBirth}
                </Text>
              </View>
            </View>
          ) : null}
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
  formGroup: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 17,
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
  timeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  timeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  togglePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  togglePillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  togglePillTextActive: {
    color: '#FFF9F0',
  },
  togglePillTextInactive: {
    color: '#2B211C',
  },
  timePickerContainer: {
    height: 180,
  },
  infoContainer: {
    borderRadius: 14,
    padding: 16,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFF9F0',
    fontSize: 18,
    fontWeight: '700',
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedLocationLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  selectedLocationText: {
    fontSize: 15,
    fontWeight: '600',
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
