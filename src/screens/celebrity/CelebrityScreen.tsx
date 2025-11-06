import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../../store';
import { useCelebrities } from '../../hooks/useCelebrities';
import { Celebrity } from '../../api/celebrities';
import { HeaderWithProfile } from '../../components/navigation';
import { useTheme } from '../../theme';
import { parseDateStringAsLocalDate } from '../../utils/dateHelpers';
import PlanetaryIcons from '../../components/chart/PlanetaryIcons';
import AnalysisTypeIndicator from '../../components/chart/AnalysisTypeIndicator';
import { SubjectDocument } from '../../types';

type CelebrityStackParamList = {
  CelebrityMain: undefined;
  CelebrityDetail: {
    celebrity: Celebrity;
  };
};

type CelebrityScreenNavigationProp = StackNavigationProp<CelebrityStackParamList, 'CelebrityMain'>;

const CelebrityScreen: React.FC = () => {
  const navigation = useNavigation<CelebrityScreenNavigationProp>();
  const { userData } = useStore();
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const {
    celebrities,
    searchResults,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    searchCelebrities,
    loadNextPage,
    refreshCelebrities,
    clearError,
    clearSearch,
  } = useCelebrities();

  // Handle search with debouncing
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (searchText.trim().length > 2) {
        setIsSearching(true);
        searchCelebrities(searchText.trim()).finally(() => {
          setIsSearching(false);
        });
      } else {
        clearSearch();
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const handleCelebrityPress = (celebrity: Celebrity) => {
    navigation.navigate('CelebrityDetail', { celebrity });
  };

  const renderCelebrityItem = ({ item }: { item: Celebrity }) => {
    // Parse date-only string to avoid timezone shifts
    const birthDate = parseDateStringAsLocalDate(item.dateOfBirth);

    // Convert Celebrity to SubjectDocument format for PlanetaryIcons
    const celebrityAsSubject: SubjectDocument = {
      _id: item._id,
      createdAt: '',
      updatedAt: '',
      kind: item.kind || 'celebrity',
      ownerUserId: null,
      isCelebrity: item.isCelebrity || true,
      isReadOnly: item.isReadOnly || true,
      firstName: item.firstName,
      lastName: item.lastName,
      dateOfBirth: item.dateOfBirth,
      placeOfBirth: item.placeOfBirth,
      birthTimeUnknown: false,
      totalOffsetHours: item.totalOffsetHours || 0,
      birthChart: item.birthChart,
    };

    return (
      <TouchableOpacity
        style={[styles.guestCard, { backgroundColor: colors.surface }]}
        onPress={() => handleCelebrityPress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.guestAvatar, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.avatarText, { color: colors.onSurfaceVariant }]}>
            {item.firstName[0]}{item.lastName[0]}
          </Text>
        </View>
        <View style={styles.guestInfo}>
          <Text style={[styles.guestName, { color: colors.onSurface }]}>
            {item.firstName} {item.lastName}
          </Text>
          <PlanetaryIcons subject={celebrityAsSubject} />
          <Text style={[styles.guestDetails, { color: colors.onSurfaceVariant }]}>
            {birthDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })} - {item.placeOfBirth}
          </Text>
          <AnalysisTypeIndicator analysisStatus={celebrityAsSubject.analysisStatus} />
        </View>
        <Text style={[styles.chevron, { color: colors.onSurfaceVariant }]}>›</Text>
      </TouchableOpacity>
    );
  };

  if (!userData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderWithProfile title="Celebrity" showSafeArea={false} />
        <View style={styles.content}>
          <Text style={[styles.errorText, { color: colors.error }]}>Please sign in to explore celebrity charts</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine which data to display
  const displayData = searchText.length > 2 ? searchResults : celebrities;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Error Display */}
      {error && (
        <View style={[styles.errorSection, { backgroundColor: colors.surface, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.error }]} onPress={clearError}>
            <Text style={[styles.retryButtonText, { color: colors.onError }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search */}
      <View style={[styles.searchSection, { backgroundColor: colors.surface }]}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.onSurface }]}
            placeholder="Search celebrities..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchText}
            onChangeText={setSearchText}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />
          )}
        </View>
        {searchText.length > 0 && searchText.length <= 2 && (
          <Text style={[styles.searchHint, { color: colors.onSurfaceVariant }]}>Type at least 3 characters to search</Text>
        )}
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading celebrities...</Text>
        </View>
      )}

      {/* Empty State */}
      {!loading && displayData.length === 0 && (
        <Text style={[styles.noResultsText, { color: colors.onSurfaceVariant }]}>
          {searchText.length > 2
            ? 'No celebrities found matching your search'
            : 'No celebrities available'
          }
        </Text>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) {return null;}

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading more celebrities...</Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (searchText.length > 2) {
      // Don't load more during search for now
      return;
    }

    if (hasMore && !loadingMore && !loading) {
      loadNextPage();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderWithProfile title="Celebrity" showSafeArea={false} />
      <FlatList
        data={displayData}
        renderItem={renderCelebrityItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={refreshCelebrities}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 8,
  },
  searchSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  searchLoader: {
    position: 'absolute',
    right: 28,
    top: 12,
  },
  searchHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
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
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 32,
    fontStyle: 'italic',
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
});

export default CelebrityScreen;
