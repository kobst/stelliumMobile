import React, { useState, useEffect, useRef } from 'react';
import { LayoutAnimation } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { relationshipsApi, UserCompositeChart, RelationshipAnalysisResponse } from '../../api/relationships';
import { usersApi } from '../../api/users';
import { SubjectDocument } from '../../types';
import SynastryChartWheel from '../../components/chart/SynastryChartWheel';
import SynastryAspectsTable from '../../components/chart/SynastryAspectsTable';
import CompositeChartTables from '../../components/chart/CompositeChartTables';
import CompositeChartWheel from '../../components/chart/CompositeChartWheel';
import SynastryHousePlacementsTable from '../../components/chart/SynastryHousePlacementsTable';
import AspectColorLegend from '../../components/chart/AspectColorLegend';
import RadarChart from '../../components/chart/RadarChart';
import ScoredItemsTable from '../../components/chart/ScoredItemsTable';
import { CompleteRelationshipAnalysisButton } from '../../components/relationship';
import { SegmentedControl, CardAccordion, AccordionCard, ClusterChipRow, TaglineCard, ProgressBar, Bullet, OverviewChipRow } from '../../components/ui';
import RelationshipTensionFlow from '../../components/relationships/RelationshipTensionFlow';

type RelationshipAnalysisScreenRouteProp = RouteProp<{
  RelationshipAnalysis: {
    relationship: UserCompositeChart;
  };
}, 'RelationshipAnalysis'>;

interface TabInfo {
  id: string;
  label: string;
  component: React.ReactNode;
}

const RelationshipAnalysisScreen: React.FC = () => {
  const route = useRoute<RelationshipAnalysisScreenRouteProp>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { relationship } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState('charts');
  const [chartMode, setChartMode] = useState<'synastry' | 'composite'>('synastry');
  const [activeSection, setActiveSection] = useState<'wheels' | 'tables' | 'placements'>('wheels');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['synastry-a']));
  const [analysisData, setAnalysisData] = useState<RelationshipAnalysisResponse | null>(null);
  const [userAData, setUserAData] = useState<SubjectDocument | null>(null);
  const [userBData, setUserBData] = useState<SubjectDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysisData();
  }, []);

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

  const handleChartModeChange = (newMode: 'synastry' | 'composite') => {
    setChartMode(newMode);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    // Reset expanded cards when switching modes
    const defaultCard = newMode === 'synastry' ? 'synastry-a' : 'composite-wheel';
    setExpandedCards(new Set([defaultCard]));
  };

  const handleSectionChange = (section: 'wheels' | 'tables' | 'placements') => {
    setActiveSection(section);
    // Scroll to appropriate section - will implement refs later if needed
  };


  const ChartsTab = () => {
    const hasChartData = relationship && (
      relationship.synastryAspects ||
      relationship.compositeChart ||
      relationship.synastryHousePlacements
    );

    return (
      <View style={styles.chartsContainer}>
        {/* Layer B: Chart Mode Segmented Control */}
        <View style={[styles.chartModeContainer, { backgroundColor: colors.background }]}>
          <SegmentedControl
            options={[
              { label: 'Synastry', value: 'synastry' },
              { label: 'Composite', value: 'composite' },
            ]}
            value={chartMode}
            onChange={handleChartModeChange}
            style={styles.chartModeControl}
            accessibilityLabel="Chart mode selection"
          />
        </View>

        {/* Layer C: Section Index */}
        <View style={[styles.sectionChipsContainer, { backgroundColor: colors.background, borderBottomColor: colors.strokeSubtle }]}>
          <SegmentedControl
            options={[
              { label: '🌀 Wheels', value: 'wheels' },
              { label: '📊 Tables', value: 'tables' },
              { label: '🧩 Placements', value: 'placements' },
            ]}
            value={activeSection}
            onChange={handleSectionChange}
            style={styles.sectionControl}
            accessibilityLabel="Chart section selection"
          />
        </View>

        {/* Aspect Color Legend for Tables Section */}
        {activeSection === 'tables' && (
          <AspectColorLegend compact />
        )}

        {/* Layer D: Scrollable Content with Cards */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {hasChartData ? (
            <>
              {chartMode === 'synastry' && (
                <>
                  {/* Synastry Wheels Section */}
                  {(activeSection === 'wheels' || activeSection === 'tables') && (
                    <>
                      <CardAccordion
                        title="Synastry Chart A"
                        subtitle={`${relationship.userA_name}'s chart with ${relationship.userB_name}'s influences`}
                        headerIcon="📊"
                        defaultExpanded={expandedCards.has('synastry-a')}
                        onExpand={() => toggleCardExpanded('synastry-a')}
                        lazyLoad
                      >
                        {userAData?.birthChart && userBData?.birthChart ? (
                          <View style={styles.wheelContainer}>
                            <SynastryChartWheel
                              basePlanets={userAData.birthChart.planets}
                              baseHouses={userAData.birthChart.houses}
                              transitPlanets={userBData.birthChart.planets}
                              baseName={relationship.userA_name}
                              transitName={relationship.userB_name}
                            />
                          </View>
                        ) : (
                          <View style={styles.loadingContainer}>
                            <Text style={[styles.loadingText, { color: colors.onSurfaceMed }]}>
                              Loading chart data...
                            </Text>
                          </View>
                        )}
                      </CardAccordion>

                      <CardAccordion
                        title="Synastry Chart B"
                        subtitle={`${relationship.userB_name}'s chart with ${relationship.userA_name}'s influences`}
                        headerIcon="📊"
                        defaultExpanded={expandedCards.has('synastry-b')}
                        onExpand={() => toggleCardExpanded('synastry-b')}
                        lazyLoad
                      >
                        {userAData?.birthChart && userBData?.birthChart ? (
                          <View style={styles.wheelContainer}>
                            <SynastryChartWheel
                              basePlanets={userBData.birthChart.planets}
                              baseHouses={userBData.birthChart.houses}
                              transitPlanets={userAData.birthChart.planets}
                              baseName={relationship.userB_name}
                              transitName={relationship.userA_name}
                            />
                          </View>
                        ) : (
                          <View style={styles.loadingContainer}>
                            <Text style={[styles.loadingText, { color: colors.onSurfaceMed }]}>
                              Loading chart data...
                            </Text>
                          </View>
                        )}
                      </CardAccordion>
                    </>
                  )}

                  {/* Synastry Tables Section */}
                  {activeSection === 'tables' && relationship.synastryAspects && (
                    <CardAccordion
                      title="Synastry Aspects"
                      subtitle="Planetary connections between your charts"
                      headerIcon="🔗"
                      defaultExpanded={expandedCards.has('synastry-aspects')}
                      onExpand={() => toggleCardExpanded('synastry-aspects')}
                    >
                      <SynastryAspectsTable
                        aspects={relationship.synastryAspects}
                        userAName={relationship.userA_name}
                        userBName={relationship.userB_name}
                      />
                    </CardAccordion>
                  )}

                  {/* Synastry Placements Section */}
                  {activeSection === 'placements' && relationship.synastryHousePlacements && (
                    <CardAccordion
                      title="Synastry House Placements"
                      subtitle="How your planets fall in each other's houses"
                      headerIcon="🏠"
                      defaultExpanded={expandedCards.has('synastry-placements')}
                      onExpand={() => toggleCardExpanded('synastry-placements')}
                    >
                      <SynastryHousePlacementsTable
                        synastryHousePlacements={relationship.synastryHousePlacements}
                        userAName={relationship.userA_name}
                        userBName={relationship.userB_name}
                      />
                    </CardAccordion>
                  )}
                </>
              )}

              {chartMode === 'composite' && (
                <>
                  {/* Composite Wheels Section */}
                  {activeSection === 'wheels' && relationship.compositeChart && (
                    <CardAccordion
                      title="Composite Chart"
                      subtitle="Midpoint chart representing your combined energies"
                      headerIcon="🌟"
                      defaultExpanded={expandedCards.has('composite-wheel')}
                      onExpand={() => toggleCardExpanded('composite-wheel')}
                      lazyLoad
                    >
                      <View style={styles.wheelContainer}>
                        <CompositeChartWheel
                          compositeChart={relationship.compositeChart}
                        />
                      </View>
                    </CardAccordion>
                  )}

                  {/* Composite Tables Section */}
                  {activeSection === 'tables' && relationship.compositeChart && (
                    <CardAccordion
                      title="Composite Chart Tables"
                      subtitle="Detailed planetary positions, houses, and aspects"
                      headerIcon="📊"
                      defaultExpanded={expandedCards.has('composite-tables')}
                      onExpand={() => toggleCardExpanded('composite-tables')}
                    >
                      <CompositeChartTables compositeChart={relationship.compositeChart} />
                    </CardAccordion>
                  )}
                </>
              )}
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={[styles.noDataText, { color: colors.onSurfaceMed }]}>
                Chart data not available
              </Text>
            </View>
          )}
        </ScrollView>
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
    const [activeAnalysisTab, setActiveAnalysisTab] = useState('OVERALL_ATTRACTION_CHEMISTRY');

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
    const currentCategoryData = analysisData?.analysis?.[activeAnalysisTab];

    return (
      <View style={styles.analysisContainer}>
        {analysisData?.analysis && analysisCategories.length > 0 ? (
          <>
            {/* Category Tab Navigation */}
            <View style={[styles.analysisTabContainer, { borderBottomColor: colors.border }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.analysisTabScrollContainer}
              >
                {analysisCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.analysisTab,
                      activeAnalysisTab === category && [styles.activeAnalysisTab, { borderBottomColor: colors.primary }],
                    ]}
                    onPress={() => setActiveAnalysisTab(category)}
                  >
                    <Text style={[styles.analysisTabIcon, { color: colors.onSurface }]}>
                      {categoryInfo[category]?.icon || '📊'}
                    </Text>
                    <Text style={[
                      styles.analysisTabText,
                      { color: colors.onSurfaceVariant },
                      activeAnalysisTab === category && [styles.activeAnalysisTabText, { color: colors.primary }],
                    ]}>
                      {categoryInfo[category]?.name || category.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Category Content */}
            <ScrollView style={styles.analysisCategoryContent} showsVerticalScrollIndicator={false}>
              {currentCategoryData ? (
                <>
                  {/* Category Header */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                      {categoryInfo[activeAnalysisTab]?.icon || '📊'} {categoryInfo[activeAnalysisTab]?.name || activeAnalysisTab}
                    </Text>
                    {analysisData?.scoreAnalysis?.[activeAnalysisTab]?.scoredItems && (
                      <View style={[styles.relevantPositionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.relevantPositionTitle, { color: colors.onSurface }]}>🎯 Most Significant Factors</Text>
                        <ScoredItemsTable
                          scoredItems={analysisData.scoreAnalysis[activeAnalysisTab].scoredItems}
                          userAName={relationship.userA_name || 'User A'}
                          userBName={relationship.userB_name || 'User B'}
                        />
                      </View>
                    )}

                    {/* Tension Flow Analysis */}
                    {analysisData?.categoryTensionFlowAnalysis?.[activeAnalysisTab] && (
                      <RelationshipTensionFlow
                        tensionFlow={analysisData.categoryTensionFlowAnalysis[activeAnalysisTab]}
                      />
                    )}
                  </View>

                  {/* Analysis Panels */}
                  {currentCategoryData.panels.synastry && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>🔗 Synastry Analysis</Text>
                      <Text style={[styles.analysisText, { color: colors.onSurface }]}>
                        {currentCategoryData.panels.synastry}
                      </Text>
                    </View>
                  )}

                  {currentCategoryData.panels.composite && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>🌟 Composite Analysis</Text>
                      <Text style={[styles.analysisText, { color: colors.onSurface }]}>
                        {currentCategoryData.panels.composite}
                      </Text>
                    </View>
                  )}

                  {currentCategoryData.panels.fullAnalysis && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>🔍 Full Analysis</Text>
                      <Text style={[styles.analysisText, { color: colors.onSurface }]}>
                        {currentCategoryData.panels.fullAnalysis}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={[styles.missingDataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={styles.missingDataIcon}>📊</Text>
                  <Text style={[styles.missingDataTitle, { color: colors.primary }]}>Analysis Loading</Text>
                  <Text style={[styles.missingDataText, { color: colors.onSurfaceVariant }]}>
                    Analysis data for this category is being prepared.
                  </Text>
                </View>
              )}
            </ScrollView>
          </>
        ) : (
          <View style={styles.analysisEmptyContainer}>
            <CompleteRelationshipAnalysisButton
              compositeChartId={relationship._id}
              onAnalysisComplete={loadAnalysisData}
            />
          </View>
        )}
      </View>
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

  const tabs: TabInfo[] = [
    { id: 'charts', label: 'Charts', component: <ChartsTab /> },
    { id: 'scores', label: 'Scores', component: <ScoresTab /> },
    { id: 'overview', label: 'Overview', component: <OverviewTab /> },
    { id: 'analysis', label: 'Analysis', component: <AnalysisTab /> },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading relationship analysis...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.relationshipInfo}>
          <Text style={[styles.relationshipTitle, { color: colors.primary }]}>Relationship Analysis</Text>
          <Text style={[styles.partnerNames, { color: colors.onSurface }]}>
            {relationship.userA_name} & {relationship.userB_name}
          </Text>
          <Text style={[styles.createdDate, { color: colors.onSurfaceVariant }]}>
            Created {relationship.createdAt ? new Date(relationship.createdAt).toLocaleDateString() : 'Invalid Date'}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && [styles.activeTab, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                { color: colors.onSurfaceVariant },
                activeTab === tab.id && [styles.activeTabText, { color: colors.primary }],
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {tabs.find(tab => tab.id === activeTab)?.component}
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
  // New Charts Tab styles
  chartsContainer: {
    flex: 1,
  },
  chartModeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chartModeControl: {
    // Styles handled by SegmentedControl component
  },
  sectionChipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionControl: {
    // Styles handled by SegmentedControl component
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
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
  header: {
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  relationshipInfo: {
    alignItems: 'center',
  },
  relationshipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  partnerNames: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  createdDate: {
    fontSize: 14,
  },
  tabContainer: {
    borderBottomWidth: 1,
  },
  tabScrollContainer: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
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
  analysisTabContainer: {
    borderBottomWidth: 1,
  },
  analysisTabScrollContainer: {
    paddingHorizontal: 16,
  },
  analysisTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  activeAnalysisTab: {
    borderBottomWidth: 2,
  },
  analysisTabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  analysisTabText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeAnalysisTabText: {
    fontWeight: '600',
  },
  analysisCategoryContent: {
    flex: 1,
    padding: 16,
  },
  relevantPositionCard: {
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  relevantPositionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 15,
    lineHeight: 24,
  },
  analysisEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
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
