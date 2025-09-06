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
import CelebrityRelationships from '../../components/CelebrityRelationships';
import { HeaderWithProfile } from '../../components/navigation';
import { useTheme } from '../../theme';
import { parseDateStringAsLocalDate } from '../../utils/dateHelpers';

type CelebrityStackParamList = {
  CelebrityMain: undefined;
  CelebrityDetail: {
    celebrity: Celebrity;
  };
};

type CelebrityScreenNavigationProp = StackNavigationProp<CelebrityStackParamList, 'CelebrityMain'>;

type TabType = 'individuals' | 'relationships';

const CelebrityScreen: React.FC = () => {
  const navigation = useNavigation<CelebrityScreenNavigationProp>();
  const { userData } = useStore();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('individuals');
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
  }, [searchText, searchCelebrities, clearSearch]);

  const handleCelebrityPress = (celebrity: Celebrity) => {
    navigation.navigate('CelebrityDetail', { celebrity });
  };

  const renderTabSwitcher = () => (
    <View style={[styles.tabSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'individuals' && { backgroundColor: colors.primary },
        ]}
        onPress={() => setActiveTab('individuals')}
      >
        <Text
          style={[
            { color: colors.onSurfaceVariant },
            activeTab === 'individuals' && { color: colors.onPrimary, fontWeight: '600' },
          ]}
        >
          Individuals
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'relationships' && { backgroundColor: colors.primary },
        ]}
        onPress={() => setActiveTab('relationships')}
      >
        <Text
          style={[
            { color: colors.onSurfaceVariant },
            activeTab === 'relationships' && { color: colors.onPrimary, fontWeight: '600' },
          ]}
        >
          Relationships
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCelebrityItem = ({ item }: { item: Celebrity }) => (
    <TouchableOpacity
      style={[styles.celebrityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleCelebrityPress(item)}
    >
      <View style={styles.celebrityInfo}>
        <Text style={[styles.celebrityName, { color: colors.onSurface }]}>{item.firstName} {item.lastName}</Text>
        <Text style={[styles.celebrityDetails, { color: colors.onSurfaceVariant }]}>
          {parseDateStringAsLocalDate(item.dateOfBirth).toLocaleDateString()}
        </Text>
        <Text style={[styles.celebrityLocation, { color: colors.onSurfaceVariant }]}>
          Born in {item.placeOfBirth}
        </Text>
      </View>
      <Text style={[styles.viewChartText, { color: colors.primary }]}>View Chart →</Text>
    </TouchableOpacity>
  );

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
    <View>
      {/* Tab Switcher */}
      {renderTabSwitcher()}

      {/* Error Display */}
      {error && activeTab === 'individuals' && (
        <View style={[styles.errorSection, { backgroundColor: colors.surface, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.error }]} onPress={clearError}>
            <Text style={[styles.retryButtonText, { color: colors.onError }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
          {activeTab === 'individuals' ? 'Celebrity Birth Charts' : 'Celebrity Relationships'}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          {activeTab === 'individuals'
            ? 'Explore the cosmic blueprints of famous personalities'
            : 'Discover your cosmic connections with celebrities'
          }
        </Text>
      </View>

      {/* Search - Only show for individuals tab */}
      {activeTab === 'individuals' && (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Search Celebrities</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.onSurface }]}
              placeholder="Search by name..."
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
      )}

      {/* Results Section Header - Only show for individuals tab */}
      {activeTab === 'individuals' && (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {searchText.length > 2
              ? `Search Results (${searchResults.length})`
              : `Celebrities (${displayData.length})`
            }
          </Text>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading celebrities...</Text>
            </View>
          )}

          {!loading && displayData.length === 0 && (
            <Text style={[styles.noResultsText, { color: colors.onSurfaceVariant }]}>
              {searchText.length > 2
                ? 'No celebrities found matching your search'
                : 'No celebrities available'
              }
            </Text>
          )}
        </View>
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

  if (activeTab === 'relationships') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderWithProfile title="Celebrity" showSafeArea={false} />
        {renderHeader()}
        <CelebrityRelationships onCelebrityPress={handleCelebrityPress} />
      </SafeAreaView>
    );
  }

  if (!loading && displayData.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderWithProfile title="Celebrity" showSafeArea={false} />
        {renderHeader()}
      </SafeAreaView>
    );
  }

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
        showsVerticalScrollIndicator={true}
        style={styles.celebrityList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
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
    right: 12,
    top: 12,
  },
  searchHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
  celebrityList: {
    marginTop: 8,
  },
  celebrityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  celebrityInfo: {
    flex: 1,
  },
  celebrityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  celebrityDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  celebrityLocation: {
    fontSize: 12,
  },
  viewChartText: {
    fontSize: 14,
    fontWeight: '500',
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
