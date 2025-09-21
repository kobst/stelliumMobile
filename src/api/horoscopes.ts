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
  transitEvents: TransitEvent[];
  transitToTransitEvents?: TransitEvent[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface CustomHoroscopeRequest {
  userId: string;
  query?: string;
  selectedTransits?: TransitEvent[];
  transitEvents?: TransitEvent[]; // Backward compatibility
}

export interface CustomHoroscopeResponse {
  success: boolean;
  horoscope: {
    userId: string;
    period: 'custom' | 'daily' | 'weekly' | 'monthly';
    startDate: string;
    endDate: string;
    customTransitEvents: TransitEvent[];
    interpretation: string;
    userPrompt?: string;
    generatedAt: string;
    requestHash: string;
    metadata: {
      hasKnownBirthTime: boolean;
      transitEventCount: number;
      mode: 'custom' | 'chat' | 'hybrid';
    };
  };
  cached: boolean;
}

export interface CustomHoroscope {
  _id: string;
  userId: string;
  period: 'custom';
  startDate: string;
  endDate: string;
  customTransitEvents: TransitEvent[];
  interpretation: string;
  userPrompt?: string;
  generatedAt: string;
  requestHash: string;
  metadata: {
    hasKnownBirthTime: boolean;
    transitEventCount: number;
    mode: 'custom' | 'chat' | 'hybrid';
  };
}

export interface CustomHoroscopeHistoryResponse {
  success: boolean;
  horoscopes: CustomHoroscope[];
  count: number;
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

  // Generate custom horoscope with new API
  generateCustomHoroscope: async (userId: string, request: Omit<CustomHoroscopeRequest, 'userId'>): Promise<CustomHoroscopeResponse> => {
    const requestBody: any = {};

    if (request.query?.trim()) {
      requestBody.query = request.query.trim();
    }

    if (request.selectedTransits?.length || request.transitEvents?.length) {
      // Use selectedTransits if provided, otherwise fall back to transitEvents for backward compatibility
      requestBody.selectedTransits = request.selectedTransits || request.transitEvents;
    }

    return apiClient.post<CustomHoroscopeResponse>(`/users/${userId}/horoscope/custom`, requestBody);
  },

  // Legacy method for backward compatibility
  generateCustomHoroscopeFromTransits: async (userId: string, transitEvents: TransitEvent[]): Promise<CustomHoroscopeResponse> => {
    return apiClient.post<CustomHoroscopeResponse>(`/users/${userId}/horoscope/custom`, {
      selectedTransits: transitEvents,
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
      to,
    });
  },

  // Generate custom horoscope from selected transits (old API)
  generateCustomHoroscopeOld: async (
    request: CustomHoroscopeRequest
  ): Promise<CustomHoroscopeResponse> => {
    return apiClient.post<CustomHoroscopeResponse>('/generateCustomHoroscope', request);
  },

  // Get custom horoscope history
  getCustomHoroscopeHistory: async (userId: string, limit: number = 50): Promise<CustomHoroscopeHistoryResponse> => {
    return apiClient.get<CustomHoroscopeHistoryResponse>(`/users/${userId}/horoscope/custom?limit=${limit}`);
  },

  // Get horoscope by time period
  getHoroscopeByPeriod: async (
    userId: string,
    period: 'today' | 'thisWeek' | 'thisMonth'
  ): Promise<HoroscopeResponse> => {
    const now = new Date();

    switch (period) {
      case 'today':
        return horoscopesApi.getDailyHoroscope(userId, now.toISOString().split('T')[0]);

      case 'thisWeek':
        return horoscopesApi.getWeeklyHoroscope(userId, now.toISOString().split('T')[0]);

      case 'thisMonth':
        return horoscopesApi.getMonthlyHoroscope(userId, now.toISOString().split('T')[0]);

      default:
        return horoscopesApi.getDailyHoroscope(userId);
    }
  },
};
