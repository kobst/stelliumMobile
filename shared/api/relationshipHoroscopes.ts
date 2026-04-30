import { relationshipApiClient } from './relationshipClient';
import { ApiError } from './baseClient';

export type HoroscopePeriod = 'weekly' | 'monthly';
export type RelationshipHoroscopeMode = 'composite' | 'synastry';

export interface HoroscopeKeyTheme {
  transitingPlanet: string;
  targetPlanet: string;
  aspect: string;
  exactDate?: string | null;
  description?: string | null;
  priority?: number | null;
}

export interface HoroscopeAnalysis {
  keyThemes?: HoroscopeKeyTheme[];
  detailedAnalysis?: unknown[];
  romance?: {
    hasKnownBirthTime?: boolean;
    romanceTransitCount?: number;
    moonPhaseCount?: number;
    transitToTransitCount?: number;
  };
}

export interface RomanceHoroscopeDocument {
  _id: string;
  subjectType: 'relationship-app-user';
  mode: 'romance';
  userId: string;
  userName?: string;
  period: HoroscopePeriod;
  startDate: string;
  endDate: string;
  generatedAt: string;
  interpretation: string;
  analysis?: HoroscopeAnalysis;
  referencedCodes?: string[];
}

export interface RelationshipHoroscopeDocument {
  _id: string;
  subjectType: 'relationship';
  mode: RelationshipHoroscopeMode;
  compositeChartId: string;
  userAId?: string;
  userBId?: string;
  period: HoroscopePeriod;
  startDate: string;
  endDate: string;
  generatedAt: string;
  interpretation: string;
  analysis?: HoroscopeAnalysis;
  referencedCodes?: string[];
}

interface HoroscopeEnvelope<T> {
  success?: boolean;
  cached?: boolean;
  horoscope?: T;
  status?: string;
}

function isNotReadyError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function unwrapHoroscope<T>(envelope: HoroscopeEnvelope<T>, label: string): T {
  if (!envelope?.horoscope) {
    throw new Error(`${label}: missing horoscope payload`);
  }
  return envelope.horoscope;
}

export const relationshipHoroscopesApi = {
  async getRomanceCurrent(
    userId: string,
    period: HoroscopePeriod = 'weekly'
  ): Promise<RomanceHoroscopeDocument | null> {
    const path = `/relationship-app/users/${encodeURIComponent(userId)}/horoscope/romance/current?period=${period}`;
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[relationshipHoroscopesApi.getRomanceCurrent] GET', path);
    }
    try {
      const envelope = await relationshipApiClient.get<HoroscopeEnvelope<RomanceHoroscopeDocument>>(
        path
      );
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[relationshipHoroscopesApi.getRomanceCurrent] response', {
          hasHoroscope: Boolean(envelope?.horoscope),
          status: envelope?.status,
        });
      }
      return envelope?.horoscope ?? null;
    } catch (error: unknown) {
      if (isNotReadyError(error)) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[relationshipHoroscopesApi.getRomanceCurrent] not_ready (404)');
        }
        return null;
      }
      throw error;
    }
  },

  async generateRomance(
    userId: string,
    payload: { period?: HoroscopePeriod; startDate?: string } = {}
  ): Promise<RomanceHoroscopeDocument> {
    const path = `/relationship-app/users/${encodeURIComponent(userId)}/horoscope/romance`;
    const body = {
      period: payload.period ?? 'weekly',
      ...(payload.startDate ? { startDate: payload.startDate } : {}),
    };
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[relationshipHoroscopesApi.generateRomance] POST', path, body);
    }
    const envelope = await relationshipApiClient.post<HoroscopeEnvelope<RomanceHoroscopeDocument>>(
      path,
      body
    );
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[relationshipHoroscopesApi.generateRomance] response', {
        success: envelope?.success,
        cached: envelope?.cached,
        hasHoroscope: Boolean(envelope?.horoscope),
      });
    }
    return unwrapHoroscope(envelope, 'generateRomance');
  },

  async ensureCurrentRomance(
    userId: string,
    period: HoroscopePeriod = 'weekly'
  ): Promise<RomanceHoroscopeDocument> {
    const cached = await this.getRomanceCurrent(userId, period);
    if (cached) return cached;
    // POST returns the freshly generated doc directly — no second GET needed.
    return this.generateRomance(userId, { period });
  },

  async getRelationshipCurrent(
    compositeChartId: string,
    options: { period?: HoroscopePeriod; mode?: RelationshipHoroscopeMode } = {}
  ): Promise<RelationshipHoroscopeDocument | null> {
    const period = options.period ?? 'weekly';
    const mode = options.mode ?? 'composite';
    const path = `/relationship-app/relationships/${encodeURIComponent(
      compositeChartId
    )}/horoscope/current?period=${period}&mode=${mode}`;
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[relationshipHoroscopesApi.getRelationshipCurrent] GET', path);
    }
    try {
      const envelope = await relationshipApiClient.get<
        HoroscopeEnvelope<RelationshipHoroscopeDocument>
      >(path);
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[relationshipHoroscopesApi.getRelationshipCurrent] response', {
          hasHoroscope: Boolean(envelope?.horoscope),
          status: envelope?.status,
        });
      }
      return envelope?.horoscope ?? null;
    } catch (error: unknown) {
      if (isNotReadyError(error)) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[relationshipHoroscopesApi.getRelationshipCurrent] not_ready (404)', {
            compositeChartId,
          });
        }
        return null;
      }
      throw error;
    }
  },

  async generateRelationshipComposite(
    compositeChartId: string,
    payload: { period?: HoroscopePeriod; startDate?: string } = {}
  ): Promise<RelationshipHoroscopeDocument> {
    const path = `/relationship-app/relationships/${encodeURIComponent(
      compositeChartId
    )}/horoscope/composite`;
    const body = {
      period: payload.period ?? 'weekly',
      ...(payload.startDate ? { startDate: payload.startDate } : {}),
    };
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[relationshipHoroscopesApi.generateRelationshipComposite] POST', path, body);
    }
    const envelope = await relationshipApiClient.post<
      HoroscopeEnvelope<RelationshipHoroscopeDocument>
    >(path, body);
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[relationshipHoroscopesApi.generateRelationshipComposite] response', {
        success: envelope?.success,
        cached: envelope?.cached,
        hasHoroscope: Boolean(envelope?.horoscope),
      });
    }
    return unwrapHoroscope(envelope, 'generateRelationshipComposite');
  },

  async ensureCurrentRelationshipComposite(
    compositeChartId: string,
    period: HoroscopePeriod = 'weekly'
  ): Promise<RelationshipHoroscopeDocument> {
    const cached = await this.getRelationshipCurrent(compositeChartId, { period, mode: 'composite' });
    if (cached) return cached;
    // POST returns the freshly generated doc directly — no second GET needed.
    return this.generateRelationshipComposite(compositeChartId, { period });
  },
};
