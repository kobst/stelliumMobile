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
  Aspect
} from '../types';

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

  // Workflow States
  creationWorkflowState: WorkflowState;
  analysisWorkflowState: AnalysisWorkflowState;
  relationshipWorkflowState: RelationshipWorkflowState;

  // UI States
  loading: boolean;
  error: string | null;
  activeTab: TabName;

  // Transit & Horoscope States
  transitData: TransitEvent[];
  selectedTransits: Set<string>;
  customHoroscope: any;
  horoscopeFilter: HoroscopeFilter;

  // Actions
  setUserData: (userData: User | null) => void;
  setWorkflowState: (workflowState: Partial<WorkflowState>) => void;
  setAnalysisState: (analysisState: Partial<AnalysisWorkflowState>) => void;
  setActiveUserContext: (context: User | null) => void;
  switchUserContext: (newUser: User) => void;
  navigateBack: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: TabName) => void;

  // Transit & Horoscope Actions
  setTransitData: (transitData: TransitEvent[]) => void;
  toggleTransitSelection: (transitId: string) => void;
  setCustomHoroscope: (horoscope: any) => void;
  setHoroscopeFilter: (filter: HoroscopeFilter) => void;

  // Chart Data Actions
  setChartData: (planets: Planet[], houses: House[], aspects: Aspect[]) => void;
  
  // Persistence Actions
  initializeFromStorage: () => Promise<void>;
  persistUserData: () => Promise<void>;
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

  creationWorkflowState: {
    workflowId: null,
    status: null,
    isCompleted: false,
    progress: null
  },

  analysisWorkflowState: {
    isPaused: false,
    hasOverview: false,
    hasFullAnalysis: false,
    overviewContent: '',
    analysisContent: {}
  },

  relationshipWorkflowState: {
    isPaused: false,
    hasScores: false,
    scores: {},
    scoreAnalysis: {},
    currentRelationship: null
  },

  loading: false,
  error: null,
  activeTab: 'horoscope',

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
      activeUserContext: userData
    });
    get().persistUserData();
  },

  setWorkflowState: (workflowState) => set((state) => ({
    creationWorkflowState: { ...state.creationWorkflowState, ...workflowState }
  })),

  setAnalysisState: (analysisState) => set((state) => ({
    analysisWorkflowState: { ...state.analysisWorkflowState, ...analysisState }
  })),

  setActiveUserContext: (context) => set({ activeUserContext: context }),

  switchUserContext: (newUser) => {
    const { activeUserContext } = get();
    set({
      previousUserContext: activeUserContext,
      activeUserContext: newUser
    });
  },

  navigateBack: () => {
    const { previousUserContext } = get();
    if (previousUserContext) {
      set({
        activeUserContext: previousUserContext,
        previousUserContext: null
      });
    }
  },

  clearError: () => set({ error: null }),
  setLoading: (loading) => set({ loading }),
  setActiveTab: (tab) => set({ activeTab: tab }),

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
    userAspects: aspects
  }),

  // Persistence Actions
  initializeFromStorage: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        set({ 
          userData: parsedUserData,
          isAuthenticated: true,
          userId: parsedUserData.id,
          currentUserContext: parsedUserData,
          activeUserContext: parsedUserData
        });
      }
    } catch (error) {
      console.error('Failed to load user data from storage:', error);
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
      }
    } catch (error) {
      console.error('Failed to persist user data:', error);
    }
  }
}));