import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { useHoroscope } from '../../hooks/useHoroscope';
import HoroscopeContainer from '../../components/HoroscopeContainer';
import { HeaderWithProfile } from '../../components/navigation';
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderWithProfile title="Horoscope" showSafeArea={false} />
        <View style={styles.content}>
          <Text style={[styles.errorText, { color: colors.error }]}>Please sign in to view your horoscope</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderWithProfile
        title="Horoscope"
        subtitle={`Hello, ${userData.name}`}
        showSafeArea={false}
      />

      <View style={styles.content}>
        {/* Horoscope Container */}
        <HoroscopeContainer
          transitWindows={transitData}
          loading={loading}
          error={error}
          userId={userData.id}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 32,
  },
});

export default HoroscopeScreen;
