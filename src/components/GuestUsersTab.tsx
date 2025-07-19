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

interface GuestUser {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  gender?: string;
}

interface GuestUsersTabProps {
  selectedPerson: GuestUser | null;
  onPersonSelect: (person: GuestUser) => void;
}

const GuestUsersTab: React.FC<GuestUsersTabProps> = ({ selectedPerson, onPersonSelect }) => {
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
      <Text style={styles.emptyStateTitle}>No Guest Users Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || genderFilter !== 'all'
          ? 'Try adjusting your search or filter settings.'
          : 'Add guest users in the Charts tab and they will appear here.'}
      </Text>
      {!searchQuery && genderFilter === 'all' && (
        <TouchableOpacity style={styles.helpButton} onPress={showEmptyStateModal}>
          <Text style={styles.helpButtonText}>Learn More</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading guest users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Controls */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search guest users..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Gender:</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowGenderPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {genderFilter === 'all' ? 'All' : 
               genderFilter === 'male' ? 'Male' : 
               genderFilter === 'female' ? 'Female' : 'Non-binary'}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender Filter</Text>
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
                  genderFilter === option.value && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setGenderFilter(option.value);
                  setShowGenderPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    genderFilter === option.value && styles.modalOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowGenderPicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
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
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#374151',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  pickerArrow: {
    color: '#8b5cf6',
    fontSize: 12,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  resultsText: {
    color: '#94a3b8',
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
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  helpButtonText: {
    color: '#ffffff',
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
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 250,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
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
    backgroundColor: '#8b5cf6',
  },
  modalOptionText: {
    color: '#ffffff',
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
    backgroundColor: '#374151',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default GuestUsersTab;