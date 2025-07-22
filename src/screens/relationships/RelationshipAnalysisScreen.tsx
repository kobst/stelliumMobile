import React, { useState, useEffect } from 'react';
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
import RadarChart from '../../components/chart/RadarChart';
import ScoredItemsTable from '../../components/chart/ScoredItemsTable';

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

  const [activeTab, setActiveTab] = useState('charts');
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
              }
            }
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
          scoreAnalysis: enhancedAnalysis.scoreAnalysis
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

  const ChartsTab = () => {
    // Chart data should always come from the relationship object
    const hasChartData = relationship && (
      relationship.synastryAspects || 
      relationship.compositeChart || 
      relationship.synastryHousePlacements
    );
    const chartData = hasChartData ? relationship : null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {hasChartData && chartData ? (
          <>
            {/* Synastry Chart A */}
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>📊 Synastry Chart A</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
                {relationship.userA_name}'s chart with {relationship.userB_name}'s planetary influences
              </Text>
              {userAData?.birthChart && userBData?.birthChart ? (
                <SynastryChartWheel
                  basePlanets={userAData.birthChart.planets}
                  baseHouses={userAData.birthChart.houses}
                  transitPlanets={userBData.birthChart.planets}
                  baseName={relationship.userA_name}
                  transitName={relationship.userB_name}
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={[styles.placeholderText, { color: colors.onSurface }]}>Loading Chart Data...</Text>
                  <Text style={[styles.placeholderSubtext, { color: colors.onSurfaceVariant }]}>
                    {!userAData && `Fetching ${relationship.userA_name}'s birth chart...`}
                    {!userBData && `Fetching ${relationship.userB_name}'s birth chart...`}
                  </Text>
                </View>
              )}
            </View>

            {/* Synastry Chart B */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>📊 Synastry Chart B</Text>
              <Text style={styles.sectionSubtitle}>
                {relationship.userB_name}'s chart with {relationship.userA_name}'s planetary influences
              </Text>
              {userAData?.birthChart && userBData?.birthChart ? (
                <SynastryChartWheel
                  basePlanets={userBData.birthChart.planets}
                  baseHouses={userBData.birthChart.houses}
                  transitPlanets={userAData.birthChart.planets}
                  baseName={relationship.userB_name}
                  transitName={relationship.userA_name}
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={[styles.placeholderText, { color: colors.onSurface }]}>Loading Chart Data...</Text>
                  <Text style={[styles.placeholderSubtext, { color: colors.onSurfaceVariant }]}>
                    {!userAData && `Fetching ${relationship.userA_name}'s birth chart...`}
                    {!userBData && `Fetching ${relationship.userB_name}'s birth chart...`}
                  </Text>
                </View>
              )}
            </View>

            {/* Composite Chart */}
            {(chartData as any).compositeChart && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>🌟 Composite Chart</Text>
                <Text style={styles.sectionSubtitle}>
                  Midpoint chart representing your combined energies
                </Text>
                <CompositeChartTables compositeChart={(chartData as any).compositeChart} />
              </View>
            )}

            {/* Synastry Aspects */}
            {(chartData as any).synastryAspects && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>🔗 Synastry Aspects</Text>
                <Text style={styles.sectionSubtitle}>
                  Planetary connections between your charts
                </Text>
                <SynastryAspectsTable 
                  aspects={(chartData as any).synastryAspects}
                  userAName={relationship.userA_name}
                  userBName={relationship.userB_name}
                />
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>📊 Synastry Charts</Text>
              <Text style={styles.sectionSubtitle}>
                Birth chart comparisons with planetary overlays
              </Text>
              <View style={styles.placeholder}>
                <Text style={[styles.placeholderText, { color: colors.onSurface }]}>Synastry Charts</Text>
                <Text style={[styles.placeholderSubtext, { color: colors.onSurfaceVariant }]}>Chart data not available in analysis response</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>🌟 Composite Chart</Text>
              <Text style={styles.sectionSubtitle}>
                Midpoint chart representing your combined energies
              </Text>
              <View style={styles.placeholder}>
                <Text style={[styles.placeholderText, { color: colors.onSurface }]}>Composite Chart</Text>
                <Text style={[styles.placeholderSubtext, { color: colors.onSurfaceVariant }]}>Chart data not available in analysis response</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>🔗 Synastry Aspects</Text>
              <Text style={styles.sectionSubtitle}>
                Planetary connections between your charts
              </Text>
              <View style={styles.placeholder}>
                <Text style={[styles.placeholderText, { color: colors.onSurface }]}>Synastry Aspects Table</Text>
                <Text style={[styles.placeholderSubtext, { color: colors.onSurfaceVariant }]}>Aspect data not available in analysis response</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    );
  };

  const ScoresTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {analysisData?.profileAnalysis ? (
        <>
          {/* Profile Banner */}
          <View style={[styles.profileBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.profileItem}>
              <Text style={[styles.profileLabel, { color: colors.onSurfaceVariant }]}>Tier:</Text>
              <Text style={[styles.profileValue, { color: colors.onSurface }]}>
                {analysisData.profileAnalysis.profileResult.tier}
              </Text>
            </View>
            <Text style={[styles.profileDivider, { color: colors.border }]}>|</Text>
            <View style={styles.profileItem}>
              <Text style={[styles.profileLabel, { color: colors.onSurfaceVariant }]}>Profile:</Text>
              <Text style={[styles.profileValue, { color: colors.onSurface }]}>
                {analysisData.profileAnalysis.profileResult.profile}
              </Text>
            </View>
          </View>

          {/* Radar Chart */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>💕 Compatibility Scores</Text>
            <RadarChart 
              data={analysisData.profileAnalysis.profileResult.clusterScores}
              size={300}
            />
          </View>

          {/* Cluster Analysis Sections */}
          {analysisData.clusterAnalysis && Object.entries(analysisData.clusterAnalysis).map(([cluster, data]) => (
            <View key={cluster} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {getClusterIcon(cluster)} {cluster} Analysis
              </Text>
              <Text style={[styles.clusterAnalysisText, { color: colors.onSurface }]}>
                {data.analysis}
              </Text>
            </View>
          ))}
        </>
      ) : (
        <View style={[styles.missingDataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.missingDataIcon}>📊</Text>
          <Text style={[styles.missingDataTitle, { color: colors.primary }]}>Compatibility Scores</Text>
          <Text style={[styles.missingDataText, { color: colors.onSurfaceVariant }]}>
            Complete your full analysis to unlock detailed compatibility scores and radar chart visualization.
          </Text>
          <TouchableOpacity style={[styles.completeAnalysisButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.completeAnalysisButtonText, { color: colors.onPrimary }]}>Complete Full Analysis</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const OverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {analysisData?.holisticOverview ? (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>💫 Relationship Overview</Text>
            <Text style={[styles.overviewText, { color: colors.onSurface }]}>{analysisData.holisticOverview.overview}</Text>
          </View>

          {analysisData.holisticOverview.topStrengths && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>✨ Top Strengths</Text>
              {analysisData.holisticOverview.topStrengths.map((strength, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.listItemTitle, { color: colors.primary }]}>{strength.name}</Text>
                  <Text style={[styles.listItemText, { color: colors.onSurfaceVariant }]}>{strength.description}</Text>
                </View>
              ))}
            </View>
          )}

          {analysisData.holisticOverview.keyChallenges && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>⚠️ Key Challenges</Text>
              {analysisData.holisticOverview.keyChallenges.map((challenge, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.listItemTitle, { color: colors.primary }]}>{challenge.name}</Text>
                  <Text style={[styles.listItemText, { color: colors.onSurfaceVariant }]}>{challenge.description}</Text>
                </View>
              ))}
            </View>
          )}

          {analysisData.tensionFlowAnalysis && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>⚖️ Relationship Dynamics</Text>
              
              <View style={styles.dynamicsGrid}>
                <View style={styles.dynamicCard}>
                  <Text style={styles.dynamicIcon}>🌿</Text>
                  <Text style={[styles.dynamicLabel, { color: colors.onSurfaceVariant }]}>Support Level</Text>
                  <Text style={[styles.dynamicValue, { color: colors.onSurface }]}>
                    {getSupportLevel(analysisData.tensionFlowAnalysis.supportDensity)}
                  </Text>
                </View>
                
                <View style={styles.dynamicCard}>
                  <Text style={styles.dynamicIcon}>🔥</Text>
                  <Text style={[styles.dynamicLabel, { color: colors.onSurfaceVariant }]}>Tension Level</Text>
                  <Text style={[styles.dynamicValue, { color: colors.onSurface }]}>
                    {getTensionLevel(analysisData.tensionFlowAnalysis.challengeDensity)}
                  </Text>
                </View>
                
                <View style={styles.dynamicCard}>
                  <Text style={styles.dynamicIcon}>⚖️</Text>
                  <Text style={[styles.dynamicLabel, { color: colors.onSurfaceVariant }]}>Balance</Text>
                  <Text style={[styles.dynamicValue, { color: colors.onSurface }]}>
                    {getBalanceDescription(analysisData.tensionFlowAnalysis.polarityRatio)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={[styles.missingDataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.missingDataIcon}>💫</Text>
          <Text style={[styles.missingDataTitle, { color: colors.primary }]}>Relationship Overview</Text>
          <Text style={[styles.missingDataText, { color: colors.onSurfaceVariant }]}>
            Complete your full analysis to unlock detailed relationship insights and dynamic analysis.
          </Text>
          <TouchableOpacity style={[styles.completeAnalysisButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.completeAnalysisButtonText, { color: colors.onPrimary }]}>Complete Full Analysis</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

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
          <View style={[styles.missingDataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.missingDataIcon}>🔍</Text>
            <Text style={[styles.missingDataTitle, { color: colors.primary }]}>Detailed Analysis</Text>
            <Text style={[styles.missingDataText, { color: colors.onSurfaceVariant }]}>
              Complete your full analysis to unlock detailed category insights across all 7 compatibility areas.
            </Text>
            <TouchableOpacity style={[styles.completeAnalysisButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.completeAnalysisButtonText, { color: colors.onPrimary }]}>Complete Full Analysis</Text>
            </TouchableOpacity>
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
    if (density >= 2.5) return 'Very High';
    if (density >= 1.5) return 'High';
    if (density >= 0.8) return 'Moderate';
    if (density >= 0.3) return 'Low';
    return 'Very Low';
  };

  const getTensionLevel = (density: number): string => {
    if (density >= 1.5) return 'Very High';
    if (density >= 1.0) return 'High';
    if (density >= 0.5) return 'Moderate';
    if (density >= 0.1) return 'Low';
    return 'Very Low';
  };

  const getBalanceDescription = (ratio: number): string => {
    if (ratio >= 5) return 'Highly Supportive';
    if (ratio >= 2) return 'More Supportive';
    if (ratio >= 1) return 'Balanced';
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
  profileBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileItem: {
    alignItems: 'center',
  },
  profileLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileDivider: {
    fontSize: 20,
    marginHorizontal: 20,
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
});

export default RelationshipAnalysisScreen;