import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BirthChart } from '../../types';
import ChartWheel from './ChartWheel';
import ChartTables from './ChartTables';
import { useTheme } from '../../theme';
import { StickySegment } from '../navigation/StickySegment';
import { AnalysisHeader } from '../navigation/AnalysisHeader';
import { SectionSubtitle } from '../navigation/SectionSubtitle';

interface ChartContainerProps {
  birthChart?: BirthChart;
  loading?: boolean;
  error?: string | null;
  userName?: string;
  userId?: string;
  overview?: string | null;
  showNavigation?: boolean; // Controls whether to show internal navigation
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  birthChart,
  loading = false,
  error = null,
  userName,
  userId,
  overview,
  showNavigation = false,
}) => {
  const { colors } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState('wheel');

  const chartSubTabs = [
    { label: 'Wheel', value: 'wheel' },
    { label: 'Tables', value: 'tables' },
  ];

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

  const renderContent = () => {
    if (!hasChartData) {
      return (
        <View style={[styles.noDataContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>
            📊 No birth chart data available
          </Text>
          <Text style={[styles.noDataSubtext, { color: colors.onSurfaceVariant }]}>
            Chart data will appear here once loaded from the backend
          </Text>
        </View>
      );
    }

    if (activeSubTab === 'wheel') {
      return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
          <View style={[styles.chartSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ChartWheel
              birthChart={birthChart}
              showAspects={true}
              showHouses={true}
            />
          </View>

          {/* Overview Section */}
          {overview && (
            <View style={[styles.overviewSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.overviewTitle, { color: colors.primary }]}>Chart Overview</Text>
              <Text style={[styles.overviewText, { color: colors.onSurface }]}>{overview}</Text>
            </View>
          )}
        </ScrollView>
      );
    } else {
      // Tables view
      return (
        <ChartTables birthChart={birthChart} />
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Analysis Header - only show when showNavigation is true */}
      {showNavigation && (
        <AnalysisHeader
          title={userName || 'Birth Chart'}
          subtitle="Birth Chart"
        />
      )}

      {/* Section Subtitle - only show when showNavigation is true */}
      {showNavigation && (
        <SectionSubtitle
          icon="🌀"
          title=""
          desc=""
        />
      )}

      {/* Sub Navigation - only show when showNavigation is true */}
      {showNavigation && hasChartData && (
        <StickySegment
          items={chartSubTabs}
          selectedValue={activeSubTab}
          onChange={setActiveSubTab}
        />
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        {showNavigation ? renderContent() : (
          // When not showing navigation, always show wheel view (for use in ChartScreen)
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
            <View style={[styles.chartSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ChartWheel
                birthChart={birthChart}
                showAspects={true}
                showHouses={true}
              />
            </View>

            {/* Overview Section */}
            {overview && (
              <View style={[styles.overviewSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.overviewTitle, { color: colors.primary }]}>Chart Overview</Text>
                <Text style={[styles.overviewText, { color: colors.onSurface }]}>{overview}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
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
  chartSection: {
    alignItems: 'center',
    padding: 8,
    margin: 8,
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
