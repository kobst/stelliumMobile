import { apiClient } from './client';
import { SubjectDocument } from '../../src/types';
import {
  getRelationshipAppRequestMetadata,
  RelationshipAppCreateUserRequest,
  RelationshipAppCreateUserUnknownTimeRequest,
  RelationshipAppProfile,
  RELATIONSHIP_APP_DOMAIN,
} from '../domain/relationshipUser';

type SubjectResponse = SubjectDocument | { user: SubjectDocument };

function unwrapSubjectDocument(response: SubjectResponse): SubjectDocument {
  if ('user' in response && response.user) {
    return response.user;
  }

  return response;
}

function normalizeRelationshipAppProfile(
  response: SubjectResponse,
  firebaseUid: string | null
): RelationshipAppProfile {
  const subject = unwrapSubjectDocument(response);

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
  };
}

export const relationshipUsersApi = {
  async getProfileByFirebaseUid(firebaseUid: string): Promise<RelationshipAppProfile> {
    const response = await apiClient.post<SubjectResponse>('/getUserByFirebaseUid', {
      firebaseUid,
      ...getRelationshipAppRequestMetadata(),
    });

    return normalizeRelationshipAppProfile(response, firebaseUid);
  },

  async createProfile(
    request: Omit<RelationshipAppCreateUserRequest, 'appDomain' | 'clientProduct'>
  ): Promise<RelationshipAppProfile> {
    const response = await apiClient.post<SubjectResponse>('/createUser', {
      ...request,
      ...getRelationshipAppRequestMetadata(),
    });

    return normalizeRelationshipAppProfile(response, request.firebaseUid);
  },

  async createProfileUnknownTime(
    request: Omit<RelationshipAppCreateUserUnknownTimeRequest, 'appDomain' | 'clientProduct'>
  ): Promise<RelationshipAppProfile> {
    const response = await apiClient.post<SubjectResponse>('/createUserUnknownTime', {
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
    const response = await apiClient.put<SubjectResponse>(`/users/${userId}`, {
      ...updates,
      ...getRelationshipAppRequestMetadata(),
    });

    return normalizeRelationshipAppProfile(response, null);
  },
};
