import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BirthChart } from '../../types';
import ChartContainer from './ChartContainer';
import PatternsTab from './PatternsTab';
import PlanetsTab from './PlanetsTab';
import AnalysisTab from './AnalysisTab';
import { useTheme } from '../../theme';

interface ChartTabNavigatorProps {
  birthChart?: BirthChart;
  loading?: boolean;
  error?: string | null;
  userName?: string;
  userId?: string;
  overview?: string | null;
}

const tabs = [
  { key: 'chart', title: 'Chart' },
  { key: 'patterns', title: 'Patterns and Dominance' },
  { key: 'planets', title: 'Planets' },
  { key: 'analysis', title: '360 Analysis' },
];

const ChartTabNavigator: React.FC<ChartTabNavigatorProps> = ({
  birthChart,
  loading,
  error,
  userName,
  userId,
  overview,
}) => {
  const [activeTab, setActiveTab] = useState('chart');
  const { colors } = useTheme();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chart':
        return (
          <ChartContainer
            birthChart={birthChart}
            loading={loading}
            error={error}
            userName={userName}
            userId={userId}
            overview={overview}
          />
        );
      case 'patterns':
        return <PatternsTab userId={userId} birthChart={birthChart} />;
      case 'planets':
        return <PlanetsTab userId={userId} birthChart={birthChart} />;
      case 'analysis':
        return <AnalysisTab userId={userId} />;
      default:
        return <ChartContainer birthChart={birthChart} loading={loading} error={error} userName={userName} userId={userId} overview={overview} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: colors.primary }
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '500', textAlign: 'center' },
                activeTab === tab.key && { color: colors.onPrimary, fontWeight: '600' }
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
});

export default ChartTabNavigator;