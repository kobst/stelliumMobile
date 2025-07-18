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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../../store';
import { useCelebrities } from '../../hooks/useCelebrities';
import { Celebrity } from '../../api/celebrities';
import CelebrityRelationships from '../../components/CelebrityRelationships';

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
    <View style={styles.tabSwitcher}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'individuals' && styles.activeTabButton,
        ]}
        onPress={() => setActiveTab('individuals')}
      >
        <Text
          style={[
            styles.tabButtonText,
            activeTab === 'individuals' && styles.activeTabButtonText,
          ]}
        >
          Individuals
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'relationships' && styles.activeTabButton,
        ]}
        onPress={() => setActiveTab('relationships')}
      >
        <Text
          style={[
            styles.tabButtonText,
            activeTab === 'relationships' && styles.activeTabButtonText,
          ]}
        >
          Relationships
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCelebrityItem = ({ item }: { item: Celebrity }) => (
    <TouchableOpacity 
      style={styles.celebrityItem} 
      onPress={() => handleCelebrityPress(item)}
    >
      <View style={styles.celebrityInfo}>
        <Text style={styles.celebrityName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.celebrityDetails}>
          {new Date(item.dateOfBirth).toLocaleDateString()}
        </Text>
        <Text style={styles.celebrityLocation}>
          Born in {item.placeOfBirth}
        </Text>
      </View>
      <Text style={styles.viewChartText}>View Chart →</Text>
    </TouchableOpacity>
  );

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to explore celebrity charts</Text>
      </View>
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
        <View style={styles.errorSection}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={clearError}>
            <Text style={styles.retryButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'individuals' ? 'Celebrity Birth Charts' : 'Celebrity Relationships'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {activeTab === 'individuals' 
            ? 'Explore the cosmic blueprints of famous personalities'
            : 'Discover your cosmic connections with celebrities'
          }
        </Text>
      </View>

      {/* Search - Only show for individuals tab */}
      {activeTab === 'individuals' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Celebrities</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              placeholderTextColor="#94a3b8"
              value={searchText}
              onChangeText={setSearchText}
            />
            {isSearching && (
              <ActivityIndicator size="small" color="#8b5cf6" style={styles.searchLoader} />
            )}
          </View>
          {searchText.length > 0 && searchText.length <= 2 && (
            <Text style={styles.searchHint}>Type at least 3 characters to search</Text>
          )}
        </View>
      )}

      {/* Results Section Header - Only show for individuals tab */}
      {activeTab === 'individuals' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchText.length > 2 
              ? `Search Results (${searchResults.length})`
              : `Celebrities (${displayData.length})`
            }
          </Text>
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={styles.loadingText}>Loading celebrities...</Text>
            </View>
          )}

          {!loading && displayData.length === 0 && (
            <Text style={styles.noResultsText}>
              {searchText.length > 2 
                ? "No celebrities found matching your search"
                : "No celebrities available"
              }
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading more celebrities...</Text>
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
      <View style={styles.container}>
        {renderHeader()}
        <CelebrityRelationships onCelebrityPress={handleCelebrityPress} />
      </View>
    );
  }

  if (!loading && displayData.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: '#8b5cf6',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94a3b8',
  },
  activeTabButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 20,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 8,
  },
  searchLoader: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  searchHint: {
    fontSize: 12,
    color: '#94a3b8',
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
    backgroundColor: '#374151',
    padding: 12,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: '#8b5cf6',
  },
  categoryButtonText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCategoryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
  },
  noResultsText: {
    color: '#94a3b8',
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
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  celebrityInfo: {
    flex: 1,
  },
  celebrityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  celebrityDetails: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 2,
  },
  celebrityLocation: {
    fontSize: 12,
    color: '#64748b',
  },
  viewChartText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
  },
  errorSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CelebrityScreen;