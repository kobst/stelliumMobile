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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { usersApi, PaginatedUserSubjectsResponse } from '../../api';
import { SubjectDocument } from '../../types';
import { userTransformers } from '../../transformers/user';
import { useTheme } from '../../theme';

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
    if (!userData?.id) return;
    
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
        sortOrder: 'desc'
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
      }
    });
  };

  const getZodiacIcon = (birthMonth: number, birthDay: number) => {
    // Simple zodiac calculation
    const zodiacDates = [
      { sign: '♈', start: [3, 21], end: [4, 19] }, // Aries
      { sign: '♉', start: [4, 20], end: [5, 20] }, // Taurus
      { sign: '♊', start: [5, 21], end: [6, 20] }, // Gemini
      { sign: '♋', start: [6, 21], end: [7, 22] }, // Cancer
      { sign: '♌', start: [7, 23], end: [8, 22] }, // Leo
      { sign: '♍', start: [8, 23], end: [9, 22] }, // Virgo
      { sign: '♎', start: [9, 23], end: [10, 22] }, // Libra
      { sign: '♏', start: [10, 23], end: [11, 21] }, // Scorpio
      { sign: '♐', start: [11, 22], end: [12, 21] }, // Sagittarius
      { sign: '♑', start: [12, 22], end: [1, 19] }, // Capricorn
      { sign: '♒', start: [1, 20], end: [2, 18] }, // Aquarius
      { sign: '♓', start: [2, 19], end: [3, 20] }, // Pisces
    ];

    for (const zodiac of zodiacDates) {
      const [startMonth, startDay] = zodiac.start;
      const [endMonth, endDay] = zodiac.end;
      
      if (startMonth === endMonth) {
        if (birthMonth === startMonth && birthDay >= startDay && birthDay <= endDay) {
          return zodiac.sign;
        }
      } else {
        if ((birthMonth === startMonth && birthDay >= startDay) ||
            (birthMonth === endMonth && birthDay <= endDay)) {
          return zodiac.sign;
        }
      }
    }
    
    return '⭐';
  };

  if (!userData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Please sign in to view charts</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
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
      <Text style={[styles.header, { color: colors.onBackground }]}>My Birth Chart</Text>
      
      {/* Logged-in User's Chart - Expanded */}
      <TouchableOpacity
        style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}
        onPress={() => handleSelectChart(null)}
      >
        <View style={styles.chartHeader}>
          <Text style={[styles.chartQuestion, { color: colors.onSurfaceVariant }]}>How is my day?</Text>
          <View style={styles.expandedContent}>
            <View style={[styles.chartCircle, { borderColor: colors.primary, backgroundColor: colors.background }]}>
              <Text style={styles.zodiacSymbol}>
                {getZodiacIcon(userData.birthMonth, userData.birthDay)}
              </Text>
            </View>
            <Text style={[styles.chartLabel, { color: colors.onSurface }]}>Birth Chart</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Friends & Family Section */}
      <Text style={[styles.sectionHeader, { color: colors.onBackground }]}>Friends & Family</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : (
        <>
          {guestSubjects.map((subject) => {
            const birthDate = new Date(subject.dateOfBirth);
            const zodiacSign = getZodiacIcon(birthDate.getMonth() + 1, birthDate.getDate());
            
            return (
              <TouchableOpacity
                key={subject._id}
                style={[styles.guestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleSelectChart(subject)}
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
                  <Text style={[styles.guestDetails, { color: colors.onSurfaceVariant }]}>
                    {birthDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })} - {subject.placeOfBirth}
                  </Text>
                </View>
                <Text style={styles.guestZodiac}>{zodiacSign}</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Add New Birth Chart Button */}
      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleAddNewChart}>
        <Text style={[styles.addButtonIcon, { color: colors.primary }]}>+</Text>
        <Text style={[styles.addButtonText, { color: colors.primary }]}>Add New Birth Chart</Text>
      </TouchableOpacity>

      {/* Loading indicator for pagination */}
      {loading && !refreshing && guestSubjects.length > 0 && (
        <ActivityIndicator size="small" color={colors.primary} style={styles.paginationLoader} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
  },
  chartHeader: {
    alignItems: 'center',
  },
  chartQuestion: {
    fontSize: 16,
    marginBottom: 16,
  },
  expandedContent: {
    alignItems: 'center',
  },
  chartCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  zodiacSymbol: {
    fontSize: 48,
  },
  chartLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
    fontSize: 18,
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
  guestZodiac: {
    fontSize: 24,
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addButtonIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
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