import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../../store';
import { useChart } from '../../hooks/useChart';
import { useTheme } from '../../theme';
import { ChartTabNavigator } from '../../components';
import { Celebrity } from '../../api/celebrities';
import { getCelebrityDisplayName, getCelebritySubtitle } from '../../transformers/celebrity';

type CelebrityStackParamList = {
  CelebrityMain: undefined;
  CelebrityDetail: {
    celebrity: Celebrity;
  };
};

type CelebrityDetailScreenRouteProp = RouteProp<CelebrityStackParamList, 'CelebrityDetail'>;
type CelebrityDetailScreenNavigationProp = StackNavigationProp<CelebrityStackParamList, 'CelebrityDetail'>;

const CelebrityDetailScreen: React.FC = () => {
  const route = useRoute<CelebrityDetailScreenRouteProp>();
  const navigation = useNavigation<CelebrityDetailScreenNavigationProp>();
  const { colors } = useTheme();

  const { celebrity } = route.params;
  const { switchToCelebrityContext, navigateBack, activeUserContext } = useStore();

  const {
    overview,
    fullAnalysis,
    loading: chartLoading,
    error: chartError,
    loadFullAnalysis,
    clearError,
  } = useChart();

  const [isInitialized, setIsInitialized] = useState(false);

  // Switch to celebrity context when screen loads
  useEffect(() => {
    if (celebrity && !isInitialized) {
      try {
        switchToCelebrityContext(celebrity);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to switch to celebrity context:', error);
        Alert.alert(
          'Error',
          'Failed to load celebrity chart data',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    }
  }, [celebrity, switchToCelebrityContext, isInitialized, navigation]);

  // Load chart analysis when context is ready
  useEffect(() => {
    if (activeUserContext?.birthChart && isInitialized) {
      loadFullAnalysis();
    }
  }, [activeUserContext?.birthChart, loadFullAnalysis, isInitialized]);

  // Navigate back when unmounting
  useEffect(() => {
    return () => {
      navigateBack();
    };
  }, [navigateBack]);

  // Handle navigation back button
  const handleBackPress = () => {
    navigateBack();
    navigation.goBack();
  };

  if (!celebrity) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Celebrity data not found</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading celebrity chart...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Chart Tab Navigator */}
      <ChartTabNavigator
        birthChart={activeUserContext?.birthChart}
        loading={chartLoading}
        error={chartError}
        userName={getCelebrityDisplayName(celebrity)}
        userId={celebrity._id}
        overview={overview}
        birthInfo={getCelebritySubtitle(celebrity)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  celebrityName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  celebritySubtitle: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
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

export default CelebrityDetailScreen;
