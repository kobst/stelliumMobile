import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { useChart } from '../../hooks/useChart';
import { ChartTabNavigator } from '../../components';
import { useTheme } from '../../theme';
import { AnalysisHeader } from '../../components/navigation/AnalysisHeader';
import { TopTabBar } from '../../components/navigation/TopTabBar';
import { StickySegment } from '../../components/navigation/StickySegment';
import { SectionSubtitle } from '../../components/navigation/SectionSubtitle';
import ChartContainer from '../../components/chart/ChartContainer';
import ChartTables from '../../components/chart/ChartTables';
import PatternsTab from '../../components/chart/PatternsTab';
import PlanetsTab from '../../components/chart/PlanetsTab';
import AnalysisTab from '../../components/chart/AnalysisTab';
import BirthChartChatTab from '../../components/chart/BirthChartChatTab';
import CompleteFullAnalysisButton from '../../components/chart/CompleteFullAnalysisButton';
import { BirthChartElement } from '../../api/charts';
import { parseDateStringAsLocalDate } from '../../utils/dateHelpers';

const ChartScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
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
    hasAnalysisData,
    workflowState,
    isAnalysisInProgress,
  } = useChart(subject?.id);

  // Navigation state
  const [activeTab, setActiveTab] = useState('chart');
  const [activeSubTab, setActiveSubTab] = useState('wheel');
  const [preSelectedChatElements, setPreSelectedChatElements] = useState<BirthChartElement[]>([]);

  const topTabs = [
    { label: 'Chart', routeName: 'chart' },
    { label: 'Patterns & Dominance', routeName: 'patterns' },
    { label: 'Planets', routeName: 'planets' },
    { label: '360 Analysis', routeName: 'analysis' },
    { label: 'Chat', routeName: 'chat' },
  ];

  const chartSubTabs = [
    { label: 'Wheel', value: 'wheel' },
    { label: 'Tables', value: 'tables' },
  ];

  // Create birth info string for regular users
  const getBirthInfo = (subject: any): string => {
    if (!subject) {return 'Birth Chart';}

    try {
      // Handle different date formats
      let birthDate: Date;
      if (subject.dateOfBirth) {
        // SubjectDocument type (date-only safe parse)
        birthDate = parseDateStringAsLocalDate(subject.dateOfBirth);
      } else if (subject.birthYear && subject.birthMonth && subject.birthDay) {
        // User type
        birthDate = new Date(subject.birthYear, subject.birthMonth - 1, subject.birthDay);
      } else {
        return 'Birth Chart';
      }

      const formattedDate = birthDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      // Handle time information
      let timeString = '';
      if (subject.time && !subject.birthTimeUnknown) {
        timeString = ` at ${subject.time}`;
      } else if (subject.birthHour !== undefined && subject.birthMinute !== undefined &&
                 !(subject.birthHour === 12 && subject.birthMinute === 0)) {
        const hour = subject.birthHour === 0 ? 12 : subject.birthHour > 12 ? subject.birthHour - 12 : subject.birthHour;
        const minute = subject.birthMinute.toString().padStart(2, '0');
        const period = subject.birthHour >= 12 ? 'PM' : 'AM';
        timeString = ` at ${hour}:${minute} ${period}`;
      }

      // Handle location
      const location = subject.placeOfBirth || subject.birthLocation;
      const locationString = location ? ` in ${location}` : '';

      return `Born ${formattedDate}${timeString}${locationString}`;
    } catch (error) {
      return 'Birth Chart';
    }
  };


  useEffect(() => {
    if (subject?.birthChart) {
      loadFullAnalysis();
    }
  }, [subject?.birthChart, loadFullAnalysis]);

  // Handler for "Chat about this" functionality
  const handleChatAboutElement = (element: BirthChartElement) => {
    setPreSelectedChatElements([element]);
    setActiveTab('chat');
  };

  // Clear preselected elements when switching tabs
  const handleTabPress = (tab: string) => {
    if (tab !== 'chat') {
      setPreSelectedChatElements([]);
    }
    setActiveTab(tab);
  };

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
      case 'chat':
        return null;
      default:
        return null;
    }
  };

  if (!subject) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Please sign in to view birth charts</Text>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'chart':
        if (activeSubTab === 'wheel') {
          return (
            <ChartContainer
              birthChart={subject?.birthChart}
              loading={chartLoading}
              error={chartError}
              userName={subject?.name}
              userId={subject?.id}
              overview={overview}
            />
          );
        } else {
          // Tables view - import and use the actual ChartTables component
          return (
            <ChartTables birthChart={subject?.birthChart} />
          );
        }
      case 'patterns':
        return <PatternsTab userId={subject?.id} birthChart={subject?.birthChart} />;
      case 'planets':
        return <PlanetsTab userId={subject?.id} birthChart={subject?.birthChart} />;
      case 'analysis':
        return <AnalysisTab userId={subject?.id} />;
      case 'chat':
        // Show consistent loading state for chat tab during analysis
        if (chartLoading || isAnalysisInProgress) {
          const progressText = workflowState?.progress
            ? `Analyzing... ${workflowState.progress.percentage}% complete (${workflowState.progress.completedTasks}/${workflowState.progress.totalTasks} tasks)`
            : 'Loading analysis...';

          return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>{progressText}</Text>
              {workflowState?.progress && (
                <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
                  Current phase: {workflowState.progress.currentPhase}
                </Text>
              )}
            </View>
          );
        }

        if (!hasAnalysisData) {
          return (
            <ScrollView style={[styles.lockedTabContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
              <View style={styles.lockedTabContent}>
                <View style={[styles.lockedTabHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.lockedTabSubtitle, { color: colors.onSurfaceVariant }]}>
                    Chat with AI about your birth chart insights
                  </Text>
                </View>
                <View style={styles.missingAnalysisContainer}>
                  <CompleteFullAnalysisButton userId={subject?.id} onAnalysisComplete={loadFullAnalysis} />
                </View>
              </View>
            </ScrollView>
          );
        }
        return (
          <BirthChartChatTab
            userId={subject?.id}
            birthChart={subject?.birthChart}
            preSelectedElements={preSelectedChatElements}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Analysis Header */}
      <AnalysisHeader
        title={subject?.name || 'Unknown'}
        subtitle={getBirthInfo(subject)}
      />

      {/* Top Tab Bar */}
      <TopTabBar
        items={topTabs}
        activeRoute={activeTab}
        onTabPress={handleTabPress}
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

      {/* Error Handling */}
      {chartError && (
        <View style={[styles.errorSection, { backgroundColor: colors.surface, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>Chart Error: {chartError}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.error }]} onPress={clearError}>
            <Text style={[styles.retryButtonText, { color: colors.onError }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
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
  lockedTabContainer: {
    flex: 1,
  },
  lockedTabContent: {
    padding: 16,
  },
  lockedTabHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  lockedTabSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  missingAnalysisContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ChartScreen;
