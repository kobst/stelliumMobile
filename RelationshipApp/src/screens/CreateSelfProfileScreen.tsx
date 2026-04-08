import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useRelationshipAppStore, GuestProfileDraft } from '../store';
import { useTheme } from '../theme';
import { externalApi, onboardingApi, PlaceDetails, OnboardingPreviewResponse } from '../api';
import { relationshipAppEnv } from '../config/env';
import {
  getEpochSeconds,
  isValidDate,
  isValidTime,
  parseNumberInput,
} from '../utils/birthData';

type Props = StackScreenProps<RelationshipRootParamList, 'CreateSelfProfile'>;

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

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'non-binary' },
] as const;

const PARTNER_GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'All', value: 'all' },
] as const;

export const CreateSelfProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const setGuestProfileDraft = useRelationshipAppStore((state) => state.setGuestProfileDraft);
  const setProfileReveal = useRelationshipAppStore((state) => state.setProfileReveal);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode) || relationshipAppEnv.enableLocalUxMode;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [preferredPartnerGender, setPreferredPartnerGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [timeOfBirth, setTimeOfBirth] = useState('12:00');
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isAutofillingLocation, setIsAutofillingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showPartnerGenderDropdown, setShowPartnerGenderDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateSet, setDateSet] = useState(false);
  const [timeSet, setTimeSet] = useState(false);

  const canUseGoogleServices = Boolean(relationshipAppEnv.googleApiKey);
  const currentDate = useMemo(() => parseDateString(dateOfBirth), [dateOfBirth]);
  const currentTime = useMemo(() => parseTimeString(timeOfBirth), [timeOfBirth]);

  const genderLabel = GENDER_OPTIONS.find((o) => o.value === gender)?.label;
  const partnerGenderLabel = PARTNER_GENDER_OPTIONS.find((o) => o.value === preferredPartnerGender)?.label;

  const formatDisplayDate = (iso: string): string => {
    const [y, m, d] = iso.split('-');
    return `${m}/${d}/${y}`;
  };

  const formatDisplayTime = (t: string): string => {
    const [h, min] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
  };

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

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    setDateOfBirth(`${year}-${month}-${day}`);
    setDateSet(true);
  };

  const handleTimeChange = (_event: unknown, selectedTime?: Date) => {
    if (!selectedTime) {
      return;
    }

    const hours = String(selectedTime.getHours()).padStart(2, '0');
    const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
    setTimeOfBirth(`${hours}:${minutes}`);
    setTimeSet(true);
  };

  const handleSubmit = async () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      setSubmitError('Name is required.');
      return;
    }

    if (!isValidDate(dateOfBirth)) {
      setSubmitError('Please enter a valid date of birth.');
      return;
    }

    if (!birthTimeUnknown && !isValidTime(timeOfBirth)) {
      setSubmitError('Please enter a valid birth time.');
      return;
    }

    if (!placeOfBirth.trim()) {
      setSubmitError('Birth location is required.');
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
        (resolved.lat === null ||
        resolved.lon === null ||
        resolved.tzone === null)
      ) {
        throw new Error(
          'We could not resolve this birth location. Please choose a clearer place.'
        );
      }

      const draft: GuestProfileDraft = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        dateOfBirth,
        timeOfBirth: birthTimeUnknown ? '12:00' : timeOfBirth,
        birthTimeUnknown,
        placeOfBirth: resolved.placeOfBirth,
        latitude: resolved.lat,
        longitude: resolved.lon,
        totalOffsetHours: resolved.tzone,
      };

      if (isLocalUxMode) {
        setGuestProfileDraft(draft);
        setProfileReveal({
          previewId: 'local-preview-id',
          claimToken: 'local-claim-token',
          overview:
            `${draft.firstName}, your chart reveals a deeply magnetic romantic nature. ` +
            'You lead with emotional intensity and crave partnerships that challenge you intellectually.',
          topAspects: [
            {
              aspectType: 'venus_mars_conjunction',
              label: 'Venus-Mars conjunction',
              primaryCluster: 'Passion',
              clusterThemes: ['Passion', 'Connection'],
              matches: [{ celebId: 'demo-1', celebName: 'Timothée Chalamet', orb: 2.1 }],
            },
            {
              aspectType: 'moon_venus_trine',
              label: 'Moon-Venus trine',
              primaryCluster: 'Harmony',
              clusterThemes: ['Harmony', 'Connection'],
              matches: [{ celebId: 'demo-2', celebName: 'Zendaya', orb: 3.5 }],
            },
          ],
          birthChart: {},
          fullResponse: {} as OnboardingPreviewResponse,
        });
        navigation.replace('ProfileReveal');
        return;
      }

      const requestPayload = {
        firstName: draft.firstName,
        lastName: draft.lastName,
        gender: draft.gender,
        preferredPartnerGender: preferredPartnerGender || undefined,
        dateOfBirth: draft.dateOfBirth,
        time: draft.birthTimeUnknown ? undefined : draft.timeOfBirth,
        placeOfBirth: draft.placeOfBirth,
        lat: String(draft.latitude ?? 0),
        lon: String(draft.longitude ?? 0),
        tzone: String(draft.totalOffsetHours ?? 0),
        totalOffsetHours: draft.totalOffsetHours ?? 0,
      };
      // TODO: Remove debug log after API integration is confirmed working
      console.log('[onboarding-preview] request:', JSON.stringify(requestPayload, null, 2));

      const previewResponse = await onboardingApi.submitPreview(requestPayload);

      console.log('[onboarding-preview] response:', JSON.stringify(previewResponse, null, 2));

      // Set both at once to avoid navigator key change mid-flight
      setGuestProfileDraft(draft);
      setProfileReveal({
        previewId: previewResponse.previewId,
        claimToken: previewResponse.claimToken,
        overview: previewResponse.overview,
        topAspects: previewResponse.topAspects,
        birthChart: previewResponse.birthChart,
        fullResponse: previewResponse,
      });

      navigation.replace('ProfileReveal');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not generate your profile.';
      setSubmitError(message);
      Alert.alert('Profile generation failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.heroIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.heroIconText, { color: colors.accent }]}>✦✦</Text>
          </View>
          <Text style={[styles.loadingTitle, { color: colors.text }]}>
            Reading the stars...
          </Text>
          <Text style={[styles.loadingSubtitle, { color: colors.textMuted }]}>
            Calculating your chart positions and finding your celebrity matches.
          </Text>
          <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero header */}
        <View style={styles.heroBlock}>
          <View style={[styles.heroIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.heroIconText, { color: colors.accent }]}>✦✦</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Discover your{'\n'}
            <Text style={{ color: colors.accent, fontStyle: 'italic' }}>
              celestial resonance
            </Text>
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
            Align your earthly journey with the celestial bodies. Enter your
            birth details to reveal your unique cosmic blueprint.
          </Text>
        </View>

        {/* Form card */}
        <View style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Full Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            />
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            />
          </View>

          {/* Gender */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Essence</Text>
            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => setShowGenderDropdown(!showGenderDropdown)}
            >
              <Text style={[styles.selectInputText, { color: gender ? colors.text : colors.textSubtle }]}>
                {genderLabel ?? 'Select gender'}
              </Text>
              <Text style={[styles.selectChevron, { color: colors.textSubtle }]}>&#709;</Text>
            </TouchableOpacity>
            {showGenderDropdown ? (
              <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      gender === option.value && { backgroundColor: colors.surfaceMuted },
                    ]}
                    onPress={() => {
                      setGender(option.value);
                      setShowGenderDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          {/* Date of Birth */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Date of Alignment</Text>
            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.inputBackground, borderColor: showDatePicker ? colors.primary : colors.border }]}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Text style={[styles.selectInputText, { color: dateSet ? colors.text : colors.textSubtle }]}>
                {dateSet ? formatDisplayDate(dateOfBirth) : 'mm/dd/yyyy'}
              </Text>
              <Text style={[styles.selectIcon, { color: colors.textSubtle }]}>&#x1F4C5;</Text>
            </TouchableOpacity>
            {showDatePicker ? (
              <View style={[styles.inlinePicker, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <DateTimePicker
                  value={currentDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  textColor={colors.text}
                  style={styles.inlinePickerWheel}
                />
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setShowDatePicker(false);
                    setDateSet(true);
                  }}
                >
                  <Text style={styles.confirmButtonText}>CONFIRM ALIGNMENT</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Birth Time */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Moment of Breath</Text>
              <TouchableOpacity onPress={() => setBirthTimeUnknown(!birthTimeUnknown)}>
                <Text style={[styles.unknownToggleText, { color: birthTimeUnknown ? colors.primary : colors.textSubtle }]}>
                  {birthTimeUnknown ? 'Unknown' : 'I don\'t know'}
                </Text>
              </TouchableOpacity>
            </View>
            {!birthTimeUnknown ? (
              <>
                <TouchableOpacity
                  style={[styles.selectInput, { backgroundColor: colors.inputBackground, borderColor: showTimePicker ? colors.primary : colors.border }]}
                  onPress={() => setShowTimePicker(!showTimePicker)}
                >
                  <Text style={[styles.selectInputText, { color: timeSet ? colors.text : colors.textSubtle }]}>
                    {timeSet ? formatDisplayTime(timeOfBirth) : '- - : - -'}
                  </Text>
                  <Text style={[styles.selectIcon, { color: colors.textSubtle }]}>&#x1F552;</Text>
                </TouchableOpacity>
                {showTimePicker ? (
                  <View style={[styles.inlinePicker, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                    <DateTimePicker
                      value={currentTime}
                      mode="time"
                      display="spinner"
                      onChange={handleTimeChange}
                      is24Hour={false}
                      textColor={colors.text}
                      style={styles.inlinePickerWheel}
                    />
                    <TouchableOpacity
                      style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        setShowTimePicker(false);
                        setTimeSet(true);
                      }}
                    >
                      <Text style={styles.confirmButtonText}>CONFIRM MOMENT</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={[styles.infoBox, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  We'll calculate without house placements.
                </Text>
              </View>
            )}
          </View>

          {/* Birth Location */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Terrestrial Coordinates</Text>
            <PlaceAutocompleteInput
              value={placeOfBirth}
              onChangeText={setPlaceOfBirth}
              onSelectSuggestion={async (selection) => {
                await handlePlaceSelected(selection);
              }}
              onBlur={() => {
                handlePlaceResolved().catch(() => undefined);
              }}
              placeholder="Search City, Country"
              canUseSuggestions={canUseGoogleServices}
            />
            {placeOfBirth ? (
              <View style={[styles.selectedLocation, { backgroundColor: colors.surfaceMuted }]}>
                <View style={[styles.locationDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.selectedLocationText, { color: colors.text }]} numberOfLines={1}>
                  {placeOfBirth}
                </Text>
              </View>
            ) : null}
            {isAutofillingLocation ? (
              <Text style={[styles.infoText, { color: colors.textMuted }]}>Resolving...</Text>
            ) : null}
          </View>

          {/* Preferred Partner Gender */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Preferred Partner Gender</Text>
            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => setShowPartnerGenderDropdown(!showPartnerGenderDropdown)}
            >
              <Text style={[styles.selectInputText, { color: preferredPartnerGender ? colors.text : colors.textSubtle }]}>
                {partnerGenderLabel ?? 'Select preference'}
              </Text>
              <Text style={[styles.selectChevron, { color: colors.textSubtle }]}>&#709;</Text>
            </TouchableOpacity>
            {showPartnerGenderDropdown ? (
              <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {PARTNER_GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      preferredPartnerGender === option.value && { backgroundColor: colors.surfaceMuted },
                    ]}
                    onPress={() => {
                      setPreferredPartnerGender(option.value);
                      setShowPartnerGenderDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {submitError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{submitError}</Text>
        ) : null}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>
            {isSubmitting ? 'GENERATING...' : 'GENERATE PROFILE'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.privacyText, { color: colors.textSubtle }]}>
          Privacy secured by encrypted celestial channels
        </Text>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  loadingTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  loadingSpinner: {
    marginTop: 12,
  },

  // Hero
  heroBlock: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    gap: 16,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: {
    fontSize: 28,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  // Form card
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  // Select / dropdown inputs
  selectInput: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectInputText: {
    fontSize: 16,
  },
  selectChevron: {
    fontSize: 18,
  },
  selectIcon: {
    fontSize: 18,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownOptionText: {
    fontSize: 16,
  },
  unknownToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Inline picker
  inlinePicker: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  inlinePickerWheel: {
    height: 160,
    width: '100%',
  },
  confirmButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    marginHorizontal: 8,
    marginTop: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  infoBox: {
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Location
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedLocationText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Error
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },

  // CTA
  ctaButton: {
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 20,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  privacyText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 16,
  },
});
