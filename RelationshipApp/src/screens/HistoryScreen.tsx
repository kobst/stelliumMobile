import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { relationshipsApi } from '../api';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { buildHistorySelectionState } from './historySelection';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigation>();
  const { colors } = useTheme();
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const isHistoryLoading = useRelationshipAppStore((state) => state.isHistoryLoading);
  const historyError = useRelationshipAppStore((state) => state.historyError);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);
  const setActiveRelationshipId = useRelationshipAppStore((state) => state.setActiveRelationshipId);
  const setFullAnalysis = useRelationshipAppStore((state) => state.setFullAnalysis);
  const setWorkflowState = useRelationshipAppStore((state) => state.setWorkflowState);

  useEffect(() => {
    if (!selfProfileId) {
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setRelationshipHistory({
        relationshipHistory: [],
        isHistoryLoading: true,
        historyError: null,
      });

      try {
        const charts = await relationshipsApi.getUserCompositeCharts(selfProfileId);

        if (!cancelled) {
          setRelationshipHistory({
            relationshipHistory: charts,
            isHistoryLoading: false,
            historyError: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setRelationshipHistory({
            relationshipHistory: [],
            isHistoryLoading: false,
            historyError:
              error instanceof Error ? error.message : 'Could not load relationship history.',
          });
        }
      }
    };

    loadHistory().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [selfProfileId, setRelationshipHistory]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>History</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Recent analyses and unlocked relationships.
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          This list is now backed by the shared composite-chart history API for your relationship-app self profile.
        </Text>

        {isHistoryLoading ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>Loading history...</Text>
          </View>
        ) : null}

        {historyError ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>{historyError}</Text>
          </View>
        ) : null}

        {!isHistoryLoading && !historyError && relationshipHistory.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              No relationship analyses found yet.
            </Text>
          </View>
        ) : null}

        {relationshipHistory.map((relationship) => (
          <View
            key={relationship._id}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {relationship.userA_name} and {relationship.userB_name}
            </Text>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              Created: {new Date(relationship.createdAt).toLocaleDateString()}
            </Text>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              Status: {relationship.relationshipAnalysisStatus?.level ?? 'unknown'}
            </Text>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={() => {
                const selectionState = buildHistorySelectionState(relationship);
                setActiveRelationshipId(relationship._id);
                setFullAnalysis(selectionState.fullAnalysis);
                setWorkflowState({
                  workflowStatus: null,
                  workflowPhase: selectionState.workflowPhase,
                  workflowError: null,
                });
                navigation.navigate('Unlock');
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Open Relationship
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
