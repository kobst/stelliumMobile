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
import { useTheme } from '../../theme';

const ChartScreen: React.FC = () => {
  const route = useRoute<any>();
  const { userData } = useStore();
  const { colors } = useTheme();
  
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Please sign in to view birth charts</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <View style={[styles.errorSection, { backgroundColor: colors.surface, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>Chart Error: {chartError}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.error }]} onPress={clearError}>
            <Text style={[styles.retryButtonText, { color: colors.onError }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChartScreen;