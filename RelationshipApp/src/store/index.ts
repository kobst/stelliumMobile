import { create } from 'zustand';
import { RELATIONSHIP_APP_DOMAIN, RelationshipAppProfile } from '../../../shared/domain/relationshipUser';
import { SubjectDocument } from '../../../shared/types/subject';
import {
  EnhancedRelationshipAnalysisResponse,
  RelationshipAnalysisResponse,
  RelationshipWorkflowStatusResponse,
  UserCompositeChart,
} from '../../../shared/api/relationships';
import type { OwnedGuestSubject } from '../../../shared/api/relationshipUsers';
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

export type SubscriptionTier = 'free' | 'monthly';

export interface CreditsState {
  balance: number;
  purchased: number;
  planRenewsAt: string | null;
  planName: string | null;
  planPriceLabel: string | null;
  fullAnalysesRemaining: number;
  fullAnalysesLimit: number;
  askQuestionsRemainingToday: number;
  askQuestionsDailyLimit: number;
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  renewsAt: string | null;
  label: string;
}

export type AskRole = 'user' | 'iris';

export type AskAspectKind = 'Synastry' | 'Composite' | 'Aspect' | 'Placement';

export interface AskAspectRef {
  id: string;
  name: string;
  shortName: string;
  type: AskAspectKind;
}

export interface AskMessage {
  id: string;
  role: AskRole;
  text: string;
  createdAt: string;
  contexts?: AskAspectRef[];
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

export interface PartnerDraft {
  firstName: string;
  lastName: string;
  gender: ProfileGender;
  photoUri: string | null;
  dateOfBirth: string;
  time: string;
  birthTimeUnknown: boolean;
  placeOfBirth: string;
  latitude: number | null;
  longitude: number | null;
  totalOffsetHours: number | null;
}

export const EMPTY_PARTNER_DRAFT: PartnerDraft = {
  firstName: '',
  lastName: '',
  gender: 'other',
  photoUri: null,
  dateOfBirth: '1995-01-01',
  time: '12:00',
  birthTimeUnknown: false,
  placeOfBirth: '',
  latitude: null,
  longitude: null,
  totalOffsetHours: null,
};

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
  photoUri?: string | null;
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

export interface PartnerRomanticAssets {
  birthChart: Record<string, unknown> | null;
  overview: string | null;
  romanticProfileBlurb: string | null;
  referencedCodes: string[];
  overviewMode: string | null;
  status: string | null;
}

interface RelationshipFlowState {
  hasCompletedSelfProfile: boolean;
  selfProfileId: string | null;
  selfProfileDomain: typeof RELATIONSHIP_APP_DOMAIN;
  selfProfileOverview: string | null;
  activeTargetType: TargetType;
  activeTargetSubject: SubjectDocument | null;
  activeRelationshipId: string | null;
  activePartnerRomanticAssets: PartnerRomanticAssets | null;
  previewAnalysis: EnhancedRelationshipAnalysisResponse | null;
  fullAnalysis: RelationshipAnalysisResponse | null;
  workflowStatus: RelationshipWorkflowStatusResponse | null;
  workflowPhase: RelationshipWorkflowPhase;
  workflowError: string | null;
  relationshipHistory: UserCompositeChart[];
  isHistoryLoading: boolean;
  historyError: string | null;
  hasFetchedHistory: boolean;
  ownedSubjects: OwnedGuestSubject[];
  isSubjectsLoading: boolean;
  subjectsError: string | null;
  hasFetchedSubjects: boolean;
}

export interface PaywallRequest {
  label: string;
  missingCredits?: number;
  onComplete?: () => void;
}

interface CreditsFlowState {
  credits: CreditsState | null;
  subscription: SubscriptionState | null;
  paywall: PaywallRequest | null;
  askThreads: Record<string, AskMessage[]>;
  creditTransactions: CreditTransaction[];
  notificationPrefs: NotificationPrefs;
  birthEditsRemaining: number | null;
  birthDetailsDraft: BirthDetailsDraft | null;
  partnerDraft: PartnerDraft | null;
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
  setActivePartnerRomanticAssets: (value: PartnerRomanticAssets | null) => void;
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
  upsertRelationshipInHistory: (relationship: UserCompositeChart) => void;
  setOwnedSubjects: (payload: {
    ownedSubjects: OwnedGuestSubject[];
    isSubjectsLoading?: boolean;
    subjectsError?: string | null;
    hasFetchedSubjects?: boolean;
  }) => void;
  upsertOwnedSubject: (subject: OwnedGuestSubject) => void;
  clearActiveRelationshipFlow: () => void;
  setCredits: (value: CreditsState | null) => void;
  spendCredits: (amount: number) => void;
  setSubscription: (value: SubscriptionState | null) => void;
  showPaywall: (request: PaywallRequest) => void;
  hidePaywall: () => void;
  appendAskMessage: (threadKey: AskThreadKey, message: AskMessage) => void;
  clearAskThread: (threadKey: AskThreadKey) => void;
  setCreditTransactions: (value: CreditTransaction[]) => void;
  setNotificationPrefs: (value: NotificationPrefs) => void;
  setBirthEditsRemaining: (value: number | null) => void;
  setBirthDetailsDraft: (value: BirthDetailsDraft | null) => void;
  updateBirthDetailsDraft: (partial: Partial<BirthDetailsDraft>) => void;
  clearBirthDetailsDraft: () => void;
  setPartnerDraft: (value: PartnerDraft | null) => void;
  updatePartnerDraft: (partial: Partial<PartnerDraft>) => void;
  clearPartnerDraft: () => void;
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
  paywall: null,
  askThreads: {},
  creditTransactions: [],
  notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
  birthEditsRemaining: null,
  birthDetailsDraft: null,
  partnerDraft: null,
};

const initialFlowState: RelationshipFlowState = {
  hasCompletedSelfProfile: false,
  selfProfileId: null,
  selfProfileDomain: RELATIONSHIP_APP_DOMAIN,
  selfProfileOverview: null,
  activeTargetType: null,
  activeTargetSubject: null,
  activeRelationshipId: null,
  activePartnerRomanticAssets: null,
  previewAnalysis: null,
  fullAnalysis: null,
  workflowStatus: null,
  workflowPhase: 'idle',
  workflowError: null,
  relationshipHistory: [],
  isHistoryLoading: false,
  historyError: null,
  hasFetchedHistory: false,
  ownedSubjects: [],
  isSubjectsLoading: false,
  subjectsError: null,
  hasFetchedSubjects: false,
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
    set((state) => {
      const nextProfileId = profile?.id ?? null;
      const shouldResetRelationshipData = state.selfProfileId !== nextProfileId;

      return {
        profile,
        hasCompletedSelfProfile: Boolean(profile),
        selfProfileId: nextProfileId,
        selfProfileOverview: profile?.romanticOverview ?? null,
        ...(shouldResetRelationshipData
          ? {
              relationshipHistory: [],
              isHistoryLoading: false,
              historyError: null,
              hasFetchedHistory: false,
              ownedSubjects: [],
              isSubjectsLoading: false,
              subjectsError: null,
              hasFetchedSubjects: false,
            }
          : {}),
      };
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
  setActivePartnerRomanticAssets: (value) => set({ activePartnerRomanticAssets: value }),
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
  setOwnedSubjects: ({
    ownedSubjects,
    isSubjectsLoading = false,
    subjectsError = null,
    hasFetchedSubjects,
  }) =>
    set((state) => ({
      ownedSubjects,
      isSubjectsLoading,
      subjectsError,
      hasFetchedSubjects:
        hasFetchedSubjects !== undefined ? hasFetchedSubjects : state.hasFetchedSubjects,
    })),
  upsertOwnedSubject: (subject) =>
    set((state) => {
      if (!subject?._id) return state;
      const existingIndex = state.ownedSubjects.findIndex(
        (entry) => entry._id === subject._id
      );
      if (existingIndex >= 0) {
        const next = [...state.ownedSubjects];
        next[existingIndex] = { ...next[existingIndex], ...subject };
        return { ownedSubjects: next };
      }
      return { ownedSubjects: [subject, ...state.ownedSubjects] };
    }),
  upsertRelationshipInHistory: (relationship) =>
    set((state) => {
      if (!relationship?._id) return state;
      const existingIndex = state.relationshipHistory.findIndex(
        (entry) => entry._id === relationship._id
      );
      if (existingIndex >= 0) {
        const next = [...state.relationshipHistory];
        next[existingIndex] = { ...next[existingIndex], ...relationship };
        return { relationshipHistory: next };
      }
      return { relationshipHistory: [relationship, ...state.relationshipHistory] };
    }),
  clearActiveRelationshipFlow: () =>
    set({
      activeTargetType: null,
      activeTargetSubject: null,
      activeRelationshipId: null,
      activePartnerRomanticAssets: null,
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
      const nextPurchased = Math.max(state.credits.purchased - amount, 0);
      return {
        credits: {
          ...state.credits,
          purchased: nextPurchased,
          balance: nextPurchased,
        },
      };
    }),
  setSubscription: (value) => set({ subscription: value }),
  showPaywall: (request) => set({ paywall: request }),
  hidePaywall: () => set({ paywall: null }),
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
  setPartnerDraft: (value) => set({ partnerDraft: value }),
  updatePartnerDraft: (partial) =>
    set((state) => ({
      partnerDraft: state.partnerDraft
        ? { ...state.partnerDraft, ...partial }
        : { ...EMPTY_PARTNER_DRAFT, ...partial },
    })),
  clearPartnerDraft: () => set({ partnerDraft: null }),
}));
