import Config from 'react-native-config';
import { getCurrentFirebaseIdToken } from '../auth/session';

export interface ApiResponse<T = unknown> {
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

interface EndpointConfig {
  timeout: number;
  retryOnTimeout: boolean;
  maxRetries?: number;
  retryDelays?: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};

const ENDPOINT_CONFIGS: Array<{ pattern: string | RegExp; config: EndpointConfig }> = [
  { pattern: '/chat', config: { timeout: 60000, retryOnTimeout: true } },
  { pattern: '/enhanced-chat', config: { timeout: 60000, retryOnTimeout: true } },
  { pattern: /\/horoscope\/daily/, config: { timeout: 90000, retryOnTimeout: true, maxRetries: 2, retryDelays: [2000, 5000] } },
  { pattern: /\/horoscope\/weekly/, config: { timeout: 90000, retryOnTimeout: true, maxRetries: 2, retryDelays: [2000, 5000] } },
  { pattern: /\/horoscope\/monthly/, config: { timeout: 120000, retryOnTimeout: true, maxRetries: 2, retryDelays: [3000, 7000] } },
  { pattern: /\/horoscope\/custom/, config: { timeout: 120000, retryOnTimeout: true, maxRetries: 2, retryDelays: [3000, 7000] } },
  { pattern: /\/horoscope\/transit-windows/, config: { timeout: 60000, retryOnTimeout: true, retryDelays: [2000, 5000] } },
];

const DEFAULT_ENDPOINT_CONFIG: EndpointConfig = {
  timeout: 30000,
  retryOnTimeout: false,
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

class BaseApiClient {
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

  private isRetriableError(error: unknown, endpointConfig: EndpointConfig): boolean {
    if (error instanceof ApiError && error.status && error.status >= 500 && error.status < 600) {
      return true;
    }

    if (error instanceof TypeError && error.message.includes('Network')) {
      return true;
    }

    if (error instanceof ApiError && error.code === 'TIMEOUT') {
      return endpointConfig.retryOnTimeout;
    }

    return false;
  }

  private getRetryDelay(attempt: number): number {
    const exponentialDelay = this.retryConfig.baseDelayMs * Math.pow(2, attempt);
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    const delay = Math.min(exponentialDelay + jitter, this.retryConfig.maxDelayMs);
    return Math.round(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorCode = '';

      try {
        const errorText = await response.text();

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
          errorCode = errorJson.code || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
          errorCode = errorText;
        }
      } catch {
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
    } catch {
      throw new ApiError({
        message: 'Invalid JSON response',
        status: response.status,
      });
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const endpointConfig = getEndpointConfig(endpoint);
    const maxRetries = endpointConfig.maxRetries ?? this.retryConfig.maxRetries;

    const authToken = await getCurrentFirebaseIdToken();
    const authHeaders: Record<string, string> = authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {};

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...((options.headers as Record<string, string>) || {}),
      },
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new ApiError({
                message: `Request timeout after ${endpointConfig.timeout / 1000}s`,
                code: 'TIMEOUT',
              })
            );
          }, endpointConfig.timeout);
        });

        const response = await Promise.race([fetch(url, config), timeoutPromise]);
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error;

        const isLastAttempt = attempt === maxRetries;
        const shouldRetry = !isLastAttempt && this.isRetriableError(error, endpointConfig);

        if (!shouldRetry) {
          throw error;
        }

        const delay = endpointConfig.retryDelays?.[attempt] ?? this.getRetryDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  async post<T>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  async poll<T>(
    endpoint: string,
    data: unknown,
    interval: number = 3000,
    maxAttempts: number = 20,
    headers?: Record<string, string>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const pollInterval = setInterval(async () => {
        attempts += 1;

        try {
          const response = await this.post<any>(endpoint, data, headers);

          if (response.isCompleted || response.status === 'completed') {
            clearInterval(pollInterval);
            resolve(response);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            reject(
              new ApiError({
                message: 'Polling timeout - maximum attempts reached',
                code: 'POLLING_TIMEOUT',
              })
            );
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, interval);
    });
  }
}

export const apiClient = new BaseApiClient();
