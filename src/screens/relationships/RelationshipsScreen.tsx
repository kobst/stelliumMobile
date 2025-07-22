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
import { useTheme } from '../../theme';

const RelationshipsScreen: React.FC = () => {
  const { userData } = useStore();
  const navigation = useNavigation();
  const { colors } = useTheme();

  if (!userData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Please sign in to view relationships</Text>
      </View>
    );
  }

  const headerSections = [
    {
      id: 'header',
      component: (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Relationship Compatibility</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
            Discover cosmic connections and compatibility insights
          </Text>
        </View>
      ),
    },
    {
      id: 'create',
      component: (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Create New Analysis</Text>
          
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: colors.primary }]} 
            onPress={() => (navigation as any).navigate('CreateRelationship')}
          >
            <Text style={[styles.createButtonText, { color: colors.onPrimary }]}>✨ Create New Relationship</Text>
            <Text style={[styles.createButtonSubtext, { color: colors.onPrimary }]}>Choose from guests or celebrities</Text>
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
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Compatibility Analysis</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
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
              <View key={index} style={[styles.categoryItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.categoryText, { color: colors.onSurface }]}>{category}</Text>
              </View>
            ))}
          </View>
        </View>
      ),
    },
    {
      id: 'synastry',
      component: (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>About Synastry</Text>
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
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
      style={[styles.container, { backgroundColor: colors.background }]}
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
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  createButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  createButtonSubtext: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  emptyStateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryList: {
    marginTop: 8,
  },
  categoryItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
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