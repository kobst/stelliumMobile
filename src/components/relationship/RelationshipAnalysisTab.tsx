import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../theme';
import { ClusterScoring, ClusterAnalysis, ClusterScoredItem, RelationshipAnalysisResponse } from '../../api/relationships';
import { RelationshipsStackParamList } from '../../navigation/RelationshipsStack';
import CompleteRelationshipAnalysisButton from './CompleteRelationshipAnalysisButton';
import RelationshipTensionFlow from '../relationships/RelationshipTensionFlow';
import CategoryHighlights from './CategoryHighlights';
import { AnalysisLoadingView } from '../ui/AnalysisLoadingView';
import { useRelationshipWorkflow } from '../../hooks/useRelationshipWorkflow';

type NavigationProp = StackNavigationProp<RelationshipsStackParamList, 'RelationshipAnalysis'>;

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
  const navigation = useNavigation<NavigationProp>();

  // Get workflow state for this relationship (match birth chart pattern)
  const {
    workflowStatus,
    isWorkflowRunning,
    isStartingAnalysis,
    isPolling
  } = useRelationshipWorkflow(relationshipId);

  // Check multiple states for analysis in progress
  const isAnalysisInProgress = isWorkflowRunning || isStartingAnalysis || isPolling;

  console.log('🔴 RelationshipAnalysisTab - isAnalysisInProgress:', isAnalysisInProgress, 'workflowStatus:', workflowStatus?.status, 'isWorkflowRunning:', isWorkflowRunning);


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
  const clusterScoring: ClusterScoring | null = clusterData ? {
    clusters: (clusterData as any).clusters || clusterData,
    overall: overallData,
    scoredItems: (clusterData as any).scoredItems || [],
  } as ClusterScoring : null;

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

  // Show loading state when analysis is in progress (match birth chart pattern)
  if (isAnalysisInProgress) {
    return (
      <AnalysisLoadingView
        isAnalysisInProgress={isAnalysisInProgress}
        workflowState={workflowStatus}
        analysisType="relationship"
      />
    );
  }

  const handleCategoryPress = (clusterName: string) => {
    const clusterData = (clusterScoring!.clusters as any)[clusterName];
    const analysis = (completeAnalysis as any)![clusterName];
    const info = (clusterInfo as any)[clusterName];

    if (!clusterData || !analysis || !info) {
      console.warn('Missing data for cluster:', clusterName);
      return;
    }

    navigation.navigate('CategoryDetail', {
      categoryName: info.name,
      categoryData: clusterData,
      analysisData: analysis,
      color: info.color,
      icon: info.icon,
      relationshipId,
      userAName: analysisData?.userA_name || 'User A',
      userBName: analysisData?.userB_name || 'User B',
      consolidatedItems: clusterScoring?.scoredItems || [],
    });
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
        <View style={[styles.completeBanner, { backgroundColor: colors.accentSecondary }]}>
          <Text style={[styles.completeBannerText, { color: colors.onAccent }]}>
            ✅ Complete Analysis Ready
          </Text>
        </View>

        {availableClusters.map((clusterName) => {
          const clusterData = (clusterScoring.clusters as any)[clusterName];
          const analysis = (completeAnalysis as any)![clusterName];
          const info = (clusterInfo as any)[clusterName];

          if (!clusterData || !analysis || !info) {return null;}

          return (
            <TouchableOpacity
              key={clusterName}
              style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleCategoryPress(clusterName)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryCardContent}>
                <View style={[styles.clusterColorBar, { backgroundColor: info.color }]} />
                <View style={styles.categoryTextContainer}>
                  <Text style={[styles.categoryTitle, { color: colors.onSurface }]}>{info.name}</Text>
                  <Text style={[styles.categorySubtitle, { color: colors.onSurfaceVariant }]}>
                    {clusterData.quadrant} • {Math.round(clusterData.score)}%
                  </Text>
                </View>
                <Text style={[styles.chevronIcon, { color: colors.onSurfaceVariant }]}>›</Text>
              </View>
            </TouchableOpacity>
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
  categoryCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  clusterColorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  categorySubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chevronIcon: {
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 8,
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
});

export default RelationshipAnalysisTab;
