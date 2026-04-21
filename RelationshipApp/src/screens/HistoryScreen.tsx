import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { useRelationshipHistory } from '../hooks/useRelationshipHistory';
import { useOwnedSubjects } from '../hooks/useOwnedSubjects';
import { buildHistorySelectionState } from './historySelection';
import { startRelationshipPreview } from './previewFlow';
import {
  getBigThree,
  getRelationshipArchetypeLabel,
  getInitials,
} from '../utils/mainShell';
import { getUnconnectedSubjects } from '../utils/unconnectedSubjects';
import { CreditPill } from '../components/CreditPill';
import { CountedFilterPills, type CountedPillOption } from '../components/CountedFilterPills';
import { RelationshipCard } from '../components/RelationshipCard';
import { RelationshipEmptyState } from '../components/RelationshipEmptyState';
import { Avatar } from '../components/Avatar';
import { relationshipsApi } from '../api';
import type { UserCompositeChart } from '../../../shared/api/relationships';
import type { OwnedGuestSubject } from '../../../shared/api/relationshipUsers';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

type Filter = 'all' | 'people' | 'celebs';
const HISTORY_TIMEOUT_ERROR = 'Loading relationships took too long. Pull to refresh and try again.';

interface UnconnectedListItem {
  id: string;
  name: string;
  initial: string;
  sun: string | null;
  photoUri: string | null;
  subject: OwnedGuestSubject;
}

function toUnconnectedListItem(subject: OwnedGuestSubject): UnconnectedListItem {
  const firstName = subject.firstName?.trim() ?? '';
  const lastName = subject.lastName?.trim() ?? '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unnamed';
  const { sun } = getBigThree(subject);
  return {
    id: subject._id,
    name,
    initial: getInitials(name) || name.charAt(0).toUpperCase() || '·',
    sun,
    photoUri: subject.profilePhotoUrl ?? null,
    subject,
  };
}

function resolveOtherSide(
  relationship: UserCompositeChart,
  selfProfileId: string | null
): { name: string; initial: string; photoUri: string | null } {
  const selfIsA = Boolean(selfProfileId) && relationship.userA_id === selfProfileId;
  const otherName = selfIsA ? relationship.userB_name : relationship.userA_name;
  const fallbackName = selfIsA ? relationship.userA_name : relationship.userB_name;
  const name = otherName || fallbackName || 'Connection';
  const profilePhoto = selfIsA
    ? relationship.userB_profilePhotoUrl
    : relationship.userA_profilePhotoUrl;
  const photo = selfIsA ? relationship.userB_photoUrl : relationship.userA_photoUrl;
  return {
    name,
    initial: getInitials(name) || name.charAt(0).toUpperCase() || '·',
    photoUri: profilePhoto ?? photo ?? null,
  };
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
  const setActivePartnerRomanticAssets = useRelationshipAppStore(
    (state) => state.setActivePartnerRomanticAssets
  );
  const clearActiveRelationshipFlow = useRelationshipAppStore(
    (state) => state.clearActiveRelationshipFlow
  );
  const setActiveTargetType = useRelationshipAppStore((state) => state.setActiveTargetType);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);
  const setRelationshipHistory = useRelationshipAppStore((state) => state.setRelationshipHistory);
  const isLocalUxMode = useRelationshipAppStore((state) => state.isLocalUxMode);
  const relationshipHistoryFromStore = useRelationshipAppStore(
    (state) => state.relationshipHistory
  );
  const profile = useRelationshipAppStore((state) => state.profile);
  const credits = useRelationshipAppStore((state) => state.credits);
  const { ownedSubjects } = useOwnedSubjects();

  const [filter, setFilter] = useState<Filter>('all');
  const [unconnectedExpanded, setUnconnectedExpanded] = useState(false);
  const [connectingSubjectId, setConnectingSubjectId] = useState<string | null>(null);
  const didAutoRetryOnFocusRef = useRef(false);

  const selfProfileId = profile?.id ?? null;

  const unconnectedItems = useMemo(
    () =>
      getUnconnectedSubjects(ownedSubjects, relationshipHistory, selfProfileId).map(
        toUnconnectedListItem
      ),
    [ownedSubjects, relationshipHistory, selfProfileId]
  );

  const counts = useMemo(() => {
    const celebs = relationshipHistory.filter((rel) => Boolean(rel.isCelebrityRelationship)).length;
    const people = relationshipHistory.length - celebs;
    return {
      all: relationshipHistory.length,
      people,
      celebs,
    };
  }, [relationshipHistory]);

  const filteredRelationships = useMemo(() => {
    const matched = relationshipHistory.filter((relationship) => {
      if (filter === 'all') {
        return true;
      }
      return filter === 'celebs'
        ? Boolean(relationship.isCelebrityRelationship)
        : !relationship.isCelebrityRelationship;
    });
    return [...matched].sort((a, b) => {
      const aTs = Date.parse(a.updatedAt ?? a.createdAt ?? '');
      const bTs = Date.parse(b.updatedAt ?? b.createdAt ?? '');
      const aValid = Number.isFinite(aTs) ? aTs : 0;
      const bValid = Number.isFinite(bTs) ? bTs : 0;
      return bValid - aValid;
    });
  }, [filter, relationshipHistory]);

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

  const connectExistingSubject = useCallback(
    async (item: UnconnectedListItem) => {
      if (!profile || !profile.id || connectingSubjectId) return;
      setConnectingSubjectId(item.id);
      try {
        clearActiveRelationshipFlow();
        setActiveTargetType('person');
        setActiveTargetSubject(item.subject);
        setActivePartnerRomanticAssets(null);

        const { preview, updatedHistory } = await startRelationshipPreview(
          {
            selfProfile: profile,
            targetSubject: item.subject,
            targetType: 'person',
            isLocalUxMode,
            relationshipHistory: relationshipHistoryFromStore,
          },
          {
            enhancedRelationshipAnalysis: relationshipsApi.enhancedRelationshipAnalysis,
          }
        );

        setPreviewAnalysis(preview);
        setActiveRelationshipId(preview.compositeChartId);
        setRelationshipHistory({ relationshipHistory: updatedHistory });
        navigation.navigate('RelationshipPreview');
      } catch (error) {
        Alert.alert(
          'Could not create connection',
          error instanceof Error ? error.message : 'Please try again shortly.'
        );
      } finally {
        setConnectingSubjectId(null);
      }
    },
    [
      clearActiveRelationshipFlow,
      connectingSubjectId,
      isLocalUxMode,
      navigation,
      profile,
      relationshipHistoryFromStore,
      setActivePartnerRomanticAssets,
      setActiveRelationshipId,
      setActiveTargetSubject,
      setActiveTargetType,
      setPreviewAnalysis,
      setRelationshipHistory,
    ]
  );

  const openRelationship = useCallback(
    (relationship: UserCompositeChart) => {
      const selectionState = buildHistorySelectionState(relationship);
      setActivePartnerRomanticAssets(null);
      setPreviewAnalysis(selectionState.previewAnalysis);
      setActiveRelationshipId(relationship._id);
      setFullAnalysis(selectionState.fullAnalysis);
      setWorkflowState({
        workflowStatus: null,
        workflowPhase: selectionState.workflowPhase,
        workflowError: null,
      });
      navigation.navigate('RelationshipPreview');
    },
    [
      navigation,
      setActivePartnerRomanticAssets,
      setActiveRelationshipId,
      setFullAnalysis,
      setPreviewAnalysis,
      setWorkflowState,
    ]
  );

  const showEmptyState =
    !isHistoryLoading &&
    !historyError &&
    relationshipHistory.length === 0 &&
    unconnectedItems.length === 0;
  const showFilteredEmpty =
    !isHistoryLoading && !historyError && relationshipHistory.length > 0 && filteredRelationships.length === 0;

  const handlePullToRefresh = useCallback(() => {
    refreshHistory(true).catch(() => undefined);
  }, [refreshHistory]);

  useFocusEffect(
    useCallback(() => {
      if (
        !didAutoRetryOnFocusRef.current &&
        !isHistoryLoading &&
        relationshipHistory.length === 0 &&
        historyError === HISTORY_TIMEOUT_ERROR
      ) {
        didAutoRetryOnFocusRef.current = true;
        refreshHistory(true).catch(() => undefined);
      }

      return () => {
        didAutoRetryOnFocusRef.current = false;
      };
    }, [historyError, isHistoryLoading, refreshHistory, relationshipHistory.length])
  );

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
                  otherInitial={other.initial}
                  otherPhotoUri={other.photoUri}
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

            {relationshipHistory.length > 0 || unconnectedItems.length > 0 ? (
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

            {unconnectedItems.length > 0 ? (
              <View style={styles.unconnectedSection}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setUnconnectedExpanded((prev) => !prev)}
                  style={[
                    styles.unconnectedToggle,
                    { borderTopColor: colors.ghostBorder },
                  ]}
                >
                  <Text style={[styles.unconnectedToggleLabel, { color: colors.textSubtle }]}>
                    Added but not connected ({unconnectedItems.length})
                  </Text>
                  <Text
                    style={[
                      styles.unconnectedToggleChevron,
                      {
                        color: colors.textSubtle,
                        transform: [{ rotate: unconnectedExpanded ? '90deg' : '0deg' }],
                      },
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>

                {unconnectedExpanded
                  ? unconnectedItems.map((item) => {
                      const busy = connectingSubjectId === item.id;
                      const dimmed =
                        Boolean(connectingSubjectId) && connectingSubjectId !== item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={dimmed ? 1 : 0.75}
                          disabled={dimmed || busy}
                          onPress={() => {
                            connectExistingSubject(item).catch(() => undefined);
                          }}
                          style={[
                            styles.unconnectedRow,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.ghostBorder,
                              opacity: dimmed ? 0.5 : 1,
                            },
                          ]}
                        >
                          <Avatar
                            size={40}
                            gradient="green"
                            photoUri={item.photoUri}
                            fallbackInitial={item.initial}
                          />
                          <View style={styles.unconnectedCopy}>
                            <Text
                              style={[styles.unconnectedName, { color: colors.text }]}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={[styles.unconnectedMeta, { color: colors.textSubtle }]}
                              numberOfLines={1}
                            >
                              {item.sun ? `${item.sun} Sun · ` : ''}Profile only
                            </Text>
                          </View>
                          {busy ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Text
                              style={[styles.unconnectedAction, { color: colors.primary }]}
                            >
                              Connect →
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  : null}
              </View>
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
  unconnectedSection: {
    marginTop: 4,
    gap: 8,
  },
  unconnectedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  unconnectedToggleLabel: {
    fontSize: 13,
  },
  unconnectedToggleChevron: {
    fontSize: 16,
    fontWeight: '500',
  },
  unconnectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unconnectedCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  unconnectedName: {
    fontSize: 14,
    fontWeight: '600',
  },
  unconnectedMeta: {
    fontSize: 11.5,
  },
  unconnectedAction: {
    fontSize: 13,
    fontWeight: '700',
  },
});
