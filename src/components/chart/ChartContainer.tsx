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
import { useTheme } from '../../theme';

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
  const { colors } = useTheme();
  const [showTables, setShowTables] = useState(false);
  const [showAspects, setShowAspects] = useState(true);
  const [showHouses, setShowHouses] = useState(true);

  // Determine if we have complete chart data
  const hasChartData = birthChart && 
    birthChart.planets && 
    birthChart.planets.length > 0;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading birth chart...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Failed to load chart data</Text>
        <Text style={[styles.errorSubtext, { color: colors.onSurfaceVariant }]}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={true}>
      {/* User Info Header */}
      {userName && (
        <View style={[styles.userInfoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.userName, { color: colors.onSurface }]}>Birth Chart: {userName}</Text>
          {userId && <Text style={[styles.userId, { color: colors.onSurfaceVariant }]}>ID: {userId}</Text>}
        </View>
      )}

      {/* Chart Controls */}
      <View style={styles.controlsSection}>
        <View style={[styles.viewToggle, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.toggleButton, !showTables && { backgroundColor: colors.primary }]}
            onPress={() => setShowTables(false)}
          >
            <Text style={[
              { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '500' },
              !showTables && { color: colors.onPrimary }
            ]}>
              Chart Wheel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, showTables && { backgroundColor: colors.primary }]}
            onPress={() => setShowTables(true)}
          >
            <Text style={[
              { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '500' },
              showTables && { color: colors.onPrimary }
            ]}>
              Data Tables
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart Options */}
        {!showTables && hasChartData && (
          <View style={[styles.chartOptions, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => setShowAspects(!showAspects)}
            >
              <Text style={[
                { fontSize: 12, color: colors.onSurfaceVariant },
                showAspects && { color: colors.primary, fontWeight: '500' }
              ]}>
                {showAspects ? '✓' : '○'} Aspects
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => setShowHouses(!showHouses)}
            >
              <Text style={[
                { fontSize: 12, color: colors.onSurfaceVariant },
                showHouses && { color: colors.primary, fontWeight: '500' }
              ]}>
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
            <View style={[styles.chartSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ChartWheel 
                birthChart={birthChart}
                showAspects={showAspects}
                showHouses={showHouses}
              />
            </View>
            
            {/* Overview Section */}
            {overview && (
              <View style={[styles.overviewSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.overviewTitle, { color: colors.primary }]}>Chart Overview</Text>
                <Text style={[styles.overviewText, { color: colors.onSurface }]}>{overview}</Text>
              </View>
            )}
          </View>
        )
      ) : (
        <View style={[styles.noDataContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>
            📊 No birth chart data available
          </Text>
          <Text style={[styles.noDataSubtext, { color: colors.onSurfaceVariant }]}>
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
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  userInfoSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
  },
  controlsSection: {
    margin: 16,
    marginTop: 0,
  },
  viewToggle: {
    flexDirection: 'row',
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
  chartOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 8,
    padding: 8,
  },
  optionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chartSection: {
    alignItems: 'center',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  overviewSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ChartContainer;