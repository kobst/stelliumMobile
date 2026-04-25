import { relationshipApiClient } from '../../../shared/api/relationshipClient';

export interface CollectionCeleb {
  id: string;
  firstName: string;
  lastName?: string;
  gender?: string | null;
  profilePhotoUrl?: string | null;
  romanticProfileBlurb?: string | null;
  sunSign?: string | null;
  moonSign?: string | null;
  venusSign?: string | null;
  marsSign?: string | null;
  risingSign?: string | null;
}

export interface DiscoverCollection {
  id: string;
  title: string;
  description: string;
  mood?: string | null;
  accent?: string | null;
  celebs: CollectionCeleb[];
}

interface DiscoverCollectionsResponse {
  success?: boolean;
  weekOf?: string;
  collections?: DiscoverCollection[];
}

export interface CelebrityProfile {
  userId: string;
  celebrity: {
    _id: string;
    firstName?: string;
    lastName?: string;
    gender?: string | null;
    kind?: string;
    profilePhotoUrl?: string | null;
  };
  birthChart: Record<string, unknown> | null;
  overview: string | null;
  romanticProfileBlurb: string | null;
  referencedCodes: string[];
  romanticAnalysis: unknown;
  overviewMode: string | null;
}

interface CelebrityProfileResponse {
  success?: boolean;
  celebrity?: CelebrityProfile['celebrity'];
  userId?: string;
  birthChart?: Record<string, unknown> | null;
  overview?: string | null;
  romanticProfileBlurb?: string | null;
  referencedCodes?: string[];
  romanticAnalysis?: unknown;
  overviewMode?: string | null;
}

export interface ChartsLikeYoursCeleb {
  id: string;
  firstName: string;
  lastName?: string;
  profilePhotoUrl?: string | null;
  sharedPlacements: string[];
  overlapCount: number;
  romanticProfileBlurb?: string | null;
}

export interface ChartsLikeYoursMatchedPlacement {
  field: string;
  label: string;
  subtitle: string;
}

export interface ChartsLikeYoursResponse {
  weekOf: string;
  matchedPlacement: ChartsLikeYoursMatchedPlacement | null;
  celebs: ChartsLikeYoursCeleb[];
}

interface ChartsLikeYoursRawResponse {
  success?: boolean;
  weekOf?: string;
  matchedPlacement?: ChartsLikeYoursMatchedPlacement | null;
  celebs?: ChartsLikeYoursCeleb[];
}

export interface CelebRelationship {
  _id: string;
  userA_id: string;
  userB_id: string;
  userA_name: string;
  userB_name: string;
  userA_firstName?: string;
  userA_lastName?: string;
  userB_firstName?: string;
  userB_lastName?: string;
  userA_profilePhotoUrl?: string | null;
  userB_profilePhotoUrl?: string | null;
  isCelebrityRelationship?: boolean;
  overallScore?: number | null;
  clusterScores?: {
    Harmony?: number | null;
    Passion?: number | null;
    Connection?: number | null;
    Stability?: number | null;
    Growth?: number | null;
  } | null;
  archetypeKey?: string | null;
  archetypeLabel?: string | null;
  archetypeBlurb?: string | null;
  archetype?: {
    version?: string;
    archetypeKey?: string;
    label?: string;
    blurb?: string;
    dominantClusters?: string[];
    supportClusters?: string[];
    tensionClusters?: string[];
    shape?: string;
    tone?: string;
    confidence?: string;
  } | null;
  initialOverview?: string | null;
  clusterAnalysisGeneratedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface CelebRelationshipsResponse {
  success?: boolean;
  count?: number;
  relationships?: CelebRelationship[];
}

export const discoverApi = {
  async getCollections(): Promise<DiscoverCollection[]> {
    const response = await relationshipApiClient.get<DiscoverCollectionsResponse>(
      '/relationship-app/discover/collections'
    );
    if (!response || response.success === false) {
      throw new Error('Failed to load discover collections.');
    }
    return Array.isArray(response.collections) ? response.collections : [];
  },

  async getChartsLikeYours(userId: string): Promise<ChartsLikeYoursResponse> {
    if (!userId) {
      throw new Error('getChartsLikeYours requires a userId');
    }
    const response = await relationshipApiClient.get<ChartsLikeYoursRawResponse>(
      `/relationship-app/users/${encodeURIComponent(userId)}/discover/charts-like-yours`
    );
    if (!response || response.success === false) {
      throw new Error('Failed to load charts like yours.');
    }
    return {
      weekOf: response.weekOf ?? '',
      matchedPlacement: response.matchedPlacement ?? null,
      celebs: Array.isArray(response.celebs) ? response.celebs : [],
    };
  },

  async getCelebRelationships(limit: number = 20): Promise<CelebRelationship[]> {
    const response = await relationshipApiClient.post<CelebRelationshipsResponse>(
      '/getCelebRelationships',
      { limit }
    );
    if (!response || response.success === false) {
      throw new Error('Failed to load celebrity relationships.');
    }
    return Array.isArray(response.relationships) ? response.relationships : [];
  },

  async getCelebrityProfile(userId: string): Promise<CelebrityProfile> {
    if (!userId) {
      throw new Error('getCelebrityProfile requires a userId');
    }
    const response = await relationshipApiClient.get<CelebrityProfileResponse>(
      `/relationship-app/celebs/${encodeURIComponent(userId)}/profile`
    );
    if (!response || response.success === false) {
      throw new Error('Failed to load celebrity profile.');
    }
    return {
      userId: response.userId ?? userId,
      celebrity: response.celebrity ?? { _id: userId },
      birthChart: response.birthChart ?? null,
      overview: response.overview ?? null,
      romanticProfileBlurb: response.romanticProfileBlurb ?? null,
      referencedCodes: Array.isArray(response.referencedCodes) ? response.referencedCodes : [],
      romanticAnalysis: response.romanticAnalysis ?? null,
      overviewMode: response.overviewMode ?? null,
    };
  },
};
