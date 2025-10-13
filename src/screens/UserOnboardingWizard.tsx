import React, { useState } from 'react';
import { Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import Config from 'react-native-config';
import { externalApi } from '../api';
import { usersApi } from '../api';
import { useStore } from '../store';
import { userTransformers } from '../transformers/user';
import { uploadProfilePhotoPresigned } from '../utils/imageHelpers';

import { WizardContainer } from '../components/onboarding/WizardContainer';
import { NameGenderStep } from '../components/onboarding/steps/NameGenderStep';
import { BirthLocationStep } from '../components/onboarding/steps/BirthLocationStep';
import { BirthDateTimeStep } from '../components/onboarding/steps/BirthDateTimeStep';
import { ReviewStep } from '../components/onboarding/steps/ReviewStep';
import { LoadingOverlay } from '../components/LoadingOverlay';

console.log('=== ENVIRONMENT CONFIG ===');
console.log('API_URL:', Config.API_URL);
console.log('GOOGLE_API_KEY:', Config.GOOGLE_API_KEY ? 'Set' : 'Not set');
console.log('ENV:', Config.ENV);
console.log('========================');

const UserOnboardingWizard: React.FC = () => {
  const { setUserData } = useStore();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [profileImageMimeType, setProfileImageMimeType] = useState('');
  const [birthYear, setBirthYear] = useState(String(new Date().getFullYear() - 25));
  const [birthMonth, setBirthMonth] = useState('01');
  const [birthDay, setBirthDay] = useState('01');
  const [birthHour, setBirthHour] = useState('12');
  const [birthMinute, setBirthMinute] = useState('00');
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('PM');
  const [unknownTime, setUnknownTime] = useState(false);
  const [placeQuery, setPlaceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);

  const validateForm = (): string[] => {
    const errs: string[] = [];
    if (!firstName.trim()) {errs.push('First name is required');}
    if (!lastName.trim()) {errs.push('Last name is required');}
    if (!lat || !lon) {errs.push('Location is required');}
    if (!gender) {errs.push('Gender/Sex is required');}

    // Validate date is real
    if (birthYear && birthMonth && birthDay) {
      const year = parseInt(birthYear);
      const month = parseInt(birthMonth);
      const day = parseInt(birthDay);

      if (year < 1900 || year > new Date().getFullYear()) {
        errs.push('Please enter a valid year');
      } else if (month < 1 || month > 12) {
        errs.push('Please enter a valid month (1-12)');
      } else {
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day < 1 || day > daysInMonth) {
          errs.push(`${month}/${year} only has ${daysInMonth} days`);
        }
      }
    }

    return errs;
  };

  const searchPlaces = async (text: string) => {
    setPlaceQuery(text);
    setLat(null);
    setLon(null);
    setPlaceOfBirth('');
    if (!text || !Config.GOOGLE_API_KEY) {
      setSuggestions([]);
      return;
    }
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text,
        )}&types=(cities)&key=${Config.GOOGLE_API_KEY}`,
      );
      const data = await resp.json();
      if (data.status === 'OK') {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
  };

  const selectPlace = async (place: any) => {
    setSuggestions([]);
    setPlaceQuery(place.description);
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${Config.GOOGLE_API_KEY}`,
      );
      const data = await resp.json();
      if (data.status === 'OK') {
        const loc = data.result.geometry.location;
        setLat(loc.lat);
        setLon(loc.lng);
        setPlaceOfBirth(data.result.formatted_address);
      }
    } catch {}
  };

  const handleProfileImageChange = (uri: string | null, mimeType: string) => {
    setProfileImageUri(uri);
    setProfileImageMimeType(mimeType);
  };

  const handleSubmit = async () => {
    console.log('\n=== FORM SUBMISSION STARTED ===');
    console.log('Current endpoint:', Config.API_URL);

    setIsSubmitting(true);

    // Get the current Firebase Auth user
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) {
      console.error('No authenticated Firebase user found');
      Alert.alert('Error', 'Authentication error: Please sign in again');
      setIsSubmitting(false);
      return;
    }

    console.log('Firebase User ID:', firebaseUser.uid);

    const formErrors = validateForm();
    if (formErrors.length > 0) {
      console.log('Form validation failed:', formErrors);
      Alert.alert('Validation Error', formErrors.join('\n'));
      setIsSubmitting(false);
      return;
    }

    try {
      // Convert date fields to frontend format
      const date = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
      console.log('Formatted date:', date);

      // Convert time fields to frontend format
      let time = 'unknown';
      if (!unknownTime) {
        // Convert 12-hour to 24-hour format
        let hour24 = parseInt(birthHour);
        if (amPm === 'AM') {
          hour24 = hour24 === 12 ? 0 : hour24;
        } else {
          hour24 = hour24 === 12 ? 12 : hour24 + 12;
        }
        time = `${hour24.toString().padStart(2, '0')}:${birthMinute.padStart(2, '0')}`;
      }
      console.log('Formatted time:', time);

      // Calculate timezone offset like frontend
      const timeForTimezone = unknownTime ? '12:00' : time;
      const dateTimeString = `${date}T${timeForTimezone}:00`;
      const dateTime = new Date(dateTimeString);
      const epochTimeSeconds = Math.floor(dateTime.getTime() / 1000);

      console.log('\nFetching timezone...');
      console.log('Coordinates:', { lat, lon });
      console.log('Epoch time:', epochTimeSeconds);

      const totalOffsetHours = await externalApi.fetchTimeZone(lat!, lon!, epochTimeSeconds);
      console.log('Timezone offset hours:', totalOffsetHours);

      // Prepare data in the format the store expects for navigation
      const userData = {
        id: '', // Will be set after user creation
        name: `${firstName} ${lastName}`,
        email: '', // Not collected in mobile
        birthYear: parseInt(birthYear),
        birthMonth: parseInt(birthMonth),
        birthDay: parseInt(birthDay),
        birthHour: !unknownTime ? (amPm === 'AM' ? (parseInt(birthHour) === 12 ? 0 : parseInt(birthHour)) : (parseInt(birthHour) === 12 ? 12 : parseInt(birthHour) + 12)) : 12,
        birthMinute: !unknownTime ? parseInt(birthMinute) : 0,
        birthLocation: placeOfBirth, // Required for navigation
        timezone: totalOffsetHours.toString(), // Required for navigation
        // Store frontend format data for later use
        frontendData: {
          firstName,
          lastName,
          dateOfBirth: date,
          placeOfBirth,
          time: time,
          lat: parseFloat(lat!.toString()),
          lon: parseFloat(lon!.toString()),
          tzone: parseFloat(totalOffsetHours.toString()),
          gender,
          unknownTime,
        },
      };

      console.log('\nUser data prepared:', JSON.stringify(userData, null, 2));

      // Now call the API to create the user
      let response;
      if (unknownTime) {
        console.log('\nCalling createUserUnknownTime API...');
        const createUserUnknownTimePayload = {
          firebaseUid: firebaseUser.uid, // Firebase Auth UID
          firstName,
          lastName,
          gender,
          placeOfBirth,
          dateOfBirth: date,
          email: '', // Mobile app doesn't collect email
          lat: lat!,
          lon: lon!,
          tzone: totalOffsetHours,
        };

        console.log('API Payload (Unknown Time):', JSON.stringify(createUserUnknownTimePayload, null, 2));
        response = await usersApi.createUserUnknownTime(createUserUnknownTimePayload);
      } else {
        console.log('\nCalling createUser API...');
        const createUserPayload = {
          firebaseUid: firebaseUser.uid, // Firebase Auth UID
          firstName,
          lastName,
          dateOfBirth: date,
          placeOfBirth,
          time,
          lat: lat!,
          lon: lon!,
          tzone: totalOffsetHours,
          gender,
          unknownTime,
        };

        console.log('API Payload (Known Time):', JSON.stringify(createUserPayload, null, 2));
        response = await usersApi.createUser(createUserPayload);
      }
      console.log('\nAPI Response:', JSON.stringify(response, null, 2));

      // Get the subject ID from the response (_id is the MongoDB ID)
      const subjectId = response._id || response.userId || response.id;
      console.log('Subject ID for photo upload:', subjectId);

      // Transform the API response to our User type
      const createdUser = userTransformers.apiResponseToUser(response);
      console.log('\nTransformed user:', JSON.stringify(createdUser, null, 2));

      // Upload profile photo if provided
      if (profileImageUri && profileImageMimeType) {
        console.log('\nUploading profile photo...');
        console.log('Using subject ID:', subjectId);
        try {
          const photoResult = await uploadProfilePhotoPresigned(
            subjectId,
            profileImageUri,
            profileImageMimeType
          );
          console.log('Profile photo uploaded successfully:', photoResult.profilePhotoUrl);

          // Update the created user with photo URL
          createdUser.profilePhotoUrl = photoResult.profilePhotoUrl;
          createdUser.profilePhotoKey = photoResult.profilePhotoKey;
        } catch (photoError) {
          console.error('Profile photo upload failed:', photoError);
          // Don't fail the entire onboarding if photo upload fails
          Alert.alert(
            'Photo Upload Failed',
            'Your account was created successfully, but the profile photo failed to upload. You can add it later in settings.',
            [{ text: 'OK' }]
          );
        }
      }

      // Store the created user in the store
      console.log('\nStoring created user in store...');
      setUserData(createdUser);

      console.log('Navigation should happen automatically due to conditional rendering');
      console.log('=== FORM SUBMISSION COMPLETED ===\n');

    } catch (error: any) {
      console.error('\n=== FORM SUBMISSION ERROR ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      console.error('===========================\n');
      Alert.alert('Error', error.message || 'An error occurred while preparing your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepValidation = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Name & Gender
        return Boolean(firstName.trim() && lastName.trim() && gender);
      case 1: // Birth Location
        return Boolean(lat && lon && placeOfBirth);
      case 2: // Birth Date & Time
        const hasDate = Boolean(birthYear && birthMonth && birthDay);
        const hasTime = unknownTime || Boolean(birthHour && birthMinute);
        return hasDate && hasTime;
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const steps = [
    <NameGenderStep
      key="name-gender"
      firstName={firstName}
      lastName={lastName}
      gender={gender}
      profileImageUri={profileImageUri}
      onFirstNameChange={setFirstName}
      onLastNameChange={setLastName}
      onGenderChange={setGender}
      onProfileImageChange={handleProfileImageChange}
    />,
    <BirthLocationStep
      key="location"
      placeQuery={placeQuery}
      suggestions={suggestions}
      placeOfBirth={placeOfBirth}
      onPlaceQueryChange={searchPlaces}
      onPlaceSelect={selectPlace}
    />,
    <BirthDateTimeStep
      key="datetime"
      birthYear={birthYear}
      birthMonth={birthMonth}
      birthDay={birthDay}
      birthHour={birthHour}
      birthMinute={birthMinute}
      amPm={amPm}
      unknownTime={unknownTime}
      onBirthYearChange={setBirthYear}
      onBirthMonthChange={setBirthMonth}
      onBirthDayChange={setBirthDay}
      onBirthHourChange={setBirthHour}
      onBirthMinuteChange={setBirthMinute}
      onAmPmChange={setAmPm}
      onUnknownTimeChange={setUnknownTime}
    />,
    <ReviewStep
      key="review"
      firstName={firstName}
      lastName={lastName}
      gender={gender}
      birthYear={birthYear}
      birthMonth={birthMonth}
      birthDay={birthDay}
      birthHour={birthHour}
      birthMinute={birthMinute}
      amPm={amPm}
      unknownTime={unknownTime}
      placeOfBirth={placeOfBirth}
      profileImageUri={profileImageUri}
      onEditStep={setCurrentStep}
    />,
  ];

  return (
    <>
      <WizardContainer
        totalSteps={4}
        onComplete={handleSubmit}
        canGoNext={getStepValidation(currentStep) && !isSubmitting}
        canGoBack={!isSubmitting}
        currentStep={currentStep}
        onStepChange={handleStepChange}
      >
        {steps}
      </WizardContainer>
      <LoadingOverlay visible={isSubmitting} />
    </>
  );
};

export default UserOnboardingWizard;
