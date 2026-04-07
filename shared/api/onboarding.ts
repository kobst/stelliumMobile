import { relationshipApiClient } from './relationshipClient';

export interface OnboardingPreviewRequest {
  firstName: string;
  lastName: string;
  gender: string;
  preferredPartnerGender?: string;
  dateOfBirth: string;
  time?: string;
  placeOfBirth: string;
  lat: string;
  lon: string;
  tzone: string;
  totalOffsetHours: number;
  profilePhotoUrl?: string;
}

export interface CelebAspectMatch {
  celebId: string;
  celebName: string;
  orb: number;
}

export interface TopAspect {
  aspectType: string;
  label: string;
  primaryCluster: string;
  clusterThemes: string[];
  matches: CelebAspectMatch[];
}

export interface CelebAspectBank {
  topAspects: TopAspect[];
  fullBank: TopAspect[];
}

export interface OnboardingPreviewUser {
  _id: string;
  firstName: string;
  lastName: string;
  gender: string;
  preferredPartnerGender?: string;
  kind: string;
  appDomain: string;
}

export interface OnboardingPreviewResponse {
  success: boolean;
  previewId: string;
  claimToken: string;
  user: OnboardingPreviewUser;
  birthChart: Record<string, unknown>;
  overview: string;
  referencedCodes: string[];
  celebAspectBank: CelebAspectBank;
  topAspects: TopAspect[];
  overviewMode: string;
  status: string;
}

export interface OnboardingClaimRequest {
  previewId: string;
  claimToken: string;
}

export interface OnboardingClaimResponse {
  success: boolean;
  user: OnboardingPreviewUser & { firebaseUid: string };
  userId: string;
  birthChart: Record<string, unknown>;
  overview: string;
  referencedCodes: string[];
  celebAspectBank: CelebAspectBank;
  topAspects: TopAspect[];
  overviewMode: string;
  status: string;
}

export const onboardingApi = {
  async submitPreview(
    request: OnboardingPreviewRequest
  ): Promise<OnboardingPreviewResponse> {
    return relationshipApiClient.post<OnboardingPreviewResponse>(
      '/relationship-app/onboarding-preview',
      request
    );
  },

  async claimPreview(
    request: OnboardingClaimRequest
  ): Promise<OnboardingClaimResponse> {
    return relationshipApiClient.post<OnboardingClaimResponse>(
      '/relationship-app/onboarding-claim',
      request
    );
  },
};
