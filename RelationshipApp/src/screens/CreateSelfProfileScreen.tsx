import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BirthDatePicker } from '../components/BirthDatePicker';
import { StackScreenProps } from '@react-navigation/stack';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
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
import { BirthTimePicker } from '../components/BirthTimePicker';
import { PulsingHeroIcon } from '../components/PulsingHeroIcon';

type Props = StackScreenProps<RelationshipRootParamList, 'CreateSelfProfile'>;

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
  const [timeSet, setTimeSet] = useState(false);

  const canUseGoogleServices = Boolean(relationshipAppEnv.googleApiKey);

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
          romanticProfileBlurb:
            `${draft.firstName}, you love with intensity, curiosity, and a taste for people who keep your heart awake.`,
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
            romanticProfileBlurb:
              `${draft.firstName}, you love with intensity, curiosity, and a taste for people who keep your heart awake.`,
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
        romanticProfileBlurb: previewResponse.romanticProfileBlurb,
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
              <View style={[styles.dropdown, { backgroundColor: colors.surfaceLow }]}>
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
              <View style={[styles.dropdown, { backgroundColor: colors.surfaceLow }]}>
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
                {formatDisplayDate(dateOfBirth)}
              </Text>
            </View>
            <BirthDatePicker
              value={dateOfBirth}
              onChange={setDateOfBirth}
            />
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
                <BirthTimePicker
                  value={timeOfBirth}
                  onChange={(nextValue) => {
                    setTimeOfBirth(nextValue);
                    setTimeSet(true);
                  }}
                />
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
          <PulsingHeroIcon
            backgroundColor={colors.surfaceHigh}
            glyphColor={colors.accent}
            haloColor={colors.accent}
          />
          <Text style={[styles.loadingTitle, { color: colors.text }]}>
            Iris is reading your chart
          </Text>
          <Text style={[styles.loadingSubtitle, { color: colors.textMuted }]}>
            Mapping your planetary placements and the aspects that shape how you love.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const step = STEPS[currentStep];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <View style={styles.content}>
        <View style={styles.topHeader}>
          <View style={styles.topHeaderRow}>
            {currentStep > 0 ? (
              <TouchableOpacity
                style={styles.topHeaderBack}
                onPress={goBack}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={[styles.topHeaderBackArrow, { color: colors.text }]}>←</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.topHeaderBack} />
            )}
            <Text style={[styles.topHeaderTitle, { color: colors.text }]}>Iris</Text>
            <View style={styles.topHeaderBack} />
          </View>

          <View style={styles.progressDashRow}>
            {STEPS.map((_, index) => {
              const isActive = index === currentStep;
              return (
                <View
                  key={index}
                  style={[
                    styles.progressDash,
                    { backgroundColor: colors.surfaceHigh },
                    isActive && {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.9,
                      shadowRadius: 6,
                      elevation: 6,
                    },
                  ]}
                />
              );
            })}
          </View>

          <Text style={[styles.stepCounter, { color: colors.accent }]}>{step.eyebrow.toUpperCase()}</Text>
        </View>

        <View style={styles.heroBlock}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{step.title}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>{step.subtitle}</Text>
        </View>

        <View style={styles.formCard}>
          {renderStep()}
        </View>

        {submitError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{submitError}</Text>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.arrowButton, !canContinue && styles.arrowButtonDisabled]}
            onPress={isLastStep ? handleSubmit : goNext}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            <Svg width={64} height={64} style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgLinearGradient id="arrowGrad" x1="0.5" y1="0" x2="0.5" y2="1">
                  <Stop offset="0" stopColor="#9FE4FF" />
                  <Stop offset="1" stopColor="#A78BFA" />
                </SvgLinearGradient>
              </Defs>
              <Circle cx={32} cy={32} r={30} fill="url(#arrowGrad)" />
              <Path
                d="M22 32 H42 M34 24 L42 32 L34 40"
                stroke="#0B1228"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <Text style={[styles.privacyText, { color: colors.textSubtle }]}>
          Privacy secured by encrypted celestial channels
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 24,
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
  topHeader: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 14,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  topHeaderBack: {
    width: 36,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topHeaderBackArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  topHeaderTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 3,
  },
  progressDashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  progressDash: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  heroBlock: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 14,
    gap: 10,
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
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  formCard: {
    flex: 1,
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
    justifyContent: 'flex-end',
    marginTop: 24,
    paddingHorizontal: 12,
  },
  arrowButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9FE4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 10,
  },
  arrowButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  privacyText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
});
