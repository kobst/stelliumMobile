import Config from 'react-native-config';
import auth from '@react-native-firebase/auth';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(options: { message: string; status?: number; code?: string }) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
  }
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = Config.API_URL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get Firebase ID token for authenticated requests
   * Backend requires: Authorization: Bearer <firebase_id_token>
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('[ApiClient] No authenticated user');
        return null;
      }

      const token = await currentUser.getIdToken();
      return token;
    } catch (error) {
      console.error('[ApiClient] Failed to get auth token:', error);
      return null;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorCode = '';

      try {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);

        // Try to parse as JSON first
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
          errorCode = errorJson.code || errorText;
        } catch {
          // Not JSON, use raw text
          errorMessage = errorText || errorMessage;
          errorCode = errorText;
        }
      } catch {
        // Couldn't read response body
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new ApiError({
        message: errorMessage,
        status: response.status,
        code: errorCode,
      });
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ApiError({
        message: 'Invalid JSON response',
        status: response.status,
      });
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Get Firebase auth token for authenticated requests
    const authToken = await this.getAuthToken();
    const authHeaders = authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {};

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  // Utility method for handling polling operations
  async poll<T>(
    endpoint: string,
    data: any,
    interval: number = 3000,
    maxAttempts: number = 20
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const pollInterval = setInterval(async () => {
        attempts++;

        try {
          const response = await this.post<any>(endpoint, data);

          if (response.isCompleted || response.status === 'completed') {
            clearInterval(pollInterval);
            resolve(response);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            reject(new ApiError({
              message: 'Polling timeout - maximum attempts reached',
              code: 'POLLING_TIMEOUT',
            }));
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, interval);
    });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

