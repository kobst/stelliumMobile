import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useStore } from '../../store';
import { useChart } from '../../hooks/useChart';
import { ChartTabNavigator } from '../../components';

const ChartScreen: React.FC = () => {
  const route = useRoute<any>();
  const { userData } = useStore();
  
  // Use the subject passed from navigation, or fall back to logged-in user
  const subject = route.params?.subject || userData;
  
  const {
    overview,
    fullAnalysis, 
    loading: chartLoading,
    error: chartError,
    loadFullAnalysis,
    clearError,
  } = useChart(subject?.id);


  useEffect(() => {
    if (subject?.birthChart) {
      loadFullAnalysis();
    }
  }, [subject?.birthChart, loadFullAnalysis]);

  if (!subject) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view birth charts</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Birth Chart Tab Navigator */}
      <ChartTabNavigator
        birthChart={subject?.birthChart}
        loading={chartLoading}
        error={chartError}
        userName={subject?.name}
        userId={subject?.id}
        overview={overview}
      />

      {/* Error Handling */}
      {chartError && (
        <View style={styles.errorSection}>
          <Text style={styles.errorText}>Chart Error: {chartError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={clearError}>
            <Text style={styles.retryButtonText}>Retry</Text>
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
  errorSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChartScreen;