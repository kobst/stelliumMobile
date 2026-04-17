import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
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
import { buildHistorySelectionState } from './historySelection';
import {
  getRelationshipArchetypeLabel,
  getInitials,
} from '../utils/mainShell';
import { CreditPill } from '../components/CreditPill';
import { CountedFilterPills, type CountedPillOption } from '../components/CountedFilterPills';
import {
  RelationshipCard,
  type RelationshipTier,
} from '../components/RelationshipCard';
import { RelationshipEmptyState } from '../components/RelationshipEmptyState';
import type { UserCompositeChart } from '../../../shared/api/relationships';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

type Filter = 'all' | 'people' | 'celebs';

function resolveTier(relationship: UserCompositeChart): RelationshipTier {
  if (relationship.completeAnalysis && Object.keys(relationship.completeAnalysis).length > 0) {
    return 'full';
  }
  if (relationship.clusterScoring) {
    return 'overview';
  }
  return 'blurb';
}

function resolveOtherSide(
  relationship: UserCompositeChart,
  selfProfileId: string | null
): { name: string; initial: string } {
  const selfIsA = Boolean(selfProfileId) && relationship.userA_id === selfProfileId;
  const otherName = selfIsA ? relationship.userB_name : relationship.userA_name;
  const fallbackName = selfIsA ? relationship.userA_name : relationship.userB_name;
  const name = otherName || fallbackName || 'Connection';
  return {
    name,
    initial: getInitials(name) || name.charAt(0).toUpperCase() || '·',
  };
}

function resolveAspectLine(relationship: UserCompositeChart): string | null {
  const first = relationship.synastryAspects?.[0];
  if (!first) {
    return null;
  }
  const { planet1, planet2, aspectType } = first;
  if (!planet1 || !planet2 || !aspectType) {
    return null;
  }
  return `${planet1}-${planet2} ${aspectType}`;
}

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
  const credits = useRelationshipAppStore((state) => state.credits);

  const [filter, setFilter] = useState<Filter>('all');

  const selfProfileId = profile?.id ?? null;
  const userInitial = getInitials(profile?.displayName ?? '') || '·';

  const counts = useMemo(() => {
    const celebs = relationshipHistory.filter((rel) => Boolean(rel.isCelebrityRelationship)).length;
    const people = relationshipHistory.length - celebs;
    return {
      all: relationshipHistory.length,
      people,
      celebs,
    };
  }, [relationshipHistory]);

  const filteredRelationships = useMemo(
    () =>
      relationshipHistory.filter((relationship) => {
        if (filter === 'all') {
          return true;
        }
        return filter === 'celebs'
          ? Boolean(relationship.isCelebrityRelationship)
          : !relationship.isCelebrityRelationship;
      }),
    [filter, relationshipHistory]
  );

  const filterOptions = useMemo<readonly CountedPillOption<Filter>[]>(
    () => [
      { key: 'all', label: 'All', count: counts.all },
      { key: 'people', label: 'People', count: counts.people },
      { key: 'celebs', label: 'Celebrities', count: counts.celebs },
    ],
    [counts]
  );

  const openAddConnection = useCallback(() => {
    clearActiveRelationshipFlow();
    navigation.navigate('AddConnection');
  }, [clearActiveRelationshipFlow, navigation]);

  const openRelationship = useCallback(
    (relationship: UserCompositeChart) => {
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
    },
    [navigation, setActiveRelationshipId, setFullAnalysis, setPreviewAnalysis, setWorkflowState]
  );

  const showEmptyState =
    !isHistoryLoading && !historyError && relationshipHistory.length === 0;
  const showFilteredEmpty =
    !isHistoryLoading && !historyError && relationshipHistory.length > 0 && filteredRelationships.length === 0;

  const handlePullToRefresh = useCallback(() => {
    refreshHistory(true).catch(() => undefined);
  }, [refreshHistory]);

  if (__DEV__) {
    console.log('[HistoryScreen] render', {
      isHistoryLoading,
      historyError,
      historyLength: relationshipHistory.length,
      selfProfileId,
      showEmptyState:
        !isHistoryLoading && !historyError && relationshipHistory.length === 0,
    });
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isHistoryLoading}
            onRefresh={handlePullToRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.topBar}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Iris</Text>
          <CreditPill
            balance={credits?.balance ?? null}
            onPress={() =>
              Alert.alert(
                'Buy credits',
                'Open the Profile tab to purchase credits. Global purchase sheet coming soon.'
              )
            }
          />
        </View>

        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text }]}>Relationships</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Your connections and how your charts interact.
          </Text>
        </View>

        {showEmptyState ? (
          <RelationshipEmptyState onAddFirstConnection={openAddConnection} />
        ) : (
          <>
            {relationshipHistory.length > 0 ? (
              <CountedFilterPills
                options={filterOptions}
                selected={filter}
                onSelect={setFilter}
              />
            ) : null}

            {isHistoryLoading && relationshipHistory.length === 0 ? (
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <Text style={[styles.statusText, { color: colors.textMuted }]}>
                  Loading relationships…
                </Text>
                <TouchableOpacity
                  style={[styles.refreshBtn, { borderColor: colors.ghostBorder }]}
                  onPress={() => refreshHistory(true).catch(() => undefined)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.refreshBtnText, { color: colors.textMuted }]}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {historyError ? (
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <Text style={[styles.statusText, { color: colors.error }]}>{historyError}</Text>
                <TouchableOpacity
                  style={[styles.refreshBtn, { borderColor: colors.ghostBorder }]}
                  onPress={() => refreshHistory(true).catch(() => undefined)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.refreshBtnText, { color: colors.textMuted }]}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {filteredRelationships.map((relationship) => {
              const kind = relationship.isCelebrityRelationship ? 'celeb' : 'person';
              const other = resolveOtherSide(relationship, selfProfileId);
              return (
                <RelationshipCard
                  key={relationship._id}
                  kind={kind}
                  name={other.name}
                  archetype={getRelationshipArchetypeLabel(relationship)}
                  aspect={resolveAspectLine(relationship)}
                  tier={resolveTier(relationship)}
                  userInitial={userInitial}
                  otherInitial={other.initial}
                  onPress={() => openRelationship(relationship)}
                />
              );
            })}

            {showFilteredEmpty ? (
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <Text style={[styles.statusText, { color: colors.textMuted }]}>
                  No {filter === 'celebs' ? 'celebrity' : 'personal'} connections yet.
                </Text>
              </View>
            ) : null}

            {relationshipHistory.length > 0 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={openAddConnection}
                style={[styles.addFooter, { borderColor: colors.ghostBorder }]}
              >
                <View style={styles.addIcon}>
                  <Text style={[styles.addIconGlyph, { color: colors.primary }]}>+</Text>
                </View>
                <Text style={[styles.addLabel, { color: colors.textMuted }]}>
                  Add a connection
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  headerBlock: {
    gap: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  refreshBtn: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  addFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    marginTop: 4,
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(202, 190, 255, 0.12)',
  },
  addIconGlyph: {
    fontSize: 18,
    fontWeight: '700',
  },
  addLabel: {
    fontSize: 14,
  },
});
