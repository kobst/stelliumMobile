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
  celebName: string | null;
  profilePhotoUrl: string | null;
  orb: number;
  userPlacement?: {
    planet: string;
    sign?: string | null;
    house?: number | null;
    display?: string;
    compactDisplay?: string;
  };
  celebPlacement?: {
    planet: string;
    sign?: string | null;
    house?: number | null;
    display?: string;
    compactDisplay?: string;
  };
  annotation?: {
    title: string;
    sentence: string;
    generatedBy?: string;
    version?: string;
  };
}

export interface TopAspect {
  aspectType: string;
  label: string;
  shortMeaning?: string;
  primaryCluster: string;
  clusterThemes: string[];
  weight?: number;
  maxOrb?: number;
  score?: number;
  matchCount?: number;
  sweetSpotPenalty?: number;
  averageOrb?: number;
  matches: CelebAspectMatch[];
}

export interface AsyncStatus {
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
  lastRequestedAt?: string | null;
}

export interface CelebAspectBank {
  version?: string;
  configVersion?: string;
  computedAt?: string;
  lastCelebSyncAt?: string;
  celebGenderFilter?: string;
  celebrityCountScanned?: number;
  aspectCountConfigured?: number;
  annotationStrategy?: string;
  annotationRefreshNeeded?: boolean;
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
  overview: string | null;
  referencedCodes: string[];
  celebMatchesStatus: AsyncStatus;
  celebAnnotationsStatus: AsyncStatus;
  celebAspectBank: CelebAspectBank | null;
  topAspects: TopAspect[];
  overviewMode: string;
  status: string;
}

export interface OnboardingPreviewCelebResponse {
  success: boolean;
  previewId: string;
  celebMatchesStatus: AsyncStatus;
  celebAnnotationsStatus: AsyncStatus;
  celebAspectBank: CelebAspectBank | null;
  topAspects: TopAspect[];
  status:
    | 'celeb_matches_pending'
    | 'celeb_matches_running'
    | 'celeb_matches_ready'
    | 'celeb_annotations_running'
    | 'celeb_annotations_ready';
  error?: string;
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
  overview: string | null;
  referencedCodes: string[];
  celebMatchesStatus: AsyncStatus;
  celebAnnotationsStatus: AsyncStatus;
  celebAspectBank: CelebAspectBank | null;
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

  async startCelebMatches(
    previewId: string,
    claimToken: string
  ): Promise<OnboardingPreviewCelebResponse> {
    return relationshipApiClient.post<OnboardingPreviewCelebResponse>(
      `/relationship-app/onboarding-preview/${previewId}/celeb-matches`,
      { claimToken }
    );
  },

  async startCelebAnnotations(
    previewId: string,
    claimToken: string
  ): Promise<OnboardingPreviewCelebResponse> {
    return relationshipApiClient.post<OnboardingPreviewCelebResponse>(
      `/relationship-app/onboarding-preview/${previewId}/celeb-annotations`,
      { claimToken }
    );
  },

  async getCelebMatches(
    previewId: string,
    claimToken: string
  ): Promise<OnboardingPreviewCelebResponse> {
    const query = encodeURIComponent(claimToken);
    return relationshipApiClient.get<OnboardingPreviewCelebResponse>(
      `/relationship-app/onboarding-preview/${previewId}/celeb-matches?claimToken=${query}`
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
