import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  TransitEvent,
  WorkflowState,
  AnalysisWorkflowState,
  RelationshipWorkflowState,
  UserSubscription,
  HoroscopeFilter,
  TabName,
  Planet,
  House,
  Aspect,
} from '../types';
import { Celebrity } from '../api/celebrities';
import { celebrityToUser } from '../transformers/celebrity';
import { ThemeMode } from '../theme';

interface StoreState {
  // User & Authentication
  userData: User | null;
  userId: string;
  isAuthenticated: boolean;
  userSubscription: UserSubscription | null;

  // Birth Chart Data
  userPlanets: Planet[];
  userHouses: House[];
  userAspects: Aspect[];
  userElements: any;
  userModalities: any;
  userQuadrants: any;
  userPatterns: any;

  // Context Management (for viewing different charts)
  currentUserContext: User | null;    // Account owner
  activeUserContext: User | null;     // Currently viewed user
  previousUserContext: User | null;   // Navigation breadcrumb

  // Guest Subjects
  guestSubjects: User[];
  selectedSubject: User | null;

  // Workflow States
  creationWorkflowState: WorkflowState;
  analysisWorkflowState: AnalysisWorkflowState;
  relationshipWorkflowState: RelationshipWorkflowState;

  // UI States
  loading: boolean;
  error: string | null;
  activeTab: TabName;

  // Theme State
  themeMode: ThemeMode;

  // Transit & Horoscope States
  transitData: TransitEvent[];
  selectedTransits: Set<string>;
  customHoroscope: any;
  horoscopeFilter: HoroscopeFilter;

  // Actions
  setUserData: (userData: User | null) => void;
  setWorkflowState: (workflowState: Partial<WorkflowState>) => void;
  setAnalysisState: (analysisState: Partial<AnalysisWorkflowState>) => void;
  setRelationshipWorkflowState: (relationshipState: Partial<RelationshipWorkflowState>) => void;
  setActiveUserContext: (context: User | null) => void;
  switchUserContext: (newUser: User) => void;
  switchToCelebrityContext: (celebrity: Celebrity) => void;
  navigateBack: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: TabName) => void;

  // Theme Actions
  setThemeMode: (theme: ThemeMode) => void;

  // Transit & Horoscope Actions
  setTransitData: (transitData: TransitEvent[]) => void;
  toggleTransitSelection: (transitId: string) => void;
  setCustomHoroscope: (horoscope: any) => void;
  setHoroscopeFilter: (filter: HoroscopeFilter) => void;

  // Chart Data Actions
  setChartData: (planets: Planet[], houses: House[], aspects: Aspect[]) => void;

  // Guest Subject Actions
  setGuestSubjects: (subjects: User[]) => void;
  addGuestSubject: (subject: User) => void;
  setSelectedSubject: (subject: User | null) => void;

  // Persistence Actions
  initializeFromStorage: () => Promise<void>;
  persistUserData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial State
  userData: null,
  userId: '',
  isAuthenticated: false,
  userSubscription: null,

  userPlanets: [],
  userHouses: [],
  userAspects: [],
  userElements: {},
  userModalities: {},
  userQuadrants: {},
  userPatterns: {},

  currentUserContext: null,
  activeUserContext: null,
  previousUserContext: null,

  guestSubjects: [],
  selectedSubject: null,

  creationWorkflowState: {
    workflowId: null,
    status: null,
    isCompleted: false,
    progress: null,
  },

  analysisWorkflowState: {
    isPaused: false,
    hasOverview: false,
    hasFullAnalysis: false,
    overviewContent: '',
    analysisContent: {},
  },

  relationshipWorkflowState: {
    isPaused: false,
    hasScores: false,
    scores: {},
    scoreAnalysis: {},
    startedFromCreation: false,
    completed: false,
    currentRelationship: null,
    isPollingActive: false,
    activeCompositeChartId: null,
  },

  loading: false,
  error: null,
  activeTab: 'horoscope',

  // Theme State
  themeMode: 'system',

  transitData: [],
  selectedTransits: new Set(),
  customHoroscope: null,
  horoscopeFilter: 'today',

  // Actions
  setUserData: (userData) => {
    set({
      userData,
      isAuthenticated: !!userData,
      userId: userData?.id || '',
      currentUserContext: userData,
      activeUserContext: userData,
    });
    get().persistUserData();
  },

  setWorkflowState: (workflowState) => set((state) => ({
    creationWorkflowState: { ...state.creationWorkflowState, ...workflowState },
  })),

  setAnalysisState: (analysisState) => set((state) => ({
    analysisWorkflowState: { ...state.analysisWorkflowState, ...analysisState },
  })),

  setRelationshipWorkflowState: (relationshipState) => set((state) => ({
    relationshipWorkflowState: { ...state.relationshipWorkflowState, ...relationshipState },
  })),

  setActiveUserContext: (context) => set({ activeUserContext: context }),

  switchUserContext: (newUser) => {
    const { activeUserContext } = get();
    set({
      previousUserContext: activeUserContext,
      activeUserContext: newUser,
    });
  },

  switchToCelebrityContext: (celebrity) => {
    const { activeUserContext } = get();
    const userFromCelebrity = celebrityToUser(celebrity);

    set({
      previousUserContext: activeUserContext,
      activeUserContext: userFromCelebrity,
    });
  },

  navigateBack: () => {
    const { previousUserContext } = get();
    if (previousUserContext) {
      set({
        activeUserContext: previousUserContext,
        previousUserContext: null,
      });
    }
  },

  clearError: () => set({ error: null }),
  setLoading: (loading) => set({ loading }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Theme Actions
  setThemeMode: (theme) => {
    set({ themeMode: theme });
    // Persist theme preference
    AsyncStorage.setItem('themeMode', theme).catch(error =>
      console.error('Failed to persist theme mode:', error)
    );
  },

  // Transit & Horoscope Actions
  setTransitData: (transitData) => set({ transitData }),

  toggleTransitSelection: (transitId) => set((state) => {
    const newSelected = new Set(state.selectedTransits);
    if (newSelected.has(transitId)) {
      newSelected.delete(transitId);
    } else {
      newSelected.add(transitId);
    }
    return { selectedTransits: newSelected };
  }),

  setCustomHoroscope: (horoscope) => set({ customHoroscope: horoscope }),
  setHoroscopeFilter: (filter) => set({ horoscopeFilter: filter }),

  // Chart Data Actions
  setChartData: (planets, houses, aspects) => set({
    userPlanets: planets,
    userHouses: houses,
    userAspects: aspects,
  }),

  // Guest Subject Actions
  setGuestSubjects: (subjects) => set({ guestSubjects: subjects }),

  addGuestSubject: (subject) => set((state) => ({
    guestSubjects: [...state.guestSubjects, subject],
  })),

  setSelectedSubject: (subject) => set({ selectedSubject: subject }),

  // Persistence Actions
  initializeFromStorage: async () => {
    try {
      // Only load theme and non-auth data from storage
      // DO NOT load user data here as it should only come from Firebase Auth
      const themeMode = await AsyncStorage.getItem('themeMode');

      if (themeMode && (themeMode === 'light' || themeMode === 'dark' || themeMode === 'system')) {
        set({ themeMode: themeMode as ThemeMode });
      }

      console.log('Store initialized from storage (auth data excluded)');
    } catch (error) {
      console.error('Failed to load data from storage:', error);
    }
  },

  persistUserData: async () => {
    try {
      const { userData } = get();
      if (userData) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        // Only store userId if it exists and is not empty
        if (userData.id && userData.id.trim() !== '') {
          await AsyncStorage.setItem('userId', userData.id);
        }
        console.log('User data persisted to storage');
      }
    } catch (error) {
      console.error('Failed to persist user data:', error);
    }
  },

  clearAllData: async () => {
    try {
      // Clear all user-related data from AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem('userData'),
        AsyncStorage.removeItem('userId'),
      ]);
      
      // Reset store state to initial values
      set({
        userData: null,
        userId: '',
        isAuthenticated: false,
        userSubscription: null,
        userPlanets: [],
        userHouses: [],
        userAspects: [],
        userElements: {},
        userModalities: {},
        userQuadrants: {},
        userPatterns: {},
        currentUserContext: null,
        activeUserContext: null,
        previousUserContext: null,
        guestSubjects: [],
        selectedSubject: null,
        creationWorkflowState: {
          workflowId: null,
          status: null,
          isCompleted: false,
          progress: null,
        },
        analysisWorkflowState: {
          isPaused: false,
          hasOverview: false,
          hasFullAnalysis: false,
          overviewContent: '',
          analysisContent: {},
        },
        relationshipWorkflowState: {
          isPaused: false,
          hasScores: false,
          scores: {},
          scoreAnalysis: {},
          startedFromCreation: false,
          completed: false,
          currentRelationship: null,
          isPollingActive: false,
          activeCompositeChartId: null,
        },
        loading: false,
        error: null,
        transitData: [],
        selectedTransits: new Set(),
        customHoroscope: null,
      });
      
      console.log('All user data cleared from store and storage');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  },

  signOut: async () => {
    try {
      console.log('Starting sign out process...');
      
      // First clear all data
      await get().clearAllData();
      
      // Then sign out from Firebase Auth
      const auth = require('@react-native-firebase/auth').default;
      await auth().signOut();
      
      console.log('Sign out completed successfully');
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  },
}));
