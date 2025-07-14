import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useStore } from '../../store';

const RelationshipsScreen: React.FC = () => {
  const { userData } = useStore();

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view relationships</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relationship Compatibility</Text>
        <Text style={styles.sectionSubtitle}>
          Discover cosmic connections and compatibility insights
        </Text>
      </View>

      {/* Create New Relationship */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create New Analysis</Text>
        
        <TouchableOpacity style={styles.actionButton} disabled>
          <Text style={styles.actionButtonText}>💕 Add Partner</Text>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} disabled>
          <Text style={styles.actionButtonText}>⭐ Celebrity Match</Text>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </TouchableOpacity>
      </View>

      {/* Existing Relationships */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Relationships</Text>
        <Text style={styles.sectionSubtitle}>
          No relationships analyzed yet
        </Text>
        
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💫</Text>
          <Text style={styles.emptyStateText}>
            Start by creating your first relationship analysis to discover cosmic compatibility insights
          </Text>
        </View>
      </View>

      {/* Compatibility Categories Preview */}
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

      {/* Synastry Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Synastry</Text>
        <Text style={styles.infoText}>
          Synastry is the astrological practice of comparing two birth charts to understand relationship dynamics. 
          Our AI analyzes planetary aspects, house placements, and cosmic patterns to provide detailed 
          compatibility insights across seven key relationship areas.
        </Text>
      </View>
    </ScrollView>
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
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '500',
  },
  comingSoonText: {
    color: '#9ca3af',
    fontSize: 12,
    fontStyle: 'italic',
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
});

export default RelationshipsScreen;