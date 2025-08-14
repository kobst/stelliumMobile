import React, { useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { BirthChart } from '../../types';
import ChartContainer from './ChartContainer';
import ChartTables from './ChartTables';
import PatternsTab from './PatternsTab';
import PlanetsTab from './PlanetsTab';
import AnalysisTab from './AnalysisTab';
import { useTheme } from '../../theme';
import { AnalysisHeader } from '../navigation/AnalysisHeader';
import { TopTabBar } from '../navigation/TopTabBar';
import { SectionSubtitle } from '../navigation/SectionSubtitle';
import { StickySegment } from '../navigation/StickySegment';

interface ChartTabNavigatorProps {
  birthChart?: BirthChart;
  loading?: boolean;
  error?: string | null;
  userName?: string;
  userId?: string;
  overview?: string | null;
  birthInfo?: string;
}

const ChartTabNavigator: React.FC<ChartTabNavigatorProps> = ({
  birthChart,
  loading,
  error,
  userName,
  userId,
  overview,
  birthInfo,
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('chart');
  const [activeSubTab, setActiveSubTab] = useState('wheel');

  const topTabs = [
    { label: 'Chart', routeName: 'chart' },
    { label: 'Patterns & Dominance', routeName: 'patterns' },
    { label: 'Planets', routeName: 'planets' },
    { label: '360 Analysis', routeName: 'analysis' },
  ];

  const chartSubTabs = [
    { label: 'Wheel', value: 'wheel' },
    { label: 'Tables', value: 'tables' },
  ];

  const getSectionSubtitle = () => {
    switch (activeTab) {
      case 'chart':
        return null;
      case 'patterns':
        return null;
      case 'planets':
        return null;
      case 'analysis':
        return null;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chart':
        if (activeSubTab === 'wheel') {
          return (
            <ChartContainer
              birthChart={birthChart}
              loading={loading}
              error={error}
              userName={userName}
              userId={userId}
              overview={overview}
              showNavigation={false}
            />
          );
        } else {
          // Tables view - use ChartTables component directly
          return (
            <ChartTables birthChart={birthChart} />
          );
        }
      case 'patterns':
        return <PatternsTab userId={userId} birthChart={birthChart} />;
      case 'planets':
        return <PlanetsTab userId={userId} birthChart={birthChart} />;
      case 'analysis':
        return <AnalysisTab userId={userId} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Analysis Header */}
      <AnalysisHeader
        title={userName || 'Unknown'}
        subtitle={birthInfo || 'Birth Chart'}
      />

      {/* Top Tab Bar */}
      <TopTabBar
        items={topTabs}
        activeRoute={activeTab}
        onTabPress={setActiveTab}
      />

      {/* Section Subtitle */}
      {getSectionSubtitle() && (
        <SectionSubtitle
          icon={getSectionSubtitle()!.icon}
          title={getSectionSubtitle()!.title}
          desc={getSectionSubtitle()!.desc}
        />
      )}

      {/* Sub Navigation (only for Chart tab) */}
      {activeTab === 'chart' && (
        <StickySegment
          items={chartSubTabs}
          selectedValue={activeSubTab}
          onChange={setActiveSubTab}
        />
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
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
});

export default ChartTabNavigator;
