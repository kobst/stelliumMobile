import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { celebritiesApi, CelebrityRelationship } from '../api/celebrities';

interface CelebrityRelationshipsProps {
  onCelebrityPress?: (celebrity: any) => void;
}

const CelebrityRelationships: React.FC<CelebrityRelationshipsProps> = ({ onCelebrityPress }) => {
  const { userData } = useStore();
  const { colors } = useTheme();
  const [relationships, setRelationships] = useState<CelebrityRelationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRelationships();
  }, []);

  const loadRelationships = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await celebritiesApi.getCelebrityRelationships(50);
      setRelationships(response);
    } catch (err) {
      console.error('Failed to load celebrity relationships:', err);
      setError('Failed to load celebrity relationships');
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (item: CelebrityRelationship, userType: 'A' | 'B') => {
    if (userType === 'A') {
      // If we have separate first/last name fields, use them
      if (item.userA_firstName && item.userA_lastName) {
        return `${item.userA_firstName} ${item.userA_lastName}`;
      }
      // Otherwise use the full name field
      return item.userA_name;
    } else {
      // If we have separate first/last name fields, use them
      if (item.userB_firstName && item.userB_lastName) {
        return `${item.userB_firstName} ${item.userB_lastName}`;
      }
      // Otherwise use the full name field
      return item.userB_name;
    }
  };

  const renderRelationshipItem = ({ item }: { item: CelebrityRelationship }) => (
    <TouchableOpacity
      style={[styles.relationshipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => {
        // Future: Navigate to relationship analysis
        console.log('Selected relationship:', item);
      }}
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
