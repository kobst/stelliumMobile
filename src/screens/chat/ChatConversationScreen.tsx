import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { ChatThread } from '../../types/chat';
import { TransitEvent } from '../../types';
import HoroscopeChatTab from '../../components/HoroscopeChatTab';
import BirthChartChatTab from '../../components/chart/BirthChartChatTab';
import RelationshipChatTab from '../../components/relationship/RelationshipChatTab';
import { horoscopesApi } from '../../api/horoscopes';
import { relationshipsApi, ClusterScoredItem } from '../../api/relationships';
import { useStore } from '../../store';

type ChatConversationRouteProp = RouteProp<
  {
    ChatConversation: {
      thread: ChatThread;
      preSelectedElements?: any[]; // For "Chat about this" functionality
    };
  },
  'ChatConversation'
>;

const ChatConversationScreen: React.FC = () => {
  const route = useRoute<ChatConversationRouteProp>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { userData } = useStore();
  const { thread, preSelectedElements } = route.params;

  // State for horoscope transit data
  const [transitWindows, setTransitWindows] = useState<TransitEvent[]>([]);
  const [transitWindowsLoading, setTransitWindowsLoading] = useState(false);
  const [transitWindowsError, setTransitWindowsError] = useState<string | null>(null);

  // State for relationship data
  const [consolidatedItems, setConsolidatedItems] = useState<ClusterScoredItem[]>([]);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [relationshipError, setRelationshipError] = useState<string | null>(null);

  // Load transit windows for horoscope chat
  useEffect(() => {
    if (thread.type === 'horoscope' && userData?.id) {
      fetchTransitWindows();
    }
  }, [thread.type, userData?.id]);

  // Load relationship data for relationship chat
  useEffect(() => {
    if (thread.type === 'relationship' && thread.compositeChartId) {
      fetchRelationshipData();
    }
  }, [thread.type, thread.compositeChartId]);

  const fetchTransitWindows = async () => {
    if (!userData?.id) return;

    setTransitWindowsLoading(true);
    setTransitWindowsError(null);

    try {
      // Query range: 3 days ago to 6 weeks forward (45 days total)
      const now = new Date();
      const fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 3); // Start 3 days ago
      const toDate = new Date(now);
      toDate.setDate(now.getDate() + 42); // 6 weeks forward (42 days)

      const response = await horoscopesApi.getTransitWindows(
        userData.id,
        fromDate.toISOString().split('T')[0],
        toDate.toISOString().split('T')[0]
      );

      // Combine both transit-to-natal and transit-to-transit events
      const allTransitEvents = [
        ...(response.transitEvents || []),
        ...(response.transitToTransitEvents || [])
      ];

      if (allTransitEvents.length > 0) {
        // Filter out transits that ended before today
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const activeTransits = allTransitEvents.filter(transit => {
          const transitEnd = new Date(transit.end);
          return transitEnd >= today; // Keep transits ending today or later
        });

        setTransitWindows(activeTransits);
      } else {
        throw new Error('No transit data received');
      }
    } catch (error) {
      console.error('Error fetching transit windows:', error);
      setTransitWindowsError(`Failed to load transit data: ${(error as Error).message}`);
    } finally {
      setTransitWindowsLoading(false);
    }
  };

  const fetchRelationshipData = async () => {
    if (!thread.compositeChartId) return;

    setRelationshipLoading(true);
    setRelationshipError(null);

    try {
      const response = await relationshipsApi.fetchRelationshipAnalysis(thread.compositeChartId);

      // Extract consolidated items from the cluster scoring
      if (response.clusterScoring?.scoredItems) {
        setConsolidatedItems(response.clusterScoring.scoredItems);
      } else if (response.clusterAnalysis) {
        // If no clusterScoring but there's clusterAnalysis, we still need scoredItems
        // This might need to be fetched differently or the analysis might not be complete
        console.warn('Relationship analysis found but no scored items available');
        setConsolidatedItems([]);
      } else {
        throw new Error('No relationship analysis data found');
      }
    } catch (error) {
      console.error('Error fetching relationship data:', error);
      setRelationshipError(`Failed to load relationship data: ${(error as Error).message}`);
    } finally {
      setRelationshipLoading(false);
    }
  };

  const renderChatComponent = () => {
    switch (thread.type) {
      case 'horoscope':
        return (
          <HoroscopeChatTab
            userId={userData?.id || ''}
            transitWindows={transitWindows}
            transitWindowsLoading={transitWindowsLoading}
            transitWindowsError={transitWindowsError}
            onRetryTransitWindows={fetchTransitWindows}
          />
        );

      case 'birth_chart':
        // For birth charts, we need to determine if it's the user's chart or a guest chart
        const chartUserId = thread.userId;
        const guestSubject = thread.guestSubject;
        // Extract birthChart from guestSubject or use user's birthChart
        const birthChart = guestSubject?.birthChart || userData?.birthChart;

        if (!birthChart) {
          return (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                Birth chart data not available
              </Text>
            </View>
          );
        }

        return (
          <BirthChartChatTab
            userId={chartUserId}
            birthChart={birthChart}
            preSelectedElements={preSelectedElements}
          />
        );

      case 'relationship':
        // For relationships, we need the composite chart ID
        const compositeChartId = thread.compositeChartId;
        const relationship = thread.relationship;

        // Show loading state while fetching relationship data
        if (relationshipLoading) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                Loading relationship data...
              </Text>
            </View>
          );
        }

        // Show error state if loading failed
        if (relationshipError) {
          return (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {relationshipError}
              </Text>
              <TouchableOpacity
                onPress={fetchRelationshipData}
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.retryButtonText, { color: colors.onPrimary }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          );
        }

        // Get user names from relationship
        const userAName = relationship?.userAName || 'User A';
        const userBName = relationship?.userBName || 'User B';

        return (
          <RelationshipChatTab
            compositeChartId={compositeChartId!}
            consolidatedItems={consolidatedItems}
            preSelectedItems={preSelectedElements}
            userAName={userAName}
            userBName={userBName}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header with Back Button */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onBackground }]} numberOfLines={1}>
          {thread.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>{renderChatComponent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
});

export default ChatConversationScreen;
