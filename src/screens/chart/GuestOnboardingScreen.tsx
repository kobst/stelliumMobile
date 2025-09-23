import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { externalApi } from '../../api';
import { usersApi } from '../../api';
import { useStore } from '../../store';
import { useTheme } from '../../theme';

const GOOGLE_API = process.env.REACT_APP_GOOGLE_API_KEY;
const SERVER_URL = process.env.REACT_APP_SERVER_URL;

const GuestOnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { userData } = useStore();
  const { colors } = useTheme();
  const { onGuestCreated } = route.params || {};

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthHour, setBirthHour] = useState('');
  const [birthMinute, setBirthMinute] = useState('');
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');
  const [placeQuery, setPlaceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [unknownTime, setUnknownTime] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): string[] => {
    const errs: string[] = [];
    if (!firstName.trim()) {errs.push('First name is required');}
    if (!lastName.trim()) {errs.push('Last name is required');}
    if (!birthYear || !birthMonth || !birthDay) {errs.push('Complete birth date is required');}
    if (!unknownTime && (!birthHour || !birthMinute)) {errs.push('Birth time is required');}
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
    if (!text || !GOOGLE_API) {
      setSuggestions([]);
      return;
    }
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text,
        )}&types=(cities)&key=${GOOGLE_API}`,
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
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_API}`,
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
    console.log('Current endpoint:', SERVER_URL);
    console.log('Owner User ID:', userData?.id);

    const formErrors = validateForm();
    if (formErrors.length > 0) {
      console.log('Form validation failed:', formErrors);
      setErrors(formErrors);
      return;
    }
    setErrors([]);
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
      setErrors([error.message || 'An error occurred while creating the guest profile. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = createStyles(colors);

  // RadioButton component
  const RadioButton: React.FC<{
    selected: boolean;
    onPress: () => void;
    label: string;
  }> = ({ selected, onPress, label }) => (
    <TouchableOpacity style={styles.radioContainer} onPress={onPress}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Their name is</Text>
        <View style={styles.nameRow}>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="First Name"
            placeholderTextColor={colors.onSurfaceVariant}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="Last Name"
            placeholderTextColor={colors.onSurfaceVariant}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>They were born in</Text>
        <TextInput
          style={[styles.input, styles.fullWidth]}
          placeholder="City, Country"
          placeholderTextColor={colors.onSurfaceVariant}
          value={placeQuery}
          onChangeText={searchPlaces}
        />
      </View>
      {suggestions.map(s => (
        <TouchableOpacity
          key={s.place_id}
          style={styles.suggestion}
          onPress={() => selectPlace(s)}
        >
          <Text style={styles.suggestionText}>{s.description}</Text>
        </TouchableOpacity>
      ))}
      <View style={styles.formGroup}>
        <Text style={styles.label}>on this date</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="YYYY"
            placeholderTextColor={colors.onSurfaceVariant}
            value={birthYear}
            onChangeText={(text) => {
              if (/^\d{0,4}$/.test(text)) {
                setBirthYear(text);
              }
            }}
            keyboardType="numeric"
            maxLength={4}
          />
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="MM"
            placeholderTextColor={colors.onSurfaceVariant}
            value={birthMonth}
            onChangeText={(text) => {
              if (/^\d{0,2}$/.test(text) && (text === '' || (parseInt(text) >= 1 && parseInt(text) <= 12))) {
                setBirthMonth(text);
              }
            }}
            keyboardType="numeric"
            maxLength={2}
          />
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="DD"
            placeholderTextColor={colors.onSurfaceVariant}
            value={birthDay}
            onChangeText={(text) => {
              if (/^\d{0,2}$/.test(text) && (text === '' || parseInt(text) <= 31)) {
                setBirthDay(text);
              }
            }}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>at this time</Text>
        <View style={styles.radioGroup}>
          <RadioButton
            selected={!unknownTime}
            onPress={() => setUnknownTime(false)}
            label="Known Time"
          />
          <RadioButton
            selected={unknownTime}
            onPress={() => setUnknownTime(true)}
            label="Unknown Time"
          />
        </View>
        {!unknownTime && (
          <View>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="HH"
                placeholderTextColor={colors.onSurfaceVariant}
                value={birthHour}
                onChangeText={(text) => {
                  if (/^\d{0,2}$/.test(text) && (text === '' || (parseInt(text) >= 1 && parseInt(text) <= 12))) {
                    setBirthHour(text);
                  }
                }}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="MM"
                placeholderTextColor={colors.onSurfaceVariant}
                value={birthMinute}
                onChangeText={(text) => {
                  if (/^\d{0,2}$/.test(text) && (text === '' || parseInt(text) <= 59)) {
                    setBirthMinute(text);
                  }
                }}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <View style={styles.amPmRow}>
              <RadioButton
                selected={amPm === 'AM'}
                onPress={() => setAmPm('AM')}
                label="AM"
              />
              <RadioButton
                selected={amPm === 'PM'}
                onPress={() => setAmPm('PM')}
                label="PM"
              />
            </View>
          </View>
        )}
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Their gender/sex is</Text>
        <View style={styles.radioGroup}>
          <RadioButton
            selected={gender === 'male'}
            onPress={() => setGender('male')}
            label="Male"
          />
          <RadioButton
            selected={gender === 'female'}
            onPress={() => setGender('female')}
            label="Female"
          />
          <RadioButton
            selected={gender === 'nonbinary'}
            onPress={() => setGender('nonbinary')}
            label="Non-binary"
          />
        </View>
      </View>
      <TouchableOpacity
        style={[styles.submit, isSubmitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? 'Creating...' : 'Create Birth Chart'}
        </Text>
      </TouchableOpacity>
      {errors.length > 0 && (
        <View style={styles.errorContainer}>
          {errors.map((e, i) => (
            <Text key={i} style={styles.errorText}>{e}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  header: {
    color: colors.onBackground,
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  formGroup: { marginBottom: 16 },
  label: { color: colors.onBackground, marginBottom: 8, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    color: colors.onSurface,
    backgroundColor: colors.surface,
    marginBottom: 8,
    fontSize: 16,
  },
  fullWidth: { width: '100%' },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameInput: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dateInput: {
    width: 80,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  timeInput: {
    width: 60,
  },
  timeSeparator: {
    color: colors.onBackground,
    fontSize: 18,
    fontWeight: 'bold',
  },
  amPmRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    color: colors.onBackground,
    fontSize: 16,
  },
  submit: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitDisabled: {
    backgroundColor: colors.onSurfaceVariant,
  },
  submitText: { color: colors.onPrimary, fontWeight: 'bold', fontSize: 16 },
  suggestion: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  suggestionText: { color: colors.onSurface },
  errorContainer: { marginTop: 12 },
  errorText: { color: colors.error, fontSize: 14 },
});

export default GuestOnboardingScreen;
