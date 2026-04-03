import { apiClient } from './client';
import { RELATIONSHIP_APP_DOMAIN } from '../domain/relationshipUser';

const RELATIONSHIP_APP_HEADERS = {
  'x-app-domain': RELATIONSHIP_APP_DOMAIN,
};

export const relationshipApiClient = {
  get<T>(endpoint: string, headers?: Record<string, string>) {
    return apiClient.get<T>(endpoint, {
      ...RELATIONSHIP_APP_HEADERS,
      ...(headers || {}),
    });
  },

  post<T>(endpoint: string, data?: unknown, headers?: Record<string, string>) {
    return apiClient.post<T>(endpoint, data, {
      ...RELATIONSHIP_APP_HEADERS,
      ...(headers || {}),
    });
  },

  put<T>(endpoint: string, data?: unknown, headers?: Record<string, string>) {
    return apiClient.put<T>(endpoint, data, {
      ...RELATIONSHIP_APP_HEADERS,
      ...(headers || {}),
    });
  },

  delete<T>(endpoint: string, headers?: Record<string, string>) {
    return apiClient.delete<T>(endpoint, {
      ...RELATIONSHIP_APP_HEADERS,
      ...(headers || {}),
    });
  },

  poll<T>(endpoint: string, data: unknown, interval?: number, maxAttempts?: number) {
    return apiClient.poll<T>(
      endpoint,
      data,
      interval,
      maxAttempts,
      RELATIONSHIP_APP_HEADERS
    );
  },
};
