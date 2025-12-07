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

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};

interface EndpointConfig {
  timeout: number;
  retryOnTimeout: boolean;
  maxRetries?: number;
  // Specific delays before each retry attempt (in ms)
  // These delays let backend generation complete before retry checks cache
  retryDelays?: number[];
}

// Endpoint-specific timeout and retry configuration
// IMPORTANT: Horoscope endpoints need delays before retries to avoid race conditions
// During the 60-90s generation window, cache checks pass but generation hasn't completed
// Without delays, retries would trigger duplicate LLM calls
const ENDPOINT_CONFIGS: Array<{ pattern: string | RegExp; config: EndpointConfig }> = [
  // Chat endpoints - longer timeout, retry on timeout with standard backoff
  { pattern: '/chat', config: { timeout: 60000, retryOnTimeout: true } },
  { pattern: '/enhanced-chat', config: { timeout: 60000, retryOnTimeout: true } },

  // Horoscope endpoints - extended timeouts + delays before retries
  // Daily generates 7-day batch on first call (~60-90s), subsequent calls hit cache (~2-5s)
  // Retry delays let generation complete before retry checks cache
  { pattern: /\/horoscope\/daily/, config: { timeout: 90000, retryOnTimeout: true, maxRetries: 2, retryDelays: [2000, 5000] } },
  { pattern: /\/horoscope\/weekly/, config: { timeout: 90000, retryOnTimeout: true, maxRetries: 2, retryDelays: [2000, 5000] } },
  { pattern: /\/horoscope\/monthly/, config: { timeout: 120000, retryOnTimeout: true, maxRetries: 2, retryDelays: [3000, 7000] } },
  { pattern: /\/horoscope\/custom/, config: { timeout: 120000, retryOnTimeout: true, maxRetries: 2, retryDelays: [3000, 7000] } },
  { pattern: /\/horoscope\/transit-windows/, config: { timeout: 60000, retryOnTimeout: true, retryDelays: [2000, 5000] } },
];

const DEFAULT_ENDPOINT_CONFIG: EndpointConfig = {
  timeout: 30000,
  retryOnTimeout: false, // Don't retry timeouts for standard endpoints by default
};

function getEndpointConfig(endpoint: string): EndpointConfig {
  for (const { pattern, config } of ENDPOINT_CONFIGS) {
    if (typeof pattern === 'string') {
      if (endpoint.includes(pattern)) {
        return config;
      }
    } else if (pattern.test(endpoint)) {
      return config;
    }
  }
  return DEFAULT_ENDPOINT_CONFIG;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private retryConfig: RetryConfig;

  constructor() {
    this.baseURL = Config.API_URL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.retryConfig = DEFAULT_RETRY_CONFIG;
  }

  /**
   * Check if an error is retriable based on error type and endpoint config
   */
  private isRetriableError(error: unknown, endpointConfig: EndpointConfig): boolean {
    // Retry on 5xx server errors (always)
    if (error instanceof ApiError && error.status && error.status >= 500 && error.status < 600) {
      return true;
    }

    // Retry on network errors (always)
    if (error instanceof TypeError && error.message.includes('Network')) {
      return true;
    }

    // Retry on timeout only if endpoint config allows it
    if (error instanceof ApiError && error.code === 'TIMEOUT') {
      return endpointConfig.retryOnTimeout;
    }

    return false;
  }

  /**
   * Calculate delay for exponential backoff with jitter
   */
  private getRetryDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = this.retryConfig.baseDelayMs * Math.pow(2, attempt);
    // Add jitter (±25% randomization) to prevent thundering herd
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    const delay = Math.min(exponentialDelay + jitter, this.retryConfig.maxDelayMs);
    return Math.round(delay);
  }

  /**
   * Sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

    // Get endpoint-specific configuration for timeout and retry behavior
    const endpointConfig = getEndpointConfig(endpoint);
    const maxRetries = endpointConfig.maxRetries ?? this.retryConfig.maxRetries;

    // Get Firebase auth token for authenticated requests
    const authToken = await this.getAuthToken();
    const authHeaders: Record<string, string> = authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {};

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...(options.headers as Record<string, string> || {}),
      },
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create timeout promise using endpoint-specific timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new ApiError({
              message: `Request timeout after ${endpointConfig.timeout / 1000}s`,
              code: 'TIMEOUT',
            }));
          }, endpointConfig.timeout);
        });

        // Race between fetch and timeout
        const response = await Promise.race([
          fetch(url, config),
          timeoutPromise,
        ]);

        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error;

        // Check if we should retry based on error type and endpoint config
        const isLastAttempt = attempt === maxRetries;
        const shouldRetry = !isLastAttempt && this.isRetriableError(error, endpointConfig);

        if (shouldRetry) {
          // Use endpoint-specific retry delays if configured, otherwise use exponential backoff
          // Specific delays are important for horoscope endpoints to let generation complete
          const delay = endpointConfig.retryDelays?.[attempt] ?? this.getRetryDelay(attempt);
          console.log(
            `[ApiClient] Request failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
            `retrying in ${delay}ms: ${endpoint}`,
            error instanceof Error ? error.message : error
          );
          await this.sleep(delay);
        } else {
          console.error(
            `[ApiClient] Request failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
            `not retrying: ${endpoint}`,
            error
          );
          throw error;
        }
      }
    }

    // This should not be reached, but TypeScript needs it
    throw lastError;
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

