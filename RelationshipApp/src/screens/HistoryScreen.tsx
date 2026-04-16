import React from 'react';
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
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { useRelationshipHistory } from '../hooks/useRelationshipHistory';
import { TopCelebMatchesRail } from '../components/TopCelebMatchesRail';
import { buildHistorySelectionState } from './historySelection';
import {
  getRelationshipArchetypeLabel,
  getRelationshipOverviewExcerpt,
  getRelationshipPairLabel,
  getRelationshipTopCluster,
} from '../utils/mainShell';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigation>();
  const { colors } = useTheme();
  const { relationshipHistory, isHistoryLoading, historyError, refreshHistory } =
    useRelationshipHistory(true);
  const setActiveRelationshipId = useRelationshipAppStore((state) => state.setActiveRelationshipId);
  const setFullAnalysis = useRelationshipAppStore((state) => state.setFullAnalysis);
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setWorkflowState = useRelationshipAppStore((state) => state.setWorkflowState);
  const clearActiveRelationshipFlow = useRelationshipAppStore(
    (state) => state.clearActiveRelationshipFlow
  );
  const profile = useRelationshipAppStore((state) => state.profile);
  const [filter, setFilter] = React.useState<'all' | 'people' | 'celebs'>('all');

  const filteredRelationships = relationshipHistory.filter((relationship) => {
    if (filter === 'all') {
      return true;
    }

    return filter === 'celebs'
      ? Boolean(relationship.isCelebrityRelationship)
      : !relationship.isCelebrityRelationship;
  });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Relationships</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Every connection you have created.
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          This is the structured layer beneath Home: a full list, quick filters, and a direct path
          into the gated relationship detail flow.
        </Text>

        <TouchableOpacity
          style={[styles.refreshLink, { borderColor: colors.border }]}
          onPress={() => refreshHistory(true).catch(() => undefined)}
        >
          <Text style={[styles.refreshLinkText, { color: colors.textMuted }]}>Refresh list</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryAction, { backgroundColor: colors.primary }]}
            onPress={() => {
              clearActiveRelationshipFlow();
              navigation.navigate('CreatePartner');
            }}
          >
            <Text style={[styles.primaryActionText, { color: colors.onPrimary }]}>Add person</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryAction, { borderColor: colors.border }]}
            onPress={() => {
              clearActiveRelationshipFlow();
              navigation.navigate('SelectCelebrity');
            }}
          >
            <Text style={[styles.secondaryActionText, { color: colors.text }]}>Add celeb</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {(['all', 'people', 'celebs'] as const).map((value) => {
            const isActive = filter === value;
            return (
              <TouchableOpacity
                key={value}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.primaryContainer : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setFilter(value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? colors.primary : colors.textMuted },
                  ]}
                >
                  {value === 'all' ? 'All' : value === 'people' ? 'People' : 'Celebs'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TopCelebMatchesRail
          title="Your Chart in the Wild"
          subtitle="Celeb overlaps from your saved relationship-app profile."
          matches={(profile?.topCelebMatches ?? []).slice(0, 5)}
        />

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

        {!isHistoryLoading && !historyError && filteredRelationships.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              No relationships match this filter yet.
            </Text>
          </View>
        ) : null}

        {filteredRelationships.map((relationship) => {
          const topCluster = getRelationshipTopCluster(relationship);
          const excerpt = getRelationshipOverviewExcerpt(relationship);

          return (
            <View
              key={relationship._id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {getRelationshipPairLabel(relationship)}
              </Text>
              <Text style={[styles.cardBody, { color: colors.textMuted }]}>
                {getRelationshipArchetypeLabel(relationship)}
              </Text>
              <Text style={[styles.cardBody, { color: colors.textMuted }]}>
                Top score: {topCluster ? `${topCluster.label} ${topCluster.score}` : 'Pending'}
              </Text>
              <Text style={[styles.cardBody, { color: colors.textMuted }]}>
                Created: {new Date(relationship.createdAt).toLocaleDateString()}
              </Text>
              {excerpt ? (
                <Text style={[styles.cardExcerpt, { color: colors.textMuted }]} numberOfLines={3}>
                  {excerpt}
                </Text>
              ) : null}
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => {
                  const selectionState = buildHistorySelectionState(relationship);
                  setPreviewAnalysis(null);
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
          );
        })}
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  refreshLink: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshLinkText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
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
  cardExcerpt: {
    fontSize: 13,
    lineHeight: 19,
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
