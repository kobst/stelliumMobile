import { useCallback, useEffect, useState } from 'react';
import { weeklyArticlesApi, type WeeklyArticle } from '../api';

export type WeeklyArticleLoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export interface UseWeeklyArticleResult {
  article: WeeklyArticle | null;
  state: WeeklyArticleLoadState;
  error: string | null;
  reload: () => Promise<void>;
}

export function useWeeklyArticle(weekStartDate?: string): UseWeeklyArticleResult {
  const [article, setArticle] = useState<WeeklyArticle | null>(null);
  const [state, setState] = useState<WeeklyArticleLoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const result = await weeklyArticlesApi.getCurrent(weekStartDate);
      if (!result) {
        setArticle(null);
        setState('empty');
        return;
      }
      setArticle(result);
      setState('ready');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load weekly article';
      setError(message);
      setState('error');
    }
  }, [weekStartDate]);

  useEffect(() => {
    load();
  }, [load]);

  return { article, state, error, reload: load };
}
