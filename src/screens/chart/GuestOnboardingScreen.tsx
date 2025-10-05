import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Config from 'react-native-config';
import { externalApi } from '../../api';
import { usersApi } from '../../api';
import { useStore } from '../../store';

import { WizardContainer } from '../../components/onboarding/WizardContainer';
import { GuestNameGenderStep } from '../../components/onboarding/steps/GuestNameGenderStep';
import { GuestBirthLocationStep } from '../../components/onboarding/steps/GuestBirthLocationStep';
import { GuestBirthDateTimeStep } from '../../components/onboarding/steps/GuestBirthDateTimeStep';
import { LoadingOverlay } from '../../components/LoadingOverlay';

const GuestOnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { userData } = useStore();
  const { onGuestCreated } = route.params || {};

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
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

  const handleSubmit = async () => {
    console.log('\n=== GUEST FORM SUBMISSION STARTED ===');
    console.log('Current endpoint:', Config.SERVER_URL);
    console.log('Owner User ID:', userData?.id);

    const formErrors = validateForm();
    if (formErrors.length > 0) {
      console.log('Form validation failed:', formErrors);
      Alert.alert('Validation Error', formErrors.join('\n'));
      return;
    }

    setIsSubmitting(true);

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

      // Now call the API to create the guest subject
      let response;
      if (unknownTime) {
        console.log('\nCalling createGuestSubjectUnknownTime API...');
        const createGuestUnknownTimePayload = {
          firstName,
          lastName,
          gender,
          placeOfBirth,
          dateOfBirth: date,
          lat: lat!,
          lon: lon!,
          tzone: totalOffsetHours,
          ownerUserId: userData!.id,
        };

        console.log('API Payload (Unknown Time):', JSON.stringify(createGuestUnknownTimePayload, null, 2));
        response = await usersApi.createGuestSubjectUnknownTime(createGuestUnknownTimePayload);
      } else {
        console.log('\nCalling createGuestSubject API...');
        const createGuestPayload = {
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
          ownerUserId: userData!.id,
        };

        console.log('API Payload (Known Time):', JSON.stringify(createGuestPayload, null, 2));
        response = await usersApi.createGuestSubject(createGuestPayload);
      }
      console.log('\nAPI Response:', JSON.stringify(response, null, 2));

      console.log('Guest subject created successfully, navigating back...');

      // Call the callback to refresh the parent screen
      if (onGuestCreated) {
        onGuestCreated();
      }

      navigation.goBack();

    } catch (error: any) {
      console.error('\n=== GUEST FORM SUBMISSION ERROR ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      console.error('===========================\n');
      Alert.alert('Error', error.message || 'An error occurred while creating the guest profile. Please try again.');
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
      default:
        return false;
    }
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const steps = [
    <GuestNameGenderStep
      key="name-gender"
      firstName={firstName}
      lastName={lastName}
      gender={gender}
      onFirstNameChange={setFirstName}
      onLastNameChange={setLastName}
      onGenderChange={setGender}
    />,
    <GuestBirthLocationStep
      key="location"
      placeQuery={placeQuery}
      suggestions={suggestions}
      placeOfBirth={placeOfBirth}
      onPlaceQueryChange={searchPlaces}
      onPlaceSelect={selectPlace}
    />,
    <GuestBirthDateTimeStep
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
  ];

  return (
    <>
      <WizardContainer
        totalSteps={3}
        onComplete={handleSubmit}
        canGoNext={getStepValidation(currentStep) && !isSubmitting}
        canGoBack={!isSubmitting}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        completeButtonText="Create Chart"
      >
        {steps}
      </WizardContainer>
      <LoadingOverlay visible={isSubmitting} />
    </>
  );
};

export default GuestOnboardingScreen;
