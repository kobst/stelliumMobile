import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '../../store';
import { useChart } from '../../hooks/useChart';
import { ChartTabNavigator } from '../../components';
import { useTheme } from '../../theme';
import { AnalysisHeader } from '../../components/navigation/AnalysisHeader';
import { TopTabBar } from '../../components/navigation/TopTabBar';
import { StickySegment } from '../../components/navigation/StickySegment';
import { SectionSubtitle } from '../../components/navigation/SectionSubtitle';
import ChartContainer from '../../components/chart/ChartContainer';
import ChartWheel from '../../components/chart/ChartWheel';
import ChartTables from '../../components/chart/ChartTables';
import PatternsTab from '../../components/chart/PatternsTab';
import PlanetsTab from '../../components/chart/PlanetsTab';
import AnalysisTab from '../../components/chart/AnalysisTab';
import BirthChartChatTab from '../../components/chart/BirthChartChatTab';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { BirthChartElement } from '../../api/charts';
import { parseDateStringAsLocalDate } from '../../utils/dateHelpers';
import { extractPlanetaryData } from '../../utils/chartHelpers';
import { AstroIcon } from '../../../utils/astrologyIcons';
import {
  pickImageFromLibrary,
  pickImageFromCamera,
  uploadProfilePhotoPresigned,
  ImageResult,
} from '../../utils/imageHelpers';
import { usersApi } from '../../api/users';

const ChartScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { userData } = useStore();
  const { colors } = useTheme();

  // Use the subject passed from navigation, or fall back to logged-in user
  const [subject, setSubject] = useState(route.params?.subject || userData);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Helper to get subject ID from either User or SubjectDocument type
  const getSubjectId = (subject: any): string | undefined => {
    return subject?.id || subject?._id;
  };

  // Helper to get subject name from either User or SubjectDocument type
  const getSubjectName = (subject: any): string => {
    if (!subject) return 'Unknown';

    // Handle SubjectDocument type (has firstName and lastName)
    if (subject.firstName && subject.lastName) {
      return `${subject.firstName} ${subject.lastName}`;
    }

    // Handle User type (has name field)
    if (subject.name) {
      return subject.name;
    }

    return 'Unknown';
  };

  // Update subject when route params change
  useEffect(() => {
    setSubject(route.params?.subject || userData);
  }, [route.params?.subject, userData]);

  // Refresh subject data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshSubjectData = async () => {
        const subjectId = getSubjectId(route.params?.subject || userData);
        if (!subjectId) return;

        // Only refresh if this is a guest subject (not home user)
        if (subjectId === userData?.id) {
          // For home user, just use userData from store
          setSubject(userData);
          return;
        }

        try {
          console.log('ChartScreen - Refreshing subject data on focus for:', subjectId);
          const updatedSubjectDoc = await usersApi.getUser(subjectId);
          setSubject(updatedSubjectDoc);
          console.log('ChartScreen - Subject refreshed:', {
            _id: updatedSubjectDoc._id,
            firstName: updatedSubjectDoc.firstName,
            lastName: updatedSubjectDoc.lastName,
            profilePhotoUrl: updatedSubjectDoc.profilePhotoUrl,
          });
        } catch (error) {
          console.error('Failed to refresh subject data:', error);
        }
      };

      refreshSubjectData();
    }, [route.params?.subject, userData])
  );

  // Guest photo management handlers
  const handleGuestPhotoLongPress = () => {
    const subjectId = getSubjectId(subject);
    if (!subjectId) return;

    // Only show photo management for guest subjects (not home user)
    if (subjectId === userData?.id) return;

    const options = [
      {
        text: 'Change Photo',
        onPress: () => handleChangeGuestPhoto(),
      },
    ];

    if (subject.profilePhotoUrl) {
      options.push({
        text: 'Remove Photo',
        onPress: () => handleRemoveGuestPhoto(),
        style: 'destructive' as const,
      });
    }

    options.push({
      text: 'Cancel',
      style: 'cancel' as const,
    });

    Alert.alert('Profile Photo', 'Select an option', options);
  };

  const handleChangeGuestPhoto = () => {
    Alert.alert(
      'Choose Photo Source',
      'Select where to get the photo from:',
      [
        {
          text: 'Photo Library',
          onPress: async () => {
            const result = await pickImageFromLibrary();
            if (result) {
              await handleGuestImageSelected(result);
            }
          },
        },
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await pickImageFromCamera();
            if (result) {
              await handleGuestImageSelected(result);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleGuestImageSelected = async (imageResult: ImageResult) => {
    const subjectId = getSubjectId(subject);
    if (!subjectId) return;

    setIsUploadingPhoto(true);

    try {
      console.log('ChartScreen - Starting guest photo upload for subject:', subjectId);
      const result = await uploadProfilePhotoPresigned(
        subjectId,
        imageResult.uri,
        imageResult.type
      );

      console.log('ChartScreen - Upload result:', result);

      // Refresh subject data from API to get updated photo
      console.log('ChartScreen - Fetching updated subject data...');
      const updatedSubjectDoc = await usersApi.getUser(subjectId);
      console.log('ChartScreen - Raw updated subject from API:', {
        _id: updatedSubjectDoc._id,
        firstName: updatedSubjectDoc.firstName,
        lastName: updatedSubjectDoc.lastName,
        profilePhotoUrl: updatedSubjectDoc.profilePhotoUrl,
        profilePhotoKey: updatedSubjectDoc.profilePhotoKey,
        profilePhotoUpdatedAt: updatedSubjectDoc.profilePhotoUpdatedAt,
      });

      // Update the subject state directly with the SubjectDocument
      // (ProfileAvatar can handle both User and SubjectDocument types)
      setSubject(updatedSubjectDoc);
      console.log('ChartScreen - Subject state updated with new photo data');

      Alert.alert('Success', 'Profile photo updated successfully');
    } catch (error: any) {
      console.error('Failed to upload guest profile photo:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload profile photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemoveGuestPhoto = async () => {
    const subjectId = getSubjectId(subject);
    if (!subjectId) return;

    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsUploadingPhoto(true);

            try {
              console.log('ChartScreen - Removing photo for subject:', subjectId);
              await usersApi.deleteProfilePhoto(subjectId);

              // Refresh subject data from API
              console.log('ChartScreen - Fetching updated subject after removal...');
              const updatedSubjectDoc = await usersApi.getUser(subjectId);
              console.log('ChartScreen - Updated subject after removal:', {
                _id: updatedSubjectDoc._id,
                profilePhotoUrl: updatedSubjectDoc.profilePhotoUrl,
                profilePhotoKey: updatedSubjectDoc.profilePhotoKey,
              });
              setSubject(updatedSubjectDoc);

              Alert.alert('Success', 'Profile photo removed successfully');
            } catch (error: any) {
              console.error('Failed to remove guest profile photo:', error);
              Alert.alert('Remove Failed', error.message || 'Failed to remove profile photo');
            } finally {
              setIsUploadingPhoto(false);
            }
          },
        },
      ]
    );
  };

  const {
    overview,
    fullAnalysis,
    loading: chartLoading,
    error: chartError,
    loadFullAnalysis,
    clearError,
    hasAnalysisData,
    workflowState,
    isAnalysisInProgress,
  } = useChart(getSubjectId(subject));

  // Navigation state
  const [activeTab, setActiveTab] = useState('chart');
  const [activeSubTab, setActiveSubTab] = useState('wheel');

  const topTabs = [
    { label: 'Chart', routeName: 'chart' },
    { label: 'Overview', routeName: 'overview' },
    { label: 'Patterns & Dominance', routeName: 'patterns' },
    { label: 'Planets', routeName: 'planets' },
    { label: '360 Analysis', routeName: 'analysis' },
    { label: 'Ask Stellium', routeName: 'chat' },
  ];

  const chartSubTabs = [
    { label: 'Wheel', value: 'wheel' },
    { label: 'Tables', value: 'tables' },
  ];

  // Helper to get planetary signs description
  const getPlanetarySignsElement = (subject: any) => {
    if (!subject?.birthChart) {return null;}

    try {
      const planetaryData = extractPlanetaryData(subject);

      return (
        <View style={styles.planetarySignsContainer}>
          {planetaryData.sun.sign && (
            <View style={styles.signGroup}>
              <AstroIcon type="planet" name="Sun" size={12} color={colors.onSurfaceHigh} />
              <Text style={[styles.signText, { color: colors.onSurfaceHigh }]}>
                {planetaryData.sun.sign}
              </Text>
            </View>
          )}
          {planetaryData.moon.sign && (
            <>
              <Text style={[styles.separator, { color: colors.onSurfaceHigh }]}>•</Text>
              <View style={styles.signGroup}>
                <AstroIcon type="planet" name="Moon" size={12} color={colors.onSurfaceHigh} />
                <Text style={[styles.signText, { color: colors.onSurfaceHigh }]}>
                  {planetaryData.moon.sign}
                </Text>
              </View>
            </>
          )}
          {planetaryData.ascendant?.sign && (
            <>
              <Text style={[styles.separator, { color: colors.onSurfaceHigh }]}>•</Text>
              <View style={styles.signGroup}>
                <AstroIcon type="planet" name="Ascendant" size={12} color={colors.onSurfaceHigh} />
                <Text style={[styles.signText, { color: colors.onSurfaceHigh }]}>
                  {planetaryData.ascendant.sign}
                </Text>
              </View>
            </>
          )}
        </View>
      );
    } catch (error) {
      return null;
    }
  };

  // Create birth date/time/location string
  const getBirthInfo = (subject: any): string => {
    if (!subject) {return '';}

    try {
      // Handle different date formats
      let birthDate: Date;
      if (subject.dateOfBirth) {
        // SubjectDocument type (date-only safe parse)
        birthDate = parseDateStringAsLocalDate(subject.dateOfBirth);
      } else if (subject.birthYear && subject.birthMonth && subject.birthDay) {
        // User type
        birthDate = new Date(subject.birthYear, subject.birthMonth - 1, subject.birthDay);
      } else {
        return '';
      }

      const formattedDate = birthDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      // Handle time information
      let timeString = '';
      if (subject.time && !subject.birthTimeUnknown) {
        timeString = ` at ${subject.time}`;
      } else if (subject.birthHour !== undefined && subject.birthMinute !== undefined &&
                 !(subject.birthHour === 12 && subject.birthMinute === 0)) {
        const hour = subject.birthHour === 0 ? 12 : subject.birthHour > 12 ? subject.birthHour - 12 : subject.birthHour;
        const minute = subject.birthMinute.toString().padStart(2, '0');
        const period = subject.birthHour >= 12 ? 'PM' : 'AM';
        timeString = ` at ${hour}:${minute} ${period}`;
      }

      // Handle location
      const location = subject.placeOfBirth || subject.birthLocation;
      const locationString = location ? ` in ${location}` : '';

      return `${formattedDate}${timeString}${locationString}`;
    } catch (error) {
      return '';
    }
  };


  useEffect(() => {
    if (subject?.birthChart) {
      loadFullAnalysis();
    }
  }, [subject?.birthChart, loadFullAnalysis]);

  const getSectionSubtitle = () => {
    switch (activeTab) {
      case 'chart':
        return null;
      case 'patterns':
        return null;
      case 'planets':
        return null;
      case 'analysis':
        return null;
      default:
        return null;
    }
  };

  if (!subject) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Please sign in to view birth charts</Text>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'chart':
        if (chartLoading) {
          return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading birth chart...</Text>
            </View>
          );
        }

        if (chartError) {
          return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>Failed to load chart data</Text>
              <Text style={[styles.noOverviewText, { color: colors.onSurfaceVariant }]}>{chartError}</Text>
            </View>
          );
        }

        return (
          <View style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={[styles.wheelSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ChartWheel
                  birthChart={subject?.birthChart}
                  showAspects={true}
                  showHouses={true}
                />
              </View>
              <View style={{ height: 500 }}>
                <ChartTables birthChart={subject?.birthChart} />
              </View>
            </ScrollView>
          </View>
        );
      case 'overview':
        return (
          <ScrollView
            style={[styles.overviewContainer, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
          >
            {overview ? (
              <View style={[styles.overviewSection, { backgroundColor: colors.surface }]}>
                <Text style={[styles.overviewText, { color: colors.onSurfaceVariant }]}>{overview}</Text>
              </View>
            ) : (
              <View style={[styles.noOverviewContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.noOverviewText, { color: colors.onSurfaceVariant }]}>
                  Chart overview not available
                </Text>
              </View>
            )}
          </ScrollView>
        );
      case 'patterns':
        return <PatternsTab userId={getSubjectId(subject)} birthChart={subject?.birthChart} />;
      case 'planets':
        return <PlanetsTab userId={getSubjectId(subject)} birthChart={subject?.birthChart} />;
      case 'analysis':
        return <AnalysisTab userId={getSubjectId(subject)} birthChart={subject?.birthChart} />;
      case 'chat':
        return <BirthChartChatTab subjectId={getSubjectId(subject)!} birthChart={subject?.birthChart} />;
      default:
        return null;
    }
  };

  const planetarySigns = getPlanetarySignsElement(subject);
  const birthInfo = getBirthInfo(subject);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Analysis Header */}
      <AnalysisHeader
        title={getSubjectName(subject)}
        subtitle={planetarySigns || birthInfo}
        meta={planetarySigns ? birthInfo : undefined}
        subject={subject}
        onAvatarLongPress={subject && getSubjectId(subject) !== userData?.id ? handleGuestPhotoLongPress : undefined}
      />

      {/* Top Tab Bar */}
      <TopTabBar
        items={topTabs}
        activeRoute={activeTab}
        onTabPress={setActiveTab}
      />

      {/* Section Subtitle */}
      {getSectionSubtitle() && (
        <SectionSubtitle
          icon={getSectionSubtitle()!.icon}
          title={getSectionSubtitle()!.title}
          desc={getSectionSubtitle()!.desc}
        />
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Error Handling */}
      {chartError && (
        <View style={[styles.errorSection, { backgroundColor: colors.surface, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>Chart Error: {chartError}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.error }]} onPress={clearError}>
            <Text style={[styles.retryButtonText, { color: colors.onError }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <LoadingOverlay visible={isUploadingPhoto} message="Updating photo..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  planetarySignsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  signGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  signText: {
    fontSize: 13,
    fontWeight: '400',
  },
  separator: {
    fontSize: 13,
    marginHorizontal: 4,
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
  lockedTabContainer: {
    flex: 1,
  },
  lockedTabContent: {
    padding: 16,
  },
  lockedTabHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  lockedTabSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  missingAnalysisContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  overviewContainer: {
    flex: 1,
  },
  overviewHeader: {
    padding: 20,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  overviewSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  overviewText: {
    fontSize: 16,
    lineHeight: 24,
  },
  noOverviewContainer: {
    margin: 16,
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  noOverviewText: {
    fontSize: 14,
    textAlign: 'center',
  },
  wheelSection: {
    alignItems: 'center',
    padding: 8,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
  },
});

export default ChartScreen;
