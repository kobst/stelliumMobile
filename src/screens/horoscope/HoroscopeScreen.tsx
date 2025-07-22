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
      {/* Welcome Section */}
      <View style={[styles.welcomeSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.welcomeText, { color: colors.onSurface }]}>Hello, {userData.name}!</Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.onSurfaceVariant }]}>
          Your personalized horoscope based on your birth chart
        </Text>
      </View>

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
  welcomeSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 32,
  },
});

export default HoroscopeScreen;