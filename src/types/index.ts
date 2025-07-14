export interface User {
  id: string;
  name: string;
  email?: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  birthMinute: number;
  birthLocation: string;
  timezone: string;
  birthChart?: any;
}

export interface Planet {
  name: string;
  degree: number;
  sign: string;
  house: number;
  symbol: string;
  color: string;
}

export interface House {
  number: number;
  startDegree: number;
  sign: string;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  planet1Degree: number;
  planet2Degree: number;
  type: 'major' | 'minor';
  aspect: string;
  color: string;
  orb: number;
}

export interface TransitEvent {
  id: string;
  description: string;
  startDate: string;
  endDate: string;
  exactDate: string;
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
}

export interface WorkflowState {
  workflowId: string | null;
  status: string | null;
  isCompleted: boolean;
  progress: number | null;
}

export interface AnalysisWorkflowState {
  isPaused: boolean;
  hasOverview: boolean;
  hasFullAnalysis: boolean;
  overviewContent: string;
  analysisContent: any;
}

export interface RelationshipWorkflowState {
  isPaused: boolean;
  hasScores: boolean;
  scores: any;
  scoreAnalysis: any;
  currentRelationship: any;
}

export interface UserSubscription {
  plan: 'free' | 'premium' | 'pro';
  features: string[];
  expiresAt?: string;
}

export type HoroscopeFilter = 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth';

export type TabName = 'horoscope' | 'chart' | 'relationships' | 'celebrity';