import { REACT_APP_SERVER_URL } from '@env';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = REACT_APP_SERVER_URL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
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
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
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

// Export the error class for use in other modules
export { ApiError };