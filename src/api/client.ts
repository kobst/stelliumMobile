import { REACT_APP_SERVER_URL } from '@env';

console.log('\n=== API CLIENT MODULE LOADING ===');
console.log('REACT_APP_SERVER_URL from @env:', REACT_APP_SERVER_URL);
console.log('==============================\n');

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
    this.baseURL = REACT_APP_SERVER_URL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };

    console.log('\n=== API CLIENT INITIALIZED ===');
    console.log('Base URL:', this.baseURL);
    console.log('Default headers:', this.defaultHeaders);
    console.log('============================\n');
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError({
        message: `HTTP error! status: ${response.status}`,
        status: response.status,
        code: errorText,
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

    console.log('\n=== API REQUEST ===');
    console.log('Method:', options.method || 'GET');
    console.log('Full URL:', url);
    console.log('Base URL:', this.baseURL);
    console.log('Endpoint:', endpoint);

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    console.log('Headers:', config.headers);
    if (options.body) {
      console.log('Request body:', options.body);
    }

    try {
      console.log('\nMaking fetch request...');
      const response = await fetch(url, config);

      console.log('\n=== API RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Status text:', response.statusText);
      console.log('OK:', response.ok);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      const result = await this.handleResponse<T>(response);
      console.log('Response data:', JSON.stringify(result, null, 2));
      console.log('==================\n');

      return result;
    } catch (error) {
      console.error('\n=== API REQUEST ERROR ===');
      console.error(`API request failed: ${endpoint}`);
      console.error('Error:', error);
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('=======================\n');
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
console.log('Creating API client singleton...');
export const apiClient = new ApiClient();
console.log('API client singleton created');

