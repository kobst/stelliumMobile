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
import { relationshipsApi, UserCompositeChart } from '../../api/relationships';
import { Celebrity } from '../../api/celebrities';
import GuestUsersTab from '../../components/GuestUsersTab';
import CelebritiesTab from '../../components/CelebritiesTab';
import { useTheme } from '../../theme';
import { parseDateStringAsLocalDate } from '../../utils/dateHelpers';

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
        selectedPerson._id,
        currentUserId // ownerUserId
      );

      if (result.success && result.compositeChartId) {
        console.log('Enhanced relationship analysis result:', result);
        console.log('result.clusters:', result.clusters);
        console.log('result.overall:', result.overall);
        console.log('result.synastryAspects:', result.synastryAspects);
        console.log('result.compositeChart:', result.compositeChart);
        console.log('result.synastryHousePlacements:', result.synastryHousePlacements);

        // Create unified clusterScoring structure for backward compatibility
        const unifiedClusterScoring = {
          clusters: result.clusters,
          overall: result.overall,
          scoredItems: result.scoredItems,
        };

        // Direct 5-cluster integration
        const v3Relationship: UserCompositeChart = {
          _id: result.compositeChartId,
          userA_name: result.userA.name,
          userB_name: result.userB.name,
          userA_id: result.userA.id,
          userB_id: result.userB.id,
          createdAt: result.metadata.processingTime,
          userA_dateOfBirth: '',
          userB_dateOfBirth: '',

          // 5-Cluster Analysis Data (unified structure for backward compatibility)
          clusterScoring: unifiedClusterScoring,
          completeAnalysis: result.completeAnalysis,
          initialOverview: result.initialOverview,

          // Chart Data
          synastryAspects: result.synastryAspects,
          compositeChart: result.compositeChart,
          synastryHousePlacements: result.synastryHousePlacements,
        };

        Alert.alert(
          'Success!',
          `${result.overall?.tier || 'New'} relationship with ${selectedPerson.firstName} ${selectedPerson.lastName} created! Your profile: ${result.overall?.profile || 'Compatibility analysis complete'}`,
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
                console.log('Navigating with v3Relationship:', v3Relationship);
                console.log('v3Relationship.clusterScoring:', v3Relationship.clusterScoring);
                console.log('v3Relationship.synastryAspects:', v3Relationship.synastryAspects);
                console.log('v3Relationship.compositeChart:', v3Relationship.compositeChart);
                console.log('v3Relationship.synastryHousePlacements:', v3Relationship.synastryHousePlacements);
                (navigation as any).navigate('RelationshipAnalysis', {
                  relationship: v3Relationship,
                });
              },
            },
          ]
        );
      } else {
        throw new Error('Failed to create relationship - invalid response');
      }
    } catch (error: any) {
      console.error('Error creating V3 relationship:', error);
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
              Born: {parseDateStringAsLocalDate(selectedPerson.dateOfBirth).toLocaleDateString()}
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
