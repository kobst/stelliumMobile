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
import { usersApi } from '../api/users';
import { useStore } from '../store';
import PersonCard from './PersonCard';
import { useTheme } from '../theme';

interface GuestUser {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  gender?: string;
  profilePhotoUrl?: string;
  profilePhotoKey?: string;
  profilePhotoUpdatedAt?: string;
}

interface GuestUsersTabProps {
  selectedPerson: GuestUser | null;
  onPersonSelect: (person: GuestUser) => void;
}

const GuestUsersTab: React.FC<GuestUsersTabProps> = ({ selectedPerson, onPersonSelect }) => {
  const { colors } = useTheme();
  const { userData } = useStore();
  const [guests, setGuests] = useState<GuestUser[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<GuestUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 10;

  useEffect(() => {
    loadGuests();
  }, []);

  useEffect(() => {
    filterGuests();
  }, [guests, searchQuery, genderFilter]);

  const loadGuests = async () => {
    try {
      setLoading(true);
      const userId = userData?.userId || userData?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await usersApi.getUserSubjects(userId);
      const guestList = Array.isArray(response) ? response : [];
      setGuests(guestList);
      setHasMore(guestList.length >= PAGE_SIZE);
    } catch (error) {
      console.error('Error loading guests:', error);
      Alert.alert('Error', 'Failed to load guest users');
    } finally {
      setLoading(false);
    }
  };

  const filterGuests = () => {
    let filtered = guests;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(guest =>
        `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(guest => guest.gender === genderFilter);
    }

    setFilteredGuests(filtered);
  };

  const showEmptyStateModal = () => {
    Alert.alert(
      'No Guest Users',
      'Add guest users in the Charts tab and they will appear here.',
      [{ text: 'OK' }]
    );
  };

  const renderGuestCard = ({ item }: { item: GuestUser }) => (
    <PersonCard
      person={item}
      isSelected={selectedPerson?._id === item._id}
      onPress={() => onPersonSelect(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>👥</Text>
      <Text style={[styles.emptyStateTitle, { color: colors.onSurface }]}>No Guest Users Found</Text>
      <Text style={[styles.emptyStateText, { color: colors.onSurfaceVariant }]}>
        {searchQuery || genderFilter !== 'all'
          ? 'Try adjusting your search or filter settings.'
          : 'Add guest users in the Charts tab and they will appear here.'}
      </Text>
      {!searchQuery && genderFilter === 'all' && (
        <TouchableOpacity style={[styles.helpButton, { backgroundColor: colors.primary }]} onPress={showEmptyStateModal}>
          <Text style={[styles.helpButtonText, { color: colors.onPrimary }]}>Learn More</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading guest users...</Text>
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
            placeholder="Search guest users..."
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
              { label: 'Other', value: 'nonbinary' },
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
          {filteredGuests.length} guest user{filteredGuests.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Guest List */}
      <FlatList
        data={filteredGuests}
        renderItem={renderGuestCard}
        keyExtractor={(item, index) => `guest-${item._id}-${index}`}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredGuests.length === 0 ? styles.emptyContainer : undefined}
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
    marginBottom: 16,
  },
  helpButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GuestUsersTab;
