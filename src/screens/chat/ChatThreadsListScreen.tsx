import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useChatThreads } from '../../hooks/useChatThreads';
import { ChatThread } from '../../types/chat';
import { HeaderWithProfile } from '../../components/navigation';

const ChatThreadsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { sections, loading, error, refreshThreads } = useChatThreads();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshThreads();
    setRefreshing(false);
  };

  const handleThreadPress = (thread: ChatThread) => {
    if (thread.isLocked) {
      // Show alert that analysis is required
      Alert.alert(
        'Analysis Required',
        `Complete the full 360° analysis for ${thread.title} to unlock chat functionality.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    navigation.navigate('ChatConversation', { thread });
  };

  const renderThread = (thread: ChatThread) => {
    const isLocked = thread.isLocked || false;

    return (
      <TouchableOpacity
        key={thread.id}
        style={[
          styles.threadCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isLocked && styles.lockedCard,
        ]}
        onPress={() => handleThreadPress(thread)}
        activeOpacity={isLocked ? 1 : 0.7}
      >
        <View style={styles.threadContent}>
          <Text
            style={[
              styles.threadTitle,
              { color: isLocked ? colors.onSurfaceVariant : colors.onSurface },
            ]}
            numberOfLines={1}
          >
            {thread.title}
          </Text>
          {thread.subtitle && (
            <Text
              style={[styles.threadSubtitle, { color: colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {thread.subtitle}
            </Text>
          )}
          {isLocked && (
            <Text style={[styles.lockedText, { color: colors.error }]}>
              🔒 Complete analysis to unlock
            </Text>
          )}
        </View>
        <View style={styles.chevronContainer}>
          <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (section: typeof sections[0]) => {
    return (
      <View key={section.title} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{section.title}</Text>
        {section.data.map((thread) => renderThread(thread))}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderWithProfile title="Ask Stellium" showSafeArea={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading conversations...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderWithProfile title="Ask Stellium" showSafeArea={false} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={[styles.retryButtonText, { color: colors.onPrimary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderWithProfile title="Ask Stellium" showSafeArea={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {sections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              No Conversations Yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              Complete your birth chart analysis or create a relationship to start chatting about
              your cosmic insights.
            </Text>
          </View>
        ) : (
          sections.map((section) => renderSection(section))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  lockedCard: {
    opacity: 0.6,
  },
  threadContent: {
    flex: 1,
  },
  threadTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  threadSubtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  lockedText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  chevronContainer: {
    marginLeft: 8,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ChatThreadsListScreen;
