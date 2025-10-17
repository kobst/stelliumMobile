import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { celebritiesApi, Celebrity } from '../api/celebrities';
import PersonCard from './PersonCard';
import { useTheme } from '../theme';

interface CelebritiesTabProps {
  selectedPerson: Celebrity | null;
  onPersonSelect: (person: Celebrity) => void;
}

const CelebritiesTab: React.FC<CelebritiesTabProps> = ({ selectedPerson, onPersonSelect }) => {
  const { colors } = useTheme();
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 10;

  useEffect(() => {
    loadCelebrities();
  }, []);

  useEffect(() => {
    // Reset and reload when search or filter changes
    setPage(1);
    setCelebrities([]);
    loadCelebrities(true);
  }, [searchQuery, genderFilter]);

  const loadCelebrities = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;

      const response = await celebritiesApi.getCelebrities({
        usePagination: true,
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchQuery.trim() || undefined,
        sortBy: 'firstName',
        sortOrder: 'asc',
      });

      if ('data' in response) {
        // Filter by gender if needed
        let filteredData = response.data;
        if (genderFilter !== 'all') {
          filteredData = response.data.filter(celeb => celeb.gender === genderFilter);
        }

        if (reset) {
          setCelebrities(filteredData);
        } else {
          setCelebrities(prev => [...prev, ...filteredData]);
        }

        setHasMore(response.pagination.hasNext);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Error loading celebrities:', error);
      Alert.alert('Error', 'Failed to load celebrities');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadCelebrities();
    }
  };

  const renderCelebrityCard = ({ item }: { item: Celebrity }) => (
    <PersonCard
      person={{
        _id: item._id,
        firstName: item.firstName,
        lastName: item.lastName,
        dateOfBirth: item.dateOfBirth,
        placeOfBirth: item.placeOfBirth,
        profession: 'Celebrity', // You might want to add a profession field
        gender: item.gender,
      }}
      isSelected={selectedPerson?._id === item._id}
      onPress={() => onPersonSelect(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>⭐</Text>
      <Text style={[styles.emptyStateTitle, { color: colors.onSurface }]}>No Celebrities Found</Text>
      <Text style={[styles.emptyStateText, { color: colors.onSurfaceVariant }]}>
        {searchQuery || genderFilter !== 'all'
          ? 'Try adjusting your search or filter settings.'
          : 'No celebrities available at the moment.'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) {return null;}
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerLoaderText, { color: colors.onSurfaceVariant }]}>Loading more...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading celebrities...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Filter Controls */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: colors.outline }]}
            placeholder="Search celebrities..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Gender Filter - Radio Buttons */}
        <View style={styles.genderFilterContainer}>
          <Text style={[styles.filterLabel, { color: colors.onSurfaceVariant }]}>Gender:</Text>
          <View style={styles.radioButtonsContainer}>
            {[
              { label: 'All', value: 'all' },
              { label: 'Female', value: 'female' },
              { label: 'Male', value: 'male' },
              { label: 'Other', value: 'other' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.radioButton}
                onPress={() => setGenderFilter(option.value)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radioCircle,
                  { borderColor: colors.outline },
                  genderFilter === option.value && [styles.radioCircleSelected, { borderColor: colors.primary }],
                ]}>
                  {genderFilter === option.value && (
                    <View style={[styles.radioCircleInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text style={[
                  styles.radioLabel,
                  { color: colors.onSurface },
                  genderFilter === option.value && { color: colors.primary, fontWeight: '600' },
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Results */}
      <View style={[styles.resultsContainer, { borderBottomColor: colors.border }]}>
        <Text style={[styles.resultsText, { color: colors.onSurfaceVariant }]}>
          {celebrities.length} celebrit{celebrities.length !== 1 ? 'ies' : 'y'} found
          {hasMore && ' (scroll for more)'}
        </Text>
      </View>

      {/* Celebrity List */}
      <FlatList
        data={celebrities}
        renderItem={renderCelebrityCard}
        keyExtractor={(item, index) => `celebrity-${item._id}-${index}`}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={celebrities.length === 0 ? styles.emptyContainer : undefined}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  genderFilterContainer: {
    marginTop: 4,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  radioButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  radioCircleSelected: {
    // borderColor handled inline
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 14,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  resultsText: {
    fontSize: 12,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerLoaderText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default CelebritiesTab;
