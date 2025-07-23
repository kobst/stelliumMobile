import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { useHoroscope } from '../../hooks/useHoroscope';
import { horoscopeTransformers } from '../../transformers/horoscope';
import { TransitEvent } from '../../types';

const TransitSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    userData,
    selectedTransits,
    toggleTransitSelection,
  } = useStore();

  const {
    transitData,
    customHoroscope,
    loading,
    error,
    loadTransitWindows,
    generateCustomHoroscope,
    clearError,
  } = useHoroscope();

  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (userData) {
      loadTransitWindows();
    }
  }, [userData, loadTransitWindows]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  useEffect(() => {
    if (customHoroscope && !generating) {
      navigation.navigate('CustomHoroscope' as never);
    }
  }, [customHoroscope, generating, navigation]);

  const handleGenerateHoroscope = async () => {
    const selectedTransitsList = transitData.filter(t => selectedTransits.has(t.id));

    if (selectedTransitsList.length === 0) {
      Alert.alert('No Transits Selected', 'Please select at least one transit to generate a custom horoscope.');
      return;
    }

    setGenerating(true);
    try {
      await generateCustomHoroscope(selectedTransitsList);
    } finally {
      setGenerating(false);
    }
  };

  const renderTransitItem = (transit: TransitEvent) => {
    const isSelected = selectedTransits.has(transit.id);
    const intensity = horoscopeTransformers.getTransitIntensity(transit);

    return (
      <TouchableOpacity
        key={transit.id}
        style={[styles.transitCard, isSelected && styles.selectedTransitCard]}
        onPress={() => toggleTransitSelection(transit.id)}
      >
        <View style={styles.transitHeader}>
          <View style={styles.transitInfo}>
            <Text style={styles.transitTitle}>{transit.description}</Text>
            <Text style={styles.transitSubtitle}>
              {transit.transitingPlanet} {transit.aspect} {transit.natalPlanet}
            </Text>
          </View>
          <View style={[styles.intensityBadge, styles[`intensity${intensity}`]]}>
            <Text style={styles.intensityText}>{intensity}</Text>
          </View>
        </View>

        <View style={styles.transitDates}>
          <Text style={styles.dateText}>
            Exact: {horoscopeTransformers.formatDate(transit.exactDate)}
          </Text>
          <Text style={styles.dateText}>
            {horoscopeTransformers.formatDate(transit.startDate)} - {horoscopeTransformers.formatDate(transit.endDate)}
          </Text>
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓ Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view transits</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading transit data...</Text>
      </View>
    );
  }

  const sortedTransits = horoscopeTransformers.sortTransitsByRelevance(transitData);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Transits</Text>
          <Text style={styles.headerSubtitle}>
            Choose the planetary transits you'd like to include in your custom horoscope
          </Text>
        </View>

        {sortedTransits.length > 0 ? (
          <View style={styles.transitsContainer}>
            {sortedTransits.map(renderTransitItem)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No transits available at this time. Please check back later.
            </Text>
          </View>
        )}
      </ScrollView>

      {sortedTransits.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.selectionCount}>
            {selectedTransits.size} transit{selectedTransits.size !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity
            style={[
              styles.generateButton,
              selectedTransits.size === 0 && styles.disabledButton,
            ]}
            onPress={handleGenerateHoroscope}
            disabled={selectedTransits.size === 0 || generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Custom Horoscope</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 22,
  },
  transitsContainer: {
    padding: 16,
  },
  transitCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedTransitCard: {
    borderColor: '#8b5cf6',
    backgroundColor: '#1e293b',
  },
  transitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transitInfo: {
    flex: 1,
    marginRight: 12,
  },
  transitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    lineHeight: 22,
  },
  transitSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  intensityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  intensitylow: {
    backgroundColor: '#374151',
  },
  intensitymedium: {
    backgroundColor: '#7c3aed',
  },
  intensityhigh: {
    backgroundColor: '#dc2626',
  },
  intensityText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  transitDates: {
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  selectedIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  selectedText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  selectionCount: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#374151',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    padding: 32,
  },
});

export default TransitSelectionScreen;
