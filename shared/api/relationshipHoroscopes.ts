import { relationshipApiClient } from './relationshipClient';
import { ApiError } from './baseClient';
import { devLog } from './devLog';

export type HoroscopePeriod = 'weekly' | 'monthly';
export type RelationshipHoroscopeMode = 'composite' | 'synastry' | 'unified';

export interface HoroscopeKeyTheme {
  transitingPlanet: string;
  targetPlanet: string;
  aspect: string;
  exactDate?: string | null;
  description?: string | null;
  priority?: number | null;
}

export interface UnifiedKeyThemes {
  composite?: HoroscopeKeyTheme[];
  synastry?: HoroscopeKeyTheme[];
}

export interface HoroscopeAnalysis {
  // Composite/synastry single-layer modes return a flat array.
  // Unified mode returns { composite, synastry }.
  keyThemes?: HoroscopeKeyTheme[] | UnifiedKeyThemes;
  detailedAnalysis?: unknown[];
  romance?: {
    hasKnownBirthTime?: boolean;
    romanceTransitCount?: number;
    moonPhaseCount?: number;
    transitToTransitCount?: number;
  };
  composite?: {
    hasKnownBirthTime?: boolean;
    mainThemeCount?: number;
    immediateEventCount?: number;
    moonPhaseCount?: number;
    transitToTransitCount?: number;
  };
  synastry?: {
    partnerAHasKnownBirthTime?: boolean;
    partnerBHasKnownBirthTime?: boolean;
    partnerATransitCount?: number;
    partnerBTransitCount?: number;
    activatedSynastryAspectCount?: number;
    activatedSynastryHousePlacementCount?: number;
  };
}

export interface RomanceTransit {
  type?: 'transit-to-natal' | string;
  start?: string;
  exact: string;
  end?: string;
  priority?: number | null;
  transitingPlanet: string;
  targetPlanet: string;
  aspect: string;
  transitingSign?: string;
  transitingSigns?: string[];
  targetSign?: string;
  transitingHouse?: number | null;
  targetHouse?: number | null;
  isRetrograde?: boolean;
  targetIsRetrograde?: boolean;
}

export interface MoonPhaseAspectToNatal {
  planet: string;
  aspect: string;
}

export interface MoonPhase {
  type?: 'moon-phase' | string;
  exact: string;
  start?: string;
  end?: string;
  priority?: number | null;
  transitingPlanet?: 'Moon' | string;
  description?: string | null;
  moonPhaseData?: {
    phase?: string;
    angle?: number;
    waxing?: boolean;
    moonSign?: string;
    description?: string | null;
  };
  aspectsToPersonalPlanets?: MoonPhaseAspectToNatal[];
}

export interface TransitToTransitAspect {
  type?: 'transit-to-transit' | string;
  start?: string;
  exact: string;
  end?: string;
  priority?: number | null;
  transitingPlanet: string;
  targetPlanet: string;
  aspect: string;
  transitingSign?: string;
  targetSign?: string;
  transitingHouse?: number | null;
  targetHouse?: number | null;
  description?: string | null;
  isRetrograde?: boolean;
  targetIsRetrograde?: boolean;
}

export interface HoroscopeTransitData {
  transits?: unknown[];
  romanceTransits?: RomanceTransit[];
  retrogrades?: unknown[];
  // Unified-mode buckets. Single-layer modes leave these undefined.
  composite?: {
    transits?: unknown[];
    mainThemes?: RomanceTransit[];
    immediateEvents?: RomanceTransit[];
    moonPhases?: MoonPhase[];
  };
  synastry?: {
    partnerA?: {
      transits?: unknown[];
      romanceTransits?: RomanceTransit[];
    };
    partnerB?: {
      transits?: unknown[];
      romanceTransits?: RomanceTransit[];
    };
    activatedAspects?: unknown[];
    activatedHouseOverlays?: unknown[];
  };
  sky?: {
    transitToTransitAspects?: TransitToTransitAspect[];
  };
}

export interface HoroscopeComponents {
  romanceTransits?: RomanceTransit[];
  moonPhases?: MoonPhase[];
  transitToTransitAspects?: TransitToTransitAspect[];
  // Unified-mode buckets. Single-layer modes leave these undefined.
  composite?: {
    mainThemes?: RomanceTransit[];
    immediateEvents?: RomanceTransit[];
    moonPhases?: MoonPhase[];
  };
  synastry?: {
    partnerATransits?: RomanceTransit[];
    partnerBTransits?: RomanceTransit[];
    activatedSynastryAspects?: unknown[];
    activatedSynastryHousePlacements?: unknown[];
  };
  sky?: {
    transitToTransitAspects?: TransitToTransitAspect[];
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
  transitData?: HoroscopeTransitData;
  components?: HoroscopeComponents;
}

export interface RelationshipHoroscopeDocument {
  _id: string;
  subjectType: 'relationship';
  mode: RelationshipHoroscopeMode;
  compositeChartId: string;
  userAId?: string;
  userBId?: string;
  userAName?: string;
  userBName?: string;
  period: HoroscopePeriod;
  startDate: string;
  endDate: string;
  generatedAt: string;
  interpretation: string;
  analysis?: HoroscopeAnalysis;
  referencedCodes?: string[];
  transitData?: HoroscopeTransitData;
  components?: HoroscopeComponents;
}

export interface RelationshipHoroscopeBilling {
  charged?: boolean;
  amount?: number;
  reason?: string;
}

interface HoroscopeEnvelope<T> {
  success?: boolean;
  cached?: boolean;
  horoscope?: T;
  status?: string;
  billing?: RelationshipHoroscopeBilling;
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
    devLog('relationshipHoroscopesApi.getRomanceCurrent GET', { path });
    try {
      const envelope = await relationshipApiClient.get<HoroscopeEnvelope<RomanceHoroscopeDocument>>(
        path
      );
      devLog('relationshipHoroscopesApi.getRomanceCurrent response', {
        hasHoroscope: Boolean(envelope?.horoscope),
        status: envelope?.status,
      });
      return envelope?.horoscope ?? null;
    } catch (error: unknown) {
      if (isNotReadyError(error)) {
        devLog('relationshipHoroscopesApi.getRomanceCurrent not_ready (404)');
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
    devLog('relationshipHoroscopesApi.generateRomance POST', { path, body });
    const envelope = await relationshipApiClient.post<HoroscopeEnvelope<RomanceHoroscopeDocument>>(
      path,
      body
    );
    devLog('relationshipHoroscopesApi.generateRomance response', {
      success: envelope?.success,
      cached: envelope?.cached,
      hasHoroscope: Boolean(envelope?.horoscope),
    });
    return unwrapHoroscope(envelope, 'generateRomance');
  },

  async ensureCurrentRomance(
    userId: string,
    period: HoroscopePeriod = 'weekly'
  ): Promise<RomanceHoroscopeDocument> {
    const cached = await this.getRomanceCurrent(userId, period);
    if (cached) {return cached;}
    // POST returns the freshly generated doc directly — no second GET needed.
    return this.generateRomance(userId, { period });
  },

  async getRelationshipCurrent(
    compositeChartId: string,
    options: { period?: HoroscopePeriod; mode?: RelationshipHoroscopeMode } = {}
  ): Promise<RelationshipHoroscopeDocument | null> {
    const period = options.period ?? 'weekly';
    const mode = options.mode ?? 'unified';
    const path = `/relationship-app/relationships/${encodeURIComponent(
      compositeChartId
    )}/horoscope/current?period=${period}&mode=${mode}`;
    devLog('relationshipHoroscopesApi.getRelationshipCurrent GET', { path });
    try {
      const envelope = await relationshipApiClient.get<
        HoroscopeEnvelope<RelationshipHoroscopeDocument>
      >(path);
      devLog('relationshipHoroscopesApi.getRelationshipCurrent response', {
        hasHoroscope: Boolean(envelope?.horoscope),
        status: envelope?.status,
      });
      return envelope?.horoscope ?? null;
    } catch (error: unknown) {
      if (isNotReadyError(error)) {
        devLog('relationshipHoroscopesApi.getRelationshipCurrent not_ready (404)', {
          compositeChartId,
        });
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
    devLog('relationshipHoroscopesApi.generateRelationshipComposite POST', { path, body });
    const envelope = await relationshipApiClient.post<
      HoroscopeEnvelope<RelationshipHoroscopeDocument>
    >(path, body);
    devLog('relationshipHoroscopesApi.generateRelationshipComposite response', {
      success: envelope?.success,
      cached: envelope?.cached,
      hasHoroscope: Boolean(envelope?.horoscope),
    });
    return unwrapHoroscope(envelope, 'generateRelationshipComposite');
  },

  async ensureCurrentRelationshipComposite(
    compositeChartId: string,
    period: HoroscopePeriod = 'weekly'
  ): Promise<RelationshipHoroscopeDocument> {
    const cached = await this.getRelationshipCurrent(compositeChartId, { period, mode: 'composite' });
    if (cached) {return cached;}
    // POST returns the freshly generated doc directly — no second GET needed.
    return this.generateRelationshipComposite(compositeChartId, { period });
  },

  async generateRelationshipUnified(
    compositeChartId: string,
    payload: { period?: HoroscopePeriod; startDate?: string } = {}
  ): Promise<RelationshipHoroscopeDocument> {
    const path = `/relationship-app/relationships/${encodeURIComponent(
      compositeChartId
    )}/horoscope/unified`;
    const body = {
      period: payload.period ?? 'weekly',
      ...(payload.startDate ? { startDate: payload.startDate } : {}),
    };
    devLog('relationshipHoroscopesApi.generateRelationshipUnified POST', { path, body });
    const envelope = await relationshipApiClient.post<
      HoroscopeEnvelope<RelationshipHoroscopeDocument>
    >(path, body);
    devLog('relationshipHoroscopesApi.generateRelationshipUnified response', {
      success: envelope?.success,
      cached: envelope?.cached,
      billing: envelope?.billing,
      hasHoroscope: Boolean(envelope?.horoscope),
    });
    return unwrapHoroscope(envelope, 'generateRelationshipUnified');
  },

  async listRelationship(
    compositeChartId: string,
    options: { period?: HoroscopePeriod; mode?: RelationshipHoroscopeMode; limit?: number } = {}
  ): Promise<RelationshipHoroscopeDocument[]> {
    const period = options.period ?? 'weekly';
    const mode = options.mode ?? 'unified';
    const limit = options.limit ?? 10;
    const path = `/relationship-app/relationships/${encodeURIComponent(
      compositeChartId
    )}/horoscopes?period=${period}&mode=${mode}&limit=${limit}`;
    devLog('relationshipHoroscopesApi.listRelationship GET', { path });
    const response = await relationshipApiClient.get<{
      success?: boolean;
      horoscopes?: RelationshipHoroscopeDocument[];
    }>(path);
    return response?.horoscopes ?? [];
  },

  async ensureCurrentRelationshipUnified(
    compositeChartId: string,
    period: HoroscopePeriod = 'weekly'
  ): Promise<RelationshipHoroscopeDocument> {
    const cached = await this.getRelationshipCurrent(compositeChartId, { period, mode: 'unified' });
    if (cached) {
      devLog('relationshipHoroscopesApi.ensureCurrentRelationshipUnified cache hit', {
        compositeChartId,
        period,
      });
      return cached;
    }
    // POST returns the freshly generated doc directly — no second GET needed.
    return this.generateRelationshipUnified(compositeChartId, { period });
  },
};
