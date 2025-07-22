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

  const renderRelationshipItem = ({ item }: { item: UserCompositeChart }) => (
    <TouchableOpacity 
      style={[styles.relationshipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleRelationshipPress(item)}
    >
      <View style={styles.relationshipHeader}>
        <Text style={[styles.relationshipTitle, { color: colors.primary }]}>Your Relationship</Text>
        <Text style={[styles.createdDate, { color: colors.onSurfaceVariant }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.partnerPair}>
        <View style={styles.partnerInfo}>
          <Text style={[styles.partnerName, { color: colors.onSurface }]}>{item.userA_name}</Text>
          <Text style={[styles.partnerDOB, { color: colors.onSurfaceVariant }]}>
            {new Date(item.userA_dateOfBirth).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.separator}>
          <Text style={[styles.separatorText, { color: colors.primary }]}>♥</Text>
        </View>
        
        <View style={styles.partnerInfo}>
          <Text style={[styles.partnerName, { color: colors.onSurface }]}>{item.userB_name}</Text>
          <Text style={[styles.partnerDOB, { color: colors.onSurfaceVariant }]}>
            {new Date(item.userB_dateOfBirth).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={[styles.actionsContainer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleRelationshipPress(item)}
        >
          <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Analysis →</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.deleteButton,
            deletingRelationship === item._id && styles.deleteButtonDisabled
          ]}
          onPress={() => handleDeleteRelationship(item)}
          disabled={deletingRelationship === item._id}
        >
          <Text style={styles.deleteButtonText}>
            {deletingRelationship === item._id ? 'Deleting...' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.error }]} onPress={loadRelationships}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {relationships.length === 0 ? (
        <View style={[styles.noResultsContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.noResultsText, { color: colors.onSurfaceVariant }]}>
            No relationships found.
          </Text>
          <Text style={[styles.noResultsSubtext, { color: colors.onSurfaceVariant }]}>
            Your created relationships will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.relationshipsList}>
          <View style={styles.listContainer}>
            {relationships.map((item) => (
              <View key={item._id}>
                {renderRelationshipItem({ item })}
              </View>
            ))}
          </View>
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
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  relationshipsList: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  relationshipCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  relationshipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  relationshipTitle: {
    fontSize: 14,
    fontWeight: '600',
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  viewButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default UserRelationships;