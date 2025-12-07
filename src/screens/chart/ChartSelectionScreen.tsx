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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '../../store';
import { usersApi, PaginatedUserSubjectsResponse } from '../../api';
import { SubjectDocument } from '../../types';
import { userTransformers } from '../../transformers/user';
import { useTheme } from '../../theme';
import UpgradeBanner from '../../components/UpgradeBanner';
import { HeaderWithProfile } from '../../components/navigation';
import PlanetaryIcons from '../../components/chart/PlanetaryIcons';
import AnalysisTypeIndicator from '../../components/chart/AnalysisTypeIndicator';
import ProfileAvatar from '../../components/profile/ProfileAvatar';

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
  const hasLoadedInitially = React.useRef(false);

  useEffect(() => {
    loadGuestSubjects();
    hasLoadedInitially.current = true;
  }, []);

  // Don't auto-refresh on focus - it causes infinite loops
  // User can manually pull-to-refresh or new guests are added via callback

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
          // Deduplicate by ID to prevent duplicate entries
          setGuestSubjects(prev => {
            const existingIds = new Set(prev.map(s => s._id));
            const newGuests = guests.filter((g: SubjectDocument) => !existingIds.has(g._id));
            return [...prev, ...newGuests];
          });
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
    setCurrentPage(1);
    setHasMore(true);
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
        contentContainerStyle={[styles.content, styles.contentWithReducedTopPadding]}
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

        {/* Compact My Birth Chart Row */}
        <TouchableOpacity
          style={[styles.compactChartCard, { backgroundColor: colors.surface }]}
          onPress={() => handleSelectChart(null)}
          activeOpacity={0.8}
        >
          <View style={{ marginRight: 16 }}>
            <ProfileAvatar subject={userData} size={64} showOnlineIndicator={false} />
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
            <AnalysisTypeIndicator analysisStatus={userData.analysisStatus} userId={userData.id} />
          </View>
          <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>›</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Guest Charts Section */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={[styles.sectionHeader, { color: colors.onSurface }]}>Guest Charts</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddNewChart}
            activeOpacity={0.8}
          >
            <Text style={[styles.addButtonText, { color: colors.onPrimary }]}>Add Birth Chart</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        ) : (
          <>
            {guestSubjects.map((subject) => {
              // Parse date-only string to avoid timezone shifts
              let birthDate: Date;
              const dob = subject.dateOfBirth;
              if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
                const [y, m, d] = dob.split('-').map(Number);
                birthDate = new Date(y, m - 1, d);
              } else {
                const d = new Date(dob);
                birthDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
              }

              return (
                <TouchableOpacity
                  key={subject._id}
                  style={[styles.guestCard, { backgroundColor: colors.surface }]}
                  onPress={() => handleSelectChart(subject)}
                  activeOpacity={0.8}
                >
                  <View style={{ marginRight: 12 }}>
                    <ProfileAvatar subject={subject} size={48} showOnlineIndicator={false} />
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
                    <AnalysisTypeIndicator analysisStatus={subject.analysisStatus} userId={subject._id} />
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
  contentWithReducedTopPadding: {
    paddingTop: 4,
  },
  header: {
    fontSize: 22,
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
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
