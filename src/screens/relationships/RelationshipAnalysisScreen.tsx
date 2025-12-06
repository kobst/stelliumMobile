import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { relationshipsApi, UserCompositeChart, RelationshipAnalysisResponse, ClusterScoredItem } from '../../api/relationships';
import { usersApi } from '../../api/users';
import { SubjectDocument } from '../../types';
import SynastryChartWheel from '../../components/chart/SynastryChartWheel';
import SynastryAspectsTable from '../../components/chart/SynastryAspectsTable';
import CompositeChartTables from '../../components/chart/CompositeChartTables';
import CompositeChartWheel from '../../components/chart/CompositeChartWheel';
import SynastryHousePlacementsTable from '../../components/chart/SynastryHousePlacementsTable';
import SynastryTables from '../../components/chart/SynastryTables';
import CompositeTables from '../../components/chart/CompositeTables';
import AspectColorLegend from '../../components/chart/AspectColorLegend';
import RelationshipAnalysisTab from '../../components/relationship/RelationshipAnalysisTab';
import RelationshipChatTab from '../../components/relationship/RelationshipChatTab';
import LockedRelationshipChatTab from '../../components/relationship/LockedRelationshipChatTab';
import V3ClusterRadar from '../../components/relationship/V3ClusterRadar';
import ConsolidatedItemsGrid from '../../components/relationship/ConsolidatedItemsGrid';
import { AnalysisHeader } from '../../components/navigation/AnalysisHeader';
import { TopTabBar } from '../../components/navigation/TopTabBar';
import { StickySegment } from '../../components/navigation/StickySegment';
import { SectionSubtitle } from '../../components/navigation/SectionSubtitle';
import { relationshipTransformers } from '../../transformers/relationship';

type RelationshipAnalysisScreenRouteProp = RouteProp<{
  RelationshipAnalysis: {
    relationship: UserCompositeChart;
  };
}, 'RelationshipAnalysis'>;


const RelationshipAnalysisScreen: React.FC = () => {
  const route = useRoute<RelationshipAnalysisScreenRouteProp>();
  const { colors } = useTheme();
  const { relationship } = route.params;

  const [activeTab, setActiveTab] = useState('scores');
  const [chartSubTab, setChartSubTab] = useState('synastry');

  const [userAData, setUserAData] = useState<SubjectDocument | null>(null);
  const [userBData, setUserBData] = useState<SubjectDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [analysisData, setAnalysisData] = useState<RelationshipAnalysisResponse | null>(null);
  const [relationshipData, setRelationshipData] = useState<UserCompositeChart | null>(relationship || null);

  // Navigation configuration
  const topTabs = [
    { label: 'Scores', routeName: 'scores' },
    { label: 'Overview', routeName: 'overview' },
    { label: 'Charts', routeName: 'charts' },
    { label: '360 Analysis', routeName: 'guidance' },
    { label: 'Ask Stellium', routeName: 'chat' },
  ];

  const chartSubTabs = [
    { label: 'Synastry', value: 'synastry' },
    { label: 'Composite', value: 'composite' },
  ];

  console.log('RelationshipAnalysisScreen loaded with relationship:', relationship);
  console.log('Relationship has clusterScoring:', !!relationshipData?.clusterScoring);
  console.log('Relationship synastryAspects:', !!relationshipData?.synastryAspects);
  console.log('Relationship compositeChart:', !!relationshipData?.compositeChart);
  console.log('Relationship synastryHousePlacements:', !!relationshipData?.synastryHousePlacements);

  // Early return if no relationship data
  if (!relationship || !relationshipData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading relationship...</Text>
      </View>
    );
  }

  const getSectionSubtitle = () => {
    switch (activeTab) {
      case 'charts':
        return null;
      case 'scores':
        return null;
      case 'overview':
        return null;
      case 'guidance':
        return null;
      default:
        return null;
    }
  };

  const loadAnalysisData = useCallback(async (forceReload = false) => {
    console.log('loadAnalysisData called - relationship ID:', relationship?._id);
    console.log('userA_id:', relationship?.userA_id, 'userB_id:', relationship?.userB_id);
    console.log('hasLoadedData:', hasLoadedData, 'forceReload:', forceReload);

    // Always need a relationship ID
    if (!relationship?._id) {
      console.log('No relationship ID, returning early');
      return;
    }

    // Prevent reloading if we've already loaded data for this relationship (unless forced)
    if (!forceReload && hasLoadedData) {
      console.log('Already loaded data and not forcing reload, returning early');
      return;
    }

    console.log('Starting to load analysis data...');
    try {
      setError(null);

      // Fetch the full relationship analysis document
      const fullAnalysisData = await relationshipsApi.fetchRelationshipAnalysis(relationship._id);
      console.log('Full analysis data loaded:', fullAnalysisData);

      // Store the full analysis data for the 360 Analysis tab
      setAnalysisData(fullAnalysisData);
      console.log('Set analysisData in state:', !!fullAnalysisData.completeAnalysis);

      // Update the relationship data with cluster data (handle both new and legacy structures)
      const clusterData = fullAnalysisData.clusterAnalysis || fullAnalysisData.clusterScoring;
      const overallData = fullAnalysisData.overall || fullAnalysisData.clusterScoring?.overall;

      if (clusterData) {
        // Create unified clusterScoring structure for backward compatibility
        const unifiedClusterScoring = {
          clusters: clusterData.clusters || clusterData,
          overall: overallData,
          scoredItems: clusterData.scoredItems || [],
        };

        setRelationshipData(prev => ({
          ...prev,
          clusterScoring: unifiedClusterScoring,
          completeAnalysis: fullAnalysisData.completeAnalysis,
          initialOverview: fullAnalysisData.initialOverview,
        }));
        console.log('Updated relationship with cluster data - clusters:', Object.keys(unifiedClusterScoring.clusters));
      }

      // Fetch user birth charts in parallel if we have user IDs
      const userPromises: Promise<any>[] = [];
      if (relationship?.userA_id) {
        userPromises.push(usersApi.getUser(relationship.userA_id));
      }
      if (relationship?.userB_id) {
        userPromises.push(usersApi.getUser(relationship.userB_id));
      }

      if (userPromises.length > 0) {
        console.log('Fetching user data, promises count:', userPromises.length);
        const userResults = await Promise.all(userPromises);
        console.log('User results received:', userResults.length);

        if (relationship?.userA_id && userResults[0]) {
          console.log('Setting userA data - has birthChart:', !!userResults[0]?.birthChart);
          console.log('UserA birthChart planets:', userResults[0]?.birthChart?.planets?.length);
          console.log('UserA birthChart houses:', userResults[0]?.birthChart?.houses?.length);
          setUserAData(userResults[0]);
        }
        if (relationship?.userB_id && userResults[userResults.length - 1]) {
          console.log('Setting userB data - has birthChart:', !!userResults[userResults.length - 1]?.birthChart);
          console.log('UserB birthChart planets:', userResults[userResults.length - 1]?.birthChart?.planets?.length);
          console.log('UserB birthChart houses:', userResults[userResults.length - 1]?.birthChart?.houses?.length);
          setUserBData(userResults[userResults.length - 1]);
        }
      } else {
        console.log('No user promises to fetch - userA_id:', !!relationship?.userA_id, 'userB_id:', !!relationship?.userB_id);
      }

      setHasLoadedData(true);
      console.log('Analysis data load completed successfully');
    } catch (err) {
      console.error('Failed to load analysis data:', err);
      setError('Failed to load analysis data');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, [relationship?._id, relationship?.userA_id, relationship?.userB_id, hasLoadedData]);

  useEffect(() => {
    // Only reset and reload if the relationship ID actually changed
    if (relationship) {
      console.log('Relationship changed, resetting and loading data');
      setHasLoadedData(false);
      setRelationshipData(relationship);

      // Always load analysis data to ensure we have user birth charts for charts
      setLoading(true);
      setAnalysisData(null);
      loadAnalysisData();
    }
  }, [relationship?._id]); // Only reload when the relationship ID changes

  // Debug logging for userAData and userBData changes
  useEffect(() => {
    console.log('userAData changed - exists:', !!userAData, 'has birthChart:', !!userAData?.birthChart);
    if (userAData?.birthChart) {
      console.log('userAData birthChart - planets:', userAData.birthChart.planets?.length, 'houses:', userAData.birthChart.houses?.length);
    }
  }, [userAData]);

  useEffect(() => {
    console.log('userBData changed - exists:', !!userBData, 'has birthChart:', !!userBData?.birthChart);
    if (userBData?.birthChart) {
      console.log('userBData birthChart - planets:', userBData.birthChart.planets?.length, 'houses:', userBData.birthChart.houses?.length);
    }
  }, [userBData]);





  const ChartsTab = () => {
    const renderSynastry = () => {
      console.log('renderSynastry - userAData:', !!userAData, 'birthChart:', !!userAData?.birthChart);
      console.log('renderSynastry - userBData:', !!userBData, 'birthChart:', !!userBData?.birthChart);
      console.log('renderSynastry - loading:', loading, 'error:', error);

      if (!userAData?.birthChart || !userBData?.birthChart) {
        if (error) {
          return (
            <View style={styles.noDataContainer}>
              <Text style={[styles.noDataText, { color: colors.error }]}>
                Error loading chart data: {error}
              </Text>
            </View>
          );
        }

        return (
          <View style={styles.noDataContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.noDataText, { color: colors.onSurfaceMed }]}>
              Loading chart data...
            </Text>
          </View>
        );
      }

      return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.wheelSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.chartTitle, { color: colors.onSurface }]}>
              {relationshipData?.userA_name}'s Chart
            </Text>
            <Text style={[styles.chartSubtitle, { color: colors.onSurfaceMed }]}>
              with {relationshipData?.userB_name}'s influences
            </Text>
            <View style={styles.wheelContainer}>
              <SynastryChartWheel
                basePlanets={userAData.birthChart.planets}
                baseHouses={userAData.birthChart.houses}
                transitPlanets={userBData.birthChart.planets}
                baseName={relationshipData?.userA_name || ''}
                transitName={relationshipData?.userB_name || ''}
              />
            </View>
          </View>
          <View style={{ height: 500 }}>
            <SynastryTables relationship={relationshipData} />
          </View>
        </ScrollView>
      );
    };

    const renderComposite = () => {
      if (!relationshipData?.compositeChart) {
        return (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: colors.onSurfaceMed }]}>
              No composite chart data available
            </Text>
          </View>
        );
      }

      return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.wheelSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.chartTitle, { color: colors.onSurface }]}>Composite Chart</Text>
            <Text style={[styles.chartSubtitle, { color: colors.onSurfaceMed }]}>
              Midpoint chart representing your combined energies
            </Text>
            <View style={styles.wheelContainer}>
              <CompositeChartWheel compositeChart={relationshipData?.compositeChart} />
            </View>
          </View>
          <View style={{ height: 500 }}>
            <CompositeTables compositeChart={relationshipData?.compositeChart} />
          </View>
        </ScrollView>
      );
    };

    return (
      <View style={styles.chartsContainer}>
        {chartSubTab === 'synastry' && renderSynastry()}
        {chartSubTab === 'composite' && renderComposite()}
      </View>
    );
  };

  const ScoresTab = () => {
    console.log('Relationship object:', relationship);
    console.log('ClusterScoring:', relationshipData?.clusterScoring);
    console.log('Keystones available:', relationshipData?.clusterScoring?.overall?.keystoneAspects?.length || 0);

    const consolidatedItems = relationshipTransformers.enrichCompositeAspects(
      relationshipData.clusterScoring?.scoredItems || [],
      relationshipData?.compositeChart
    );

    if (!relationshipData?.clusterScoring) {
      return (
        <View style={[styles.missingDataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.missingDataIcon}>⚠️</Text>
          <Text style={[styles.missingDataTitle, { color: colors.error }]}>Data Loading Error</Text>
          <Text style={[styles.missingDataText, { color: colors.onSurfaceVariant }]}>
            Cluster scoring data is missing. This should not happen for new relationships.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* V3 Cluster Radar */}
        <V3ClusterRadar
          clusters={relationshipData?.clusterScoring?.clusters || {}}
          tier={relationshipData?.clusterScoring?.overall?.tier || ''}
          profile={relationshipData?.clusterScoring?.overall?.profile || ''}
          overallScore={relationshipData?.clusterScoring?.overall?.score}
        />

        {/* Consolidated Items Grid */}
        <ConsolidatedItemsGrid
          scoredItems={consolidatedItems}
          keystoneAspects={relationshipData?.clusterScoring?.overall?.keystoneAspects || []}
          onItemPress={(item) => {
            console.log('Consolidated item pressed:', item);
          }}
          userAName={relationship.userA_name}
          userBName={relationship.userB_name}
        />
      </ScrollView>
    );
  };

  const OverviewTab = () => {
    console.log('OverviewTab - Relationship object:', relationship);
    console.log('OverviewTab - ClusterScoring:', relationshipData?.clusterScoring);
    console.log('OverviewTab - AnalysisData:', analysisData);
    const clusterScoring = relationshipData?.clusterScoring;

    if (!clusterScoring) {
      return (
        <View style={[styles.missingDataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.missingDataIcon}>⚠️</Text>
          <Text style={[styles.missingDataTitle, { color: colors.error }]}>Data Loading Error</Text>
          <Text style={[styles.missingDataText, { color: colors.onSurfaceVariant }]}>
            Cluster scoring data is missing. This should not happen for new relationships.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Initial Overview */}
        {analysisData?.initialOverview && (
          <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.overviewText, { color: colors.onSurfaceVariant }]}>
              {analysisData.initialOverview}
            </Text>
          </View>
        )}

      </ScrollView>
    );
  };


  // Legacy helper functions removed - no longer needed for V3


  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading relationship analysis...</Text>
      </View>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'charts':
        return <ChartsTab />;
      case 'scores':
        return <ScoresTab />;
      case 'overview':
        return <OverviewTab />;
      case 'guidance':
        return (
          <RelationshipAnalysisTab
            analysisData={analysisData}
            relationshipId={relationship._id}
            onAnalysisComplete={(_completedAnalysisData) => {
              console.log('Analysis completed, refreshing data...');
              // Force reload the analysis data to get the completed analysis
              loadAnalysisData(true);
            }}
            loading={loading}
          />
        );
      case 'chat':
        // Ask Stellium requires 360 Analysis to be completed first
        if (!analysisData?.completeAnalysis) {
          return (
            <LockedRelationshipChatTab
              userAName={relationship.userA_name}
              userBName={relationship.userB_name}
            />
          );
        }
        const consolidatedItems = relationshipTransformers.enrichCompositeAspects(
          relationshipData?.clusterScoring?.scoredItems || [],
          relationshipData?.compositeChart
        );
        return (
          <RelationshipChatTab
            compositeChartId={relationship._id}
            consolidatedItems={consolidatedItems}
            userAName={relationship.userA_name}
            userBName={relationship.userB_name}
          />
        );
      default:
        return <ChartsTab />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Analysis Header */}
      <AnalysisHeader
        title={`${relationshipData?.userA_name || 'User A'} & ${relationshipData?.userB_name || 'User B'}`}
        subtitle={relationshipData?.isCelebrityRelationship ? 'Celebrity Relationship Analysis' : 'Relationship Analysis'}
        hideAvatar={true}
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

      {/* Sub Navigation (only for Charts tab) */}
      {activeTab === 'charts' && (
        <StickySegment
          items={chartSubTabs}
          selectedValue={chartSubTab}
          onChange={setChartSubTab}
        />
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.error }]} onPress={loadAnalysisData}>
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
  // Charts Tab styles
  chartsContainer: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  horizontalScroll: {
    flex: 1,
  },
  chartPage: {
    width: screenWidth,
    padding: 16,
    alignItems: 'center',
  },
  tablePage: {
    width: screenWidth,
    padding: 16,
  },
  singleChartContainer: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  singleTableContainer: {
    flex: 1,
    padding: 16,
  },
  pageContainer: {
    flex: 1,
  },
  pageControl: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  tableSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  wheelSection: {
    alignItems: 'center',
    padding: 8,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  wheelContainer: {
    alignItems: 'center',
    padding: 8,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  placeholder: {
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  clusterAnalysisText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  overviewText: {
    fontSize: 16,
    lineHeight: 24,
  },
  listItem: {
    marginBottom: 12,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  dynamicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dynamicCard: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  dynamicIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  dynamicLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  dynamicValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  missingDataCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    margin: 16,
  },
  missingDataIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  missingDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  missingDataText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  completeAnalysisButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeAnalysisButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
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
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  analysisContainer: {
    flex: 1,
  },
  analysisContent: {
    padding: 16,
  },
  categorySection: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  expandIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryContent: {
    borderTopWidth: 1,
  },
  factorsSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tensionFlowSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  panelsSection: {
    padding: 16,
  },
  analysisPanel: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  analysisPanelLast: {
    marginBottom: 0,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  analysisEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  // Scores Tab Styles
  scoresContainer: {
    flex: 1,
  },
  stickyChipRow: {
    position: 'relative',
    zIndex: 10,
  },
  scoresScrollContent: {
    paddingBottom: 20,
  },
  // Overview Tab Styles
  overviewContainer: {
    flex: 1,
  },
  stickyTagline: {
    position: 'relative',
    zIndex: 9,
  },
  overviewChipRow: {
    position: 'relative',
    zIndex: 8,
  },
  overviewScrollContent: {
    paddingBottom: 20,
  },
  overviewBodyText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  strengthTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  // V3 Overview Tab Styles
  overviewHeader: {
    padding: 20,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
  },
  relationshipTier: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  relationshipProfile: {
    fontSize: 15,
    fontWeight: '600',
  },
  overviewCard: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  clustersCard: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  clustersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  clusterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  clusterName: {
    fontSize: 16,
    fontWeight: '500',
  },
  clusterScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  keystonesCard: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  keystonesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  keystoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  keystoneDescription: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  keystoneScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  upgradeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
});

export default RelationshipAnalysisScreen;
