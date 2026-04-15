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

export interface ClusterScores {
  Harmony: number;
  Passion: number;
  Connection: number;
  Stability: number;
  Growth: number;
  overall: number;
}

export interface Archetype {
  version: string;
  archetypeKey: string;
  label: string;
  blurb: string;
  dominantClusters: string[];
  supportClusters: string[];
  tensionClusters: string[];
  shape: 'balanced' | 'polarized' | 'concentrated' | 'flat' | 'conflicted';
  tone: 'steady' | 'easy' | 'magnetic' | 'growth-heavy' | 'volatile' | 'mixed';
  confidence: number;
}

export interface TopCelebMatch {
  key: string;
  celebId: string;
  celebName: string | null;
  profilePhotoUrl: string | null;
  selectedAspect: {
    aspectType: string;
    label: string;
    shortMeaning?: string;
    primaryCluster: string;
    clusterThemes: string[];
    orb: number;
    userPlacement?: CelebAspectMatch['userPlacement'];
    celebPlacement?: CelebAspectMatch['celebPlacement'];
    annotation?: CelebAspectMatch['annotation'];
  };
  annotation?: CelebAspectMatch['annotation'];
  clusterScores: ClusterScores | null;
  archetype: Archetype | null;
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
  topCelebMatches?: TopCelebMatch[];
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
  romanticProfileBlurb: string | null;
  referencedCodes: string[];
  celebMatchesStatus: AsyncStatus;
  celebAnnotationsStatus: AsyncStatus;
  celebAspectBank: CelebAspectBank | null;
  topAspects: TopAspect[];
  topCelebMatches?: TopCelebMatch[];
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
  topCelebMatches?: TopCelebMatch[];
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
  romanticProfileBlurb: string | null;
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
