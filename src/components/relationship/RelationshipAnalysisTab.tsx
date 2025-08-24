import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { ClusterScoring, ClusterAnalysis, ClusterScoredItem, RelationshipAnalysisResponse } from '../../api/relationships';
import CompleteRelationshipAnalysisButton from './CompleteRelationshipAnalysisButton';
import RelationshipTensionFlow from '../relationships/RelationshipTensionFlow';
import CategoryHighlights from './CategoryHighlights';

interface RelationshipAnalysisTabProps {
  analysisData: RelationshipAnalysisResponse | null;
  relationshipId: string;
  onAnalysisComplete: (analysisData?: any) => void;
  loading?: boolean;
  onChatAboutItem?: (item: ClusterScoredItem) => void;
}

const RelationshipAnalysisTab: React.FC<RelationshipAnalysisTabProps> = ({
  analysisData,
  relationshipId,
  onAnalysisComplete,
  loading = false,
  onChatAboutItem,
}) => {
  const { colors } = useTheme();
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());

  const clusterInfo: { [key: string]: { icon: string; name: string; color: string } } = {
    'Harmony': { icon: '🎵', name: 'Harmony & Balance', color: '#4CAF50' },
    'Passion': { icon: '🔥', name: 'Passion & Chemistry', color: '#F44336' },
    'Connection': { icon: '🧠', name: 'Mental Connection', color: '#2196F3' },
    'Stability': { icon: '🏛️', name: 'Stability & Security', color: '#9C27B0' },
    'Growth': { icon: '🌱', name: 'Growth & Evolution', color: '#FF9800' },
  };

  // Extract data from analysisData (handle both new unified structure and legacy structure)
  const clusterData = analysisData?.clusterAnalysis || analysisData?.clusterScoring;
  const overallData = analysisData?.overall || analysisData?.clusterScoring?.overall;
  const completeAnalysis = analysisData?.completeAnalysis || null;
  const isFullAnalysisComplete = !!(completeAnalysis && Object.keys(completeAnalysis).length > 0);
  const availableClusters = completeAnalysis ? Object.keys(completeAnalysis) : [];

  // Create unified cluster scoring for backward compatibility
  const clusterScoring = clusterData ? {
    clusters: clusterData.clusters || clusterData,
    overall: overallData,
    scoredItems: clusterData.scoredItems || [],
  } : null;

  // Show loading state while fetching analysis data
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          Loading cluster analysis...
        </Text>
      </View>
    );
  }

  const toggleCluster = (cluster: string) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(cluster)) {
      newExpanded.delete(cluster);
    } else {
      newExpanded.add(cluster);
    }
    setExpandedClusters(newExpanded);
  };

  // Progressive Disclosure: Show different views based on analysis completion state
  if (!clusterScoring) {
    return (
      <ScrollView style={[styles.analysisContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.analysisContent}>
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.previewTitle, { color: colors.onSurface }]}>🎯 360° Analysis</Text>
            <Text style={[styles.previewSubtitle, { color: colors.onSurfaceVariant }]}>
              Generate detailed insights for each compatibility dimension.
            </Text>

            <CompleteRelationshipAnalysisButton
              compositeChartId={relationshipId}
              onAnalysisComplete={onAnalysisComplete}
              hasAnalysisData={false}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!isFullAnalysisComplete) {
    return (
      <ScrollView style={[styles.analysisContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.analysisContent}>
          {/* Basic Cluster Preview */}
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.previewTitle, { color: colors.onSurface }]}>🎯 360° Analysis</Text>
            <Text style={[styles.previewSubtitle, { color: colors.onSurfaceVariant }]}>
              Generate detailed insights for each compatibility dimension.
            </Text>

            <CompleteRelationshipAnalysisButton
              compositeChartId={relationshipId}
              onAnalysisComplete={onAnalysisComplete}
              hasAnalysisData={isFullAnalysisComplete}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.analysisContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.analysisContent}>
        {/* Full Analysis Available */}
        <View style={[styles.completeBanner, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.completeBannerText, { color: colors.onPrimaryContainer }]}>
            ✅ Complete Analysis Ready
          </Text>
        </View>

        {availableClusters.map((clusterName) => {
          const clusterData = clusterScoring.clusters[clusterName];
          const analysis = completeAnalysis![clusterName];
          const info = clusterInfo[clusterName];
          const isExpanded = expandedClusters.has(clusterName);


          if (!clusterData || !analysis || !info) {return null;}

          return (
            <View key={clusterName} style={[styles.analysisCluster, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.clusterHeader}
                onPress={() => toggleCluster(clusterName)}
              >
                <View style={styles.clusterHeaderLeft}>
                  <View style={[styles.clusterColorBar, { backgroundColor: info.color }]} />
                  <Text style={styles.clusterIcon}>{info.icon}</Text>
                  <View style={styles.clusterTitleContainer}>
                    <Text style={[styles.clusterTitle, { color: colors.onSurface }]}>{info.name}</Text>
                    <Text style={[styles.clusterQuadrant, { color: colors.onSurfaceVariant }]}>
                      {clusterData.quadrant} • {Math.round(clusterData.score)}%
                    </Text>
                  </View>
                </View>
                <Text style={[styles.expandIcon, { color: colors.primary }]}>
                  {isExpanded ? '−' : '+'}
                </Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.clusterContent, { borderTopColor: colors.border }]}>
                  {/* Cluster Metrics */}
                  <View style={[styles.metricsSection, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.metricsTitle, { color: colors.onSurface }]}>📊 Cluster Metrics</Text>
                    <View style={styles.metricsGrid}>
                      <View style={styles.metricRow}>
                        <View style={styles.metricItem}>
                          <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Support</Text>
                          <Text style={[styles.metricValue, { color: colors.primary }]}>
                            {Math.round(clusterData.supportPct)}%
                          </Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Challenge</Text>
                          <Text style={[styles.metricValue, { color: colors.error }]}>
                            {Math.round(clusterData.challengePct)}%
                          </Text>
                        </View>
                      </View>
                      <View style={styles.metricRow}>
                        <View style={styles.metricItem}>
                          <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Heat</Text>
                          <Text style={[styles.metricValue, { color: colors.secondary }]}>
                            {Math.round(clusterData.heatPct)}%
                          </Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Activity</Text>
                          <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                            {Math.round(clusterData.activityPct)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Analysis Panels - Handle nested structure */}
                  <View style={styles.panelsSection}>
                    {/* Synastry Analysis - Extract from nested object */}
                    {analysis.synastry && (
                      <>
                        {analysis.synastry.supportPanel && (
                          <View style={[styles.analysisPanel, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.panelTitle, { color: info.color }]}>🔗 Synastry Support</Text>
                            <Text style={[styles.analysisText, { color: colors.onSurface }]}>
                              {analysis.synastry.supportPanel}
                            </Text>
                          </View>
                        )}
                        {analysis.synastry.challengePanel && (
                          <View style={[styles.analysisPanel, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.panelTitle, { color: info.color }]}>🔗 Synastry Growth</Text>
                            <Text style={[styles.analysisText, { color: colors.onSurface }]}>
                              {analysis.synastry.challengePanel}
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* Composite Analysis - Extract from nested object */}
                    {analysis.composite && (
                      <>
                        {analysis.composite.supportPanel && (
                          <View style={[styles.analysisPanel, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.panelTitle, { color: info.color }]}>🌟 Composite Support</Text>
                            <Text style={[styles.analysisText, { color: colors.onSurface }]}>
                              {analysis.composite.supportPanel}
                            </Text>
                          </View>
                        )}
                        {analysis.composite.challengePanel && (
                          <View style={[styles.analysisPanel, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.panelTitle, { color: info.color }]}>🌟 Composite Growth</Text>
                            <Text style={[styles.analysisText, { color: colors.onSurface }]}>
                              {analysis.composite.challengePanel}
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* Synthesis Analysis - Use synthesisPanel from either synastry or composite */}
                    {(analysis.synastry?.synthesisPanel || analysis.composite?.synthesisPanel) && (
                      <View style={styles.analysisPanelLast}>
                        <Text style={[styles.panelTitle, { color: info.color }]}>✨ Synthesis & Integration</Text>
                        <Text style={[styles.analysisText, { color: colors.onSurface }]}>
                          {analysis.synastry?.synthesisPanel || analysis.composite?.synthesisPanel}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  analysisContainer: {
    flex: 1,
  },
  analysisContent: {
    padding: 16,
  },
  previewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  previewSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  clusterPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    justifyContent: 'center',
  },
  clusterPreviewItem: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  clusterPreviewIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  clusterPreviewName: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  clusterPreviewScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  startAnalysisButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  startAnalysisButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  analysisNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  completeBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  completeBannerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  analysisCluster: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  clusterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clusterColorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  clusterIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  clusterTitleContainer: {
    flex: 1,
  },
  clusterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clusterQuadrant: {
    fontSize: 12,
    marginTop: 2,
  },
  missingDataContainer: {
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
  },
  expandIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clusterContent: {
    borderTopWidth: 1,
    borderTopColor: 'inherit',
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
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
  analysisPanelLast: {
    // No border bottom for last panel
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  // Metrics table styles
  metricsSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  metricsGrid: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Daily Dynamics section (placed after metrics)
  interpretationSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  partnersGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  partnerPanel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  partnerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  partnerText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default RelationshipAnalysisTab;
