import { useState, useEffect, useCallback } from 'react';
import { Celebrity } from '../api/celebrities';
import { apiClient } from '../api/client';
import { useStore } from '../store';

// API functions matching the working web app
const fetchCelebrities = async () => {
  return apiClient.post('/getCelebs', {});
};

const fetchCelebritiesPaginated = async (options: {
  usePagination?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) => {
  const {
    usePagination = true,
    page = 1,
    limit = 20,
    search,
    sortBy = 'name',
    sortOrder = 'asc',
  } = options;

  const requestBody: any = {
    usePagination,
    page,
    limit,
    sortBy,
    sortOrder,
  };

  if (search) {
    requestBody.search = search;
  }

  // Use the same endpoint as the web app
  return apiClient.post('/getCelebs', requestBody);
};

export interface UseCelebritiesReturn {
  celebrities: Celebrity[];
  searchResults: Celebrity[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  searchCelebrities: (searchTerm: string) => Promise<void>;
  loadNextPage: () => Promise<void>;
  refreshCelebrities: () => Promise<void>;
  clearError: () => void;
  clearSearch: () => void;
}

export const useCelebrities = (): UseCelebritiesReturn => {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [searchResults, setSearchResults] = useState<Celebrity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(true);

  const clearError = () => setError(null);
  const clearSearch = () => {
    setSearchResults([]);
    setSearchPage(1);
    setSearchHasMore(true);
  };

  const searchCelebrities = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) {
      clearSearch();
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPage(1);

    try {
      const response = await fetchCelebritiesPaginated({
        usePagination: true,
        page: 1,
        limit: 20,
        search: searchTerm,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      console.log('Search response:', response);

      if (response && response.success && response.data) {
        setSearchResults(response.data);
        // Check if there are more pages
        setSearchHasMore(response.pagination?.hasNext || response.data.length === 20);
      } else {
        console.warn('Search response missing data:', response);
        setSearchResults([]);
        setSearchHasMore(false);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search celebrities');
      setSearchResults([]);
      setSearchHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore) {return;}

    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = currentPage + 1;
      const response = await fetchCelebritiesPaginated({
        usePagination: true,
        page: nextPage,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      console.log('Load next page response:', response);

      if (response && response.success && response.data) {
        setCelebrities(prev => {
          // Filter out duplicates by checking if celebrity ID already exists
          const existingIds = new Set(prev.map(celebrity => celebrity._id));
          const newCelebrities = response.data.filter(celebrity => !existingIds.has(celebrity._id));

          return [...prev, ...newCelebrities];
        });
        setCurrentPage(nextPage);
        setHasMore(response.pagination?.hasNext || response.data.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Load next page error:', err);
      setError('Failed to load more celebrities');
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, loadingMore]);

  const refreshCelebrities = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    setCurrentPage(1);
    setHasMore(true);

    try {
      const response = await fetchCelebritiesPaginated({
        usePagination: true,
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      console.log('Refresh response:', response);

      if (response && response.success && response.data) {
        // Remove any potential duplicates from the response
        const uniqueCelebrities = response.data.filter((celebrity, index, self) =>
          index === self.findIndex(c => c._id === celebrity._id)
        );
        setCelebrities(uniqueCelebrities);
        setHasMore(response.pagination?.hasNext || uniqueCelebrities.length === 20);
      } else if (response && Array.isArray(response)) {
        const uniqueCelebrities = response.slice(0, 20).filter((celebrity, index, self) =>
          index === self.findIndex(c => c._id === celebrity._id)
        );
        setCelebrities(uniqueCelebrities);
        setHasMore(response.length === 20);
      } else {
        // Try legacy API as fallback
        const legacyResponse = await fetchCelebrities();
        if (legacyResponse && Array.isArray(legacyResponse)) {
          const uniqueCelebrities = legacyResponse.slice(0, 20).filter((celebrity, index, self) =>
            index === self.findIndex(c => c._id === celebrity._id)
          );
          setCelebrities(uniqueCelebrities);
          setHasMore(legacyResponse.length > 20);
        } else if (legacyResponse && legacyResponse.success && legacyResponse.data) {
          const uniqueCelebrities = legacyResponse.data.slice(0, 20).filter((celebrity, index, self) =>
            index === self.findIndex(c => c._id === celebrity._id)
          );
          setCelebrities(uniqueCelebrities);
          setHasMore(legacyResponse.data.length > 20);
        }
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError('Failed to refresh celebrities');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Load initial celebrities on mount
  useEffect(() => {
    const loadInitialCelebrities = async () => {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setHasMore(true);

      try {
        // Try the paginated API first
        const response = await fetchCelebritiesPaginated({
          usePagination: true,
          page: 1,
          limit: 20,
          sortBy: 'name',
          sortOrder: 'asc',
        });

        console.log('Initial load response:', response);

        if (response && response.success && response.data) {
          // Remove any potential duplicates from the response
          const uniqueCelebrities = response.data.filter((celebrity, index, self) =>
            index === self.findIndex(c => c._id === celebrity._id)
          );
          setCelebrities(uniqueCelebrities);
          setHasMore(response.pagination?.hasNext || uniqueCelebrities.length === 20);
        } else if (response && Array.isArray(response)) {
          // Fallback for legacy response format
          const uniqueCelebrities = response.slice(0, 20).filter((celebrity, index, self) =>
            index === self.findIndex(c => c._id === celebrity._id)
          );
          setCelebrities(uniqueCelebrities);
          setHasMore(response.length === 20);
        } else {
          // Try legacy API as final fallback
          const legacyResponse = await fetchCelebrities();
          console.log('Legacy response:', legacyResponse);

          if (legacyResponse && Array.isArray(legacyResponse)) {
            const uniqueCelebrities = legacyResponse.slice(0, 20).filter((celebrity, index, self) =>
              index === self.findIndex(c => c._id === celebrity._id)
            );
            setCelebrities(uniqueCelebrities);
            setHasMore(legacyResponse.length > 20);
          } else if (legacyResponse && legacyResponse.success && legacyResponse.data) {
            const uniqueCelebrities = legacyResponse.data.slice(0, 20).filter((celebrity, index, self) =>
              index === self.findIndex(c => c._id === celebrity._id)
            );
            setCelebrities(uniqueCelebrities);
            setHasMore(legacyResponse.data.length > 20);
          } else {
            setCelebrities([]);
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error('Failed to load celebrities:', err);
        setError('Failed to load celebrities');
        setCelebrities([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    loadInitialCelebrities();
  }, []);

  return {
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
  };
};
