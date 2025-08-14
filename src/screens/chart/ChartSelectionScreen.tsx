import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { usersApi, PaginatedUserSubjectsResponse } from '../../api';
import { SubjectDocument } from '../../types';
import { userTransformers } from '../../transformers/user';
import { useTheme } from '../../theme';
import AddFooterButton from '../../components/AddFooterButton';
import UpgradeBanner from '../../components/UpgradeBanner';
import { HeaderWithProfile } from '../../components/navigation';
import PlanetaryIcons from '../../components/chart/PlanetaryIcons';
import AnalysisTypeIndicator from '../../components/chart/AnalysisTypeIndicator';

const ChartSelectionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userData } = useStore();
  const { colors } = useTheme();
  const [guestSubjects, setGuestSubjects] = useState<SubjectDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadGuestSubjects();
  }, []);

  const loadGuestSubjects = async (isRefresh = false) => {
    if (!userData?.id) {return;}

    if (isRefresh) {
      setRefreshing(true);
      setCurrentPage(1);
      setGuestSubjects([]);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await usersApi.getUserSubjects({
        ownerUserId: userData.id,
        usePagination: true,
        page: isRefresh ? 1 : currentPage,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }) as PaginatedUserSubjectsResponse;

      if (result.success) {
        const guests = result.data.filter((s: SubjectDocument) => s.kind === 'guest');

        if (isRefresh) {
          setGuestSubjects(guests);
        } else {
          setGuestSubjects(prev => [...prev, ...guests]);
        }

        setHasMore(result.pagination.hasNext);
        if (!isRefresh) {
          setCurrentPage(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('Error loading guest subjects:', err);
      setError('Failed to load charts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      loadGuestSubjects();
    }
  };

  const handleRefresh = () => {
    loadGuestSubjects(true);
  };

  const handleSelectChart = (subject: SubjectDocument | null) => {
    // If null, use the logged-in user's data
    const selectedSubject = subject ? userTransformers.subjectDocumentToUser(subject) : userData;
    navigation.navigate('ChartMain', { subject: selectedSubject });
  };

  const handleAddNewChart = () => {
    navigation.navigate('GuestOnboarding', {
      onGuestCreated: () => {
        // Refresh the list when a new guest is created
        handleRefresh();
      },
    });
  };


  if (!userData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderWithProfile title="Birth Charts" showSafeArea={false} />
        <View style={styles.content}>
          <Text style={[styles.errorText, { color: colors.error }]}>Please sign in to view charts</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderWithProfile title="Birth Charts" showSafeArea={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
      {/* My Birth Chart Section */}
      <Text style={[styles.header, { color: colors.onSurface }]}>My Birth Chart</Text>

      {/* Compact My Birth Chart Row */}
      <TouchableOpacity
        style={[styles.compactChartCard, { backgroundColor: colors.surface }]}
        onPress={() => handleSelectChart(null)}
        activeOpacity={0.8}
      >
        <View style={[styles.compactChartAvatar, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.avatarText, { color: colors.onSurfaceVariant }]}>
            {userData.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </Text>
        </View>
        <View style={styles.compactChartInfo}>
          <Text style={[styles.compactChartTitle, { color: colors.onSurface }]}>
            {userData.name}
          </Text>
          <PlanetaryIcons user={userData} />
          <Text style={[styles.compactChartSubtitle, { color: colors.onSurfaceVariant }]}>
            {new Date(userData.birthYear, userData.birthMonth - 1, userData.birthDay).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })} - {userData.birthLocation}
          </Text>
          <AnalysisTypeIndicator hasCompleteAnalysis={false} />
        </View>
        <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>›</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Friends & Family Section */}
      <Text style={[styles.sectionHeader, { color: colors.onSurface }]}>Friends & Family</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : (
        <>
          {guestSubjects.map((subject) => {
            const birthDate = new Date(subject.dateOfBirth);

            return (
              <TouchableOpacity
                key={subject._id}
                style={[styles.guestCard, { backgroundColor: colors.surface }]}
                onPress={() => handleSelectChart(subject)}
                activeOpacity={0.8}
              >
                <View style={[styles.guestAvatar, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.avatarText, { color: colors.onSurfaceVariant }]}>
                    {subject.firstName[0]}{subject.lastName[0]}
                  </Text>
                </View>
                <View style={styles.guestInfo}>
                  <Text style={[styles.guestName, { color: colors.onSurface }]}>
                    {subject.firstName} {subject.lastName}
                  </Text>
                  <PlanetaryIcons subject={subject} />
                  <Text style={[styles.guestDetails, { color: colors.onSurfaceVariant }]}>
                    {birthDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })} - {subject.placeOfBirth}
                  </Text>
                  <AnalysisTypeIndicator hasCompleteAnalysis={false} />
                </View>
                <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>›</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

        {/* Loading indicator for pagination */}
        {loading && !refreshing && guestSubjects.length > 0 && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.paginationLoader} />
        )}
      </ScrollView>

      {/* Footer Button */}
      <AddFooterButton
        title="+ Add New Birth Chart"
        onPress={handleAddNewChart}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  // Compact My Birth Chart Row (96px height)
  compactChartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 96,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  compactChartAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  compactZodiacSymbol: {
    fontSize: 32,
  },
  compactChartInfo: {
    flex: 1,
  },
  compactChartTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  compactChartSubtitle: {
    fontSize: 15,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  // Divider using strokeSubtle equivalent
  divider: {
    height: 1,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  guestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  guestDetails: {
    fontSize: 14,
  },
  loader: {
    marginVertical: 32,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
  },
  paginationLoader: {
    marginVertical: 16,
  },
});

export default ChartSelectionScreen;
