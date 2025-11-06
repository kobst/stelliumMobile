import { apiClient } from './client';
import { User, SubjectDocument } from '../types';

export interface CreateUserRequest {
  firebaseUid: string; // Firebase Auth UID
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
  firebaseUid: string; // Firebase Auth UID
  firstName: string;
  lastName: string;
  gender: string;
  placeOfBirth: string;
  dateOfBirth: string;
  email: string;
  lat: number;
  lon: number;
  tzone: number;
}

export interface CreateGuestSubjectRequest extends CreateUserRequest {
  ownerUserId: string;
}

export interface CreateGuestSubjectUnknownTimeRequest {
  firstName: string;
  lastName: string;
  gender: string;
  placeOfBirth: string;
  dateOfBirth: string;
  lat: number;
  lon: number;
  tzone: number;
  ownerUserId: string;
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

  // Get user by Firebase UID - returns backend SubjectDocument format
  getUserByFirebaseUid: async (firebaseUid: string): Promise<SubjectDocument> => {
    console.log('\n=== USERS API: getUserByFirebaseUid ===');
    console.log('Firebase UID:', firebaseUid);
    console.log('=====================================\n');

    const response = await apiClient.post<SubjectDocument>('/getUserByFirebaseUid', { firebaseUid });
    console.log('Response received:', JSON.stringify(response, null, 2));
    console.log('=====================================\n');
    return response;
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

  // Create guest subject with known birth time
  createGuestSubject: async (guestData: CreateGuestSubjectRequest): Promise<SubjectDocument> => {
    console.log('\n=== USERS API: createGuestSubject ===');
    console.log('Request data:', JSON.stringify(guestData, null, 2));

    const response = await apiClient.post<SubjectDocument>('/createGuestSubject', guestData);

    console.log('Response received:', JSON.stringify(response, null, 2));
    console.log('===========================\n');

    return response;
  },

  // Create guest subject with unknown birth time
  createGuestSubjectUnknownTime: async (
    guestData: CreateGuestSubjectUnknownTimeRequest
  ): Promise<SubjectDocument> => {
    console.log('\n=== USERS API: createGuestSubjectUnknownTime ===');
    console.log('Request data:', JSON.stringify(guestData, null, 2));

    const response = await apiClient.post<SubjectDocument>('/createGuestSubjectUnknownTime', guestData);

    console.log('Response received:', JSON.stringify(response, null, 2));
    console.log('===========================\n');

    return response;
  },

  // Profile Photo APIs

  // Get presigned URL for profile photo upload
  getPresignedUploadUrl: async (
    subjectId: string,
    contentType: string = 'image/jpeg'
  ): Promise<{ uploadUrl: string; photoKey: string; expiresIn: number }> => {
    console.log('\n=== USERS API: getPresignedUploadUrl ===');
    console.log('Subject ID:', subjectId);
    console.log('Content Type:', contentType);

    const response = await apiClient.post<{
      success: boolean;
      uploadUrl: string;
      photoKey: string;
      expiresIn: number;
      instructions: string;
    }>(`/subjects/${subjectId}/profile-photo/presigned-url`, { contentType });

    console.log('Response received:', JSON.stringify(response, null, 2));
    console.log('=====================================\n');

    return {
      uploadUrl: response.uploadUrl,
      photoKey: response.photoKey,
      expiresIn: response.expiresIn,
    };
  },

  // Confirm profile photo upload
  confirmProfilePhotoUpload: async (
    subjectId: string,
    photoKey: string
  ): Promise<{ profilePhotoUrl: string; profilePhotoKey: string; updatedAt: string }> => {
    console.log('\n=== USERS API: confirmProfilePhotoUpload ===');
    console.log('Subject ID:', subjectId);
    console.log('Photo Key:', photoKey);

    const response = await apiClient.post<{
      success: boolean;
      profilePhotoUrl: string;
      profilePhotoKey: string;
      updatedAt: string;
    }>(`/subjects/${subjectId}/profile-photo/confirm`, { photoKey });

    console.log('Response received:', JSON.stringify(response, null, 2));
    console.log('=====================================\n');

    return {
      profilePhotoUrl: response.profilePhotoUrl,
      profilePhotoKey: response.profilePhotoKey,
      updatedAt: response.updatedAt,
    };
  },

  // Delete profile photo
  deleteProfilePhoto: async (
    subjectId: string
  ): Promise<{ success: boolean; message: string; deletedAt: string }> => {
    console.log('\n=== USERS API: deleteProfilePhoto ===');
    console.log('Subject ID:', subjectId);

    const response = await apiClient.delete<{
      success: boolean;
      message: string;
      deletedAt: string;
    }>(`/subjects/${subjectId}/profile-photo`);

    console.log('Response received:', JSON.stringify(response, null, 2));
    console.log('===================================\n');

    return response;
  },
};
