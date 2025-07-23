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
  Modal,
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
  const [showGenderPicker, setShowGenderPicker] = useState(false);
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

        <View style={styles.filterContainer}>
          <Text style={[styles.filterLabel, { color: colors.onSurfaceVariant }]}>Gender:</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.outline }]}
            onPress={() => setShowGenderPicker(true)}
          >
            <Text style={[styles.pickerButtonText, { color: colors.onSurface }]}>
              {genderFilter === 'all' ? 'All' :
               genderFilter === 'male' ? 'Male' :
               genderFilter === 'female' ? 'Female' : 'Other'}
            </Text>
            <Text style={[styles.pickerArrow, { color: colors.primary }]}>▼</Text>
          </TouchableOpacity>
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

      {/* Gender Filter Modal */}
      <Modal
        visible={showGenderPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Select Gender Filter</Text>
            {[
              { label: 'All', value: 'all' },
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Other', value: 'other' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  genderFilter === option.value && [styles.modalOptionSelected, { backgroundColor: colors.primary }],
                ]}
                onPress={() => {
                  setGenderFilter(option.value);
                  setShowGenderPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    { color: genderFilter === option.value ? colors.onPrimary : colors.onSurface },
                    genderFilter === option.value && styles.modalOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalCancelButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setShowGenderPicker(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.onSurfaceVariant }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  pickerButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 14,
  },
  pickerArrow: {
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 250,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionSelected: {
    // backgroundColor handled inline with theme colors
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    fontWeight: 'bold',
  },
  modalCancelButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CelebritiesTab;
