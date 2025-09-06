import { useState, useEffect, useCallback } from 'react';
import {
  horoscopesApi,
  HoroscopeResponse,
  TransitWindowsResponse,
  CustomHoroscopeResponse,
  ApiError,
} from '../api';
import { useStore } from '../store';
import { HoroscopeFilter, TransitEvent } from '../types';

export interface UseHoroscopeReturn {
  horoscope: HoroscopeResponse | null;
  customHoroscope: CustomHoroscopeResponse | null;
  transitData: TransitEvent[];
  loading: boolean;
  error: string | null;
  loadHoroscope: (period: HoroscopeFilter) => Promise<void>;
  loadTransitWindows: () => Promise<void>;
  generateCustomHoroscope: (selectedTransits: TransitEvent[]) => Promise<void>;
  clearError: () => void;
}

export const useHoroscope = (userId?: string): UseHoroscopeReturn => {
  const [horoscope, setHoroscope] = useState<HoroscopeResponse | null>(null);
  const [customHoroscope, setCustomHoroscope] = useState<CustomHoroscopeResponse | null>(null);
  const [transitData, setTransitData] = useState<TransitEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { userData, setCustomHoroscope: setStoreCustomHoroscope, setTransitData: setStoreTransitData } = useStore();

  const clearError = () => setError(null);

  const loadHoroscope = useCallback(async (period: HoroscopeFilter) => {
    const targetUserId = userId || userData?.id;
    if (!targetUserId) {
      setError('No user ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await horoscopesApi.getHoroscopeByPeriod(targetUserId, period);
      setHoroscope(response);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load horoscope';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, userData?.id]);

  const loadTransitWindows = useCallback(async () => {
    const targetUserId = userId || userData?.id;
    if (!targetUserId) {
      setError('No user ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate date range for transit windows (next 3 months)
      const now = new Date();
      const from = now.toISOString();
      const to = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 3 months from now

      const response = await horoscopesApi.getTransitWindows(targetUserId, from, to);
      setTransitData(response.transitEvents);
      setStoreTransitData(response.transitEvents);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load transit data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, userData?.id, setStoreTransitData]);

  const generateCustomHoroscope = useCallback(async (selectedTransits: TransitEvent[]) => {
    const targetUserId = userId || userData?.id;
    if (!targetUserId) {
      setError('No user ID available');
      return;
    }

    if (selectedTransits.length === 0) {
      setError('Please select at least one transit');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await horoscopesApi.generateCustomHoroscope(targetUserId, selectedTransits);

      setCustomHoroscope(response);
      setStoreCustomHoroscope(response);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to generate custom horoscope';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, userData?.id, setStoreCustomHoroscope]);

  // Load daily horoscope on mount
  useEffect(() => {
    if (userId || userData?.id) {
      loadHoroscope('today');
    }
  }, [userId, userData?.id, loadHoroscope]);

  return {
    horoscope,
    customHoroscope,
    transitData,
    loading,
    error,
    loadHoroscope,
    loadTransitWindows,
    generateCustomHoroscope,
    clearError,
  };
};
