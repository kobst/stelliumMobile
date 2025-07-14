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

const ChartScreen: React.FC = () => {
  const {
    userData,
    loading,
    setLoading,
  } = useStore();

  const [analysisContent, setAnalysisContent] = useState('');

  useEffect(() => {
    if (userData) {
      loadChartAnalysis();
    }
  }, [userData, loadChartAnalysis]);

  const loadChartAnalysis = async () => {
    setLoading(true);
    try {
      // Placeholder - will integrate with existing API later
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAnalysisContent(`Your birth chart reveals a fascinating cosmic blueprint. With your Sun in ${getUserSign()}, you possess natural leadership qualities and a creative spirit that shines brightly in all your endeavors.`);
    } catch (error) {
      console.error('Failed to load chart analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserSign = () => {
    // Placeholder - will calculate from actual chart data
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    return signs[Math.floor(Math.random() * signs.length)];
  };

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view your birth chart</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Chart Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Birth Chart</Text>
        <Text style={styles.birthInfo}>
          Born: {userData.birthMonth}/{userData.birthDay}/{userData.birthYear}
        </Text>
        <Text style={styles.birthInfo}>
          Location: {userData.birthLocation}
        </Text>
        <Text style={styles.birthInfo}>
          Time: {userData.birthHour}:{userData.birthMinute.toString().padStart(2, '0')}
        </Text>
      </View>

      {/* Chart Visualization Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Birth Chart Wheel</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>🌟</Text>
          <Text style={styles.placeholderSubtext}>
            Interactive birth chart visualization coming soon
          </Text>
        </View>
      </View>

      {/* Analysis Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chart Analysis</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Analyzing your birth chart...</Text>
          </View>
        ) : (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisText}>{analysisContent}</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chart Tools</Text>
        
        <TouchableOpacity style={styles.actionButton} disabled>
          <Text style={styles.actionButtonText}>🔮 Full Analysis</Text>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} disabled>
          <Text style={styles.actionButtonText}>👥 Guest Charts</Text>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} disabled>
          <Text style={styles.actionButtonText}>💬 Chat with AI</Text>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </TouchableOpacity>
      </View>

      {/* Planet Positions Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Planetary Positions</Text>
        <Text style={styles.sectionSubtitle}>
          Your planets in signs and houses
        </Text>
        
        <View style={styles.planetList}>
          {['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].map((planet, index) => (
            <View key={planet} style={styles.planetItem}>
              <Text style={styles.planetName}>{planet}</Text>
              <Text style={styles.planetPosition}>{getUserSign()} • House {index + 1}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
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
  birthInfo: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  chartPlaceholder: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  analysisCard: {
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  analysisText: {
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
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '500',
  },
  comingSoonText: {
    color: '#9ca3af',
    fontSize: 12,
    fontStyle: 'italic',
  },
  planetList: {
    marginTop: 8,
  },
  planetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  planetName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  planetPosition: {
    fontSize: 14,
    color: '#94a3b8',
  },
});

export default ChartScreen;