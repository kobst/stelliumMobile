import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import UserRelationships from '../../components/UserRelationships';

const RelationshipsScreen: React.FC = () => {
  const { userData } = useStore();
  const navigation = useNavigation();

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view relationships</Text>
      </View>
    );
  }

  const headerSections = [
    {
      id: 'header',
      component: (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relationship Compatibility</Text>
          <Text style={styles.sectionSubtitle}>
            Discover cosmic connections and compatibility insights
          </Text>
        </View>
      ),
    },
    {
      id: 'create',
      component: (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create New Analysis</Text>
          
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={() => (navigation as any).navigate('CreateRelationship')}
          >
            <Text style={styles.createButtonText}>✨ Create New Relationship</Text>
            <Text style={styles.createButtonSubtext}>Choose from guests or celebrities</Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      id: 'relationships',
      component: (
        <View style={styles.relationshipsSection}>
          <UserRelationships
            onRelationshipPress={(relationship) => {
              console.log('Navigate to relationship analysis:', relationship);
              (navigation as any).navigate('RelationshipAnalysis', { relationship });
            }}
          />
        </View>
      ),
    },
    {
      id: 'categories',
      component: (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compatibility Analysis</Text>
          <Text style={styles.sectionSubtitle}>
            Our analysis covers these key areas:
          </Text>
          
          <View style={styles.categoryList}>
            {[
              '💫 Overall Attraction & Chemistry',
              '🏡 Emotional Security & Connection',
              '💬 Communication & Learning',
              '🎯 Values, Goals & Life Direction',
              '🔥 Intimacy & Sexuality',
              '💍 Long-term Stability',
              '🌟 Spiritual Growth',
            ].map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ))}
          </View>
        </View>
      ),
    },
    {
      id: 'synastry',
      component: (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Synastry</Text>
          <Text style={styles.infoText}>
            Synastry is the astrological practice of comparing two birth charts to understand relationship dynamics. 
            Our AI analyzes planetary aspects, house placements, and cosmic patterns to provide detailed 
            compatibility insights across seven key relationship areas.
          </Text>
        </View>
      ),
    },
  ];

  return (
    <FlatList
      style={styles.container}
      data={headerSections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => item.component}
      showsVerticalScrollIndicator={true}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  createButtonSubtext: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  emptyStateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryList: {
    marginTop: 8,
  },
  categoryItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  categoryText: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    padding: 32,
  },
  relationshipsSection: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
});

export default RelationshipsScreen;