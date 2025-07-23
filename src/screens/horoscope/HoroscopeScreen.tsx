import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { useHoroscope } from '../../hooks/useHoroscope';
import HoroscopeContainer from '../../components/HoroscopeContainer';
import { useTheme } from '../../theme';

const HoroscopeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userData } = useStore();
  const { colors } = useTheme();

  const {
    transitData,
    loading,
    error,
    loadTransitWindows,
  } = useHoroscope();

  useEffect(() => {
    if (userData?.id) {
      loadTransitWindows();
    }
  }, [userData?.id, loadTransitWindows]);

  if (!userData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Please sign in to view your horoscope</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Greeting Subtitle */}
      <Text style={[styles.greetingSubtitle, { color: colors.onSurfaceVariant }]}>
        Hello, {userData.name}
      </Text>

      {/* Horoscope Container */}
      <HoroscopeContainer
        transitWindows={transitData}
        loading={loading}
        error={error}
        userId={userData.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greetingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 32,
  },
});

export default HoroscopeScreen;