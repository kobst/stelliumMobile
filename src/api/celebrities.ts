import { apiClient } from './client';

export interface Celebrity {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  time?: string;
  gender?: 'male' | 'female' | 'other';
  totalOffsetHours?: number;
  birthChart?: any;
  isCelebrity?: boolean;
  isReadOnly?: boolean;
  kind?: string;
}

export interface CreateCelebrityRequest {
  name: string;
  profession: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
  birthMinute?: number;
  birthLocation: string;
  timezone: string;
  imageUrl?: string;
  biography?: string;
  tags?: string[];
}

// Legacy search interface (kept for backward compatibility)
export interface CelebritySearchRequest {
  query?: string;
  profession?: string;
  sign?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

// Enhanced pagination request for getCelebs
export interface GetCelebsRequest {
  usePagination?: boolean;  // Enables new pagination response format
  page?: number;           // Page number (starts from 1)
  limit?: number;          // Items per page (max 100)
  search?: string;         // Search term (optional)
  sortBy?: string;         // Field to sort by (default: "name")
  sortOrder?: 'asc' | 'desc'; // Sort direction
}

// Enhanced pagination response
export interface PaginatedCelebritiesResponse {
  success: boolean;
  data: Celebrity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  search?: {
    query: string;
    resultsCount: number;
  };
}

export interface CelebrityRelationshipRequest {
  userId: string;
  celebrityId: string;
}

export interface CelebrityCompatibilityResponse {
  celebrity: Celebrity;
  user: any;
  compatibilityScore: number;
  analysis: string;
  strengths: string[];
  challenges: string[];
  synastryAspects: any[];
}

export interface CelebrityRelationship {
  _id: string;
  userA_id: string;
  userB_id: string;
  userA_name: string;
  userB_name: string;
  userA_dateOfBirth: string;
  userB_dateOfBirth: string;
  createdAt: string;
  updatedAt?: string;
}

export const celebritiesApi = {
  // Get all celebrities (enhanced with pagination and search)
  getCelebrities: async (
    request: GetCelebsRequest = {}
  ): Promise<Celebrity[] | PaginatedCelebritiesResponse> => {
    if (request.usePagination) {
      return apiClient.post<PaginatedCelebritiesResponse>('/getCelebs', request);
    }
    
    // Legacy behavior - returns array directly
    const response = await apiClient.post<Celebrity[]>('/getCelebs', request);
    return response;
  },

  // Legacy method for backward compatibility
  getCelebritiesLegacy: async (
    limit: number = 20,
    offset: number = 0
  ): Promise<{ celebrities: Celebrity[]; total: number }> => {
    return apiClient.post<{ celebrities: Celebrity[]; total: number }>('/getCelebs', {
      limit,
      offset,
    });
  },

  // Search celebrities with filters
  searchCelebrities: async (
    searchRequest: CelebritySearchRequest
  ): Promise<{ celebrities: Celebrity[]; total: number }> => {
    return apiClient.post<{ celebrities: Celebrity[]; total: number }>(
      '/searchCelebrities',
      searchRequest
    );
  },

  // Get celebrity by ID
  getCelebrity: async (celebrityId: string): Promise<Celebrity> => {
    return apiClient.post<Celebrity>('/getCelebrity', { celebrityId });
  },

  // Create new celebrity (admin function)
  createCelebrity: async (request: CreateCelebrityRequest): Promise<Celebrity> => {
    return apiClient.post<Celebrity>('/createCeleb', request);
  },

  // Create celebrity with unknown birth time
  createCelebrityUnknownTime: async (
    request: Omit<CreateCelebrityRequest, 'birthHour' | 'birthMinute'>
  ): Promise<Celebrity> => {
    return apiClient.post<Celebrity>('/createCelebUnknownTime', request);
  },

  // Get celebrity relationships/compatibility with user
  getCelebrityRelationships: async (
    limit: number = 50
  ): Promise<CelebrityRelationship[]> => {
    const response = await apiClient.post<{ success: boolean; relationships: CelebrityRelationship[] }>('/getCelebrityRelationships', {
      limit,
    });
    
    if (response.success) {
      return response.relationships;
    } else {
      throw new Error('Failed to fetch celebrity relationships');
    }
  },

  // Analyze compatibility between user and celebrity
  analyzeCelebrityCompatibility: async (
    request: CelebrityRelationshipRequest
  ): Promise<CelebrityCompatibilityResponse> => {
    return apiClient.post<CelebrityCompatibilityResponse>(
      '/analyzeCelebrityCompatibility',
      request
    );
  },

  // Get celebrities by profession
  getCelebritiesByProfession: async (
    profession: string,
    limit: number = 20
  ): Promise<Celebrity[]> => {
    return apiClient.post<Celebrity[]>('/getCelebritiesByProfession', {
      profession,
      limit,
    });
  },

  // Get celebrities by zodiac sign
  getCelebritiesBySign: async (sign: string, limit: number = 20): Promise<Celebrity[]> => {
    return apiClient.post<Celebrity[]>('/getCelebritiesBySign', {
      sign,
      limit,
    });
  },

  // Get trending celebrities
  getTrendingCelebrities: async (limit: number = 10): Promise<Celebrity[]> => {
    return apiClient.post<Celebrity[]>('/getTrendingCelebrities', { limit });
  },

  // Get celebrity chart analysis
  getCelebrityChartAnalysis: async (celebrityId: string): Promise<any> => {
    return apiClient.post<any>('/getCelebrityChartAnalysis', { celebrityId });
  },

  // Find celebrity matches for user
  findCelebrityMatches: async (
    userId: string,
    limit: number = 10
  ): Promise<CelebrityCompatibilityResponse[]> => {
    return apiClient.post<CelebrityCompatibilityResponse[]>('/findCelebrityMatches', {
      userId,
      limit,
    });
  },

  // Get celebrity professions list
  getCelebrityProfessions: async (): Promise<string[]> => {
    return apiClient.get<string[]>('/getCelebrityProfessions');
  },

  // Update celebrity (admin function)
  updateCelebrity: async (
    celebrityId: string,
    updates: Partial<CreateCelebrityRequest>
  ): Promise<Celebrity> => {
    return apiClient.put<Celebrity>(`/celebrities/${celebrityId}`, updates);
  },

  // Delete celebrity (admin function)
  deleteCelebrity: async (celebrityId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/celebrities/${celebrityId}`);
  },
};