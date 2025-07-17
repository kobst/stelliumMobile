import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { BirthChart } from '../../types';
import ChartWheel from './ChartWheel';
import ChartTables from './ChartTables';

interface ChartContainerProps {
  birthChart?: BirthChart;
  loading?: boolean;
  error?: string | null;
  userName?: string;
  userId?: string;
  overview?: string | null;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  birthChart,
  loading = false,
  error = null,
  userName,
  userId,
  overview,
}) => {
  const [showTables, setShowTables] = useState(false);
  const [showAspects, setShowAspects] = useState(true);
  const [showHouses, setShowHouses] = useState(true);

  // Determine if we have complete chart data
  const hasChartData = birthChart && 
    birthChart.planets && 
    birthChart.planets.length > 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading birth chart...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load chart data</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {/* User Info Header */}
      {userName && (
        <View style={styles.userInfoSection}>
          <Text style={styles.userName}>Birth Chart: {userName}</Text>
          {userId && <Text style={styles.userId}>ID: {userId}</Text>}
        </View>
      )}

      {/* Chart Controls */}
      <View style={styles.controlsSection}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, !showTables && styles.activeToggle]}
            onPress={() => setShowTables(false)}
          >
            <Text style={[styles.toggleText, !showTables && styles.activeToggleText]}>
              Chart Wheel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, showTables && styles.activeToggle]}
            onPress={() => setShowTables(true)}
          >
            <Text style={[styles.toggleText, showTables && styles.activeToggleText]}>
              Data Tables
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart Options */}
        {!showTables && hasChartData && (
          <View style={styles.chartOptions}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => setShowAspects(!showAspects)}
            >
              <Text style={[styles.optionText, showAspects && styles.activeOptionText]}>
                {showAspects ? '✓' : '○'} Aspects
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => setShowHouses(!showHouses)}
            >
              <Text style={[styles.optionText, showHouses && styles.activeOptionText]}>
                {showHouses ? '✓' : '○'} Houses
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content */}
      {hasChartData ? (
        showTables ? (
          <ChartTables birthChart={birthChart} />
        ) : (
          <View>
            <View style={styles.chartSection}>
              <ChartWheel 
                birthChart={birthChart}
                showAspects={showAspects}
                showHouses={showHouses}
              />
            </View>
            
            {/* Overview Section */}
            {overview && (
              <View style={styles.overviewSection}>
                <Text style={styles.overviewTitle}>Chart Overview</Text>
                <Text style={styles.overviewText}>{overview}</Text>
              </View>
            )}
          </View>
        )
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            📊 No birth chart data available
          </Text>
          <Text style={styles.noDataSubtext}>
            Chart data will appear here once loaded from the backend
          </Text>
        </View>
      )}
    </ScrollView>
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
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  userInfoSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#94a3b8',
  },
  controlsSection: {
    margin: 16,
    marginTop: 0,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#8b5cf6',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  activeToggleText: {
    color: '#ffffff',
  },
  chartOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
  },
  optionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  activeOptionText: {
    color: '#8b5cf6',
    fontWeight: '500',
  },
  chartSection: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    margin: 16,
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  overviewSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e2e8f0',
  },
});

export default ChartContainer;