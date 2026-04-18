import { create } from 'zustand';
import { RELATIONSHIP_APP_DOMAIN, RelationshipAppProfile } from '../../../shared/domain/relationshipUser';
import { SubjectDocument } from '../../../shared/types/subject';
import {
  EnhancedRelationshipAnalysisResponse,
  RelationshipAnalysisResponse,
  RelationshipWorkflowStatusResponse,
  UserCompositeChart,
} from '../../../shared/api/relationships';
import type {
  AsyncStatus,
  CelebAspectBank,
  OnboardingPreviewResponse,
  TopAspect,
  TopCelebMatch,
} from '../../../shared/api/onboarding';

export type TargetType = 'person' | 'celebrity' | null;
export type RelationshipAuthStatus = 'booting' | 'signedOut' | 'signedIn';
export type RelationshipBootstrapStatus = 'idle' | 'loading' | 'ready' | 'error';
export type RelationshipWorkflowPhase = 'idle' | 'starting' | 'polling' | 'completed' | 'error';

export type SubscriptionTier = 'free' | 'monthly' | 'annual';

export interface CreditsState {
  balance: number;
  fromPlan: number;
  purchased: number;
  planRenewsAt: string | null;
  planName: string | null;
  planPriceLabel: string | null;
  planCreditsPerCycle: number | null;
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  renewsAt: string | null;
  label: string;
}

export type AskRole = 'user' | 'iris';

export interface AskMessage {
  id: string;
  role: AskRole;
  text: string;
  createdAt: string;
}

export type AskThreadKey = 'profile' | 'home' | `relationship:${string}`;

export type CreditTransactionKind =
  | 'analysis_full'
  | 'analysis_overview'
  | 'ask_iris'
  | 'purchase'
  | 'renewal'
  | 'bonus';

export interface CreditTransaction {
  id: string;
  occurredAt: string;
  kind: CreditTransactionKind;
  description: string;
  delta: number;
}

export interface NotificationPrefs {
  weeklyArticle: boolean;
  productUpdates: boolean;
  transitAlerts: boolean;
}

export type ProfileGender = 'male' | 'female' | 'other';

export interface BirthDetailsDraft {
  firstName: string;
  lastName: string;
  gender: ProfileGender;
  dateOfBirth: string;
  time: string;
  birthTimeUnknown: boolean;
  placeOfBirth: string;
  latitude: number | null;
  longitude: number | null;
  totalOffsetHours: number | null;
}

export interface GuestProfileDraft {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  timeOfBirth: string;
  birthTimeUnknown: boolean;
  placeOfBirth: string;
  latitude: number | null;
  longitude: number | null;
  totalOffsetHours: number | null;
}

export interface ProfileRevealData {
  previewId: string;
  claimToken: string;
  overview: string | null;
  romanticProfileBlurb: string | null;
  topAspects: TopAspect[];
  topCelebMatches: TopCelebMatch[];
  celebAspectBank: CelebAspectBank | null;
  celebMatchesStatus: AsyncStatus | null;
  celebAnnotationsStatus: AsyncStatus | null;
  birthChart: Record<string, unknown>;
  fullResponse: OnboardingPreviewResponse;
}

export type { TopAspect, TopCelebMatch };

interface RelationshipSessionState {
  authStatus: RelationshipAuthStatus;
  bootstrapStatus: RelationshipBootstrapStatus;
  firebaseUid: string | null;
  firebaseEmail: string | null;
  bootstrapError: string | null;
  profile: RelationshipAppProfile | null;
  isLocalUxMode: boolean;
}

interface OnboardingFlowState {
  guestProfileDraft: GuestProfileDraft | null;
  profileReveal: ProfileRevealData | null;
}

interface RelationshipFlowState {
  hasCompletedSelfProfile: boolean;
  selfProfileId: string | null;
  selfProfileDomain: typeof RELATIONSHIP_APP_DOMAIN;
  selfProfileOverview: string | null;
  activeTargetType: TargetType;
  activeTargetSubject: SubjectDocument | null;
  activeRelationshipId: string | null;
  previewAnalysis: EnhancedRelationshipAnalysisResponse | null;
  fullAnalysis: RelationshipAnalysisResponse | null;
  workflowStatus: RelationshipWorkflowStatusResponse | null;
  workflowPhase: RelationshipWorkflowPhase;
  workflowError: string | null;
  relationshipHistory: UserCompositeChart[];
  isHistoryLoading: boolean;
  historyError: string | null;
  hasFetchedHistory: boolean;
}

interface CreditsFlowState {
  credits: CreditsState | null;
  subscription: SubscriptionState | null;
  askThreads: Record<string, AskMessage[]>;
  creditTransactions: CreditTransaction[];
  notificationPrefs: NotificationPrefs;
  birthEditsRemaining: number | null;
  birthDetailsDraft: BirthDetailsDraft | null;
}

interface RelationshipAppStore
  extends RelationshipSessionState,
    OnboardingFlowState,
    RelationshipFlowState,
    CreditsFlowState {
  setAuthState: (payload: {
    authStatus: RelationshipAuthStatus;
    firebaseUid: string | null;
    firebaseEmail: string | null;
  }) => void;
  setBootstrapState: (payload: {
    bootstrapStatus: RelationshipBootstrapStatus;
    bootstrapError?: string | null;
  }) => void;
  setLocalUxMode: (value: boolean) => void;
  setProfile: (profile: RelationshipAppProfile | null) => void;
  resetSession: () => void;
  setCompletedSelfProfile: (value: boolean) => void;
  setSelfProfileId: (value: string | null) => void;
  setSelfProfileOverview: (value: string | null) => void;
  setGuestProfileDraft: (value: GuestProfileDraft | null) => void;
  setProfileReveal: (value: ProfileRevealData | null) => void;
  updateProfileReveal: (payload: {
    previewId: string;
    value: Partial<ProfileRevealData>;
  }) => void;
  clearOnboardingFlow: () => void;
  setActiveTargetType: (value: TargetType) => void;
  setActiveTargetSubject: (value: SubjectDocument | null) => void;
  setActiveRelationshipId: (value: string | null) => void;
  setPreviewAnalysis: (value: EnhancedRelationshipAnalysisResponse | null) => void;
  setFullAnalysis: (value: RelationshipAnalysisResponse | null) => void;
  setWorkflowState: (payload: {
    workflowStatus?: RelationshipWorkflowStatusResponse | null;
    workflowPhase?: RelationshipWorkflowPhase;
    workflowError?: string | null;
  }) => void;
  setRelationshipHistory: (payload: {
    relationshipHistory: UserCompositeChart[];
    isHistoryLoading?: boolean;
    historyError?: string | null;
    hasFetchedHistory?: boolean;
  }) => void;
  clearActiveRelationshipFlow: () => void;
  setCredits: (value: CreditsState | null) => void;
  spendCredits: (amount: number) => void;
  setSubscription: (value: SubscriptionState | null) => void;
  appendAskMessage: (threadKey: AskThreadKey, message: AskMessage) => void;
  clearAskThread: (threadKey: AskThreadKey) => void;
  setCreditTransactions: (value: CreditTransaction[]) => void;
  setNotificationPrefs: (value: NotificationPrefs) => void;
  setBirthEditsRemaining: (value: number | null) => void;
  setBirthDetailsDraft: (value: BirthDetailsDraft | null) => void;
  updateBirthDetailsDraft: (partial: Partial<BirthDetailsDraft>) => void;
  clearBirthDetailsDraft: () => void;
}

const initialSessionState: RelationshipSessionState = {
  authStatus: 'booting',
  bootstrapStatus: 'idle',
  firebaseUid: null,
  firebaseEmail: null,
  bootstrapError: null,
  profile: null,
  isLocalUxMode: false,
};

const initialOnboardingState: OnboardingFlowState = {
  guestProfileDraft: null,
  profileReveal: null,
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  weeklyArticle: true,
  productUpdates: true,
  transitAlerts: false,
};

const initialCreditsState: CreditsFlowState = {
  credits: null,
  subscription: null,
  askThreads: {},
  creditTransactions: [],
  notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
  birthEditsRemaining: null,
  birthDetailsDraft: null,
};

const initialFlowState: RelationshipFlowState = {
  hasCompletedSelfProfile: false,
  selfProfileId: null,
  selfProfileDomain: RELATIONSHIP_APP_DOMAIN,
  selfProfileOverview: null,
  activeTargetType: null,
  activeTargetSubject: null,
  activeRelationshipId: null,
  previewAnalysis: null,
  fullAnalysis: null,
  workflowStatus: null,
  workflowPhase: 'idle',
  workflowError: null,
  relationshipHistory: [],
  isHistoryLoading: false,
  historyError: null,
  hasFetchedHistory: false,
};

export const useRelationshipAppStore = create<RelationshipAppStore>((set) => ({
  ...initialSessionState,
  ...initialOnboardingState,
  ...initialFlowState,
  ...initialCreditsState,
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
  setLocalUxMode: (value) => set({ isLocalUxMode: value }),
  setProfile: (profile) =>
    set({
      profile,
      hasCompletedSelfProfile: Boolean(profile),
      selfProfileId: profile?.id ?? null,
      selfProfileOverview: profile?.romanticOverview ?? null,
    }),
  resetSession: () =>
    set({
      ...initialSessionState,
      ...initialOnboardingState,
      ...initialFlowState,
      ...initialCreditsState,
      authStatus: 'signedOut',
      bootstrapStatus: 'ready',
    }),
  setCompletedSelfProfile: (value) => set({ hasCompletedSelfProfile: value }),
  setSelfProfileId: (value) => set({ selfProfileId: value }),
  setSelfProfileOverview: (value) => set({ selfProfileOverview: value }),
  setGuestProfileDraft: (value) => set({ guestProfileDraft: value }),
  setProfileReveal: (value) => set({ profileReveal: value }),
  updateProfileReveal: ({ previewId, value }) =>
    set((state) => ({
      profileReveal: state.profileReveal && state.profileReveal.previewId === previewId
        ? {
            ...state.profileReveal,
            ...value,
          }
        : state.profileReveal,
    })),
  clearOnboardingFlow: () =>
    set({
      ...initialOnboardingState,
    }),
  setActiveTargetType: (value) => set({ activeTargetType: value }),
  setActiveTargetSubject: (value) => set({ activeTargetSubject: value }),
  setActiveRelationshipId: (value) => set({ activeRelationshipId: value }),
  setPreviewAnalysis: (value) =>
    set({
      previewAnalysis: value,
      activeRelationshipId: value?.compositeChartId ?? null,
      fullAnalysis: null,
      workflowStatus: null,
      workflowPhase: 'idle',
      workflowError: null,
    }),
  setFullAnalysis: (value) => set({ fullAnalysis: value }),
  setWorkflowState: ({ workflowStatus, workflowPhase, workflowError }) =>
    set((state) => ({
      workflowStatus: workflowStatus === undefined ? state.workflowStatus : workflowStatus,
      workflowPhase: workflowPhase ?? state.workflowPhase,
      workflowError: workflowError === undefined ? state.workflowError : workflowError,
    })),
  setRelationshipHistory: ({
    relationshipHistory,
    isHistoryLoading = false,
    historyError = null,
    hasFetchedHistory,
  }) =>
    set((state) => ({
      relationshipHistory,
      isHistoryLoading,
      historyError,
      hasFetchedHistory:
        hasFetchedHistory !== undefined ? hasFetchedHistory : state.hasFetchedHistory,
    })),
  clearActiveRelationshipFlow: () =>
    set({
      activeTargetType: null,
      activeTargetSubject: null,
      activeRelationshipId: null,
      selfProfileOverview: null,
      previewAnalysis: null,
      fullAnalysis: null,
      workflowStatus: null,
      workflowPhase: 'idle',
      workflowError: null,
    }),
  setCredits: (value) => set({ credits: value }),
  spendCredits: (amount) =>
    set((state) => {
      if (!state.credits) {
        return {};
      }
      const purchasedSpend = Math.min(state.credits.purchased, amount);
      const remainder = amount - purchasedSpend;
      const planSpend = Math.min(state.credits.fromPlan, remainder);
      const nextPurchased = state.credits.purchased - purchasedSpend;
      const nextFromPlan = state.credits.fromPlan - planSpend;
      return {
        credits: {
          ...state.credits,
          purchased: nextPurchased,
          fromPlan: nextFromPlan,
          balance: nextPurchased + nextFromPlan,
        },
      };
    }),
  setSubscription: (value) => set({ subscription: value }),
  appendAskMessage: (threadKey, message) =>
    set((state) => ({
      askThreads: {
        ...state.askThreads,
        [threadKey]: [...(state.askThreads[threadKey] ?? []), message],
      },
    })),
  clearAskThread: (threadKey) =>
    set((state) => {
      if (!(threadKey in state.askThreads)) {
        return {};
      }
      const next = { ...state.askThreads };
      delete next[threadKey];
      return { askThreads: next };
    }),
  setCreditTransactions: (value) => set({ creditTransactions: value }),
  setNotificationPrefs: (value) => set({ notificationPrefs: value }),
  setBirthEditsRemaining: (value) => set({ birthEditsRemaining: value }),
  setBirthDetailsDraft: (value) => set({ birthDetailsDraft: value }),
  updateBirthDetailsDraft: (partial) =>
    set((state) => ({
      birthDetailsDraft: state.birthDetailsDraft
        ? { ...state.birthDetailsDraft, ...partial }
        : null,
    })),
  clearBirthDetailsDraft: () => set({ birthDetailsDraft: null }),
}));
