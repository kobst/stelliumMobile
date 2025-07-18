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

const HoroscopeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userData } = useStore();

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
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view your horoscope</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Hello, {userData.name}!</Text>
        <Text style={styles.welcomeSubtitle}>
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
    backgroundColor: '#0f172a',
  },
  welcomeSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    padding: 32,
  },
});

export default HoroscopeScreen;