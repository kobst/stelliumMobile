import { apiClient } from './client';
import { TransitEvent } from '../types';

export interface HoroscopeRequest {
  userId: string;
  date?: string;
}

export interface HoroscopeResponse {
  success: boolean;
  horoscope: {
    text?: string;
    interpretation?: string;
    startDate: string;
    endDate: string;
    keyTransits?: KeyTransit[];
    analysis?: {
      keyThemes?: KeyTheme[];
    };
  };
}

export interface KeyTransit {
  transitingPlanet: string;
  aspect: string;
  targetPlanet: string;
  exactDate: string;
}

export interface KeyTheme {
  transitingPlanet: string;
  aspect: string;
  targetPlanet?: string;
  exactDate?: string;
}

export interface TransitWindowsResponse {
  transits: TransitEvent[];
  dateRange: {
    start: string;
    end: string;
  };
}

export interface CustomHoroscopeRequest {
  userId: string;
  transitEvents: TransitEvent[];
}

export interface CustomHoroscopeResponse {
  success: boolean;
  horoscope: {
    text: string;
    startDate: string;
    endDate: string;
    selectedTransits: TransitEvent[];
  };
}

export const horoscopesApi = {
  // Get daily horoscope
  getDailyHoroscope: async (userId: string, date?: string): Promise<HoroscopeResponse> => {
    return apiClient.post<HoroscopeResponse>(`/users/${userId}/horoscope/daily`, {
      startDate: date || new Date().toISOString().split('T')[0],
    });
  },

  // Get weekly horoscope
  getWeeklyHoroscope: async (userId: string, date?: string): Promise<HoroscopeResponse> => {
    return apiClient.post<HoroscopeResponse>(`/users/${userId}/horoscope/weekly`, {
      startDate: date || new Date().toISOString().split('T')[0],
    });
  },

  // Get monthly horoscope
  getMonthlyHoroscope: async (userId: string, date?: string): Promise<HoroscopeResponse> => {
    return apiClient.post<HoroscopeResponse>(`/users/${userId}/horoscope/monthly`, {
      startDate: date || new Date().toISOString().split('T')[0],
    });
  },

  // Generate daily horoscope
  generateDailyHoroscope: async (userId: string, startDate: string): Promise<HoroscopeResponse> => {
    return apiClient.post<HoroscopeResponse>(`/users/${userId}/horoscope/daily`, {
      startDate,
    });
  },

  // Generate weekly horoscope
  generateWeeklyHoroscope: async (userId: string, startDate: Date): Promise<HoroscopeResponse> => {
    return apiClient.post<HoroscopeResponse>(`/users/${userId}/horoscope/weekly`, {
      startDate,
    });
  },

  // Generate monthly horoscope
  generateMonthlyHoroscope: async (userId: string, startDate: Date): Promise<HoroscopeResponse> => {
    return apiClient.post<HoroscopeResponse>(`/users/${userId}/horoscope/monthly`, {
      startDate,
    });
  },

  // Generate custom horoscope
  generateCustomHoroscope: async (userId: string, transitEvents: TransitEvent[]): Promise<CustomHoroscopeResponse> => {
    return apiClient.post<CustomHoroscopeResponse>(`/users/${userId}/horoscope/custom`, {
      transitEvents,
    });
  },

  // Get latest horoscope
  getLatestHoroscope: async (userId: string): Promise<HoroscopeResponse> => {
    return apiClient.get<HoroscopeResponse>(`/users/${userId}/horoscope/latest`);
  },

  // Get transit windows for custom horoscope selection
  getTransitWindows: async (userId: string, from?: string, to?: string): Promise<TransitWindowsResponse> => {
    return apiClient.post<TransitWindowsResponse>('/getTransitWindows', { 
      userId, 
      from, 
      to 
    });
  },

  // Generate custom horoscope from selected transits (old API)
  generateCustomHoroscopeOld: async (
    request: CustomHoroscopeRequest
  ): Promise<CustomHoroscopeResponse> => {
    return apiClient.post<CustomHoroscopeResponse>('/generateCustomHoroscope', request);
  },

  // Get horoscope by time period
  getHoroscopeByPeriod: async (
    userId: string,
    period: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth'
  ): Promise<HoroscopeResponse> => {
    const now = new Date();
    let targetDate: Date;

    switch (period) {
      case 'today':
        targetDate = now;
        return horoscopesApi.getDailyHoroscope(userId, targetDate.toISOString().split('T')[0]);
      
      case 'tomorrow':
        targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return horoscopesApi.getDailyHoroscope(userId, targetDate.toISOString().split('T')[0]);
      
      case 'thisWeek':
        return horoscopesApi.getWeeklyHoroscope(userId, now.toISOString().split('T')[0]);
      
      case 'nextWeek':
        targetDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return horoscopesApi.getWeeklyHoroscope(userId, targetDate.toISOString().split('T')[0]);
      
      case 'thisMonth':
        return horoscopesApi.getMonthlyHoroscope(userId, now.toISOString().split('T')[0]);
      
      case 'nextMonth':
        targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return horoscopesApi.getMonthlyHoroscope(userId, targetDate.toISOString().split('T')[0]);
      
      default:
        return horoscopesApi.getDailyHoroscope(userId);
    }
  },
};