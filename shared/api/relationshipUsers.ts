import { relationshipApiClient } from './relationshipClient';
import { SubjectDocument } from '../types/subject';
import {
  getRelationshipAppRequestMetadata,
  RelationshipAppCreateUserRequest,
  RelationshipAppCreateUserUnknownTimeRequest,
  RelationshipAppProfile,
  RELATIONSHIP_APP_DOMAIN,
} from '../domain/relationshipUser';

type SubjectResponse =
  | SubjectDocument
  | {
      user: SubjectDocument;
      overview?: string;
      status?: string;
    };

function unwrapSubjectDocument(response: SubjectResponse): SubjectDocument {
  if ('user' in response && response.user) {
    return response.user as SubjectDocument;
  }

  return response as SubjectDocument;
}

function normalizeRelationshipAppProfile(
  response: SubjectResponse,
  firebaseUid: string | null
): RelationshipAppProfile {
  const subject = unwrapSubjectDocument(response);
  const romanticOverview =
    'overview' in response && typeof response.overview === 'string'
      ? response.overview
      : undefined;
  const romanticOverviewStatus =
    'status' in response && typeof response.status === 'string'
      ? response.status
      : undefined;

  if (subject.kind !== 'accountSelf') {
    throw new Error(
      `Expected relationship-app accountSelf subject, received ${subject.kind}`
    );
  }

  const backendAppDomain =
    typeof (subject as { appDomain?: unknown }).appDomain === 'string'
      ? ((subject as { appDomain?: string }).appDomain ?? null)
      : null;

  // Transitional behavior:
  // For now this wrapper can talk to legacy endpoints while backend catches up.
  // Once backend returns an explicit app domain, fail closed on a mismatch.
  if (backendAppDomain && backendAppDomain !== RELATIONSHIP_APP_DOMAIN) {
    throw new Error(
      `Expected ${RELATIONSHIP_APP_DOMAIN} user domain, received ${backendAppDomain}`
    );
  }

  return {
    id: subject._id,
    appDomain: RELATIONSHIP_APP_DOMAIN,
    firebaseUid,
    firstName: subject.firstName,
    lastName: subject.lastName,
    displayName: `${subject.firstName} ${subject.lastName}`.trim(),
    email: subject.email,
    dateOfBirth: subject.dateOfBirth,
    placeOfBirth: subject.placeOfBirth,
    time: subject.time,
    birthTimeUnknown: subject.birthTimeUnknown,
    totalOffsetHours: subject.totalOffsetHours,
    subject,
    backendAppDomain,
    isDomainExplicit: backendAppDomain === RELATIONSHIP_APP_DOMAIN,
    romanticOverview,
    romanticOverviewStatus,
  };
}

export const relationshipUsersApi = {
  async getProfileByFirebaseUid(firebaseUid: string): Promise<RelationshipAppProfile> {
    const response = await relationshipApiClient.post<SubjectResponse>('/getUserByFirebaseUid', {
      firebaseUid,
      ...getRelationshipAppRequestMetadata(),
    });

    return normalizeRelationshipAppProfile(response, firebaseUid);
  },

  async createProfile(
    request: Omit<RelationshipAppCreateUserRequest, 'appDomain' | 'clientProduct'>
  ): Promise<RelationshipAppProfile> {
    const response = await relationshipApiClient.post<SubjectResponse>('/createUser', {
      ...request,
      ...getRelationshipAppRequestMetadata(),
    });

    return normalizeRelationshipAppProfile(response, request.firebaseUid);
  },

  async getMe(): Promise<RelationshipAppProfile> {
    const response = await relationshipApiClient.get<{
      user: SubjectDocument;
      userId: string;
      birthChart?: Record<string, unknown>;
      overview?: string | null;
      romanticProfileBlurb?: string | null;
      referencedCodes?: string[];
      celebAspectBank?: import('./onboarding').CelebAspectBank | null;
      topAspects?: import('./onboarding').TopAspect[];
      topCelebMatches?: import('./onboarding').TopCelebMatch[];
    }>('/relationship-app/me');

    const normalized = normalizeRelationshipAppProfile(
      {
        user: {
          ...response.user,
          _id: response.userId || response.user._id,
          birthChart: response.birthChart ?? response.user.birthChart,
        },
        overview: response.overview ?? undefined,
      },
      response.user.firebaseUid ?? null
    );

    return {
      ...normalized,
      romanticProfileBlurb: response.romanticProfileBlurb ?? null,
      referencedCodes: response.referencedCodes ?? [],
      celebAspectBank: response.celebAspectBank ?? null,
      topAspects: response.topAspects ?? [],
      topCelebMatches: response.topCelebMatches ?? [],
    };
  },

  async createProfileUnknownTime(
    request: Omit<RelationshipAppCreateUserUnknownTimeRequest, 'appDomain' | 'clientProduct'>
  ): Promise<RelationshipAppProfile> {
    const response = await relationshipApiClient.post<SubjectResponse>('/createUserUnknownTime', {
      ...request,
      ...getRelationshipAppRequestMetadata(),
    });

    return normalizeRelationshipAppProfile(response, request.firebaseUid);
  },

  async updateProfile(
    userId: string,
    updates: Partial<
      Omit<RelationshipAppCreateUserRequest, 'firebaseUid' | 'appDomain' | 'clientProduct'>
    >
  ): Promise<RelationshipAppProfile> {
    const response = await relationshipApiClient.put<SubjectResponse>(`/users/${userId}`, {
      ...updates,
      ...getRelationshipAppRequestMetadata(),
    });

    return normalizeRelationshipAppProfile(response, null);
  },

  async createGuestSubjectRomantic(request: {
    firstName: string;
    lastName: string;
    gender: string;
    placeOfBirth: string;
    dateOfBirth: string;
    time: string;
    lat: number;
    lon: number;
    tzone: number;
    ownerUserId: string;
  }): Promise<CreateGuestSubjectRomanticResult> {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[relationshipUsersApi.createGuestSubjectRomantic] request', {
        ownerUserId: request.ownerUserId,
      });
    }
    const response = await relationshipApiClient.post<CreateGuestSubjectRomanticEnvelope>(
      '/createGuestSubjectRomantic',
      {
        ...request,
        ...getRelationshipAppRequestMetadata(),
      }
    );
    return normalizeRomanticGuestResponse(response, 'createGuestSubjectRomantic');
  },

  async createGuestSubjectUnknownTimeRomantic(request: {
    firstName: string;
    lastName: string;
    gender: string;
    placeOfBirth: string;
    dateOfBirth: string;
    lat: number;
    lon: number;
    tzone: number;
    ownerUserId: string;
  }): Promise<CreateGuestSubjectRomanticResult> {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[relationshipUsersApi.createGuestSubjectUnknownTimeRomantic] request', {
        ownerUserId: request.ownerUserId,
      });
    }
    const response = await relationshipApiClient.post<CreateGuestSubjectRomanticEnvelope>(
      '/createGuestSubjectUnknownTimeRomantic',
      {
        ...request,
        ...getRelationshipAppRequestMetadata(),
      }
    );
    return normalizeRomanticGuestResponse(response, 'createGuestSubjectUnknownTimeRomantic');
  },

  async getGuestSubjectRomantic(userId: string): Promise<CreateGuestSubjectRomanticResult> {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[relationshipUsersApi.getGuestSubjectRomantic] request', { userId });
    }
    const response = await relationshipApiClient.post<CreateGuestSubjectRomanticEnvelope>(
      '/getGuestSubjectRomantic',
      {
        userId,
        ...getRelationshipAppRequestMetadata(),
      }
    );
    return normalizeRomanticGuestResponse(response, 'getGuestSubjectRomantic');
  },
};

export interface CreateGuestSubjectRomanticResult {
  partner: SubjectDocument;
  birthChart: Record<string, unknown> | null;
  overview: string | null;
  romanticProfileBlurb: string | null;
  referencedCodes: string[];
  overviewMode: string | null;
  status: string | null;
}

interface CreateGuestSubjectRomanticEnvelope {
  success?: boolean;
  error?: string;
  userId?: string;
  guestSubject?: Partial<SubjectDocument>;
  birthChart?: Record<string, unknown> | null;
  overview?: string | null;
  romanticProfileBlurb?: string | null;
  referencedCodes?: string[];
  overviewMode?: string | null;
  status?: string | null;
}

function normalizeRomanticGuestResponse(
  response: CreateGuestSubjectRomanticEnvelope,
  endpoint: string
): CreateGuestSubjectRomanticResult {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[relationshipUsersApi.${endpoint}] response`, {
      success: response?.success,
      hasUserId: Boolean(response?.userId),
      userId: response?.userId,
      hasGuestSubject: Boolean(response?.guestSubject),
      status: response?.status,
      keys: response ? Object.keys(response) : null,
    });
  }

  if (!response || response.success === false) {
    throw new Error(response?.error || 'Failed to create guest subject');
  }

  if (!response.userId) {
    throw new Error('Guest subject response missing userId');
  }

  const partner = {
    ...(response.guestSubject ?? {}),
    _id: response.userId,
  } as SubjectDocument;

  return {
    partner,
    birthChart: response.birthChart ?? null,
    overview: response.overview ?? null,
    romanticProfileBlurb: response.romanticProfileBlurb ?? null,
    referencedCodes: response.referencedCodes ?? [],
    overviewMode: response.overviewMode ?? null,
    status: response.status ?? null,
  };
}
