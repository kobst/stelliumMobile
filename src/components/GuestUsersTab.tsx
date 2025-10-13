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
  const [showGenderPicker, setShowGenderPicker] = useState(false);
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

        <View style={styles.filterContainer}>
          <Text style={[styles.filterLabel, { color: colors.onSurfaceVariant }]}>Gender:</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.outline }]}
            onPress={() => setShowGenderPicker(true)}
          >
            <Text style={[styles.pickerButtonText, { color: colors.onSurface }]}>
              {genderFilter === 'all' ? 'All' :
               genderFilter === 'male' ? 'Male' :
               genderFilter === 'female' ? 'Female' : 'Non-binary'}
            </Text>
            <Text style={[styles.pickerArrow, { color: colors.primary }]}>▼</Text>
          </TouchableOpacity>
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
              { label: 'Non-binary', value: 'nonbinary' },
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

export default GuestUsersTab;
