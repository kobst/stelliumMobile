import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import ProgressBar from '../ui/ProgressBar';
import { TensionFlowData } from '../../api/relationships';

interface RelationshipTensionFlowProps {
  tensionFlow: TensionFlowData;
  style?: any;
}

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

const RelationshipTensionFlow: React.FC<RelationshipTensionFlowProps> = ({
  tensionFlow,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <Text style={[styles.title, { color: colors.primary }]}>⚡ Energy Flow Analysis</Text>

      {/* Progress Bars */}
      <View style={styles.progressBarsContainer}>
        <ProgressBar
          label="Support Level"
          level={getSupportLevel(tensionFlow.supportDensity)}
          fillColor="accentSupport"
          icon="🌿"
        />
        <ProgressBar
          label="Tension Level"
          level={getTensionLevel(tensionFlow.challengeDensity)}
          fillColor="accentWarning"
          icon="🔥"
        />
        <ProgressBar
          label="Balance"
          level={getBalanceDescription(tensionFlow.polarityRatio)}
          fillColor="accentPrimary"
          icon="⚖️"
        />
      </View>

      {/* Network Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Quadrant</Text>
            <Text style={[styles.metricValue, { color: colors.onSurface }]}>{tensionFlow.quadrant}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Total Aspects</Text>
            <Text style={[styles.metricValue, { color: colors.onSurface }]}>{tensionFlow.totalAspects}</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Support</Text>
            <Text style={[styles.metricValue, { color: colors.accentSupport }]}>{tensionFlow.supportAspects}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Challenge</Text>
            <Text style={[styles.metricValue, { color: colors.accentWarning }]}>{tensionFlow.challengeAspects}</Text>
          </View>
        </View>

        {tensionFlow.networkMetrics && (
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Connection Density</Text>
              <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                {(tensionFlow.networkMetrics.connectionDensity * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Average Score</Text>
              <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                {tensionFlow.networkMetrics.averageScore.toFixed(1)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Key Aspects */}
      {tensionFlow.keystoneAspects && tensionFlow.keystoneAspects.length > 0 && (
        <View style={styles.keystoneSection}>
          <Text style={[styles.keystoneTitle, { color: colors.primary }]}>🔑 Key Connections</Text>
          {tensionFlow.keystoneAspects.slice(0, 3).map((aspect, index) => (
            <View key={index} style={[styles.keystoneAspect, {
              borderLeftColor: aspect.edgeType === 'support' ? colors.accentSupport :
                              aspect.edgeType === 'challenge' ? colors.accentWarning :
                              colors.onSurfaceVariant,
            }]}>
              <View style={styles.keystoneHeader}>
                <Text style={[styles.keystoneType, {
                  color: aspect.edgeType === 'support' ? colors.accentSupport :
                         aspect.edgeType === 'challenge' ? colors.accentWarning :
                         colors.onSurfaceVariant,
                }]}>
                  {aspect.aspectType.toUpperCase()} {aspect.edgeType === 'support' ? '✨' : aspect.edgeType === 'challenge' ? '⚠️' : '⚖️'}
                </Text>
                <Text style={[styles.keystoneScore, { color: colors.onSurface }]}>
                  {aspect.score > 0 ? '+' : ''}{aspect.score}
                </Text>
              </View>
              <Text style={[styles.keystoneDescription, { color: colors.onSurfaceVariant }]}>
                {aspect.description}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressBarsContainer: {
    marginBottom: 16,
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  keystoneSection: {
    marginTop: 8,
  },
  keystoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  keystoneAspect: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 12,
  },
  keystoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  keystoneType: {
    fontSize: 12,
    fontWeight: '600',
  },
  keystoneScore: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  keystoneDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});

export default RelationshipTensionFlow;
