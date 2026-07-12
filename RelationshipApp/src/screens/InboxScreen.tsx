import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { fetchAskThreads, type AskThread } from '../api/ask';
import { Avatar } from '../components/Avatar';
import { AvatarPair } from '../components/AvatarPair';
import { SectionLabel } from '../components/SectionLabel';
import { Halo } from '../components/atmosphere/Halo';
import { Stardust } from '../components/atmosphere/Stardust';
import type { MainTabParamList } from '../navigation/MainTabs';
import type { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { useRelationshipHistory } from '../hooks/useRelationshipHistory';
import { useRelationshipAppStore } from '../store';
import { NewConversationSheet } from '../components/NewConversationSheet';
import type { UserCompositeChart } from '../../../shared/api/relationships';
import type { OwnedGuestSubject } from '../../../shared/api/relationshipUsers';

type InboxNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'IrisTab'>,
  StackNavigationProp<RelationshipRootParamList>
>;

type LoadState = 'loading' | 'ready' | 'error';

function formatRelativeTimestamp(timestamp: string | undefined): string {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - date.getTime());
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;

  if (date.getTime() >= startOfToday) {
    if (elapsedMinutes < 1) return 'Now';
    if (elapsedMinutes < 60) return `${elapsedMinutes}m`;
    return `${Math.floor(elapsedMinutes / 60)}h`;
  }

  if (date.getTime() >= startOfYesterday) return 'Yest';

  const elapsedDays = Math.max(2, Math.floor(elapsedMs / 86_400_000));
  if (elapsedDays < 7) return `${elapsedDays}d`;
  return `${Math.floor(elapsedDays / 7)}w`;
}

function fallbackInitial(thread: AskThread): string {
  if (thread.kind === 'relationship') {
    return thread.title.split('&').pop()?.trim().charAt(0) || 'P';
  }
  return thread.title.trim().charAt(0) || '?';
}

export const InboxScreen: React.FC = () => {
  const navigation = useNavigation<InboxNavigation>();
  const { colors } = useTheme();
  const requestId = useRef(0);
  const [threads, setThreads] = useState<AskThread[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const profile = useRelationshipAppStore((state) => state.profile);
  const ownedSubjects = useRelationshipAppStore((state) => state.ownedSubjects);
  const { relationshipHistory } = useRelationshipHistory(true);
  const selfProfileId = profile?.id ?? null;

  const loadThreads = useCallback(async (isRefresh = false) => {
    const currentRequest = ++requestId.current;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadState('loading');
    }
    setError(null);

    try {
      const result = await fetchAskThreads();
      if (requestId.current !== currentRequest) return;
      setThreads(result);
      setLoadState('ready');
    } catch (err: unknown) {
      if (requestId.current !== currentRequest) return;
      setError(err instanceof Error ? err.message : 'Could not load your Iris conversations.');
      setLoadState('error');
    } finally {
      if (requestId.current === currentRequest) {
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadThreads();
      return () => {
        requestId.current += 1;
      };
    }, [loadThreads])
  );

  const openSelfThread = useCallback(() => {
    navigation.navigate('AskIris', { context: 'profile', threadKey: 'profile' });
  }, [navigation]);

  const openThread = useCallback(
    (thread: AskThread) => {
      if (thread.kind === 'self') {
        navigation.navigate('AskIris', { context: 'profile', threadKey: 'profile' });
        return;
      }

      if (thread.kind === 'relationship') {
        navigation.navigate('AskIris', {
          context: 'relationship',
          threadKey: `relationship:${thread.id}`,
          relationshipLabel: thread.title,
        });
        return;
      }

      navigation.navigate('AskIris', {
        context: 'subject',
        subjectId: thread.id,
        subjectName: thread.title,
        threadKey: `subject:${thread.id}`,
      });
    },
    [navigation]
  );

  const startRelationship = useCallback(
    (chart: UserCompositeChart) => {
      const selfIsA = Boolean(selfProfileId) && chart.userA_id === selfProfileId;
      const partnerName = (selfIsA ? chart.userB_name : chart.userA_name) || 'Partner';
      navigation.navigate('AskIris', {
        context: 'relationship',
        threadKey: `relationship:${chart._id}`,
        relationshipLabel: `You & ${partnerName}`,
      });
    },
    [navigation, selfProfileId]
  );

  const startSubject = useCallback(
    (subject: OwnedGuestSubject) => {
      const name = [subject.firstName, subject.lastName].filter(Boolean).join(' ').trim();
      navigation.navigate('AskIris', {
        context: 'subject',
        subjectId: subject._id,
        subjectName: name || 'Saved person',
        threadKey: `subject:${subject._id}`,
      });
    },
    [navigation]
  );

  const goAddConnection = useCallback(() => navigation.navigate('AddConnection'), [navigation]);
  const goExplore = useCallback(() => navigation.navigate('DiscoverTab'), [navigation]);

  const renderThread = useCallback(
    ({ item }: { item: AskThread }) => {
      const speaker = item.lastMessage?.role === 'user' ? 'You' : 'Iris';
      const preview = item.lastMessage?.text?.trim() || 'Start a conversation';

      return (
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => openThread(item)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.title} Iris conversation`}
          style={[styles.threadRow, { backgroundColor: colors.surfaceLow }]}
        >
          <View style={styles.avatarColumn}>
            {item.kind === 'relationship' ? (
              <AvatarPair
                leftPhotoUri={item.avatar?.self?.photoUrl ?? null}
                leftInitial={item.avatar?.self?.initial?.trim() || 'Y'}
                leftGradient="lavender"
                rightPhotoUri={item.avatar?.partner?.photoUrl ?? null}
                rightInitial={item.avatar?.partner?.initial?.trim() || fallbackInitial(item)}
                rightGradient="green"
                size={40}
                ringColor={colors.surfaceLow}
              />
            ) : (
              <Avatar
                size={46}
                photoUri={item.avatar?.photoUrl ?? null}
                fallbackInitial={item.avatar?.initial?.trim() || fallbackInitial(item)}
                gradient={
                  item.kind === 'self'
                    ? 'lavender'
                    : item.subtitle === 'Celebrity'
                    ? 'gold'
                    : 'green'
                }
                ringColor={colors.surfaceLow}
              />
            )}
          </View>

          <View style={styles.threadCopy}>
            <View style={styles.titleRow}>
              <Text style={[styles.threadTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.timestamp, { color: colors.textSubtle }]}>
                {formatRelativeTimestamp(item.lastMessage?.timestamp)}
              </Text>
            </View>
            <SectionLabel style={styles.scopeTag}>{item.subtitle}</SectionLabel>
            <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={2}>
              <Text style={[styles.speaker, { color: colors.text }]}>{speaker}: </Text>
              {preview}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, openThread]
  );

  const renderStatus = () => {
    if (loadState === 'loading') {
      return (
        <View style={styles.statusBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            Reading your conversations…
          </Text>
        </View>
      );
    }

    if (loadState === 'error') {
      return (
        <View style={[styles.statusCard, { backgroundColor: colors.surfaceLow }]}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>The stars went quiet.</Text>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error ?? 'Something went wrong loading your conversations.'}
          </Text>
          <TouchableOpacity
            onPress={() => void loadThreads()}
            accessibilityRole="button"
            style={styles.retryButton}
          >
            <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.hintBlock}>
        <Text style={[styles.hintText, { color: colors.textSubtle }]}>
          Start a conversation about a connection or someone you&apos;ve saved — tap &ldquo;+ New&rdquo; above.
        </Text>
      </View>
    );
  };

  const selfThread = threads.find((thread) => thread.kind === 'self') ?? null;
  const otherThreads = threads.filter((thread) => thread.kind !== 'self');
  // "+ New" only offers targets you don't already have a conversation with —
  // existing ones are already one tap away in the inbox list.
  const existingRelationshipIds = new Set(
    threads.filter((thread) => thread.kind === 'relationship').map((thread) => thread.id)
  );
  const existingSubjectIds = new Set(
    threads.filter((thread) => thread.kind === 'subject').map((thread) => thread.id)
  );
  const newRelationships = relationshipHistory.filter(
    (relationship) => !existingRelationshipIds.has(relationship._id)
  );
  const newSubjects = ownedSubjects.filter((subject) => !existingSubjectIds.has(subject._id));
  const includeSelfInPicker = selfThread === null;
  const showInlineError = loadState === 'error' && threads.length > 0;

  const renderPinnedSelf = () => {
    const preview = selfThread?.lastMessage?.text?.trim();
    const speaker = selfThread?.lastMessage?.role === 'user' ? 'You' : 'Iris';
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={openSelfThread}
        accessibilityRole="button"
        accessibilityLabel="Open your chart Iris conversation"
        style={[styles.threadRow, styles.pinnedRow, { backgroundColor: colors.surfaceLow }]}
      >
        <View style={styles.avatarColumn}>
          <Avatar
            size={46}
            photoUri={null}
            fallbackInitial={profile?.firstName?.trim().charAt(0).toUpperCase() || 'Y'}
            gradient="lavender"
            ringColor={colors.surfaceLow}
          />
        </View>
        <View style={styles.threadCopy}>
          <View style={styles.titleRow}>
            <Text style={[styles.threadTitle, { color: colors.text }]} numberOfLines={1}>
              You
            </Text>
            {selfThread ? (
              <Text style={[styles.timestamp, { color: colors.textSubtle }]}>
                {formatRelativeTimestamp(selfThread.lastMessage?.timestamp)}
              </Text>
            ) : null}
          </View>
          <SectionLabel style={styles.scopeTag}>Your chart</SectionLabel>
          {preview ? (
            <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={2}>
              <Text style={[styles.speaker, { color: colors.text }]}>{speaker}: </Text>
              {preview}
            </Text>
          ) : (
            <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={1}>
              Ask your chart anything →
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Stardust density={60} seed={9} color={colors.primary} />
      </View>
      <Halo color={colors.primary} size={440} opacity={0.1} top={30} left="50%" />
      <FlatList
        data={otherThreads}
        keyExtractor={(item) => `${item.kind}:${item.id}`}
        renderItem={renderThread}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadThreads(true)}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: colors.text }]}>Iris</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Your conversations</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPickerVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Start a new conversation"
                style={[styles.newButton, { borderColor: colors.ghostBorder }]}
              >
                <Text style={[styles.newButtonText, { color: colors.primary }]}>+ New</Text>
              </TouchableOpacity>
            </View>
            {showInlineError ? (
              <View style={[styles.inlineError, { backgroundColor: colors.surfaceLow }]}>
                <Text style={[styles.inlineErrorText, { color: colors.error }]} numberOfLines={2}>
                  {error ?? 'Could not refresh your conversations.'}
                </Text>
                <TouchableOpacity onPress={() => void loadThreads()} accessibilityRole="button">
                  <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {renderPinnedSelf()}
            {otherThreads.length > 0 ? <View style={styles.separator} /> : null}
          </View>
        }
        ListEmptyComponent={renderStatus}
      />
      <NewConversationSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        relationships={newRelationships}
        subjects={newSubjects}
        selfProfileId={selfProfileId}
        includeSelf={includeSelfInPicker}
        onSelectSelf={openSelfThread}
        onSelectRelationship={startRelationship}
        onSelectSubject={startSubject}
        onAddConnection={goAddConnection}
        onExplore={goExplore}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 24,
    gap: 5,
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 42,
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  headerRow: {
    paddingTop: 18,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  newButton: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  newButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pinnedRow: {
    marginBottom: 0,
  },
  hintBlock: {
    paddingTop: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  separator: {
    height: 10,
  },
  threadRow: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarColumn: {
    width: 72,
    flexShrink: 0,
  },
  threadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  threadTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  timestamp: {
    fontSize: 11.5,
    flexShrink: 0,
  },
  scopeTag: {
    fontSize: 9,
    letterSpacing: 1.5,
    lineHeight: 13,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
  },
  speaker: {
    fontWeight: '600',
  },
  statusBlock: {
    flex: 1,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
  },
  statusCard: {
    borderRadius: 24,
    padding: 24,
    gap: 9,
    alignItems: 'flex-start',
  },
  statusTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
    gap: 12,
  },
  emptyGlyph: {
    fontSize: 24,
  },
  emptyTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 4,
  },
  primaryButton: {
    alignSelf: 'stretch',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  inlineError: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
  },
});
