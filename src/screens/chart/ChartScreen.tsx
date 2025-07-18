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
import { useChart } from '../../hooks/useChart';
import { ChartTabNavigator } from '../../components';

const ChartScreen: React.FC = () => {
  const { userData } = useStore();
  
  const {
    overview,
    fullAnalysis, 
    loading: chartLoading,
    error: chartError,
    loadFullAnalysis,
    clearError,
  } = useChart();


  useEffect(() => {
    if (userData?.birthChart) {
      loadFullAnalysis();
    }
  }, [userData?.birthChart, loadFullAnalysis]);

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view your birth chart</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Birth Chart Tab Navigator */}
      <ChartTabNavigator
        birthChart={userData?.birthChart}
        loading={chartLoading}
        error={chartError}
        userName={userData?.name}
        userId={userData?.id}
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