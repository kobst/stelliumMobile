import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../../store';

const HoroscopeScreen: React.FC = () => {
  const {
    userData,
    horoscopeFilter,
    setHoroscopeFilter,
    loading,
    setLoading,
  } = useStore();

  const [horoscopeContent, setHoroscopeContent] = useState('');

  const filterOptions = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'nextWeek', label: 'Next Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'nextMonth', label: 'Next Month' },
  ] as const;

  useEffect(() => {
    if (userData) {
      loadHoroscope();
    }
  }, [userData, horoscopeFilter, loadHoroscope]);

  const loadHoroscope = async () => {
    setLoading(true);
    try {
      // Placeholder - will integrate with API later
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHoroscopeContent(`Your ${horoscopeFilter} horoscope shows promising cosmic alignments. The stars are encouraging you to embrace new opportunities and trust your intuition during this transformative period.`);
    } catch (error) {
      console.error('Failed to load horoscope:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFilterTab = (filter: typeof filterOptions[0]) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterTab,
        horoscopeFilter === filter.key && styles.activeFilterTab,
      ]}
      onPress={() => setHoroscopeFilter(filter.key)}
    >
      <Text
        style={[
          styles.filterTabText,
          horoscopeFilter === filter.key && styles.activeFilterTabText,
        ]}
      >
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view your horoscope</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContentContainer}
      >
        {filterOptions.map(renderFilterTab)}
      </ScrollView>

      {/* Welcome Section */}
      <View style={styles.section}>
        <Text style={styles.welcomeText}>Hello, {userData.name}!</Text>
        <Text style={styles.sectionSubtitle}>
          Your personalized horoscope based on your birth chart
        </Text>
      </View>

      {/* Horoscope Content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {filterOptions.find(f => f.key === horoscopeFilter)?.label} Horoscope
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Loading your horoscope...</Text>
          </View>
        ) : (
          <View style={styles.horoscopeCard}>
            <Text style={styles.horoscopeText}>{horoscopeContent}</Text>
          </View>
        )}
      </View>

      {/* Transit Selection Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Transit Selection</Text>
        <Text style={styles.sectionSubtitle}>
          Coming soon: Select specific planetary transits for personalized forecasts
        </Text>
        <TouchableOpacity style={styles.comingSoonButton} disabled>
          <Text style={styles.comingSoonButtonText}>Coming Soon</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterContentContainer: {
    paddingRight: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeFilterTab: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  filterTabText: {
    color: '#94a3b8',
    fontWeight: '500',
    fontSize: 14,
  },
  activeFilterTabText: {
    color: 'white',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 20,
  },
  horoscopeCard: {
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  horoscopeText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#e2e8f0',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    padding: 32,
  },
  comingSoonButton: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  comingSoonButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HoroscopeScreen;