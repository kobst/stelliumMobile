import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '../store';
import { relationshipsApi, UserCompositeChart } from '../api/relationships';
import { useTheme } from '../theme';

interface UserRelationshipsProps {
  onRelationshipPress?: (relationship: UserCompositeChart) => void;
}

const UserRelationships: React.FC<UserRelationshipsProps> = ({ onRelationshipPress }) => {
  const { userData } = useStore();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [relationships, setRelationships] = useState<UserCompositeChart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRelationships();
  }, []);

  // Reload relationships when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadRelationships();
    }, [])
  );

  const loadRelationships = async () => {
    const userId = userData?.userId || userData?.id;

    if (!userId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await relationshipsApi.getUserCompositeCharts(userId);
      console.log('getUserCompositeCharts response:', JSON.stringify(response, null, 2));
      console.log('First relationship analysis status:', response[0]?.relationshipAnalysisStatus);
      setRelationships(response);
    } catch (err) {
      console.error('Failed to load user relationships:', err);
      setError('Failed to load your relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleRelationshipPress = (relationship: UserCompositeChart) => {
    console.log('Existing relationship data:', relationship);
    console.log('Existing relationship clusterScoring:', relationship.clusterScoring);
    if (onRelationshipPress) {
      onRelationshipPress(relationship);
    } else {
      // Navigate to relationship analysis screen
      (navigation as any).navigate('RelationshipAnalysis', { relationship });
    }
  };

  // Relationships can be deleted elsewhere; keep component focused on display only

  // Helper function to determine user display names
  const getDisplayNames = (item: UserCompositeChart) => {
    // Get current user's name variations for comparison
    const currentUserNames = [
      userData?.name,
      userData?.firstName,
      `${userData?.firstName} ${userData?.lastName}`.trim(),
      userData?.email?.split('@')[0],
      // Extract first name from full name (e.g., "test Horoscope3" -> "test")
      userData?.name?.split(' ')[0],
    ].filter(Boolean);

    let leftName = item.userA_name;
    let rightName = item.userB_name;

    // Check if leftName matches any variation of current user
    const isLeftNameCurrentUser = currentUserNames.some(name =>
      name && leftName && name.toLowerCase() === leftName.toLowerCase()
    );

    // Check if rightName matches any variation of current user
    const isRightNameCurrentUser = currentUserNames.some(name =>
      name && rightName && name.toLowerCase() === rightName.toLowerCase()
    );

    // Replace matching names with "You"
    if (isLeftNameCurrentUser) {
      leftName = 'You';
    }

    if (isRightNameCurrentUser) {
      rightName = 'You';
    }

    return { leftName, rightName };
  };

  const getScoreColor = (score: number) => {
    if (score >= 71) { return '#10B981'; }
    if (score >= 41) { return '#F59E0B'; }
    return '#EF4444';
  };

  const renderRelationshipItem = ({ item }: { item: UserCompositeChart }) => {
    const { leftName, rightName } = getDisplayNames(item);
    const partnerName = leftName === 'You' ? rightName : leftName;
    const analysisStatus = item.relationshipAnalysisStatus;
    const level = analysisStatus?.level || 'none';
    const score = typeof analysisStatus?.overall?.score === 'number'
      ? Math.round(analysisStatus.overall.score)
      : null;

    return (
      <TouchableOpacity
        style={[styles.relationshipRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => handleRelationshipPress(item)}
        activeOpacity={0.8}
      >
        <Text style={[styles.partnerName, { color: colors.onSurface }]}>{partnerName}</Text>
        {level !== 'none' && score !== null ? (
          <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>{score}</Text>
        ) : (
          <Text style={[styles.scoreText, { color: colors.onSurfaceVariant }]}>–</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading your relationships...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.errorSection, { backgroundColor: colors.surface, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.error }]}
            onPress={loadRelationships}
            activeOpacity={0.8}
          >
            <Text style={[styles.retryButtonText, { color: colors.onError }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {relationships.length === 0 ? (
        <View style={[styles.emptyStateContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.emptyStateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyStateIcon, { color: colors.primary }]}>💫</Text>
            <Text style={[styles.emptyStateTitle, { color: colors.onSurface }]}>
              No Relationships Yet
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.onSurfaceVariant }]}>
              Create your first compatibility analysis to explore cosmic connections and relationship insights.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.relationshipsList}>
          {relationships.map((item) => (
            <View key={item._id}>
              {renderRelationshipItem({ item })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  // Empty state with illustration + CTA
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  relationshipsList: {
    flex: 1,
  },
  relationshipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorSection: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default UserRelationships;
