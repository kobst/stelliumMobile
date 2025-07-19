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
      
      // Fetch analysis data and user birth charts in parallel
      const promises: Promise<any>[] = [
        relationshipsApi.fetchRelationshipAnalysis(relationship._id)
      ];
      
      // Only fetch user data if we have user IDs
      if (relationship.userA_id) {
        promises.push(usersApi.getUser(relationship.userA_id));
      }
      if (relationship.userB_id) {
        promises.push(usersApi.getUser(relationship.userB_id));
      }
      
      const results = await Promise.all(promises);
      setAnalysisData(results[0]);
      
      if (relationship.userA_id && results[1]) {
        setUserAData(results[1]);
      }
      if (relationship.userB_id && results[2]) {
        setUserBData(results[2]);
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

          {/* Radar Chart Placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💕 Compatibility Scores</Text>
            <View style={styles.radarPlaceholder}>
              <Text style={styles.placeholderText}>Radar Chart</Text>
              <Text style={styles.placeholderSubtext}>5-axis compatibility visualization</Text>
              
              {/* Show cluster scores */}
              <View style={styles.scoresGrid}>
                {Object.entries(analysisData.profileAnalysis.profileResult.clusterScores).map(([cluster, score]) => (
                  <View key={cluster} style={styles.scoreCard}>
                    <Text style={styles.scoreIcon}>{getClusterIcon(cluster)}</Text>
                    <Text style={styles.scoreLabel}>{cluster}</Text>
                    <Text style={styles.scoreValue}>{score}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
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

  const AnalysisTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {analysisData?.categoryAnalysis ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Detailed Analysis</Text>
          <Text style={styles.sectionSubtitle}>
            Coming soon: 7 category detailed analysis with sub-tabs
          </Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Category Analysis</Text>
            <Text style={styles.placeholderSubtext}>Sub-tab navigation for detailed insights</Text>
          </View>
        </View>
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
    </ScrollView>
  );

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
            Created {new Date(relationship.createdAt).toLocaleDateString()}
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
  radarPlaceholder: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  scoreCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  scoreIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  scoreValue: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: 'bold',
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
});

export default RelationshipAnalysisScreen;