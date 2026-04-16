import React from 'react';
import {
  SafeAreaView,
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

type Props = StackScreenProps<RelationshipRootParamList, 'Unlock'>;

export const UnlockScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const previewAnalysis = useRelationshipAppStore((state) => state.previewAnalysis);
  const activeRelationshipId = useRelationshipAppStore((state) => state.activeRelationshipId);
  const {
    workflowStatus,
    workflowPhase,
    workflowError,
    fullAnalysis,
    startFullAnalysis,
  } = useRelationshipAnalysisWorkflow(activeRelationshipId);

  const hasRelationshipContext = Boolean(activeRelationshipId);
  const isBusy = workflowPhase === 'starting' || workflowPhase === 'polling';
  const canOpenReport = Boolean(fullAnalysis);

  const primaryLabel = canOpenReport
    ? 'Open Full Report'
    : workflowPhase === 'polling'
      ? 'Generating Full Analysis...'
      : workflowPhase === 'starting'
        ? 'Starting Unlock Flow...'
        : 'Unlock Full Analysis';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Unlock</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Turn the preview into a full relationship read.
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          {hasRelationshipContext
            ? 'This unlock step starts the deeper relationship-analysis workflow for the active relationship.'
            : 'A relationship context must exist before you can unlock the full report.'}
        </Text>

        {hasRelationshipContext ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Current relationship</Text>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              {previewAnalysis
                ? `${previewAnalysis.userA.name} and ${previewAnalysis.userB.name}`
                : 'Saved relationship selected from history'}
            </Text>
            {previewAnalysis ? (
              <Text style={[styles.cardBody, { color: colors.textMuted }]}>
                Preview score: {Math.round(previewAnalysis.overall.score)}%
              </Text>
            ) : null}
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              Relationship ID: {activeRelationshipId}
            </Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Workflow status</Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            Phase: {workflowPhase}
          </Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            Backend status: {workflowStatus?.status ?? 'not started'}
          </Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            Message: {workflowStatus?.message ?? workflowError ?? 'Ready to start full analysis.'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            styles.primaryButtonEnabled,
            !hasRelationshipContext ? styles.primaryButtonDisabled : null,
            { backgroundColor: colors.primary },
          ]}
          disabled={!hasRelationshipContext || isBusy}
          onPress={() => {
            if (canOpenReport) {
              navigation.navigate('FullRelationshipAnalysis');
              return;
            }

            startFullAnalysis().catch(() => undefined);
          }}
        >
          <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
        </TouchableOpacity>
        {hasRelationshipContext ? (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() =>
              navigation.navigate('AskIris', {
                context: 'relationship',
                relationshipLabel: previewAnalysis
                  ? `${previewAnalysis.userA.name} + ${previewAnalysis.userB.name}`
                  : undefined,
              })
            }
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Ask Iris About This Relationship
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back To Preview</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    padding: 24,
    gap: 16,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardBody: {
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
  primaryButtonEnabled: {
    opacity: 1,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
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
