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
import { PlaceAutocompleteInput } from '../components/PlaceAutocompleteInput';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { resetRootTo } from '../navigation/navigationRef';
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
import { SubmittingOverlay } from '../components/SubmittingOverlay';
import { ProgressDashes } from '../components/ProgressDashes';
import { WizardArrowButton } from '../components/WizardArrowButton';
import { Avatar } from '../components/Avatar';
import { Halo } from '../components/atmosphere/Halo';
import {
  OnbHeadline,
  ChoiceChips,
  ValuePill,
  PrivacyFooter,
  ONB,
} from '../components/onboarding/atoms';
import { pickImageFromLibrary, pickImageFromCamera } from '../../../src/utils/imageHelpers';

type Props = StackScreenProps<RelationshipRootParamList, 'CreateSelfProfile'>;

const GENDER_OPTIONS = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Other', value: 'other' },
] as const;

const PARTNER_GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'All', value: 'all' },
] as const;

const STEPS = [
  {
    eyebrow: 'Step 1 of 8',
    title: 'What should we call you?',
    subtitle: 'Start with your name so we can personalize your romantic profile.',
  },
  {
    eyebrow: 'Step 2 of 8',
    title: 'Add a photo',
    subtitle: 'Optional — helps your connections feel real when your relationship list grows.',
  },
  {
    eyebrow: 'Step 3 of 8',
    title: 'How do you identify?',
    subtitle: 'Choose what fits you best.',
  },
  {
    eyebrow: 'Step 4 of 8',
    title: 'Who are you drawn to?',
    subtitle: 'This helps us filter the first celebrity match set.',
  },
  {
    eyebrow: 'Step 5 of 8',
    title: 'When were you born?',
    subtitle: 'We need your birth date to calculate your chart.',
  },
  {
    eyebrow: 'Step 6 of 8',
    title: 'What time were you born?',
    subtitle: 'Birth time sharpens house placements, but you can skip it.',
  },
  {
    eyebrow: 'Step 7 of 8',
    title: 'Where were you born?',
    subtitle: 'Enter a city and country so we can resolve coordinates and timezone.',
  },
  {
    eyebrow: 'Step 8 of 8',
    title: 'Does this look right?',
    subtitle: 'Review your details before we generate your profile.',
  },
] as const;

export const CreateSelfProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const setProfileRevealWithDraft = useRelationshipAppStore(
    (state) => state.setProfileRevealWithDraft,
  );
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

  const [timeSet, setTimeSet] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string | null>(null);

  const applyPickedPhoto = (picked: { uri: string; type: string } | null) => {
    if (picked) {
      setPhotoUri(picked.uri);
      setPhotoMimeType(picked.type);
    }
  };

  const handleChoosePhoto = () => {
    const buttons: Parameters<typeof Alert.alert>[2] = [
      {
        text: 'Photo Library',
        onPress: async () => applyPickedPhoto(await pickImageFromLibrary()),
      },
      {
        text: 'Take Photo',
        onPress: async () => applyPickedPhoto(await pickImageFromCamera()),
      },
    ];
    if (photoUri) {
      buttons.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => {
          setPhotoUri(null);
          setPhotoMimeType(null);
        },
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Add a photo', 'Choose a source', buttons);
  };

  const canUseGoogleServices = Boolean(relationshipAppEnv.googleApiKey);

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

  const getStepError = (step: number): string | null => {
    switch (step) {
      case 0:
        return firstName.trim() ? null : 'Enter your first name.';
      case 1:
        return null; // Photo step is always optional.
      case 2:
        return gender ? null : 'Select how you identify.';
      case 3:
        return preferredPartnerGender ? null : 'Select a partner preference.';
      case 4:
        return isValidDate(dateOfBirth) ? null : 'Enter a valid date of birth.';
      case 5:
        return birthTimeUnknown || isValidTime(timeOfBirth) ? null : 'Enter a valid birth time.';
      case 6:
        return placeOfBirth.trim() ? null : 'Birth location is required.';
      case 7:
        return null; // Confirm step has no extra validation.
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
    setSubmitError(null);
    if (currentStep === 0) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('Welcome');
      }
      return;
    }
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const goNext = () => {
    const stepError = getStepError(currentStep);
    if (stepError) {
      setSubmitError(stepError);
      return;
    }

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
      setSubmitError('Select how you identify.');
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
        photoUri,
        photoMimeType,
      };

      if (isLocalUxMode) {
        setProfileRevealWithDraft(draft, {
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
          topCelebMatches: [],
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
        resetRootTo('ProfileReveal');
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

      setProfileRevealWithDraft(draft, {
        previewId: previewResponse.previewId,
        claimToken: previewResponse.claimToken,
        overview: previewResponse.overview,
        romanticProfileBlurb: previewResponse.romanticProfileBlurb,
        topAspects: previewResponse.topAspects,
        topCelebMatches: previewResponse.topCelebMatches ?? [],
        celebAspectBank: previewResponse.celebAspectBank,
        celebMatchesStatus: previewResponse.celebMatchesStatus,
        celebAnnotationsStatus: previewResponse.celebAnnotationsStatus,
        birthChart: previewResponse.birthChart,
        fullResponse: previewResponse,
      });

      resetRootTo('ProfileReveal');
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
              placeholder="Last name (optional)"
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceHigh }]}
            />
          </View>
        );
      case 1:
        return (
          <View style={[styles.stepGroup, styles.photoStepGroup]}>
            <TouchableOpacity
              onPress={handleChoosePhoto}
              activeOpacity={0.85}
              style={styles.photoWrap}
            >
              <Halo color={ONB.primary} size={220} opacity={0.18} top={-35} left="50%" />
              {photoUri ? (
                <Avatar
                  size={150}
                  gradient="lavender"
                  fallbackInitial={firstName.charAt(0) || 'A'}
                  photoUri={photoUri}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={[styles.photoIcon, { color: ONB.textMuted }]}>📷</Text>
                </View>
              )}
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>{photoUri ? '✓' : '+'}</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHelper}>Tap to add — or skip for now.</Text>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepGroup}>
            <ChoiceChips options={GENDER_OPTIONS} selected={gender} onSelect={setGender} />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepGroup}>
            <ChoiceChips
              options={PARTNER_GENDER_OPTIONS}
              selected={preferredPartnerGender}
              onSelect={setPreferredPartnerGender}
            />
          </View>
        );
      case 4:
        return (
          <View style={styles.stepGroup}>
            <ValuePill>{formatDisplayDate(dateOfBirth)}</ValuePill>
            <BirthDatePicker
              value={dateOfBirth}
              onChange={setDateOfBirth}
            />
          </View>
        );
      case 5:
        return (
          <View style={styles.stepGroup}>
            <View style={styles.unknownToggleRow}>
              <TouchableOpacity
                onPress={() => {
                  setBirthTimeUnknown((value) => !value);
                  setTimeSet(true);
                }}
                activeOpacity={0.7}
                style={styles.checkboxRow}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    {
                      backgroundColor: birthTimeUnknown ? colors.primary : 'transparent',
                      borderColor: birthTimeUnknown ? colors.primary : colors.ghostBorder,
                    },
                  ]}
                >
                  {birthTimeUnknown ? (
                    <Text style={[styles.checkboxMark, { color: colors.onPrimary }]}>✓</Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.checkboxLabel,
                    { color: birthTimeUnknown ? colors.text : colors.textMuted },
                  ]}
                >
                  {birthTimeUnknown ? 'Birth time unknown' : "I don't know the birth time"}
                </Text>
              </TouchableOpacity>
            </View>
            {!birthTimeUnknown ? (
              <>
                <ValuePill>{formatDisplayTime(timeOfBirth)}</ValuePill>
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
      case 6:
        return (
          <View style={styles.stepGroup}>
            <PlaceAutocompleteInput
              value={placeOfBirth}
              onChangeText={setPlaceOfBirth}
              onSelectSuggestion={async (selection) => {
                await handlePlaceSelected(selection);
              }}
              onBlur={() => {
                handlePlaceResolved().catch(() => undefined);
              }}
              placeholder="City, Country"
              canUseSuggestions={canUseGoogleServices}
            />
            {isAutofillingLocation ? (
              <Text style={[styles.infoText, { color: colors.textMuted }]}>Resolving...</Text>
            ) : null}
          </View>
        );
      case 7:
        return <ConfirmStep
          colors={colors}
          firstName={firstName}
          lastName={lastName}
          gender={gender}
          preferredPartnerGender={preferredPartnerGender}
          dateOfBirth={dateOfBirth}
          timeOfBirth={timeOfBirth}
          birthTimeUnknown={birthTimeUnknown}
          placeOfBirth={placeOfBirth}
          photoUri={photoUri}
          formatDisplayDate={formatDisplayDate}
          formatDisplayTime={formatDisplayTime}
        />;
      default:
        return null;
    }
  };

  if (isSubmitting) {
    return (
      <SubmittingOverlay
        title="Iris is reading your chart"
        subtitle="Mapping your planetary placements and the aspects that shape how you love."
      />
    );
  }

  const step = STEPS[currentStep];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <View style={styles.content}>
        <View style={styles.topHeader}>
          <View style={styles.topHeaderRow}>
            <TouchableOpacity
              style={styles.topHeaderBack}
              onPress={goBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel={currentStep === 0 ? 'Exit onboarding' : 'Go back'}
            >
              <Text style={[styles.topHeaderBackArrow, { color: colors.text }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.topHeaderTitle, { color: colors.text }]}>Iris</Text>
            <View style={styles.topHeaderBack} />
          </View>

          <View style={styles.progressRowWrap}>
            <ProgressDashes current={currentStep} total={STEPS.length} />
          </View>

          <Text style={[styles.stepCounter, { color: colors.accent }]}>{step.eyebrow.toUpperCase()}</Text>
        </View>

        <OnbHeadline title={step.title} sub={step.subtitle} />

        <View style={styles.formCard}>
          {renderStep()}
        </View>

        {submitError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{submitError}</Text>
        ) : null}

        <View style={styles.actionsRow}>
          <WizardArrowButton
            onPress={isLastStep ? handleSubmit : goNext}
            disabled={!canContinue}
          />
        </View>

        <View style={styles.privacyFooterWrap}>
          <PrivacyFooter />
        </View>
      </View>
    </SafeAreaView>
  );
};

interface ConfirmStepProps {
  colors: ReturnType<typeof useTheme>['colors'];
  firstName: string;
  lastName: string;
  gender: string;
  preferredPartnerGender: string;
  dateOfBirth: string;
  timeOfBirth: string;
  birthTimeUnknown: boolean;
  placeOfBirth: string;
  photoUri: string | null;
  formatDisplayDate: (iso: string) => string;
  formatDisplayTime: (time: string) => string;
}

function ConfirmStep({
  colors,
  firstName,
  lastName,
  gender,
  preferredPartnerGender,
  dateOfBirth,
  timeOfBirth,
  birthTimeUnknown,
  placeOfBirth,
  photoUri,
  formatDisplayDate,
  formatDisplayTime,
}: ConfirmStepProps) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Not set';
  const genderLabel =
    GENDER_OPTIONS.find((option) => option.value === gender)?.label ?? 'Not set';
  const partnerGenderLabel =
    PARTNER_GENDER_OPTIONS.find((option) => option.value === preferredPartnerGender)?.label ??
    'Not set';

  const rows: readonly { key: string; label: string; value: string }[] = [
    { key: 'name', label: 'Name', value: fullName },
    { key: 'gender', label: 'Identify as', value: genderLabel },
    { key: 'pref', label: 'Drawn to', value: partnerGenderLabel },
    { key: 'dob', label: 'Birth Date', value: formatDisplayDate(dateOfBirth) },
    {
      key: 'time',
      label: 'Birth Time',
      value: birthTimeUnknown ? 'Unknown' : formatDisplayTime(timeOfBirth),
    },
    { key: 'city', label: 'Birth City', value: placeOfBirth || 'Not set' },
  ];

  return (
    <View style={styles.stepGroup}>
      <View style={styles.confirmHero}>
        <Avatar
          size={80}
          gradient="lavender"
          fallbackInitial={firstName.charAt(0) || 'A'}
          photoUri={photoUri}
        />
      </View>
      <View
        style={[
          styles.confirmCard,
          { backgroundColor: colors.surfaceHigh, borderColor: colors.ghostBorder },
        ]}
      >
        {rows.map((row, index) => {
          const isLast = index === rows.length - 1;
          return (
            <View
              key={row.key}
              style={[
                styles.confirmRow,
                isLast
                  ? null
                  : { borderBottomColor: colors.ghostBorder, borderBottomWidth: 1 },
              ]}
            >
              <Text style={[styles.confirmRowLabel, { color: colors.textMuted }]}>
                {row.label}
              </Text>
              <Text
                style={[styles.confirmRowValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {row.value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

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
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  progressRowWrap: {
    marginBottom: 10,
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  formCard: {
    flex: 1,
    minHeight: 300,
    paddingTop: 32,
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
  input: {
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  photoStepGroup: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 16,
  },
  photoWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(202,190,255,0.32)',
    backgroundColor: ONB.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 40,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ONB.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ONB.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  photoBadgeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a142e',
    lineHeight: 22,
  },
  photoHelper: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 15,
    textAlign: 'center',
    color: ONB.textFaint,
  },
  privacyFooterWrap: {
    alignItems: 'center',
  },
  confirmHero: {
    alignItems: 'center',
    paddingBottom: 6,
  },
  confirmCard: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  confirmRowLabel: {
    width: 100,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  confirmRowValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  unknownToggleRow: {
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMark: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
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
});
