import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import { useRelationshipAnalysisWorkflow } from '../hooks/useRelationshipAnalysisWorkflow';

type Props = StackScreenProps<RelationshipRootParamList, 'FullRelationshipAnalysis'>;

export const FullRelationshipAnalysisScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const activeRelationshipId = useRelationshipAppStore((state) => state.activeRelationshipId);
  const previewAnalysis = useRelationshipAppStore((state) => state.previewAnalysis);
  const { fullAnalysis, workflowPhase, workflowError, loadFullAnalysis } =
    useRelationshipAnalysisWorkflow(activeRelationshipId);

  useEffect(() => {
    if (activeRelationshipId && !fullAnalysis && workflowPhase === 'completed') {
      loadFullAnalysis(activeRelationshipId).catch(() => undefined);
    }
  }, [activeRelationshipId, fullAnalysis, loadFullAnalysis, workflowPhase]);

  if (!activeRelationshipId) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Full Analysis</Text>
          <Text style={[styles.title, { color: colors.text }]}>No active relationship loaded.</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Generate a relationship preview first, then unlock the full report from that result.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!fullAnalysis) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Full Analysis</Text>
          <Text style={[styles.title, { color: colors.text }]}>The full report is not ready yet.</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            {workflowError ??
              'Return to the unlock screen to start or monitor the full-analysis workflow.'}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Unlock')}
          >
            <Text style={styles.primaryButtonText}>Back To Unlock</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const clusterAnalysis = fullAnalysis.completeAnalysis
    ? Object.entries(fullAnalysis.completeAnalysis)
    : [];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Full Analysis</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {previewAnalysis?.userA.name ?? fullAnalysis.userA_name ?? 'You'} and{' '}
            {previewAnalysis?.userB.name ?? fullAnalysis.userB_name ?? 'Partner'}
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            {fullAnalysis.holisticOverview ??
              fullAnalysis.initialOverview ??
              'The complete relationship read is available.'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overall</Text>
          <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
            Tier: {fullAnalysis.overall?.tier ?? previewAnalysis?.overall.tier ?? 'Unknown'}
          </Text>
          <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
            Profile: {fullAnalysis.overall?.profile ?? previewAnalysis?.overall.profile ?? 'Unknown'}
          </Text>
          <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
            Dominant cluster: {fullAnalysis.overall?.dominantCluster ?? 'Unknown'}
          </Text>
          <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
            Challenge cluster: {fullAnalysis.overall?.challengeCluster ?? 'Unknown'}
          </Text>
        </View>

        {clusterAnalysis.map(([clusterName, clusterData]) => (
          <View
            key={clusterName}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{clusterName}</Text>
            <Text style={[styles.subsectionTitle, { color: colors.textMuted }]}>Synastry support</Text>
            <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
              {clusterData.synastry.supportPanel}
            </Text>
            <Text style={[styles.subsectionTitle, { color: colors.textMuted }]}>Synastry challenge</Text>
            <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
              {clusterData.synastry.challengePanel}
            </Text>
            <Text style={[styles.subsectionTitle, { color: colors.textMuted }]}>Composite synthesis</Text>
            <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
              {clusterData.composite.synthesisPanel}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back To Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  emptyState: {
    flex: 1,
    gap: 12,
    padding: 24,
    justifyContent: 'center',
  },
  headerBlock: {
    gap: 10,
    paddingTop: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
  },
  detailCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    padding: 20,
    paddingTop: 12,
  },
  primaryButton: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  primaryButtonText: {
    color: '#FFF9F0',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
