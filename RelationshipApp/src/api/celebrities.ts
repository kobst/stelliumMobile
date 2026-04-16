import { ApiError } from '../../../shared/api/client';
import type {
  Celebrity,
  GetCelebsRequest,
  PaginatedCelebritiesResponse,
} from '../../../shared/api/celebrities';
import { relationshipAppEnv } from '../config/env';

async function postPublicJson<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${relationshipAppEnv.apiUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();

    try {
      const errorJson = JSON.parse(errorText);
      throw new ApiError({
        message: errorJson.error || errorJson.message || `HTTP ${response.status}`,
        status: response.status,
        code: errorJson.code,
      });
    } catch {
      throw new ApiError({
        message: errorText || `HTTP ${response.status}`,
        status: response.status,
      });
    }
  }

  return response.json() as Promise<T>;
}

export type { Celebrity };

export const celebritiesApi = {
  async getCelebrities(
    request: GetCelebsRequest = {}
  ): Promise<Celebrity[] | PaginatedCelebritiesResponse> {
    if (request.usePagination) {
      return postPublicJson<PaginatedCelebritiesResponse>('/getCelebs', {
        usePagination: true,
        page: request.page ?? 1,
        limit: request.limit ?? 20,
        search: request.search ?? '',
        sortBy: request.sortBy ?? 'name',
        sortOrder: request.sortOrder ?? 'asc',
      });
    }

    return postPublicJson<Celebrity[]>('/getCelebs', {});
  },
};
