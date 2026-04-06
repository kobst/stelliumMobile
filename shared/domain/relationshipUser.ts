import { SubjectDocument } from '../types/subject';
import { APP_DOMAINS } from './appDomains';

export const RELATIONSHIP_APP_DOMAIN = APP_DOMAINS.relationshipApp;

export interface RelationshipAppUserRequestMetadata {
  appDomain: typeof RELATIONSHIP_APP_DOMAIN;
  clientProduct: 'relationship-app';
}

export interface RelationshipAppCreateUserRequest extends RelationshipAppUserRequestMetadata {
  firebaseUid: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  time: string;
  lat?: number;
  lon?: number;
  tzone?: number;
  gender?: string;
  unknownTime?: boolean;
}

export interface RelationshipAppCreateUserUnknownTimeRequest extends RelationshipAppUserRequestMetadata {
  firebaseUid: string;
  firstName: string;
  lastName: string;
  gender: string;
  placeOfBirth: string;
  dateOfBirth: string;
  email: string;
  lat: number;
  lon: number;
  tzone: number;
}

export interface RelationshipAppProfile {
  id: string;
  appDomain: typeof RELATIONSHIP_APP_DOMAIN;
  firebaseUid: string | null;
  firstName: string;
  lastName: string;
  displayName: string;
  email?: string;
  dateOfBirth: string;
  placeOfBirth: string;
  time?: string;
  birthTimeUnknown?: boolean;
  totalOffsetHours: number;
  subject: SubjectDocument;
  backendAppDomain: string | null;
  isDomainExplicit: boolean;
  romanticOverview?: string;
  romanticOverviewStatus?: string;
}

export function getRelationshipAppRequestMetadata(): RelationshipAppUserRequestMetadata {
  return {
    appDomain: RELATIONSHIP_APP_DOMAIN,
    clientProduct: 'relationship-app',
  };
}
