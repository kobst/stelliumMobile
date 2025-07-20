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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Synastry Chart A</Text>
              <Text style={styles.sectionSubtitle}>
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
                  <Text style={styles.placeholderText}>Loading Chart Data...</Text>
                  <Text style={styles.placeholderSubtext}>
                    {!userAData && `Fetching ${relationship.userA_name}'s birth chart...`}
                    {!userBData && `Fetching ${relationship.userB_name}'s birth chart...`}
                  </Text>
                </View>
              )}
            </View>

            {/* Synastry Chart B */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Synastry Chart B</Text>
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
                  <Text style={styles.placeholderText}>Loading Chart Data...</Text>
                  <Text style={styles.placeholderSubtext}>
                    {!userAData && `Fetching ${relationship.userA_name}'s birth chart...`}
                    {!userBData && `Fetching ${relationship.userB_name}'s birth chart...`}
                  </Text>
                </View>
              )}
            </View>

            {/* Composite Chart */}
            {(chartData as any).compositeChart && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🌟 Composite Chart</Text>
                <Text style={styles.sectionSubtitle}>
                  Midpoint chart representing your combined energies
                </Text>
                <CompositeChartTables compositeChart={(chartData as any).compositeChart} />
              </View>
            )}

            {/* Synastry Aspects */}
            {(chartData as any).synastryAspects && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔗 Synastry Aspects</Text>
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
              <Text style={styles.sectionTitle}>📊 Synastry Charts</Text>
              <Text style={styles.sectionSubtitle}>
                Birth chart comparisons with planetary overlays
              </Text>
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Synastry Charts</Text>
                <Text style={styles.placeholderSubtext}>Chart data not available in analysis response</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌟 Composite Chart</Text>
              <Text style={styles.sectionSubtitle}>
                Midpoint chart representing your combined energies
              </Text>
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Composite Chart</Text>
                <Text style={styles.placeholderSubtext}>Chart data not available in analysis response</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔗 Synastry Aspects</Text>
              <Text style={styles.sectionSubtitle}>
                Planetary connections between your charts
              </Text>
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Synastry Aspects Table</Text>
                <Text style={styles.placeholderSubtext}>Aspect data not available in analysis response</Text>
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
          <View style={styles.profileBanner}>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Tier:</Text>
              <Text style={styles.profileValue}>
                {analysisData.profileAnalysis.profileResult.tier}
              </Text>
            </View>
            <Text style={styles.profileDivider}>|</Text>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Profile:</Text>
              <Text style={styles.profileValue}>
                {analysisData.profileAnalysis.profileResult.profile}
              </Text>
            </View>
          </View>

          {/* Radar Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💕 Compatibility Scores</Text>
            <RadarChart 
              data={analysisData.profileAnalysis.profileResult.clusterScores}
              size={300}
            />
          </View>

          {/* Cluster Analysis Sections */}
          {analysisData.clusterAnalysis && Object.entries(analysisData.clusterAnalysis).map(([cluster, data]) => (
            <View key={cluster} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {getClusterIcon(cluster)} {cluster} Analysis
              </Text>
              <Text style={styles.clusterAnalysisText}>
                {data.analysis}
              </Text>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.missingDataCard}>
          <Text style={styles.missingDataIcon}>📊</Text>
          <Text style={styles.missingDataTitle}>Compatibility Scores</Text>
          <Text style={styles.missingDataText}>
            Complete your full analysis to unlock detailed compatibility scores and radar chart visualization.
          </Text>
          <TouchableOpacity style={styles.completeAnalysisButton}>
            <Text style={styles.completeAnalysisButtonText}>Complete Full Analysis</Text>
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
            <Text style={styles.sectionTitle}>💫 Relationship Overview</Text>
            <Text style={styles.overviewText}>{analysisData.holisticOverview.overview}</Text>
          </View>

          {analysisData.holisticOverview.topStrengths && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ Top Strengths</Text>
              {analysisData.holisticOverview.topStrengths.map((strength, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{strength.name}</Text>
                  <Text style={styles.listItemText}>{strength.description}</Text>
                </View>
              ))}
            </View>
          )}

          {analysisData.holisticOverview.keyChallenges && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ Key Challenges</Text>
              {analysisData.holisticOverview.keyChallenges.map((challenge, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{challenge.name}</Text>
                  <Text style={styles.listItemText}>{challenge.description}</Text>
                </View>
              ))}
            </View>
          )}

          {analysisData.tensionFlowAnalysis && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚖️ Relationship Dynamics</Text>
              
              <View style={styles.dynamicsGrid}>
                <View style={styles.dynamicCard}>
                  <Text style={styles.dynamicIcon}>🌿</Text>
                  <Text style={styles.dynamicLabel}>Support Level</Text>
                  <Text style={styles.dynamicValue}>
                    {getSupportLevel(analysisData.tensionFlowAnalysis.supportDensity)}
                  </Text>
                </View>
                
                <View style={styles.dynamicCard}>
                  <Text style={styles.dynamicIcon}>🔥</Text>
                  <Text style={styles.dynamicLabel}>Tension Level</Text>
                  <Text style={styles.dynamicValue}>
                    {getTensionLevel(analysisData.tensionFlowAnalysis.challengeDensity)}
                  </Text>
                </View>
                
                <View style={styles.dynamicCard}>
                  <Text style={styles.dynamicIcon}>⚖️</Text>
                  <Text style={styles.dynamicLabel}>Balance</Text>
                  <Text style={styles.dynamicValue}>
                    {getBalanceDescription(analysisData.tensionFlowAnalysis.polarityRatio)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.missingDataCard}>
          <Text style={styles.missingDataIcon}>💫</Text>
          <Text style={styles.missingDataTitle}>Relationship Overview</Text>
          <Text style={styles.missingDataText}>
            Complete your full analysis to unlock detailed relationship insights and dynamic analysis.
          </Text>
          <TouchableOpacity style={styles.completeAnalysisButton}>
            <Text style={styles.completeAnalysisButtonText}>Complete Full Analysis</Text>
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
            <View style={styles.analysisTabContainer}>
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
                      activeAnalysisTab === category && styles.activeAnalysisTab,
                    ]}
                    onPress={() => setActiveAnalysisTab(category)}
                  >
                    <Text style={styles.analysisTabIcon}>
                      {categoryInfo[category]?.icon || '📊'}
                    </Text>
                    <Text style={[
                      styles.analysisTabText,
                      activeAnalysisTab === category && styles.activeAnalysisTabText,
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
                    <Text style={styles.sectionTitle}>
                      {categoryInfo[activeAnalysisTab]?.icon || '📊'} {categoryInfo[activeAnalysisTab]?.name || activeAnalysisTab}
                    </Text>
                    {analysisData?.scoreAnalysis?.[activeAnalysisTab]?.scoredItems && (
                      <View style={styles.relevantPositionCard}>
                        <Text style={styles.relevantPositionTitle}>🎯 Most Significant Factors</Text>
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
                      <Text style={styles.sectionTitle}>🔗 Synastry Analysis</Text>
                      <Text style={styles.analysisText}>
                        {currentCategoryData.panels.synastry}
                      </Text>
                    </View>
                  )}

                  {currentCategoryData.panels.composite && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>🌟 Composite Analysis</Text>
                      <Text style={styles.analysisText}>
                        {currentCategoryData.panels.composite}
                      </Text>
                    </View>
                  )}

                  {currentCategoryData.panels.fullAnalysis && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>🔍 Full Analysis</Text>
                      <Text style={styles.analysisText}>
                        {currentCategoryData.panels.fullAnalysis}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.missingDataCard}>
                  <Text style={styles.missingDataIcon}>📊</Text>
                  <Text style={styles.missingDataTitle}>Analysis Loading</Text>
                  <Text style={styles.missingDataText}>
                    Analysis data for this category is being prepared.
                  </Text>
                </View>
              )}
            </ScrollView>
          </>
        ) : (
          <View style={styles.missingDataCard}>
            <Text style={styles.missingDataIcon}>🔍</Text>
            <Text style={styles.missingDataTitle}>Detailed Analysis</Text>
            <Text style={styles.missingDataText}>
              Complete your full analysis to unlock detailed category insights across all 7 compatibility areas.
            </Text>
            <TouchableOpacity style={styles.completeAnalysisButton}>
              <Text style={styles.completeAnalysisButtonText}>Complete Full Analysis</Text>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading relationship analysis...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.relationshipInfo}>
          <Text style={styles.relationshipTitle}>Relationship Analysis</Text>
          <Text style={styles.partnerNames}>
            {relationship.userA_name} & {relationship.userB_name}
          </Text>
          <Text style={styles.createdDate}>
            Created {relationship.createdAt ? new Date(relationship.createdAt).toLocaleDateString() : 'Invalid Date'}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
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
                activeTab === tab.id && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAnalysisData}>
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
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 32,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '500',
  },
  relationshipInfo: {
    alignItems: 'center',
  },
  relationshipTitle: {
    color: '#8b5cf6',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  partnerNames: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  createdDate: {
    color: '#94a3b8',
    fontSize: 14,
  },
  tabContainer: {
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    borderBottomColor: '#8b5cf6',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8b5cf6',
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
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#8b5cf6',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  placeholder: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  placeholderSubtext: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  profileBanner: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  profileValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileDivider: {
    color: '#334155',
    fontSize: 20,
    marginHorizontal: 20,
  },
  clusterAnalysisText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  overviewText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
  },
  listItem: {
    marginBottom: 12,
  },
  listItemTitle: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  dynamicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dynamicCard: {
    backgroundColor: '#0f172a',
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
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  dynamicValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  missingDataCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 24,
    alignItems: 'center',
    margin: 16,
  },
  missingDataIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  missingDataTitle: {
    color: '#8b5cf6',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  missingDataText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  completeAnalysisButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeAnalysisButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#1e293b',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#ef4444',
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
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    borderBottomColor: '#8b5cf6',
  },
  analysisTabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  analysisTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeAnalysisTabText: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  analysisCategoryContent: {
    flex: 1,
    padding: 16,
  },
  relevantPositionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  relevantPositionTitle: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  analysisText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 24,
  },
});

export default RelationshipAnalysisScreen;