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
import { useTheme } from '../../theme';

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
  const { colors } = useTheme();
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
      const result = await relationshipsApi.enhancedRelationshipAnalysis(
        currentUserId,
        selectedPerson._id
      );

      if (result.success && result.compositeChartId) {
        console.log('Enhanced relationship analysis result:', result);

        // Transform the response to match UserCompositeChart interface expected by RelationshipAnalysisScreen
        const transformedRelationship = {
          _id: result.compositeChartId,
          userA_name: userData.name || `${userData.firstName} ${userData.lastName}` || 'You',
          userB_name: `${selectedPerson.firstName} ${selectedPerson.lastName}`,
          userA_id: currentUserId,
          userB_id: selectedPerson._id,
          createdAt: new Date().toISOString(),
          // Include the enhanced analysis data - the API returns these in enhancedAnalysis object
          scores: result.enhancedAnalysis?.scores,
          clusterAnalysis: result.enhancedAnalysis?.clusterAnalysis,
          holisticOverview: result.enhancedAnalysis?.holisticOverview,
          tensionFlowAnalysis: result.enhancedAnalysis?.tensionFlowAnalysis,
          scoreAnalysis: result.enhancedAnalysis?.scoreAnalysis,
          // Include chart data - these are returned at the root level of the response
          synastryAspects: result.synastryAspects,
          compositeChart: result.compositeChart,
          synastryHousePlacements: result.synastryHousePlacements,
          // Store the entire enhanced analysis for the analysis screen
          enhancedAnalysis: result.enhancedAnalysis,
          // Add other required fields with default values
          userA_dateOfBirth: '',
          userB_dateOfBirth: '',
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
              },
            },
            {
              text: 'View Analysis',
              onPress: () => {
                (navigation as any).navigate('RelationshipAnalysis', {
                  relationship: transformedRelationship,
                });
              },
            },
          ]
        );
      } else {
        throw new Error('Failed to create relationship - invalid response');
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Create New Relationship</Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            Choose someone to analyze compatibility with
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
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
                activeTab === tab.id && [styles.activeTab, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => handleTabSwitch(tab.id)}
            >
              <Text style={[
                styles.tabText,
                { color: colors.onSurfaceVariant },
                activeTab === tab.id && [styles.activeTabText, { color: colors.primary }],
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
        <View style={[styles.selectionContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.selectionInfo}>
            <Text style={[styles.selectionTitle, { color: colors.onSurfaceVariant }]}>Selected:</Text>
            <Text style={[styles.selectionName, { color: colors.onSurface }]}>
              {selectedPerson.firstName} {selectedPerson.lastName}
            </Text>
            <Text style={[styles.selectionDetails, { color: colors.onSurfaceVariant }]}>
              Born: {new Date(selectedPerson.dateOfBirth).toLocaleDateString()}
              {selectedPerson.placeOfBirth && ` in ${selectedPerson.placeOfBirth}`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }, isCreating && [styles.createButtonDisabled, { backgroundColor: colors.onSurfaceVariant }]]}
            onPress={handleCreateRelationship}
            disabled={isCreating}
          >
            {isCreating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.onPrimary} />
                <Text style={[styles.createButtonText, { color: colors.onPrimary }]}>Creating...</Text>
              </View>
            ) : (
              <Text style={[styles.createButtonText, { color: colors.onPrimary }]}>✨ Create Relationship</Text>
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
  },
  header: {
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  tabContainer: {
    borderBottomWidth: 1,
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
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  selectionContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  selectionInfo: {
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectionName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectionDetails: {
    fontSize: 14,
  },
  createButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CreateRelationshipScreen;
