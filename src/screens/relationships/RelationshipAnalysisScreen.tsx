import React, { useState, useEffect, useRef } from 'react';
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
import { relationshipsApi, UserCompositeChart, RelationshipAnalysisResponse } from '../../api/relationships';
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
import { CardAccordion, AccordionCard, ClusterChipRow, TaglineCard, ProgressBar, Bullet, OverviewChipRow } from '../../components/ui';
import RelationshipTensionFlow from '../../components/relationships/RelationshipTensionFlow';
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
  const [analysisData, setAnalysisData] = useState<RelationshipAnalysisResponse | null>(null);
  const [userAData, setUserAData] = useState<SubjectDocument | null>(null);
  const [userBData, setUserBData] = useState<SubjectDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation configuration
  const topTabs = [
    { label: 'Charts', routeName: 'charts' },
    { label: 'Scores', routeName: 'scores' },
    { label: 'Overview', routeName: 'overview' },
    { label: '360 Analysis', routeName: 'guidance' },
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
        return {
          icon: '📊',
          title: '',
          desc: 'Synastry & composite chart wheels, tables, and placements',
        };
      case 'scores':
        return {
          icon: '💕',
          title: '',
          desc: 'Detailed compatibility scores across all relationship dimensions',
        };
      case 'overview':
        return {
          icon: '💫',
          title: '',
          desc: 'Short analysis of the relationship',
        };
      case 'guidance':
        return {
          icon: '🔮',
          title: '',
          desc: 'Comprehensive analysis across important relationship areas',
        };
      default:
        return null;
    }
  };

  useEffect(() => {
    loadAnalysisData();
  }, [loadAnalysisData]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if enhanced analysis data is already included in the relationship object (new relationships)
      if ((relationship as any).enhancedAnalysis) {
        // Use the enhanced analysis data that's already included
        const enhancedAnalysis = (relationship as any).enhancedAnalysis;

        // Transform enhanced analysis to match RelationshipAnalysisResponse interface
        const transformedAnalysis: RelationshipAnalysisResponse = {
          profileAnalysis: (relationship as any).profileAnalysis || {
            profileResult: {
              tier: 'Enhanced',
              profile: 'Compatibility Analysis',
              clusterScores: {
                Heart: Math.round(enhancedAnalysis.scores?.EMOTIONAL_SECURITY_CONNECTION?.overall || 0),
                Body: Math.round(enhancedAnalysis.scores?.SEX_AND_INTIMACY?.overall || 0),
                Mind: Math.round(enhancedAnalysis.scores?.COMMUNICATION_AND_MENTAL_CONNECTION?.overall || 0),
                Life: Math.round(enhancedAnalysis.scores?.PRACTICAL_GROWTH_SHARED_GOALS?.overall || 0),
                Soul: Math.round(enhancedAnalysis.scores?.KARMIC_LESSONS_GROWTH?.overall || 0),
              },
            },
          },
          scores: enhancedAnalysis.scores,
          // Use the actual holistic overview from the enhanced analysis
          holisticOverview: enhancedAnalysis.holisticOverview,
          // Include tension flow analysis from the enhanced analysis
          tensionFlowAnalysis: enhancedAnalysis.tensionFlowAnalysis,
          // Include cluster analysis if available
          clusterAnalysis: enhancedAnalysis.clusterAnalysis,
          // Include detailed category analysis if available
          analysis: enhancedAnalysis.analysis,
          // Include score analysis if available
          scoreAnalysis: enhancedAnalysis.scoreAnalysis,
        };

        setAnalysisData(transformedAnalysis);
      } else {
        // Fallback to fetching analysis data (existing relationships)
        try {
          const analysisResult = await relationshipsApi.fetchRelationshipAnalysis(relationship._id);
          setAnalysisData(analysisResult);
        } catch (fetchError) {
          console.log('No existing analysis data found, continuing without analysis data');
          // Don't set error state - just continue without analysis data
          // This allows the Charts tab to work with chart data from the relationship object
        }
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
    } catch (err) {
      console.error('Failed to load relationship analysis:', err);
      setError('Failed to load relationship analysis');
    } finally {
      setLoading(false);
    }
  };

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
    const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
    const [selectedChipCluster, setSelectedChipCluster] = useState<string | null>(null);
    const scoresScrollViewRef = useRef<ScrollView>(null);
    const clusterRefs = useRef<{ [key: string]: View | null }>({});

    // Prepare cluster data
    const clusterData = analysisData?.profileAnalysis ?
      Object.entries(analysisData.profileAnalysis.profileResult.clusterScores).map(([cluster, score]) => ({
        id: cluster,
        emoji: getClusterIcon(cluster),
        label: cluster,
        score: Math.round(score),
      })) : [];

    const handleClusterExpand = (clusterId: string) => {
      const newExpanded = expandedCluster === clusterId ? null : clusterId;
      setExpandedCluster(newExpanded);

      // Configure layout animation for smooth transitions
      LayoutAnimation.configureNext({
        duration: 300,
        create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
    };

    const handleChipSelect = (clusterId: string) => {
      setSelectedChipCluster(clusterId);
      // Scroll to the selected cluster card
      if (clusterRefs.current[clusterId]) {
        clusterRefs.current[clusterId]?.measureLayout(
          scoresScrollViewRef.current as any,
          (x, y) => {
            scoresScrollViewRef.current?.scrollTo({ y: y - 150, animated: true });
          },
          () => {}
        );
      }
    };

    if (!analysisData?.profileAnalysis) {
      return (
        <View style={[styles.missingDataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.missingDataIcon}>📊</Text>
          <Text style={[styles.missingDataTitle, { color: colors.primary }]}>Compatibility Scores</Text>
          <Text style={[styles.missingDataText, { color: colors.onSurfaceVariant }]}>
            Complete your full analysis to unlock detailed compatibility scores and radar chart visualization.
          </Text>
          <CompleteRelationshipAnalysisButton
            compositeChartId={relationship._id}
            onAnalysisComplete={loadAnalysisData}
          />
        </View>
      );
    }

    return (
      <View style={styles.scoresContainer}>
        {/* Sticky Cluster Chip Row */}
        <ClusterChipRow
          clusters={clusterData}
          selectedCluster={selectedChipCluster}
          onSelectCluster={handleChipSelect}
          style={styles.stickyChipRow}
        />

        <ScrollView
          ref={scoresScrollViewRef}
          style={styles.tabContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scoresScrollContent}
        >
          {/* Radar Chart */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>💕 Compatibility Scores</Text>
            <RadarChart
              data={analysisData.profileAnalysis.profileResult.clusterScores}
              size={300}
            />
          </View>

          {/* Cluster Analysis Sections */}
          {analysisData.clusterAnalysis && Object.entries(analysisData.clusterAnalysis).map(([cluster, data]) => {
            const score = Math.round(analysisData.profileAnalysis.profileResult.clusterScores[cluster] || 0);
            return (
              <View
                key={cluster}
                ref={(ref) => { clusterRefs.current[cluster] = ref; }}
                collapsable={false}
              >
                <AccordionCard
                  emoji={getClusterIcon(cluster)}
                  label={`${cluster} Analysis`}
                  score={score}
                  isExpanded={expandedCluster === cluster}
                  onPress={() => handleClusterExpand(cluster)}
                >
                  <Text style={[styles.clusterAnalysisText, { color: colors.onSurface }]}>
                    {data.analysis}
                  </Text>
                </AccordionCard>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const OverviewTab = () => {
    const [openAccordionId, setOpenAccordionId] = useState<string | null>('overview');
    const [selectedOverviewSection, setSelectedOverviewSection] = useState<string | null>(null);
    const overviewScrollViewRef = useRef<ScrollView>(null);
    const overviewSectionRefs = useRef<{ [key: string]: View | null }>({});

    // Derive tagline from top strength
    const getTagline = (): string => {
      if (analysisData?.holisticOverview?.topStrengths?.[0]?.name) {
        const topStrength = analysisData.holisticOverview.topStrengths[0].name;
        // Map to phrase library - simplified for now
        const taglinePhrases: { [key: string]: string } = {
          'Sun exact conjunction Mars': 'Magnetic attraction and fiery chemistry',
          'Venus close conjunction Mars': 'Passionate love and physical magnetism',
          'Sun conjunction Mars': 'Dynamic energy and powerful chemistry',
          'default': 'A unique cosmic connection',
        };
        return taglinePhrases[topStrength] || taglinePhrases.default;
      }
      return 'A journey of discovery together';
    };

    // Overview sections for chip navigation
    const overviewSections = [
      { id: 'overview', label: 'Overview', emoji: '💫' },
      { id: 'strengths', label: 'Strengths', emoji: '✨' },
      { id: 'challenges', label: 'Challenges', emoji: '⚠️' },
      { id: 'dynamics', label: 'Dynamics', emoji: '⚖️' },
    ];

    const handleAccordionToggle = (accordionId: string) => {
      setOpenAccordionId(openAccordionId === accordionId ? null : accordionId);

      // Configure layout animation for smooth transitions
      LayoutAnimation.configureNext({
        duration: 300,
        create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
    };

    const handleOverviewSectionSelect = (sectionId: string) => {
      setSelectedOverviewSection(sectionId);
      // Scroll to the selected section
      if (overviewSectionRefs.current[sectionId]) {
        overviewSectionRefs.current[sectionId]?.measureLayout(
          overviewScrollViewRef.current as any,
          (x, y) => {
            overviewScrollViewRef.current?.scrollTo({ y: y - 120, animated: true });
          },
          () => {}
        );
      }
    };

    if (!analysisData?.holisticOverview) {
      return (
        <View style={[styles.missingDataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.missingDataIcon}>💫</Text>
          <Text style={[styles.missingDataTitle, { color: colors.primary }]}>Relationship Overview</Text>
          <Text style={[styles.missingDataText, { color: colors.onSurfaceVariant }]}>
            Complete your full analysis to unlock detailed relationship insights and dynamic analysis.
          </Text>
          <CompleteRelationshipAnalysisButton
            compositeChartId={relationship._id}
            onAnalysisComplete={loadAnalysisData}
          />
        </View>
      );
    }

    return (
      <View style={styles.overviewContainer}>
        {/* Sticky Tagline Card */}
        <TaglineCard
          phrase={getTagline()}
          style={styles.stickyTagline}
        />

        {/* Overview Section Chip Row */}
        <OverviewChipRow
          sections={overviewSections}
          selectedSection={selectedOverviewSection}
          onSelectSection={handleOverviewSectionSelect}
          style={styles.overviewChipRow}
        />

        <ScrollView
          ref={overviewScrollViewRef}
          style={styles.tabContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.overviewScrollContent}
        >
          {/* 1. Relationship Overview */}
          <View
            ref={(ref) => { overviewSectionRefs.current.overview = ref; }}
            collapsable={false}
          >
            <AccordionCard
              emoji="💫"
              label="Relationship Overview"
              score={0} // No score for overview
              isExpanded={openAccordionId === 'overview'}
              onPress={() => handleAccordionToggle('overview')}
            >
              <Text style={[styles.overviewBodyText, { color: colors.onSurfaceMed }]}>
                {analysisData.holisticOverview.overview}
              </Text>
            </AccordionCard>
          </View>

          {/* 2. Top Strengths */}
          {analysisData.holisticOverview.topStrengths && (
            <View
              ref={(ref) => { overviewSectionRefs.current.strengths = ref; }}
              collapsable={false}
            >
              <AccordionCard
                emoji="✨"
                label="Top Strengths"
                score={0} // No score for strengths
                isExpanded={openAccordionId === 'strengths'}
                onPress={() => handleAccordionToggle('strengths')}
              >
                {analysisData.holisticOverview.topStrengths.map((strength, index) => (
                  <Bullet key={index}>
                    <Text style={[styles.strengthTitle, { color: colors.onSurfaceHigh }]}>
                      {strength.name}
                    </Text>
                    <Text style={[styles.overviewBodyText, { color: colors.onSurfaceMed }]}>
                      {strength.description}
                    </Text>
                  </Bullet>
                ))}
              </AccordionCard>
            </View>
          )}

          {/* 3. Key Challenges */}
          {analysisData.holisticOverview.keyChallenges && (
            <View
              ref={(ref) => { overviewSectionRefs.current.challenges = ref; }}
              collapsable={false}
            >
              <AccordionCard
                emoji="⚠️"
                label="Key Challenges"
                score={0} // No score for challenges
                isExpanded={openAccordionId === 'challenges'}
                onPress={() => handleAccordionToggle('challenges')}
              >
                {analysisData.holisticOverview.keyChallenges.map((challenge, index) => (
                  <Bullet key={index}>
                    <Text style={[styles.challengeTitle, { color: colors.onSurfaceHigh }]}>
                      {challenge.name}
                    </Text>
                    <Text style={[styles.overviewBodyText, { color: colors.onSurfaceMed }]}>
                      {challenge.description}
                    </Text>
                  </Bullet>
                ))}
              </AccordionCard>
            </View>
          )}

          {/* 4. Relationship Dynamics */}
          {analysisData.tensionFlowAnalysis && (
            <View
              ref={(ref) => { overviewSectionRefs.current.dynamics = ref; }}
              collapsable={false}
            >
              <AccordionCard
                emoji="⚖️"
                label="Relationship Dynamics"
                score={0} // No score for dynamics
                isExpanded={openAccordionId === 'dynamics'}
                onPress={() => handleAccordionToggle('dynamics')}
              >
                <ProgressBar
                  label="Support Level"
                  level={getSupportLevel(analysisData.tensionFlowAnalysis.supportDensity)}
                  fillColor="accentSupport"
                  icon="🌿"
                />
                <ProgressBar
                  label="Tension Level"
                  level={getTensionLevel(analysisData.tensionFlowAnalysis.challengeDensity)}
                  fillColor="accentWarning"
                  icon="🔥"
                />
                <ProgressBar
                  label="Balance"
                  level={getBalanceDescription(analysisData.tensionFlowAnalysis.polarityRatio)}
                  fillColor="accentPrimary"
                  icon="⚖️"
                />
              </AccordionCard>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const AnalysisTab = () => {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const categoryInfo: { [key: string]: { icon: string; name: string } } = {
      'OVERALL_ATTRACTION_CHEMISTRY': { icon: '💫', name: 'Overall Attraction & Chemistry' },
      'EMOTIONAL_SECURITY_CONNECTION': { icon: '🏡', name: 'Emotional Security & Connection' },
      'SEX_AND_INTIMACY': { icon: '🔥', name: 'Sex & Intimacy' },
      'COMMUNICATION_AND_MENTAL_CONNECTION': { icon: '💬', name: 'Communication & Mental Connection' },
      'COMMITMENT_LONG_TERM_POTENTIAL': { icon: '💍', name: 'Commitment & Long-term Potential' },
      'KARMIC_LESSONS_GROWTH': { icon: '🌟', name: 'Karmic Lessons & Growth' },
      'PRACTICAL_GROWTH_SHARED_GOALS': { icon: '🎯', name: 'Practical Growth & Shared Goals' },
    };

    const analysisCategories = analysisData?.analysis ? Object.keys(analysisData.analysis) : [];
    
    const toggleCategory = (category: string) => {
      const newExpanded = new Set(expandedCategories);
      if (newExpanded.has(category)) {
        newExpanded.delete(category);
      } else {
        newExpanded.add(category);
      }
      setExpandedCategories(newExpanded);
    };

    return (
      <ScrollView style={[styles.analysisContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {analysisData?.analysis && analysisCategories.length > 0 ? (
          <View style={styles.analysisContent}>
            {analysisCategories.map((category) => {
              const categoryData = analysisData.analysis[category];
              const isExpanded = expandedCategories.has(category);
              
              return (
                <View key={category} style={[styles.categorySection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(category)}>
                    <View style={styles.categoryHeaderContent}>
                      <Text style={styles.categoryIcon}>{categoryInfo[category]?.icon || '📊'}</Text>
                      <Text style={[styles.categoryTitle, { color: colors.onSurface }]}>
                        {categoryInfo[category]?.name || category.replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <Text style={[styles.expandIcon, { color: colors.primary }]}>{isExpanded ? '▼' : '▶'}</Text>
                  </TouchableOpacity>

                  {isExpanded && categoryData && (
                    <View style={[styles.categoryContent, { borderTopColor: colors.border }]}>
                      {/* Most Significant Factors */}
                      {analysisData?.scoreAnalysis?.[category]?.scoredItems && (
                        <View style={[styles.factorsSection, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
                          <Text style={[styles.factorsTitle, { color: colors.primary }]}>🎯 Most Significant Factors</Text>
                          <ScoredItemsTable
                            scoredItems={analysisData.scoreAnalysis[category].scoredItems}
                            userAName={relationship.userA_name || 'User A'}
                            userBName={relationship.userB_name || 'User B'}
                          />
                        </View>
                      )}

                      {/* Tension Flow Analysis */}
                      {analysisData?.categoryTensionFlowAnalysis?.[category] && (
                        <View style={[styles.tensionFlowSection, { borderBottomColor: colors.border }]}>
                          <RelationshipTensionFlow
                            tensionFlow={analysisData.categoryTensionFlowAnalysis[category]}
                          />
                        </View>
                      )}

                      {/* Analysis Panels */}
                      <View style={styles.panelsSection}>
                        {categoryData.panels.synastry && (
                          <View style={[styles.analysisPanel, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.panelTitle, { color: colors.primary }]}>🔗 Synastry Analysis</Text>
                            <Text style={[styles.analysisText, { color: colors.onSurface }]}>
                              {categoryData.panels.synastry}
                            </Text>
                          </View>
                        )}

                        {categoryData.panels.composite && (
                          <View style={[styles.analysisPanel, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.panelTitle, { color: colors.primary }]}>🌟 Composite Analysis</Text>
                            <Text style={[styles.analysisText, { color: colors.onSurface }]}>
                              {categoryData.panels.composite}
                            </Text>
                          </View>
                        )}

                        {categoryData.panels.fullAnalysis && (
                          <View style={styles.analysisPanelLast}>
                            <Text style={[styles.panelTitle, { color: colors.primary }]}>🔍 Full Analysis</Text>
                            <Text style={[styles.analysisText, { color: colors.onSurface }]}>
                              {categoryData.panels.fullAnalysis}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.analysisEmptyContainer}>
            <CompleteRelationshipAnalysisButton
              compositeChartId={relationship._id}
              onAnalysisComplete={loadAnalysisData}
            />
          </View>
        )}
      </ScrollView>
    );
  };

  const getClusterIcon = (cluster: string): string => {
    const icons: { [key: string]: string } = {
      Heart: '💗',
      Body: '🔥',
      Mind: '🧠',
      Life: '💎',
      Soul: '🌙',
    };
    return icons[cluster] || '💫';
  };

  const getSupportLevel = (density: number): string => {
    if (density >= 2.5) {return 'Very High';}
    if (density >= 1.5) {return 'High';}
    if (density >= 0.8) {return 'Moderate';}
    if (density >= 0.3) {return 'Low';}
    return 'Very Low';
  };

  const getTensionLevel = (density: number): string => {
    if (density >= 1.5) {return 'Very High';}
    if (density >= 1.0) {return 'High';}
    if (density >= 0.5) {return 'Moderate';}
    if (density >= 0.1) {return 'Low';}
    return 'Very Low';
  };

  const getBalanceDescription = (ratio: number): string => {
    if (ratio >= 5) {return 'Highly Supportive';}
    if (ratio >= 2) {return 'More Supportive';}
    if (ratio >= 1) {return 'Balanced';}
    return 'More Challenging';
  };


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
        return <AnalysisTab />;
      default:
        return <ChartsTab />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Analysis Header */}
      <AnalysisHeader
        title={`${relationship.userA_name} & ${relationship.userB_name}`}
        subtitle="Relationship Analysis"
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
});

export default RelationshipAnalysisScreen;
