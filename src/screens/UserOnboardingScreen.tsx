import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchTimeZone } from '../../api';
import { usersApi } from '../api';
import { useStore } from '../store';
import { userTransformers } from '../transformers/user';

const GOOGLE_API = process.env.REACT_APP_GOOGLE_API_KEY;

const UserOnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { setUserData } = useStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [unknownTime, setUnknownTime] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = (): string[] => {
    const errs: string[] = [];
    if (!firstName.trim()) errs.push('First name is required');
    if (!lastName.trim()) errs.push('Last name is required');
    if (!date) errs.push('Date is required');
    if (!unknownTime && !time) errs.push('Time is required');
    if (!lat || !lon) errs.push('Location is required');
    if (!gender) errs.push('Gender/Sex is required');
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
    const formErrors = validateForm();
    if (formErrors.length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors([]);
    try {
      const timeForTz = unknownTime ? '12:00' : time;
      const dateTime = new Date(`${date}T${timeForTz}:00`);
      const epoch = Math.floor(dateTime.getTime() / 1000);
      const tzone = await fetchTimeZone(lat!, lon!, epoch);

      const [year, month, day] = date.split('-').map(n => parseInt(n, 10));
      const name = `${firstName} ${lastName}`.trim();

      let response;
      if (unknownTime) {
        response = await usersApi.createUserUnknownTime({
          name,
          birthYear: year,
          birthMonth: month,
          birthDay: day,
          birthLocation: placeOfBirth,
          timezone: tzone.toString(),
        });
      } else {
        const [hour, minute] = time.split(':').map(n => parseInt(n, 10));
        response = await usersApi.createUser({
          name,
          birthYear: year,
          birthMonth: month,
          birthDay: day,
          birthHour: hour,
          birthMinute: minute,
          birthLocation: placeOfBirth,
          timezone: tzone.toString(),
        });
      }

      const user = userTransformers.apiResponseToUser(response);
      setUserData(user);
      navigation.navigate('Main' as never);
    } catch (error: any) {
      setErrors([error.message || 'An error occurred']);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Hello Stellium!</Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>My name is</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#94a3b8"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="#94a3b8"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>I was born in</Text>
        <TextInput
          style={[styles.input, styles.fullWidth]}
          placeholder="City, Country"
          placeholderTextColor="#94a3b8"
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
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
          value={date}
          onChangeText={setDate}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>at this time</Text>
        <TouchableOpacity
          style={styles.timeToggle}
          onPress={() => setUnknownTime(!unknownTime)}
        >
          <Text style={styles.timeToggleText}>
            {unknownTime ? 'Unknown' : 'Known Time'}
          </Text>
        </TouchableOpacity>
        {!unknownTime && (
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            placeholderTextColor="#94a3b8"
            value={time}
            onChangeText={setTime}
          />
        )}
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>My gender/sex is</Text>
        <TextInput
          style={styles.input}
          placeholder="male / female / nonbinary"
          placeholderTextColor="#94a3b8"
          value={gender}
          onChangeText={setGender}
        />
      </View>
      <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16 },
  header: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  formGroup: { marginBottom: 12 },
  label: { color: 'white', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 4,
    padding: 8,
    color: 'white',
    marginBottom: 8,
  },
  fullWidth: { width: '100%' },
  timeToggle: {
    padding: 8,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 4,
    marginRight: 8,
  },
  timeToggleText: { color: 'white' },
  submit: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: { color: 'black', fontWeight: 'bold' },
  suggestion: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  suggestionText: { color: 'white' },
  errorContainer: { marginTop: 8 },
  errorText: { color: '#ef4444' },
});

export default UserOnboardingScreen;
