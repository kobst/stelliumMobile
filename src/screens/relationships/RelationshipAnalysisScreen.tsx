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
import { relationshipsApi, UserCompositeChart, RelationshipAnalysisResponse, ConsolidatedScoredItem } from '../../api/relationships';
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
import RadarChart from '../../components/chart/RadarChart';
import ScoredItemsTable from '../../components/chart/ScoredItemsTable';
import { CompleteRelationshipAnalysisButton } from '../../components/relationship';
import RelationshipAnalysisTab from '../../components/relationship/RelationshipAnalysisTab';
import RelationshipChatTab from '../../components/relationship/RelationshipChatTab';
import V3ClusterRadar from '../../components/relationship/V3ClusterRadar';
import KeystoneAspectsHighlight from '../../components/relationship/KeystoneAspectsHighlight';
import ConsolidatedItemsGrid from '../../components/relationship/ConsolidatedItemsGrid';
import { CardAccordion, AccordionCard, ClusterChipRow, TaglineCard, ProgressBar, Bullet, OverviewChipRow } from '../../components/ui';
import { AnalysisHeader } from '../../components/navigation/AnalysisHeader';
import { TopTabBar } from '../../components/navigation/TopTabBar';
import { StickySegment } from '../../components/navigation/StickySegment';
import { SectionSubtitle } from '../../components/navigation/SectionSubtitle';

type RelationshipAnalysisScreenRouteProp = RouteProp<{
  RelationshipAnalysis: {
    relationship: UserCompositeChart;
  };
}, 'RelationshipAnalysis'>;


const RelationshipAnalysisScreen: React.FC = () => {
  const route = useRoute<RelationshipAnalysisScreenRouteProp>();
  const { colors } = useTheme();
  const { relationship } = route.params;
  
  console.log('RelationshipAnalysisScreen loaded with relationship:', relationship);
  console.log('Relationship has v2Analysis:', !!relationship.v2Analysis);
  const scrollViewRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState('charts');
  const [chartSubTab, setChartSubTab] = useState('synastry-wheels');
  const [synastryWheelsPage, setSynastryWheelsPage] = useState(0);

  const handleSynastryWheelsScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / screenWidth);
    setSynastryWheelsPage(pageIndex);
  };

  // Reset wheels page when switching between chart sub-tabs
  useEffect(() => {
    setSynastryWheelsPage(0);
  }, [chartSubTab]);

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['synastry-a']));
  const [userAData, setUserAData] = useState<SubjectDocument | null>(null);
  const [userBData, setUserBData] = useState<SubjectDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [analysisData, setAnalysisData] = useState<RelationshipAnalysisResponse | null>(null);
  const [preSelectedChatItems, setPreSelectedChatItems] = useState<ConsolidatedScoredItem[]>([]);

  // Navigation configuration
  const topTabs = [
    { label: 'Charts', routeName: 'charts' },
    { label: 'Scores', routeName: 'scores' },
    { label: 'Overview', routeName: 'overview' },
    { label: '360 Analysis', routeName: 'guidance' },
    { label: 'Chat', routeName: 'chat' },
  ];

  const chartSubTabs = [
    { label: 'Synastry Wheels', value: 'synastry-wheels' },
    { label: 'Synastry Tables', value: 'synastry-tables' },
    { label: 'Composite Wheels', value: 'composite-wheels' },
    { label: 'Composite Tables', value: 'composite-tables' },
  ];

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
      case 'chat':
        return null;
      default:
        return null;
    }
  };

  const loadAnalysisData = useCallback(async () => {
    // Prevent reloading if we've already loaded data for this relationship
    if (hasLoadedData) {
      return;
    }

    try {
      setError(null);
      
      // Fetch the full relationship analysis document
      const fullAnalysisData = await relationshipsApi.fetchRelationshipAnalysis(relationship._id);
      console.log('Full analysis data loaded:', fullAnalysisData);
      
      // Store the full analysis data for the 360 Analysis tab
      setAnalysisData(fullAnalysisData);
      console.log('Set analysisData in state:', !!fullAnalysisData.analysis);
      
      // Update the relationship object with the V3 data
      if (fullAnalysisData.v2Analysis) {
        (relationship as any).v2Analysis = fullAnalysisData.v2Analysis;
        (relationship as any).v2Metrics = fullAnalysisData.v2Metrics;
        console.log('Updated relationship with V3 data - clusters:', Object.keys(fullAnalysisData.v2Analysis.clusters));
      }
      
      // Fetch user birth charts in parallel if we have user IDs
      const userPromises: Promise<any>[] = [];
      if (relationship.userA_id) {
        userPromises.push(usersApi.getUser(relationship.userA_id));
      }
      if (relationship.userB_id) {
        userPromises.push(usersApi.getUser(relationship.userB_id));
      }

      if (userPromises.length > 0) {
        const userResults = await Promise.all(userPromises);

        if (relationship.userA_id && userResults[0]) {
          setUserAData(userResults[0]);
        }
        if (relationship.userB_id && userResults[userResults.length - 1]) {
          setUserBData(userResults[userResults.length - 1]);
        }
      }

      setHasLoadedData(true);
    } catch (err) {
      console.error('Failed to load analysis data:', err);
      setError('Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  }, [relationship._id, hasLoadedData]);

  useEffect(() => {
    // Reset loading state when relationship changes
    setHasLoadedData(false);
    setLoading(true);
    loadAnalysisData();
  }, [relationship._id]); // Only reload when the relationship ID changes

  // Helper functions
  const toggleCardExpanded = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (expandedCards.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  // Handler for "Chat about this" functionality
  const handleChatAboutItem = (item: ConsolidatedScoredItem) => {
    setPreSelectedChatItems([item]);
    setActiveTab('chat');
  };

  // Clear preselected items when switching tabs
  const handleTabPress = (tab: string) => {
    if (tab !== 'chat') {
      setPreSelectedChatItems([]);
    }
    setActiveTab(tab);
  };



  const ChartsTab = () => {
    const hasChartData = relationship && (
      relationship.synastryAspects ||
      relationship.compositeChart ||
      relationship.synastryHousePlacements
    );

    const renderSynastryWheels = () => {
      if (!userAData?.birthChart || !userBData?.birthChart) {
        return (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: colors.onSurfaceMed }]}>
              Loading chart data...
            </Text>
          </View>
        );
      }

      const pages = [relationship.userA_name, relationship.userB_name];
      
      return (
        <View style={styles.pageContainer}>
          <ScrollView
            key="synastry-wheels-scroll"
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleSynastryWheelsScroll}
            style={styles.horizontalScroll}
          >
            <View style={styles.chartPage}>
              <Text style={[styles.chartTitle, { color: colors.onSurface }]}>
                {relationship.userA_name}'s Chart
              </Text>
              <Text style={[styles.chartSubtitle, { color: colors.onSurfaceMed }]}>
                with {relationship.userB_name}'s influences
              </Text>
              <View style={styles.wheelContainer}>
                <SynastryChartWheel
                  basePlanets={userAData.birthChart.planets}
                  baseHouses={userAData.birthChart.houses}
                  transitPlanets={userBData.birthChart.planets}
                  baseName={relationship.userA_name}
                  transitName={relationship.userB_name}
                />
              </View>
            </View>
            
            <View style={styles.chartPage}>
              <Text style={[styles.chartTitle, { color: colors.onSurface }]}>
                {relationship.userB_name}'s Chart
              </Text>
              <Text style={[styles.chartSubtitle, { color: colors.onSurfaceMed }]}>
                with {relationship.userA_name}'s influences
              </Text>
              <View style={styles.wheelContainer}>
                <SynastryChartWheel
                  basePlanets={userBData.birthChart.planets}
                  baseHouses={userBData.birthChart.houses}
                  transitPlanets={userAData.birthChart.planets}
                  baseName={relationship.userB_name}
                  transitName={relationship.userA_name}
                />
              </View>
            </View>
          </ScrollView>
          
          {/* Page Control Dots */}
          <View style={styles.pageControl}>
            {pages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: colors.primary,
                    opacity: synastryWheelsPage === index ? 1.0 : 0.3,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      );
    };

    const renderSynastryTables = () => {
      return <SynastryTables relationship={relationship} />;
    };

    const renderCompositeWheels = () => {
      if (!relationship.compositeChart) {
        return (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: colors.onSurfaceMed }]}>
              No composite chart data available
            </Text>
          </View>
        );
      }

      return (
        <View style={styles.singleChartContainer}>
          <Text style={[styles.chartTitle, { color: colors.onSurface }]}>Composite Chart</Text>
          <Text style={[styles.chartSubtitle, { color: colors.onSurfaceMed }]}>
            Midpoint chart representing your combined energies
          </Text>
          <View style={styles.wheelContainer}>
            <CompositeChartWheel compositeChart={relationship.compositeChart} />
          </View>
        </View>
      );
    };

    const renderCompositeTables = () => {
      return <CompositeTables compositeChart={relationship.compositeChart} />;
    };

    return (
      <View style={styles.chartsContainer}>
        <View style={styles.contentArea}>
          {!hasChartData ? (
            <View style={styles.noDataContainer}>
              <Text style={[styles.noDataText, { color: colors.onSurfaceMed }]}>
                Chart data not available
              </Text>
            </View>
          ) : (
            <>
              {chartSubTab === 'synastry-wheels' && renderSynastryWheels()}
              {chartSubTab === 'synastry-tables' && renderSynastryTables()}
              {chartSubTab === 'composite-wheels' && renderCompositeWheels()}
              {chartSubTab === 'composite-tables' && renderCompositeTables()}
            </>
          )}
        </View>
      </View>
    );
  };

  const ScoresTab = () => {
    console.log('Relationship object:', relationship);
    console.log('V2Analysis:', relationship.v2Analysis);
    const v3Analysis = relationship.v2Analysis;
    const consolidatedItems = v3Analysis?.consolidatedScoredItems || [];
    
    // Debug keystone data
    console.log('Consolidated items count:', consolidatedItems.length);
    console.log('Keystone aspects count:', v3Analysis?.keystoneAspects?.length || 0);
    const keystoneItemsCount = consolidatedItems.filter(item => item.isOverallKeystone).length;
    console.log('Consolidated items with isOverallKeystone=true:', keystoneItemsCount);

    if (!v3Analysis) {
      return (
        <View style={[styles.missingDataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.missingDataIcon}>⚠️</Text>
          <Text style={[styles.missingDataTitle, { color: colors.error }]}>Data Loading Error</Text>
          <Text style={[styles.missingDataText, { color: colors.onSurfaceVariant }]}>
            V3 analysis data is missing. This should not happen for new relationships.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* V3 Cluster Radar */}
        <V3ClusterRadar
          clusters={v3Analysis.clusters}
          tier={v3Analysis.tier}
          profile={v3Analysis.profile}
        />

        {/* Consolidated Items Grid */}
        <ConsolidatedItemsGrid
          consolidatedItems={consolidatedItems}
          keystoneAspects={v3Analysis.keystoneAspects || []}
          onItemPress={(item) => {
            console.log('Consolidated item pressed:', item);
          }}
          onChatAboutItem={handleChatAboutItem}
        />
      </ScrollView>
    );
  };

  const OverviewTab = () => {
    console.log('OverviewTab - Relationship object:', relationship);
    console.log('OverviewTab - V2Analysis:', relationship.v2Analysis);
    const v3Analysis = relationship.v2Analysis;
    
    if (!v3Analysis) {
      return (
        <View style={[styles.missingDataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.missingDataIcon}>⚠️</Text>
          <Text style={[styles.missingDataTitle, { color: colors.error }]}>Data Loading Error</Text>
          <Text style={[styles.missingDataText, { color: colors.onSurfaceVariant }]}>
            V3 analysis data is missing. This should not happen for new relationships.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Relationship Header */}
        <View style={[styles.overviewHeader, { backgroundColor: colors.surface }]}>
          <Text style={[styles.relationshipTier, { color: colors.primary }]}>
            {v3Analysis.tier} Relationship
          </Text>
          <Text style={[styles.relationshipProfile, { color: colors.onSurface }]}>
            {v3Analysis.profile}
          </Text>
        </View>

        {/* Initial Overview */}
        <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.overviewTitle, { color: colors.onSurface }]}>
            💫 Relationship Overview
          </Text>
          <Text style={[styles.overviewText, { color: colors.onSurfaceVariant }]}>
            {v3Analysis.initialOverview}
          </Text>
        </View>

        {/* V3 Clusters Summary */}
        <View style={[styles.clustersCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.clustersTitle, { color: colors.onSurface }]}>
            🎵 Cluster Highlights
          </Text>
          {Object.entries(v3Analysis.clusters).map(([clusterName, clusterData]) => (
            <View key={clusterName} style={styles.clusterRow}>
              <Text style={[styles.clusterName, { color: colors.onSurface }]}>
                {clusterName}
              </Text>
              <Text style={[styles.clusterScore, { color: colors.primary }]}>
                {clusterData.score > 1 ? Math.round(clusterData.score) : Math.round(clusterData.score * 100)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Top Keystone Aspects */}
        {v3Analysis.keystoneAspects.length > 0 && (
          <View style={[styles.keystonesCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.keystonesTitle, { color: colors.onSurface }]}>
              ⭐️ Key Influences
            </Text>
            {v3Analysis.keystoneAspects.slice(0, 3).map((aspect, index) => (
              <View key={index} style={styles.keystoneRow}>
                <Text style={[styles.keystoneDescription, { color: colors.onSurfaceVariant }]}>
                  {aspect.description}
                </Text>
                <Text style={[styles.keystoneScore, { color: colors.secondary }]}>
                  {aspect.score.toFixed(1)}
                </Text>
              </View>
            ))}
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
            onAnalysisComplete={(completedAnalysisData) => {
              console.log('Analysis completed, refreshing data...');
              // Reset the loaded data flag to force a refresh
              setHasLoadedData(false);
              setAnalysisData(null); // Clear existing data to trigger loading state
              loadAnalysisData();
            }}
            loading={loading}
            onChatAboutItem={handleChatAboutItem}
          />
        );
      case 'chat':
        const v3Analysis = relationship.v2Analysis;
        const consolidatedItems = v3Analysis?.consolidatedScoredItems || [];
        const hasRelationshipAnalysis = !!(analysisData?.analysis && Object.keys(analysisData.analysis).length > 0);
        
        if (!hasRelationshipAnalysis) {
          return (
            <ScrollView style={[styles.lockedTabContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
              <View style={styles.lockedTabContent}>
                <View style={[styles.lockedTabHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.lockedTabSubtitle, { color: colors.onSurfaceVariant }]}>
                    Chat with AI about your relationship insights
                  </Text>
                </View>
                <View style={styles.missingAnalysisContainer}>
                  <CompleteRelationshipAnalysisButton
                    compositeChartId={relationship._id}
                    onAnalysisComplete={(completedAnalysisData) => {
                      console.log('Analysis completed, refreshing data...');
                      setHasLoadedData(false);
                      setAnalysisData(null);
                      loadAnalysisData();
                    }}
                    hasAnalysisData={hasRelationshipAnalysis}
                  />
                </View>
              </View>
            </ScrollView>
          );
        }
        
        return (
          <RelationshipChatTab
            compositeChartId={relationship._id}
            consolidatedItems={consolidatedItems}
            preSelectedItems={preSelectedChatItems}
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
        title={`${relationship.userA_name} & ${relationship.userB_name}`}
        subtitle={relationship.isCelebrityRelationship ? 'Celebrity Relationship Analysis' : 'Relationship Analysis'}
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
    fontSize: 18,
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
