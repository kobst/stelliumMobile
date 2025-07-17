import { apiClient } from './client';
import { User, SubjectDocument } from '../types';

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  time: string;
  lat?: number;
  lon?: number;
  tzone?: number;
  gender?: string;
  unknownTime?: boolean;
}

export interface CreateUserUnknownTimeRequest {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthLocation: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
}

export interface UserResponse {
  id: string;
  name: string;
  birthChart?: any;
  birthData: CreateUserRequest;
  createdAt: string;
  updatedAt: string;
}

// Enhanced pagination request for getUserSubjects
export interface GetUserSubjectsRequest {
  ownerUserId: string;     // Required - the user ID
  usePagination?: boolean; // Enables new pagination response format
  page?: number;          // Page number (starts from 1)
  limit?: number;         // Items per page (max 100)
  search?: string;        // Search term (optional)
  sortBy?: string;        // Field to sort by (default: "name")
  sortOrder?: 'asc' | 'desc'; // Sort direction
}

// Enhanced pagination response for user subjects
export interface PaginatedUserSubjectsResponse {
  success: boolean;
  data: any[];
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

export const usersApi = {
  // Create user with known birth time
  createUser: async (userData: CreateUserRequest): Promise<UserResponse> => {
    console.log('\n=== USERS API: createUser ===');
    console.log('Request data:', JSON.stringify(userData, null, 2));
    
    const response = await apiClient.post<UserResponse>('/createUser', userData);
    
    console.log('Response received:', JSON.stringify(response, null, 2));
    console.log('===========================\n');
    
    return response;
  },

  // Create user with unknown birth time
  createUserUnknownTime: async (
    userData: CreateUserUnknownTimeRequest
  ): Promise<UserResponse> => {
    return apiClient.post<UserResponse>('/createUserUnknownTime', userData);
  },

  // Get user by ID - returns backend SubjectDocument format
  getUser: async (userId: string): Promise<SubjectDocument> => {
    return apiClient.post<SubjectDocument>('/getUser', { userId });
  },

  // Get all users (admin function)
  getUsers: async (): Promise<UserResponse[]> => {
    return apiClient.post<UserResponse[]>('/getUsers');
  },

  // Get user subjects/profiles (enhanced with pagination and search)
  getUserSubjects: async (
    request: GetUserSubjectsRequest | string
  ): Promise<any[] | PaginatedUserSubjectsResponse> => {
    // Handle legacy string parameter
    if (typeof request === 'string') {
      return apiClient.post<any[]>('/getUserSubjects', { ownerUserId: request });
    }
    
    if (request.usePagination) {
      return apiClient.post<PaginatedUserSubjectsResponse>('/getUserSubjects', request);
    }
    
    // Legacy behavior - returns array directly
    const response = await apiClient.post<any[]>('/getUserSubjects', request);
    return response;
  },

  // Legacy method for backward compatibility
  getUserSubjectsLegacy: async (userId: string): Promise<any[]> => {
    return apiClient.post<any[]>('/getUserSubjects', { ownerUserId: userId });
  },

  // Update user profile
  updateUser: async (
    userId: string,
    userData: Partial<CreateUserRequest>
  ): Promise<UserResponse> => {
    return apiClient.put<UserResponse>(`/users/${userId}`, userData);
  },

  // Delete user
  deleteUser: async (userId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/users/${userId}`);
  },
};