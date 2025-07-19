import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { relationshipsApi } from '../../api/relationships';
import { Celebrity } from '../../api/celebrities';
import GuestUsersTab from '../../components/GuestUsersTab';
import CelebritiesTab from '../../components/CelebritiesTab';

interface GuestUser {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  gender?: string;
}

type SelectedPerson = GuestUser | Celebrity;

interface TabInfo {
  id: string;
  label: string;
  component: React.ReactNode;
}

const CreateRelationshipScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userData } = useStore();
  const [activeTab, setActiveTab] = useState('guests');
  const [selectedPerson, setSelectedPerson] = useState<SelectedPerson | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleTabSwitch = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedPerson(null); // Reset selection when switching tabs
  };

  const handlePersonSelect = (person: SelectedPerson) => {
    setSelectedPerson(person);
  };

  const handleCreateRelationship = async () => {
    if (!selectedPerson || !userData) {
      Alert.alert('Error', 'Please select a person to create a relationship with.');
      return;
    }

    const currentUserId = userData.userId || userData.id;
    if (!currentUserId) {
      Alert.alert('Error', 'User ID not found. Please try logging in again.');
      return;
    }

    setIsCreating(true);

    try {
      const result = await relationshipsApi.createRelationshipDirect(
        currentUserId,
        selectedPerson._id
      );

      if (result.success && result.relationship) {
        // Transform the response to match UserCompositeChart interface expected by RelationshipAnalysisScreen
        const transformedRelationship = {
          _id: result.relationship.compositeChartId,
          userA_name: result.relationship.userA.name,
          userB_name: result.relationship.userB.name,
          userA_id: result.relationship.userA.id,
          userB_id: result.relationship.userB.id,
          createdAt: new Date().toISOString(),
          // Include the enhanced analysis data if available
          enhancedAnalysis: result.relationship.enhancedAnalysis,
          profileAnalysis: result.relationship.profileAnalysis,
          // Include chart data for immediate display
          compositeChart: result.relationship.compositeChart,
          synastryAspects: result.relationship.synastryAspects,
          synastryHousePlacements: result.relationship.synastryHousePlacements,
          // Add other required fields with default values
          userA_dateOfBirth: '',
          userB_dateOfBirth: '',
          metadata: result.relationship.metadata,
        };

        Alert.alert(
          'Success!',
          `Relationship with ${selectedPerson.firstName} ${selectedPerson.lastName} created successfully!`,
          [
            {
              text: 'Back to Relationships',
              style: 'cancel',
              onPress: () => {
                navigation.goBack();
              }
            },
            {
              text: 'View Analysis',
              onPress: () => {
                (navigation as any).navigate('RelationshipAnalysis', {
                  relationship: transformedRelationship
                });
              }
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Failed to create relationship');
      }
    } catch (error: any) {
      console.error('Error creating relationship:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create relationship. Please try again.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const tabs: TabInfo[] = [
    {
      id: 'guests',
      label: 'Guest Users',
      component: (
        <GuestUsersTab
          selectedPerson={activeTab === 'guests' ? selectedPerson as GuestUser : null}
          onPersonSelect={handlePersonSelect}
        />
      ),
    },
    {
      id: 'celebrities',
      label: 'Celebrities',
      component: (
        <CelebritiesTab
          selectedPerson={activeTab === 'celebrities' ? selectedPerson as Celebrity : null}
          onPersonSelect={handlePersonSelect}
        />
      ),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Create New Relationship</Text>
          <Text style={styles.headerSubtitle}>
            Choose someone to analyze compatibility with
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab,
              ]}
              onPress={() => handleTabSwitch(tab.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {tabs.find(tab => tab.id === activeTab)?.component}
      </View>

      {/* Selection Status and Create Button */}
      {selectedPerson && (
        <View style={styles.selectionContainer}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionTitle}>Selected:</Text>
            <Text style={styles.selectionName}>
              {selectedPerson.firstName} {selectedPerson.lastName}
            </Text>
            <Text style={styles.selectionDetails}>
              Born: {new Date(selectedPerson.dateOfBirth).toLocaleDateString()}
              {selectedPerson.placeOfBirth && ` in ${selectedPerson.placeOfBirth}`}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.createButton, isCreating && styles.createButtonDisabled]}
            onPress={handleCreateRelationship}
            disabled={isCreating}
          >
            {isCreating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.createButtonText}>Creating...</Text>
              </View>
            ) : (
              <Text style={styles.createButtonText}>✨ Create Relationship</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '500',
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  tabContainer: {
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tabScrollContainer: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8b5cf6',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  selectionContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  selectionInfo: {
    marginBottom: 16,
  },
  selectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectionName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectionDetails: {
    color: '#94a3b8',
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#6b5b95',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CreateRelationshipScreen;