import { create } from 'zustand';
import { RELATIONSHIP_APP_DOMAIN, RelationshipAppProfile } from '../../../shared/domain/relationshipUser';
import { SubjectDocument } from '../../../shared/types/subject';
import { EnhancedRelationshipAnalysisResponse } from '../../../shared/api/relationships';

export type TargetType = 'person' | 'celebrity' | null;
export type RelationshipAuthStatus = 'booting' | 'signedOut' | 'signedIn';
export type RelationshipBootstrapStatus = 'idle' | 'loading' | 'ready' | 'error';

interface RelationshipSessionState {
  authStatus: RelationshipAuthStatus;
  bootstrapStatus: RelationshipBootstrapStatus;
  firebaseUid: string | null;
  firebaseEmail: string | null;
  bootstrapError: string | null;
  profile: RelationshipAppProfile | null;
}

interface RelationshipFlowState {
  hasCompletedSelfProfile: boolean;
  selfProfileId: string | null;
  selfProfileDomain: typeof RELATIONSHIP_APP_DOMAIN;
  activeTargetType: TargetType;
  activeTargetSubject: SubjectDocument | null;
  activeRelationshipId: string | null;
  previewAnalysis: EnhancedRelationshipAnalysisResponse | null;
}

interface RelationshipAppStore extends RelationshipSessionState, RelationshipFlowState {
  setAuthState: (payload: {
    authStatus: RelationshipAuthStatus;
    firebaseUid: string | null;
    firebaseEmail: string | null;
  }) => void;
  setBootstrapState: (payload: {
    bootstrapStatus: RelationshipBootstrapStatus;
    bootstrapError?: string | null;
  }) => void;
  setProfile: (profile: RelationshipAppProfile | null) => void;
  resetSession: () => void;
  setCompletedSelfProfile: (value: boolean) => void;
  setSelfProfileId: (value: string | null) => void;
  setActiveTargetType: (value: TargetType) => void;
  setActiveTargetSubject: (value: SubjectDocument | null) => void;
  setActiveRelationshipId: (value: string | null) => void;
  setPreviewAnalysis: (value: EnhancedRelationshipAnalysisResponse | null) => void;
  clearActiveRelationshipFlow: () => void;
}

const initialSessionState: RelationshipSessionState = {
  authStatus: 'booting',
  bootstrapStatus: 'idle',
  firebaseUid: null,
  firebaseEmail: null,
  bootstrapError: null,
  profile: null,
};

const initialFlowState: RelationshipFlowState = {
  hasCompletedSelfProfile: false,
  selfProfileId: null,
  selfProfileDomain: RELATIONSHIP_APP_DOMAIN,
  activeTargetType: null,
  activeTargetSubject: null,
  activeRelationshipId: null,
  previewAnalysis: null,
};

export const useRelationshipAppStore = create<RelationshipAppStore>((set) => ({
  ...initialSessionState,
  ...initialFlowState,
  setAuthState: ({ authStatus, firebaseUid, firebaseEmail }) =>
    set({
      authStatus,
      firebaseUid,
      firebaseEmail,
    }),
  setBootstrapState: ({ bootstrapStatus, bootstrapError = null }) =>
    set({
      bootstrapStatus,
      bootstrapError,
    }),
  setProfile: (profile) =>
    set({
      profile,
      hasCompletedSelfProfile: Boolean(profile),
      selfProfileId: profile?.id ?? null,
    }),
  resetSession: () =>
    set({
      ...initialSessionState,
      ...initialFlowState,
      authStatus: 'signedOut',
      bootstrapStatus: 'ready',
    }),
  setCompletedSelfProfile: (value) => set({ hasCompletedSelfProfile: value }),
  setSelfProfileId: (value) => set({ selfProfileId: value }),
  setActiveTargetType: (value) => set({ activeTargetType: value }),
  setActiveTargetSubject: (value) => set({ activeTargetSubject: value }),
  setActiveRelationshipId: (value) => set({ activeRelationshipId: value }),
  setPreviewAnalysis: (value) =>
    set({
      previewAnalysis: value,
      activeRelationshipId: value?.compositeChartId ?? null,
    }),
  clearActiveRelationshipFlow: () =>
    set({
      activeTargetType: null,
      activeTargetSubject: null,
      activeRelationshipId: null,
      previewAnalysis: null,
    }),
}));
