import React from 'react';
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
import { RELATIONSHIP_CLUSTERS } from '../../../shared/domain/relationship';
import { useRelationshipAppStore } from '../store';

type Props = StackScreenProps<RelationshipRootParamList, 'RelationshipPreview'>;

const CLUSTER_LABELS = {
  harmony: 'Harmony',
  passion: 'Passion',
  connection: 'Connection',
  stability: 'Stability',
  growth: 'Growth',
} as const;

function toPercent(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  return `${Math.round(value)}%`;
}

export const RelationshipPreviewScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const previewAnalysis = useRelationshipAppStore((state) => state.previewAnalysis);
  const activeTargetSubject = useRelationshipAppStore((state) => state.activeTargetSubject);
  const clearActiveRelationshipFlow = useRelationshipAppStore(
    (state) => state.clearActiveRelationshipFlow
  );

  if (!previewAnalysis) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Preview</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            No preview is loaded yet.
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Create a partner profile first so the relationship app can request the live
            compatibility preview payload.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.replace('CreatePartner')}
          >
            <Text style={styles.primaryButtonText}>Create Partner</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Preview</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {previewAnalysis.userA.name} and {previewAnalysis.userB.name}
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            {previewAnalysis.initialOverview ??
              'Your first compatibility preview is ready. This should become the free result surface before unlock.'}
          </Text>
        </View>

        <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>Overall compatibility</Text>
          <Text style={[styles.scoreValue, { color: colors.primary }]}>
            {toPercent(previewAnalysis.overall?.score)}
          </Text>
          <Text style={[styles.scoreMeta, { color: colors.text }]}>
            {previewAnalysis.overall?.profile ?? 'Preview profile pending'}
          </Text>
          <Text style={[styles.scoreMeta, { color: colors.textMuted }]}>
            Tier: {previewAnalysis.overall?.tier ?? 'Unknown'}
          </Text>
          <Text style={[styles.scoreMeta, { color: colors.textMuted }]}>
            Relationship ID: {previewAnalysis.compositeChartId}
          </Text>
          {activeTargetSubject ? (
            <Text style={[styles.scoreMeta, { color: colors.textMuted }]}>
              Partner subject: {activeTargetSubject._id}
            </Text>
          ) : null}
        </View>

        <View style={styles.clusterRow}>
          {RELATIONSHIP_CLUSTERS.map((cluster) => {
            const label = CLUSTER_LABELS[cluster.key];
            const metrics = previewAnalysis.clusters[label];
            return (
              <View
                key={cluster.key}
                style={[
                  styles.clusterCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.clusterLabel, { color: colors.text }]}>{cluster.label}</Text>
                <Text style={[styles.clusterValue, { color: colors.primary }]}>
                  {toPercent(metrics?.score)}
                </Text>
                <Text style={[styles.clusterMeta, { color: colors.textMuted }]}>
                  {metrics?.quadrant ?? 'Quadrant pending'}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Top read</Text>
          <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
            Dominant cluster: {previewAnalysis.overall?.dominantCluster ?? 'Unknown'}
          </Text>
          <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
            Challenge cluster: {previewAnalysis.overall?.challengeCluster ?? 'Unknown'}
          </Text>
          <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
            Strengths: {previewAnalysis.overall?.strengthClusters?.join(', ') || 'None yet'}
          </Text>
          <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
            Growth edge: {previewAnalysis.overall?.growthClusters?.join(', ') || 'None yet'}
          </Text>
          <Text style={[styles.detailCopy, { color: colors.textMuted }]}>
            Scored items: {previewAnalysis.metadata.totalScoredItems}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Unlock')}
        >
          <Text style={styles.primaryButtonText}>See Unlock Flow</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => {
            clearActiveRelationshipFlow();
            navigation.replace('ChooseTargetType');
          }}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Start Another Preview
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
  scoreCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 52,
  },
  scoreMeta: {
    fontSize: 14,
    lineHeight: 20,
  },
  clusterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  clusterCard: {
    borderRadius: 14,
    borderWidth: 1,
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  clusterLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  clusterValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  clusterMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  detailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
