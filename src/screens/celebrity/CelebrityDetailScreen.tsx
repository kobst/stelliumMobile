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
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Celebrity data not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading celebrity chart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.celebrityInfo}>
          <Text style={styles.celebrityName}>
            {getCelebrityDisplayName(celebrity)}
          </Text>
          <Text style={styles.celebritySubtitle}>
            {getCelebritySubtitle(celebrity)}
          </Text>
        </View>
      </View>

      {/* Chart Tab Navigator */}
      <ChartTabNavigator
        birthChart={activeUserContext?.birthChart}
        loading={chartLoading}
        error={chartError}
        userName={getCelebrityDisplayName(celebrity)}
        userId={celebrity._id}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 32,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 32,
  },
  header: {
    backgroundColor: '#1e293b',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginBottom: 12,
  },
  backButtonText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
  },
  celebrityInfo: {
    alignItems: 'center',
  },
  celebrityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  celebritySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
    textAlign: 'center',
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

export default CelebrityDetailScreen;