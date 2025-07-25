import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { UserCompositeChart, relationshipsApi } from '../api/relationships';
import { celebritiesApi, CelebrityRelationship } from '../api/celebrities';

interface CelebrityRelationshipsProps {
  _onCelebrityPress?: (celebrity: any) => void;
}

const CelebrityRelationships: React.FC<CelebrityRelationshipsProps> = ({ _onCelebrityPress }) => {
  const { userData } = useStore();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [relationships, setRelationships] = useState<UserCompositeChart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRelationships();
  }, [loadRelationships]);

  const loadRelationships = useCallback(async () => {
    const userId = userData?.userId || userData?.id;

    console.log('Loading celebrity relationships for user ID:', userId);
    console.log('User data:', userData);

    if (!userId) {
      console.log('No user ID found, aborting...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all user composite charts
      const allRelationships = await relationshipsApi.getUserCompositeCharts(userId);
      
      console.log('All relationships:', allRelationships);
      console.log('Total relationships found:', allRelationships.length);
      
      // Check if any have the celebrity flag
      const withCelebrityFlag = allRelationships.filter(r => r.isCelebrityRelationship === true);
      console.log('Relationships with isCelebrityRelationship=true:', withCelebrityFlag);
      
      // For debugging, let's see what properties each relationship has
      allRelationships.forEach((rel, index) => {
        console.log(`Relationship ${index}:`, {
          _id: rel._id,
          userA_name: rel.userA_name,
          userB_name: rel.userB_name,
          isCelebrityRelationship: rel.isCelebrityRelationship,
          userA_id: rel.userA_id,
          userB_id: rel.userB_id,
        });
      });

      // Filter for celebrity relationships only
      const celebrityRelationships = allRelationships.filter(
        relationship => relationship.isCelebrityRelationship === true
      );

      console.log('Filtered celebrity relationships:', celebrityRelationships.length);
      
      // If no celebrity relationships found via the filter, try the original API
      let finalRelationships = celebrityRelationships;
      
      if (celebrityRelationships.length === 0) {
        console.log('No celebrity relationships found in composite charts, trying original API...');
        try {
          const originalCelebrityRels = await celebritiesApi.getCelebrityRelationships(50);
          console.log('Original celebrity relationships API returned:', originalCelebrityRels.length);
          
          if (originalCelebrityRels[0]) {
            const sample = originalCelebrityRels[0] as any;
            console.log('Sample original relationship with all fields:', {
              ...sample,
              hasSync: !!sample.synastryAspects,
              hasComposite: !!sample.compositeChart,
              hasHousePlacements: !!sample.synastryHousePlacements,
            });
          }
          
          // Transform original celebrity relationships to UserCompositeChart format
          if (originalCelebrityRels.length > 0) {
            finalRelationships = originalCelebrityRels.map((cel: any): UserCompositeChart => ({
              _id: cel._id,
              userA_name: cel.userA_name,
              userB_name: cel.userB_name,
              userA_dateOfBirth: cel.userA_dateOfBirth,
              userB_dateOfBirth: cel.userB_dateOfBirth,
              createdAt: cel.createdAt,
              userA_id: cel.userA_id,
              userB_id: cel.userB_id,
              updatedAt: cel.updatedAt,
              isCelebrityRelationship: true,
              // Include chart data fields if they exist in the response
              synastryAspects: cel.synastryAspects,
              compositeChart: cel.compositeChart,
              synastryHousePlacements: cel.synastryHousePlacements,
            }));
            console.log('Transformed celebrity relationships:', finalRelationships.length);
          }
        } catch (originalErr) {
          console.log('Original celebrity API also failed:', originalErr);
        }
      }
      
      setRelationships(finalRelationships);
    } catch (err) {
      console.error('Failed to load celebrity relationships:', err);
      setError('Failed to load celebrity relationships');
    } finally {
      setLoading(false);
    }
  }, [userData]);

  const getFullName = (item: UserCompositeChart, userType: 'A' | 'B') => {
    if (userType === 'A') {
      return item.userA_name;
    } else {
      return item.userB_name;
    }
  };

  const handleRelationshipPress = (item: UserCompositeChart) => {
    navigation.navigate('CelebrityRelationshipAnalysis' as any, { relationship: item });
  };

  const renderRelationshipItem = ({ item }: { item: UserCompositeChart }) => (
    <TouchableOpacity
      style={[styles.relationshipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleRelationshipPress(item)}
    >
      <View style={styles.relationshipHeader}>
        <Text style={[styles.relationshipTitle, { color: colors.primary }]}>Celebrity Relationship</Text>
        <Text style={[styles.createdDate, { color: colors.onSurfaceVariant }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.celebrityPair}>
        <View style={styles.celebrityInfo}>
          <Text style={[styles.celebrityName, { color: colors.onSurface }]}>{getFullName(item, 'A')}</Text>
          <Text style={[styles.celebrityDOB, { color: colors.onSurfaceVariant }]}>
            {new Date(item.userA_dateOfBirth).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.separator}>
          <Text style={[styles.separatorText, { color: colors.primary }]}>♥</Text>
        </View>

        <View style={styles.celebrityInfo}>
          <Text style={[styles.celebrityName, { color: colors.onSurface }]}>{getFullName(item, 'B')}</Text>
          <Text style={[styles.celebrityDOB, { color: colors.onSurfaceVariant }]}>
            {new Date(item.userB_dateOfBirth).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={[styles.viewAnalysisContainer, { borderTopColor: colors.border }]}>
        <Text style={[styles.viewAnalysisText, { color: colors.primary }]}>Tap to view analysis →</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading celebrity relationships...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.errorSection, { backgroundColor: colors.surface, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.error }]} onPress={loadRelationships}>
            <Text style={[styles.retryButtonText, { color: colors.onError }]}>Retry</Text>
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
            No celebrity relationships found.
          </Text>
          <Text style={[styles.noResultsSubtext, { color: colors.onSurfaceVariant }]}>
            Celebrity relationships will appear here once they are created.
          </Text>
        </View>
      ) : (
        <FlatList
          data={relationships}
          renderItem={renderRelationshipItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.listContainer}
          style={styles.relationshipsList}
        />
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
  celebrityPair: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  celebrityInfo: {
    flex: 1,
    alignItems: 'center',
  },
  celebrityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  celebrityDOB: {
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
  viewAnalysisContainer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  viewAnalysisText: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CelebrityRelationships;
