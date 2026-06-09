import { ApiError } from '../../../shared/api/client';
import { relationshipApiClient } from '../../../shared/api/relationshipClient';

export interface WeeklyArticleTopic {
  title: string;
  subtitle?: string | null;
  transitReference?: string | null;
  planetPair?: string[] | null;
  aspectType?: string | null;
  readTimeMinutes?: number | null;
  category?: string | null;
}

export interface WeeklyArticleContent {
  headline?: string | null;
  heroSymbols?: string[] | null;
  body: string;
  generatedAt?: string | null;
}

export interface WeeklyArticle {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  source?: string | null;
  status?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  topic: WeeklyArticleTopic;
  content: WeeklyArticleContent;
  personalization?: unknown | null;
  celebLink?: unknown | null;
}

interface WeeklyArticleResponse {
  success?: boolean;
  article?: WeeklyArticle;
}

function buildPath(weekStartDate?: string): string {
  const base = '/relationship-app/discover/weekly-article';
  if (!weekStartDate) {
    return base;
  }
  return `${base}?weekStartDate=${encodeURIComponent(weekStartDate)}`;
}

export const weeklyArticlesApi = {
  async getCurrent(weekStartDate?: string): Promise<WeeklyArticle | null> {
    try {
      const response = await relationshipApiClient.get<WeeklyArticleResponse>(
        buildPath(weekStartDate)
      );
      if (!response || response.success === false || !response.article) {
        throw new Error('Failed to load weekly article.');
      }
      return response.article;
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
