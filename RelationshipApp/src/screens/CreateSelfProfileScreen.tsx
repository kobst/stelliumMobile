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

const STEPS = [
  {
    eyebrow: 'Step 1 of 6',
    title: 'What should we call you?',
    subtitle: 'Start with your name so we can personalize your romantic profile.',
  },
  {
    eyebrow: 'Step 2 of 6',
    title: 'How do you identify?',
    subtitle: 'Choose the essence that best fits you.',
  },
  {
    eyebrow: 'Step 3 of 6',
    title: 'Who are you drawn to?',
    subtitle: 'This helps us filter the first celebrity match set.',
  },
  {
    eyebrow: 'Step 4 of 6',
    title: 'When were you born?',
    subtitle: 'We need your birth date to calculate your chart.',
  },
  {
    eyebrow: 'Step 5 of 6',
    title: 'What time were you born?',
    subtitle: 'Birth time sharpens house placements, but you can skip it.',
  },
  {
    eyebrow: 'Step 6 of 6',
    title: 'Where were you born?',
    subtitle: 'Enter a city and country so we can resolve coordinates and timezone.',
  },
] as const;

export const CreateSelfProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const setGuestProfileDraft = useRelationshipAppStore((state) => state.setGuestProfileDraft);
  const setProfileReveal = useRelationshipAppStore((state) => state.setProfileReveal);
  const isLocalUxMode =
    useRelationshipAppStore((state) => state.isLocalUxMode) || relationshipAppEnv.enableLocalUxMode;

  const [currentStep, setCurrentStep] = useState(0);
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
  const [showDatePicker, setShowDatePicker] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(true);
  const [dateSet, setDateSet] = useState(false);
  const [timeSet, setTimeSet] = useState(false);

  const canUseGoogleServices = Boolean(relationshipAppEnv.googleApiKey);
  const pickerDate = useMemo(() => parseDateString(dateOfBirth), [dateOfBirth]);
  const pickerTime = useMemo(() => parseTimeString(timeOfBirth), [timeOfBirth]);

  const genderLabel = GENDER_OPTIONS.find((option) => option.value === gender)?.label;
  const partnerGenderLabel = PARTNER_GENDER_OPTIONS.find(
    (option) => option.value === preferredPartnerGender
  )?.label;

  const formatDisplayDate = (iso: string): string => {
    const [year, month, day] = iso.split('-');
    return `${month}/${day}/${year}`;
  };

  const formatDisplayTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const closeTransientUi = () => {
    setShowGenderDropdown(false);
    setShowPartnerGenderDropdown(false);
  };

  const getStepError = (step: number): string | null => {
    switch (step) {
      case 0:
        return firstName.trim() && lastName.trim() ? null : 'Enter your first and last name.';
      case 1:
        return gender ? null : 'Select your gender.';
      case 2:
        return preferredPartnerGender ? null : 'Select a partner preference.';
      case 3:
        return isValidDate(dateOfBirth) ? null : 'Enter a valid date of birth.';
      case 4:
        return birthTimeUnknown || isValidTime(timeOfBirth) ? null : 'Enter a valid birth time.';
      case 5:
        return placeOfBirth.trim() ? null : 'Birth location is required.';
      default:
        return null;
    }
  };

  const canContinue = !getStepError(currentStep);
  const isLastStep = currentStep === STEPS.length - 1;

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

    if (
      resolvedTzone === null &&
      resolvedLat !== null &&
      resolvedLon !== null &&
      canUseGoogleServices
    ) {
      const timeForTimezone = birthTimeUnknown ? '12:00' : timeOfBirth;
      const epochTimeSeconds = getEpochSeconds(dateOfBirth, timeForTimezone);
      resolvedTzone = await externalApi.fetchTimeZone(
        resolvedLat,
        resolvedLon,
        epochTimeSeconds
      );
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
        setSubmitError(
          error instanceof Error ? error.message : 'Could not resolve this location.'
        );
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

  const goBack = () => {
    closeTransientUi();
    setSubmitError(null);
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const goNext = () => {
    const stepError = getStepError(currentStep);
    if (stepError) {
      setSubmitError(stepError);
      return;
    }

    closeTransientUi();
    setSubmitError(null);
    setCurrentStep((step) => Math.min(STEPS.length - 1, step + 1));
  };

  const handleSubmit = async () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      setSubmitError('Name is required.');
      return;
    }

    if (!gender) {
      setSubmitError('Select your gender.');
      return;
    }

    if (!preferredPartnerGender) {
      setSubmitError('Select a partner preference.');
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

      if (!isLocalUxMode && (resolved.lat === null || resolved.lon === null || resolved.tzone === null)) {
        throw new Error('We could not resolve this birth location. Please choose a clearer place.');
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
              shortMeaning: 'magnetic chemistry',
              primaryCluster: 'Passion',
              clusterThemes: ['Passion', 'Connection'],
              matches: [
                {
                  celebId: 'demo-1',
                  celebName: 'Timothee Chalamet',
                  profilePhotoUrl: null,
                  orb: 2.1,
                  annotation: {
                    title: 'Venus-Mars conjunction · magnetic chemistry',
                    sentence:
                      'Your romantic style meets his drive head-on, which makes the first spark immediate and difficult to ignore.',
                  },
                },
              ],
            },
            {
              aspectType: 'moon_venus_trine',
              label: 'Moon-Venus trine',
              shortMeaning: 'easy affection',
              primaryCluster: 'Harmony',
              clusterThemes: ['Harmony', 'Connection'],
              matches: [
                {
                  celebId: 'demo-2',
                  celebName: 'Zendaya',
                  profilePhotoUrl: null,
                  orb: 3.5,
                  annotation: {
                    title: 'Moon-Venus trine · easy affection',
                    sentence:
                      'There is softness here from the start, the kind of emotional ease that makes closeness feel natural.',
                  },
                },
              ],
            },
          ],
          celebAspectBank: null,
          celebMatchesStatus: { status: 'completed' },
          celebAnnotationsStatus: { status: 'completed' },
          birthChart: {},
          fullResponse: {
            success: true,
            previewId: 'local-preview-id',
            claimToken: 'local-claim-token',
            user: {
              _id: 'local-preview-id',
              firstName: draft.firstName,
              lastName: draft.lastName,
              gender: draft.gender,
              preferredPartnerGender,
              kind: 'accountSelf',
              appDomain: 'relationship-app',
            },
            birthChart: {},
            overview:
              `${draft.firstName}, your chart reveals a deeply magnetic romantic nature. ` +
              'You lead with emotional intensity and crave partnerships that challenge you intellectually.',
            referencedCodes: [],
            celebMatchesStatus: { status: 'completed' },
            celebAnnotationsStatus: { status: 'completed' },
            celebAspectBank: null,
            topAspects: [],
            overviewMode: 'romantic',
            status: 'onboarding_preview_created',
          } as OnboardingPreviewResponse,
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

      console.log('[onboarding-preview] request:', JSON.stringify(requestPayload, null, 2));
      const previewResponse = await onboardingApi.submitPreview(requestPayload);
      console.log('[onboarding-preview] response:', JSON.stringify(previewResponse, null, 2));

      setGuestProfileDraft(draft);
      setProfileReveal({
        previewId: previewResponse.previewId,
        claimToken: previewResponse.claimToken,
        overview: previewResponse.overview,
        topAspects: previewResponse.topAspects,
        celebAspectBank: previewResponse.celebAspectBank,
        celebMatchesStatus: previewResponse.celebMatchesStatus,
        celebAnnotationsStatus: previewResponse.celebAnnotationsStatus,
        birthChart: previewResponse.birthChart,
        fullResponse: previewResponse,
      });

      navigation.replace('ProfileReveal');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not generate your profile.';
      setSubmitError(message);
      Alert.alert('Profile generation failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceHigh }]}
              autoFocus
            />
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceHigh }]}
            />
          </View>
        );
      case 1:
        return (
          <View style={styles.stepGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Essence</Text>
            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.surfaceHigh }]}
              onPress={() => setShowGenderDropdown((value) => !value)}
            >
              <Text style={[styles.selectInputText, { color: gender ? colors.text : colors.textSubtle }]}>
                {genderLabel ?? 'Select gender'}
              </Text>
              <Text style={[styles.selectChevron, { color: colors.textSubtle }]}>&#709;</Text>
            </TouchableOpacity>
            {showGenderDropdown ? (
              <View style={[styles.dropdown, { backgroundColor: colors.surface }]}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      gender === option.value && { backgroundColor: colors.surfaceHigh },
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
        );
      case 2:
        return (
          <View style={styles.stepGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Preferred Partner Gender</Text>
            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.surfaceHigh }]}
              onPress={() => setShowPartnerGenderDropdown((value) => !value)}
            >
              <Text
                style={[
                  styles.selectInputText,
                  { color: preferredPartnerGender ? colors.text : colors.textSubtle },
                ]}
              >
                {partnerGenderLabel ?? 'Select preference'}
              </Text>
              <Text style={[styles.selectChevron, { color: colors.textSubtle }]}>&#709;</Text>
            </TouchableOpacity>
            {showPartnerGenderDropdown ? (
              <View style={[styles.dropdown, { backgroundColor: colors.surface }]}>
                {PARTNER_GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      preferredPartnerGender === option.value && {
                        backgroundColor: colors.surfaceHigh,
                      },
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
        );
      case 3:
        return (
          <View style={styles.stepGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Date of Alignment</Text>
            <View style={[styles.valueChip, { backgroundColor: colors.surfaceHigh }]}>
              <Text style={[styles.valueChipText, { color: colors.text }]}>
                {dateSet ? formatDisplayDate(dateOfBirth) : formatDisplayDate(dateOfBirth)}
              </Text>
            </View>
            {showDatePicker ? (
              <View style={[styles.inlinePicker, { backgroundColor: colors.surfaceHigh }]}>
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  textColor={colors.text}
                  style={styles.inlinePickerWheel}
                />
              </View>
            ) : null}
          </View>
        );
      case 4:
        return (
          <View style={styles.stepGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Moment of Breath</Text>
              <TouchableOpacity
                onPress={() => {
                  setBirthTimeUnknown((value) => !value);
                  setTimeSet(true);
                }}
              >
                <Text
                  style={[
                    styles.unknownToggleText,
                    { color: birthTimeUnknown ? colors.primary : colors.textSubtle },
                  ]}
                >
                  {birthTimeUnknown ? 'Unknown' : "I don't know"}
                </Text>
              </TouchableOpacity>
            </View>
            {!birthTimeUnknown ? (
              <>
                <View style={[styles.valueChip, { backgroundColor: colors.surfaceHigh }]}>
                  <Text style={[styles.valueChipText, { color: colors.text }]}>
                    {timeSet ? formatDisplayTime(timeOfBirth) : formatDisplayTime(timeOfBirth)}
                  </Text>
                </View>
                {showTimePicker ? (
                  <View style={[styles.inlinePicker, { backgroundColor: colors.surfaceHigh }]}>
                    <DateTimePicker
                      value={pickerTime}
                      mode="time"
                      display="spinner"
                      onChange={handleTimeChange}
                      is24Hour={false}
                      textColor={colors.text}
                      style={styles.inlinePickerWheel}
                    />
                  </View>
                ) : null}
              </>
            ) : (
              <View style={[styles.infoBox, { backgroundColor: colors.surfaceHigh }]}>
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  We&apos;ll calculate without house placements.
                </Text>
              </View>
            )}
          </View>
        );
      case 5:
        return (
          <View style={styles.stepGroup}>
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
              <View style={[styles.selectedLocation, { backgroundColor: colors.surfaceHigh }]}>
                <View style={[styles.locationDot, { backgroundColor: colors.success }]} />
                <Text
                  style={[styles.selectedLocationText, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {placeOfBirth}
                </Text>
              </View>
            ) : null}
            {isAutofillingLocation ? (
              <Text style={[styles.infoText, { color: colors.textMuted }]}>Resolving...</Text>
            ) : null}
          </View>
        );
      default:
        return null;
    }
  };

  if (isSubmitting) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.heroIcon, { backgroundColor: colors.surfaceHigh }]}>
            <Text style={[styles.heroIconText, { color: colors.accent }]}>✦✦</Text>
          </View>
          <Text style={[styles.loadingTitle, { color: colors.text }]}>Reading the stars...</Text>
          <Text style={[styles.loadingSubtitle, { color: colors.textMuted }]}>
            Calculating your chart positions and finding your celebrity matches.
          </Text>
          <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
        </View>
      </SafeAreaView>
    );
  }

  const step = STEPS[currentStep];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heroBlock}>
          <View style={[styles.heroIcon, { backgroundColor: colors.surfaceHigh }]}>
            <Text style={[styles.heroIconText, { color: colors.accent }]}>✦✦</Text>
          </View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>{step.eyebrow}</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{step.title}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>{step.subtitle}</Text>
        </View>

        <View style={styles.progressRow}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    index <= currentStep ? colors.primary : colors.surfaceHigh,
                },
              ]}
            />
          ))}
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surfaceLow }]}>
          {renderStep()}
        </View>

        {submitError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{submitError}</Text>
        ) : null}

        <View style={styles.actionsRow}>
          {currentStep > 0 ? (
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.surfaceHigh }]}
              onPress={goBack}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionSpacer} />
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: canContinue ? colors.primary : colors.surfaceHigh },
            ]}
            onPress={isLastStep ? handleSubmit : goNext}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { color: canContinue ? colors.onPrimary : colors.textSubtle },
              ]}
            >
              {isLastStep ? 'Generate Profile' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>

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
  heroBlock: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    gap: 12,
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
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  formCard: {
    borderRadius: 24,
    padding: 20,
    minHeight: 300,
  },
  stepGroup: {
    gap: 12,
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
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectInput: {
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
  dropdown: {
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
  valueChip: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  valueChipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inlinePicker: {
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
  },
  inlinePickerWheel: {
    height: 216,
    width: '100%',
  },
  infoBox: {
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
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
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  actionSpacer: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1.4,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
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
