import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useChart } from '../../hooks/useChart';
import { useStore } from '../../store';
import CompleteFullAnalysisButton from './CompleteFullAnalysisButton';
import { AnalysisLoadingView } from '../ui/AnalysisLoadingView';
import { useTheme } from '../../theme';
import { decodeAstroCode } from '../../utils/astroCode';
import { getAspectColor, getPlanetGlyph, getZodiacGlyph, PLANET_COLORS } from './ChartUtils';

interface AnalysisTabProps {
  userId?: string;
}

// New category labels/icons from Broad Category API
const CATEGORIES: Record<string, { label: string; icon: string; isCore?: boolean }> = {
  IDENTITY: { label: 'Self-Expression and Identity', icon: '🌟', isCore: true },
  EMOTIONAL_FOUNDATIONS: { label: 'Emotional Foundations and Home Life', icon: '🏠', isCore: true },
  PARTNERSHIPS: { label: 'Relationships and Social Connections', icon: '💕', isCore: true },
  CAREER: { label: 'Career & Public Image', icon: '🎯', isCore: true },
  COMMUNICATION: { label: 'Communication, Learning, and Beliefs', icon: '💭' },
  HEALTH_SERVICE: { label: 'Health & Service', icon: '🩺' },
  FINANCES: { label: 'Finances & Resources', icon: '💰' },
  TRANSFORMATION: { label: 'Transformation & Power', icon: '🔥' },
  COMMUNITY: { label: 'Community & Networks', icon: '👥' },
  SPIRITUAL: { label: 'Spirituality & Growth', icon: '🔮' },
};

const CORE_CATEGORY_ORDER = ['IDENTITY', 'EMOTIONAL_FOUNDATIONS', 'PARTNERSHIPS', 'CAREER'];
const OPTIONAL_CATEGORY_ORDER = ['COMMUNICATION', 'HEALTH_SERVICE', 'FINANCES', 'TRANSFORMATION', 'COMMUNITY', 'SPIRITUAL'];

interface TopicSectionProps {
  topicKey: string;
  topicData: any;
  expanded: boolean;
  onToggle: () => void;
  colors: any;
}

const TopicSection: React.FC<TopicSectionProps> = ({
  topicKey,
  topicData,
  expanded,
  onToggle,
  colors,
}) => {
  // Try new category config first, fallback to legacy mapping if any
  const categoryConfig = CATEGORIES[topicKey as keyof typeof CATEGORIES] as any;
  const topicConfig: any = categoryConfig || undefined;
  if (!topicData) { return null; }

  return (
    <View style={[styles.topicSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.topicHeader} onPress={onToggle}>
        <View style={styles.topicHeaderContent}>
          <Text style={styles.topicIcon}>{(topicConfig && topicConfig.icon) || '✨'}</Text>
          <Text style={[styles.topicTitle, { color: colors.onSurface }]}>{topicData.categoryName || topicData.label || (topicConfig && topicConfig.label) || topicKey}</Text>
        </View>
        <Text style={[styles.expandIcon, { color: colors.primary }]}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.topicContent, { borderTopColor: colors.border }]}>
          {/* Category overview */}
          {topicData.overview && (
            <View style={[styles.tensionFlowSection, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
              <Text style={[styles.tensionFlowTitle, { color: colors.primary }]}>Overview</Text>
              <Text style={[styles.tensionFlowDescription, { color: colors.onSurface }]}>
                {topicData.overview}
              </Text>
            </View>
          )}
          {/* Tension Flow Analysis if available */}
          {(() => {
            const tension = topicData.tensionFlowAnalysis || topicData.tensionFlow;
            if (!tension) { return null; }

            const supportPct = typeof tension.weightedSupportDensity === 'number'
              ? Math.round(tension.weightedSupportDensity * 100)
              : (typeof tension.supportDensity === 'number' ? Math.round(tension.supportDensity * 100) : null);
            const challengePct = typeof tension.weightedChallengeDensity === 'number'
              ? Math.round(tension.weightedChallengeDensity * 100)
              : (typeof tension.challengeDensity === 'number' ? Math.round(tension.challengeDensity * 100) : null);

            return (
              <View style={[styles.tensionFlowSection, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
                <Text style={[styles.tensionFlowTitle, { color: colors.primary }]}>⚡ Energy Pattern</Text>
                {(tension.llmAnalysis || tension.description) && (
                  <Text style={[styles.tensionFlowDescription, { color: colors.onSurface }]}>
                    {tension.llmAnalysis || tension.description}
                  </Text>
                )}

                <View style={styles.tensionMetrics}>
                  <View style={styles.metric}>
                    <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Support</Text>
                    <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                      {supportPct !== null ? `${supportPct}%` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Challenge</Text>
                    <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                      {challengePct !== null ? `${challengePct}%` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Quadrant</Text>
                    <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                      {tension.quadrant || 'N/A'}
                    </Text>
                  </View>
                </View>

                {(tension.totalAspects || tension.supportAspects || tension.challengeAspects) && (
                  <View style={[styles.tensionCountsRow]}>
                    {typeof tension.totalAspects === 'number' && (
                      <Text style={[styles.countPill, { color: colors.onSurface, borderColor: colors.border }]}>Total: {tension.totalAspects}</Text>
                    )}
                    {typeof tension.supportAspects === 'number' && (
                      <Text style={[styles.countPill, { color: colors.onSurface, borderColor: colors.border }]}>Support: {tension.supportAspects}</Text>
                    )}
                    {typeof tension.challengeAspects === 'number' && (
                      <Text style={[styles.countPill, { color: colors.onSurface, borderColor: colors.border }]}>Challenge: {tension.challengeAspects}</Text>
                    )}
                  </View>
                )}

                {Array.isArray(tension.keystoneAspects) && tension.keystoneAspects.length > 0 && (
                  <View style={styles.keystoneSection}>
                    <Text style={[styles.keystoneTitle, { color: colors.onSurfaceVariant }]}>Key Aspects</Text>
                    <View>
                      {tension.keystoneAspects.slice(0, 6).map((code: any, idx: number) => {
                        const decoded = typeof code === 'string' ? decodeAstroCode(code) : null;
                        if (decoded && decoded.type === 'aspect') {
                          const a = decoded;
                          return (
                            <View key={`${code || idx}`} style={styles.aspectRow}>
                              <View style={styles.aspectPlanets}>
                                <Text style={[styles.planetSymbolSmall, { color: PLANET_COLORS[a.p1.planet] || colors.onSurface }]}>
                                  {getPlanetGlyph(a.p1.planet as any)}
                                </Text>
                                <Text style={[styles.aspectSymbol, { color: getAspectColor(a.aspect as any) }]}>
                                  {a.aspect === 'conjunction' ? '☌' : a.aspect === 'opposition' ? '☍' : a.aspect === 'trine' ? '△' : a.aspect === 'square' ? '□' : a.aspect === 'sextile' ? '⚹' : a.aspect === 'quincunx' ? '⚻' : '◦'}
                                </Text>
                                <Text style={[styles.planetSymbolSmall, { color: PLANET_COLORS[a.p2.planet] || colors.onSurface }]}>
                                  {getPlanetGlyph(a.p2.planet as any)}
                                </Text>
                              </View>
                              <Text style={[styles.aspectDescription, { color: colors.onSurface }]}>
                                {a.orbTier} {a.aspect} between {a.p1.planet} and {a.p2.planet}
                              </Text>
                            </View>
                          );
                        }
                        if (decoded && decoded.type === 'placement') {
                          const p = decoded;
                          return (
                            <View key={`${code || idx}`} style={styles.placementRow}>
                              <View style={styles.placementSymbols}>
                                <Text style={[styles.planetSymbolSmall, { color: PLANET_COLORS[p.planet] || colors.onSurface }]}>
                                  {getPlanetGlyph(p.planet as any)}
                                </Text>
                                <Text style={[styles.signSymbol, { color: colors.primary }]}>
                                  {getZodiacGlyph(p.sign as any)}
                                </Text>
                              </View>
                              <Text style={[styles.placementDescription, { color: colors.onSurface }]}>
                                {p.planet} in {p.sign}
                              </Text>
                              <Text style={[styles.houseText, { color: colors.onSurfaceVariant }]}>
                                House {p.house}
                              </Text>
                            </View>
                          );
                        }
                        const label = (decoded && decoded.type === 'placement') ? decoded.pretty : (code?.description || String(code));
                        return (
                          <View key={`${code || idx}`} style={[styles.keyAspectPill, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
                            <Text style={[styles.keyAspectText, { color: colors.onSurface }]}>
                              {label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })()}

          {/* Subtopics */}
          <View style={styles.subtopicsSection}>
            <Text style={[styles.subtopicsTitle, { color: colors.primary }]}>Analysis Areas</Text>
            {(() => {
              const rawEdited = topicData.editedSubtopics || {};
              const rawLLM = topicData.subtopics || {};
              const names = Array.from(new Set([...Object.keys(rawEdited), ...Object.keys(rawLLM)]));
              return names.map((subtopicName: string) => {
                const edited = rawEdited[subtopicName];
                const llm = rawLLM[subtopicName];
                const content = typeof edited === 'string' ? edited : (typeof llm === 'object' ? llm?.analysis : '');
                const keyCodes: string[] = Array.isArray(llm?.keyAspects) ? llm.keyAspects : [];

                return (
                  <View key={subtopicName} style={[styles.subtopic, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.subtopicTitle, { color: colors.onSurface }]}>
                      {subtopicName}
                    </Text>
                    <Text style={[styles.subtopicContent, { color: colors.onSurface }]}>
                      {content || 'Analysis content not available'}
                    </Text>

                    {keyCodes.length > 0 && (
                      <View style={styles.keyAspectsSection}>
                        <Text style={[styles.keyAspectsTitle, { color: colors.onSurfaceVariant }]}>Key Aspects</Text>
                        <View>
                          {keyCodes.slice(0, 8).map((code, idx) => {
                            const decoded = decodeAstroCode(code);
                            if (decoded && decoded.type === 'aspect') {
                              const a = decoded;
                              return (
                                <View key={`${code}-${idx}`} style={styles.aspectRow}>
                                  <View style={styles.aspectPlanets}>
                                    <Text style={[styles.planetSymbolSmall, { color: PLANET_COLORS[a.p1.planet] || colors.onSurface }]}>
                                      {getPlanetGlyph(a.p1.planet as any)}
                                    </Text>
                                    <Text style={[styles.aspectSymbol, { color: getAspectColor(a.aspect as any) }]}>
                                      {a.aspect === 'conjunction' ? '☌' : a.aspect === 'opposition' ? '☍' : a.aspect === 'trine' ? '△' : a.aspect === 'square' ? '□' : a.aspect === 'sextile' ? '⚹' : a.aspect === 'quincunx' ? '⚻' : '◦'}
                                    </Text>
                                    <Text style={[styles.planetSymbolSmall, { color: PLANET_COLORS[a.p2.planet] || colors.onSurface }]}>
                                      {getPlanetGlyph(a.p2.planet as any)}
                                    </Text>
                                  </View>
                                  <Text style={[styles.aspectDescription, { color: colors.onSurface }]}>
                                    {a.orbTier} {a.aspect} between {a.p1.planet} and {a.p2.planet}
                                  </Text>
                                </View>
                              );
                            }
                            if (decoded && decoded.type === 'placement') {
                              const p = decoded;
                              return (
                                <View key={`${code}-${idx}`} style={styles.placementRow}>
                                  <View style={styles.placementSymbols}>
                                    <Text style={[styles.planetSymbolSmall, { color: PLANET_COLORS[p.planet] || colors.onSurface }]}>
                                      {getPlanetGlyph(p.planet as any)}
                                    </Text>
                                    <Text style={[styles.signSymbol, { color: colors.primary }]}>
                                      {getZodiacGlyph(p.sign as any)}
                                    </Text>
                                  </View>
                                  <Text style={[styles.placementDescription, { color: colors.onSurface }]}>
                                    {p.planet} in {p.sign}
                                  </Text>
                                  <Text style={[styles.houseText, { color: colors.onSurfaceVariant }]}>
                                    House {p.house}
                                  </Text>
                                </View>
                              );
                            }
                            const label = decoded?.pretty || code;
                            return (
                              <View key={`${code}-${idx}`} style={[styles.keyAspectPill, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                                <Text style={[styles.keyAspectText, { color: colors.onSurface }]}>{label}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                );
              });
            })()}
            {topicData.synthesis && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.subtopicsTitle, { color: colors.primary }]}>Synthesis</Text>
                <Text style={[styles.subtopicContent, { color: colors.onSurface }]}>
                  {topicData.synthesis}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const AnalysisTab: React.FC<AnalysisTabProps> = ({ userId }) => {
  const { fullAnalysis, loading, loadFullAnalysis, hasAnalysisData, isAnalysisInProgress, workflowState } = useChart(userId);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const { colors } = useTheme();

  // Don't automatically load analysis - let users trigger it with the button

  const toggleTopic = (topicKey: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicKey)) {
      newExpanded.delete(topicKey);
    } else {
      newExpanded.add(topicKey);
    }
    setExpandedTopics(newExpanded);
  };

  // Simple button container for missing analysis
  const renderAnalysisButton = () => (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.missingAnalysisContainer}>
          <CompleteFullAnalysisButton userId={userId} onAnalysisComplete={loadFullAnalysis} />
        </View>
      </View>
    </ScrollView>
  );

  // Show loading state when analysis is in progress
  if (isAnalysisInProgress) {
    return <AnalysisLoadingView isAnalysisInProgress={isAnalysisInProgress} workflowState={workflowState} />;
  }

  // Show button if no analysis data available
  if (!hasAnalysisData) {
    return renderAnalysisButton();
  }

  // Prefer new broadCategoryAnalyses if present
  const broad = fullAnalysis?.interpretation?.broadCategoryAnalyses;
  const sel = fullAnalysis?.interpretation?.selectionData;

  if (broad && Object.keys(broad).length > 0) {
    const presentKeys = Object.keys(broad);
    const orderedKeys = [
      ...CORE_CATEGORY_ORDER.filter(k => presentKeys.includes(k)),
      ...OPTIONAL_CATEGORY_ORDER.filter(k => presentKeys.includes(k)),
      ...presentKeys.filter(k => !CORE_CATEGORY_ORDER.includes(k) && !OPTIONAL_CATEGORY_ORDER.includes(k)),
    ];

    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {orderedKeys.map(categoryKey => (
            <View key={categoryKey}>
              <TopicSection
                topicKey={categoryKey}
                topicData={broad[categoryKey]}
                expanded={expandedTopics.has(categoryKey)}
                onToggle={() => toggleTopic(categoryKey)}
                colors={colors}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Legacy rendering path
  const subtopicAnalysis = fullAnalysis?.interpretation?.SubtopicAnalysis || {};
  const legacyKeys = Object.keys(subtopicAnalysis);
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {legacyKeys.map(topicKey => (
          <TopicSection
            key={topicKey}
            topicKey={topicKey}
            topicData={subtopicAnalysis[topicKey]}
            expanded={expandedTopics.has(topicKey)}
            onToggle={() => toggleTopic(topicKey)}
            colors={colors}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  topicSection: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  topicHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topicIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  expandIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  topicContent: {
    borderTopWidth: 1,
  },
  tensionFlowSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  tensionFlowTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tensionFlowDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tensionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tensionCountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  countPill: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtopicsSection: {
    padding: 16,
  },
  keystoneSection: {
    marginTop: 12,
  },
  keystoneTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  keystoneList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keystonePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  keystoneText: {
    fontSize: 12,
  },
  keyAspectsSection: {
    marginTop: 8,
  },
  keyAspectsTitle: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
  },
  keyAspectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keyAspectPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  keyAspectText: {
    fontSize: 12,
  },
  // Aspect row styling to match PlanetCard
  aspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingVertical: 1,
  },
  aspectPlanets: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
    justifyContent: 'space-between',
  },
  planetSymbolSmall: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  aspectSymbol: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  aspectDescription: {
    fontSize: 12,
    flex: 1,
    marginLeft: 6,
  },
  aspectOrb: {
    fontSize: 10,
    marginLeft: 6,
    width: 40,
    textAlign: 'right',
  },
  // Placement row styling to match PlanetCard
  placementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingVertical: 1,
  },
  placementSymbols: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
    justifyContent: 'space-between',
  },
  placementDescription: {
    fontSize: 12,
    flex: 1,
    marginLeft: 6,
  },
  signSymbol: {
    fontSize: 14,
  },
  houseText: {
    fontSize: 12,
    marginLeft: 8,
  },
  subtopicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  subtopic: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  subtopicTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtopicContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  noDataContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  noDataText: {
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
  missingAnalysisIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  missingAnalysisTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  missingAnalysisText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  completeAnalysisButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeAnalysisButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnalysisTab;
