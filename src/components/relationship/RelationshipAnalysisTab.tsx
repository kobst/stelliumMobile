import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { RelationshipAnalysisResponse } from '../../api/relationships';
import CompleteRelationshipAnalysisButton from './CompleteRelationshipAnalysisButton';
import RelationshipTensionFlow from '../relationships/RelationshipTensionFlow';

interface RelationshipAnalysisTabProps {
  analysisData: RelationshipAnalysisResponse | null;
  relationshipId: string;
  onAnalysisComplete: (analysisData?: any) => void;
  loading?: boolean;
}

const RelationshipAnalysisTab: React.FC<RelationshipAnalysisTabProps> = ({
  analysisData,
  relationshipId,
  onAnalysisComplete,
  loading = false,
}) => {
  const { colors } = useTheme();
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

  // Show loading state while fetching analysis data
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          Loading relationship analysis...
        </Text>
      </View>
    );
  }
  
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
            const categoryData = analysisData.analysis![category];
            const info = categoryInfo[category];
            const isExpanded = expandedCategories.has(category);

            return (
              <View key={category} style={[styles.analysisCategory, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category)}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <Text style={styles.categoryIcon}>{info?.icon || '📊'}</Text>
                    <Text style={[styles.categoryTitle, { color: colors.onSurface }]}>{info?.name || category}</Text>
                  </View>
                  <Text style={[styles.expandIcon, { color: colors.primary }]}>
                    {isExpanded ? '−' : '+'}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.categoryContent, { borderTopColor: colors.border }]}>
                    {/* Overall Score */}
                    {categoryData.overallScore !== undefined && (
                      <View style={[styles.scoreSection, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.scoreLabel, { color: colors.onSurfaceVariant }]}>Overall Score</Text>
                        <Text style={[styles.scoreValue, { color: colors.primary }]}>
                          {Math.round(categoryData.overallScore)}%
                        </Text>
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
            compositeChartId={relationshipId}
            onAnalysisComplete={onAnalysisComplete}
            hasAnalysisData={!!(analysisData?.analysis && analysisCategories.length > 0)}
          />
        </View>
      )}
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
  analysisCategory: {
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
  categoryHeaderLeft: {
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
});

export default RelationshipAnalysisTab;