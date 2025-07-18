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
import { celebritiesApi, CelebrityRelationship } from '../api/celebrities';

interface CelebrityRelationshipsProps {
  onCelebrityPress?: (celebrity: any) => void;
}

const CelebrityRelationships: React.FC<CelebrityRelationshipsProps> = ({ onCelebrityPress }) => {
  const { userData } = useStore();
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

  const renderRelationshipItem = ({ item }: { item: CelebrityRelationship }) => (
    <TouchableOpacity 
      style={styles.relationshipCard}
      onPress={() => {
        // Future: Navigate to relationship analysis
        console.log('Selected relationship:', item);
      }}
    >
      <View style={styles.relationshipHeader}>
        <Text style={styles.relationshipTitle}>Celebrity Relationship</Text>
        <Text style={styles.createdDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.celebrityPair}>
        <View style={styles.celebrityInfo}>
          <Text style={styles.celebrityName}>{item.userA_name}</Text>
          <Text style={styles.celebrityDOB}>
            {new Date(item.userA_dateOfBirth).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.separator}>
          <Text style={styles.separatorText}>♥</Text>
        </View>
        
        <View style={styles.celebrityInfo}>
          <Text style={styles.celebrityName}>{item.userB_name}</Text>
          <Text style={styles.celebrityDOB}>
            {new Date(item.userB_dateOfBirth).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.viewAnalysisContainer}>
        <Text style={styles.viewAnalysisText}>Tap to view analysis →</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading celebrity relationships...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorSection}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRelationships}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {relationships.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No celebrity relationships found.
          </Text>
          <Text style={styles.noResultsSubtext}>
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
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 32,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 32,
  },
  noResultsText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    color: '#64748b',
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
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
  createdDate: {
    color: '#64748b',
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  celebrityDOB: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  separator: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  separatorText: {
    color: '#8b5cf6',
    fontSize: 20,
  },
  viewAnalysisContainer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  viewAnalysisText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
  },
  errorSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#ef4444',
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

export default CelebrityRelationships;