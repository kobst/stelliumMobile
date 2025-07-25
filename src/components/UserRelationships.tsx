import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
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
  const [deletingRelationship, setDeletingRelationship] = useState<string | null>(null);

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
      setRelationships(response);
    } catch (err) {
      console.error('Failed to load user relationships:', err);
      setError('Failed to load your relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleRelationshipPress = (relationship: UserCompositeChart) => {
    if (onRelationshipPress) {
      onRelationshipPress(relationship);
    } else {
      // Navigate to relationship analysis screen
      (navigation as any).navigate('RelationshipAnalysis', { relationship });
    }
  };

  const handleDeleteRelationship = async (relationship: UserCompositeChart) => {
    Alert.alert(
      'Delete Relationship',
      `Are you sure you want to delete the relationship between ${relationship.userA_name} and ${relationship.userB_name}?\n\nThis will permanently remove:\n• The relationship data\n• All compatibility analyses\n• Chat history\n• Associated data\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingRelationship(relationship._id);
            try {
              await relationshipsApi.deleteRelationship(relationship._id);

              // Remove deleted relationship from local state
              setRelationships(prevRelationships =>
                prevRelationships.filter(r => r._id !== relationship._id)
              );

              Alert.alert('Success', 'Relationship deleted successfully.');
            } catch (error) {
              console.error('Failed to delete relationship:', error);
              let errorMessage = 'Failed to delete relationship.';

              if (error instanceof Error) {
                if (error.message.includes('Unauthorized')) {
                  errorMessage = 'You do not have permission to delete this relationship.';
                } else if (error.message.includes('not found')) {
                  errorMessage = 'This relationship may have already been deleted.';
                }
              }

              Alert.alert('Error', errorMessage);
            } finally {
              setDeletingRelationship(null);
            }
          },
        },
      ]
    );
  };

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

  const renderRelationshipItem = ({ item }: { item: UserCompositeChart }) => {
    const { leftName, rightName } = getDisplayNames(item);

    return (
      <TouchableOpacity
        style={[styles.relationshipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => handleRelationshipPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.relationshipHeader}>
          <Text style={[styles.createdDate, { color: colors.onSurfaceVariant }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.partnerPair}>
          <View style={styles.partnerInfo}>
            <Text style={[styles.partnerName, { color: colors.onSurface }]}>{leftName}</Text>
            <Text style={[styles.partnerDOB, { color: colors.onSurfaceVariant }]}>
              {new Date(item.userA_dateOfBirth).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.separator}>
            <Text style={[styles.separatorText, { color: colors.primary }]}>♥</Text>
          </View>

          <View style={styles.partnerInfo}>
            <Text style={[styles.partnerName, { color: colors.onSurface }]}>{rightName}</Text>
            <Text style={[styles.partnerDOB, { color: colors.onSurfaceVariant }]}>
              {new Date(item.userB_dateOfBirth).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleRelationshipPress(item)}
        >
          <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Analysis</Text>
        </TouchableOpacity>
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
  // Updated card visuals: 8px radius, no inner divider
  relationshipCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  relationshipHeader: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  createdDate: {
    fontSize: 12,
  },
  partnerPair: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  partnerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  partnerDOB: {
    fontSize: 12,
    textAlign: 'center',
  },
  separator: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  separatorText: {
    fontSize: 20,
  },
  viewButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
