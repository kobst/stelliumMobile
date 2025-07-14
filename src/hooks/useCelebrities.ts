import { useState, useEffect, useCallback } from 'react';
import {
  celebritiesApi,
  Celebrity,
  CelebritySearchRequest,
  CelebrityCompatibilityResponse,
  ApiError,
} from '../api';
import { useStore } from '../store';

export interface UseCelebritiesReturn {
  celebrities: Celebrity[];
  featuredCelebrities: Celebrity[];
  searchResults: Celebrity[];
  compatibility: CelebrityCompatibilityResponse[];
  professions: string[];
  loading: boolean;
  error: string | null;
  loadCelebrities: (limit?: number, offset?: number) => Promise<void>;
  searchCelebrities: (searchRequest: CelebritySearchRequest) => Promise<void>;
  getCelebrityCompatibility: (celebrityId: string) => Promise<CelebrityCompatibilityResponse | null>;
  findCelebrityMatches: (limit?: number) => Promise<void>;
  getCelebritiesByProfession: (profession: string, limit?: number) => Promise<Celebrity[]>;
  getCelebritiesBySign: (sign: string, limit?: number) => Promise<Celebrity[]>;
  loadProfessions: () => Promise<void>;
  clearError: () => void;
}

export const useCelebrities = (): UseCelebritiesReturn => {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [featuredCelebrities, setFeaturedCelebrities] = useState<Celebrity[]>([]);
  const [searchResults, setSearchResults] = useState<Celebrity[]>([]);
  const [compatibility, setCompatibility] = useState<CelebrityCompatibilityResponse[]>([]);
  const [professions, setProfessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { userData } = useStore();

  const clearError = () => setError(null);

  const loadCelebrities = useCallback(async (limit: number = 20, offset: number = 0) => {
    setLoading(true);
    setError(null);

    try {
      const response = await celebritiesApi.getCelebrities(limit, offset);
      
      if (offset === 0) {
        setCelebrities(response.celebrities);
      } else {
        setCelebrities(prev => [...prev, ...response.celebrities]);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load celebrities';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCelebrities = useCallback(async (searchRequest: CelebritySearchRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await celebritiesApi.searchCelebrities(searchRequest);
      setSearchResults(response.celebrities);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to search celebrities';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCelebrityCompatibility = useCallback(async (
    celebrityId: string
  ): Promise<CelebrityCompatibilityResponse | null> => {
    if (!userData?.id) {
      setError('No user data available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await celebritiesApi.analyzeCelebrityCompatibility({
        userId: userData.id,
        celebrityId,
      });
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to analyze celebrity compatibility';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userData?.id]);

  const findCelebrityMatches = useCallback(async (limit: number = 10) => {
    if (!userData?.id) {
      setError('No user data available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await celebritiesApi.findCelebrityMatches(userData.id, limit);
      setCompatibility(response);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to find celebrity matches';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userData?.id]);

  const getCelebritiesByProfession = useCallback(async (
    profession: string,
    limit: number = 20
  ): Promise<Celebrity[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await celebritiesApi.getCelebritiesByProfession(profession, limit);
      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to get celebrities by profession';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getCelebritiesBySign = useCallback(async (
    sign: string,
    limit: number = 20
  ): Promise<Celebrity[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await celebritiesApi.getCelebritiesBySign(sign, limit);
      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to get celebrities by sign';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProfessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await celebritiesApi.getCelebrityProfessions();
      setProfessions(response);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load professions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFeaturedCelebrities = useCallback(async () => {
    try {
      const response = await celebritiesApi.getTrendingCelebrities(10);
      setFeaturedCelebrities(response);
    } catch (err) {
      console.warn('Failed to load featured celebrities:', err);
      // Don't set error for featured celebrities as it's not critical
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadCelebrities(20, 0);
    loadProfessions();
    loadFeaturedCelebrities();
  }, [loadCelebrities, loadProfessions, loadFeaturedCelebrities]);

  return {
    celebrities,
    featuredCelebrities,
    searchResults,
    compatibility,
    professions,
    loading,
    error,
    loadCelebrities,
    searchCelebrities,
    getCelebrityCompatibility,
    findCelebrityMatches,
    getCelebritiesByProfession,
    getCelebritiesBySign,
    loadProfessions,
    clearError,
  };
};