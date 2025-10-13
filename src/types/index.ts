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
  analysisStatus?: AnalysisStatus;
  profilePhotoUrl?: string;
  profilePhotoKey?: string;
  profilePhotoUpdatedAt?: Date;
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
  id?: string;
  type: 'transit-to-natal' | 'transit-to-transit' | 'moon-phase';
  transitingPlanet: string;
  targetPlanet?: string;
  aspect: string;
  start: string;
  end: string;
  exact?: string;
  description?: string;
  transitingSign?: string;
  targetSign?: string;
  transitingHouse?: number;
  targetHouse?: number;
  transitingSigns?: string[];
  moonPhaseData?: any;
  // New API fields
  isExactInRange?: boolean;
  orbAtStart?: number;
  orbAtEnd?: number;
  orbDirection?: 'approaching' | 'separating' | 'stationary';
  priority?: number;
  isRetrograde?: boolean;
  targetIsRetrograde?: boolean;
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
  // Core workflow fields (matching frontend pattern)
  isPaused: boolean;
  hasScores: boolean;
  scores: { [key: string]: number };
  scoreAnalysis: { [key: string]: any };
  startedFromCreation: boolean;
  completed?: boolean;

  // Cluster Analysis Data (New 5-Cluster System)
  clusterScoring?: any; // ClusterScoring type from relationships.ts
  completeAnalysis?: any; // Record<string, ClusterAnalysis> from relationships.ts

  // Legacy V3 Analysis Data (deprecated)
  v3Analysis?: any; // V3Analysis type from relationships.ts
  v3Metrics?: any;  // V3Metrics type from relationships.ts

  // Legacy compatibility
  currentRelationship?: any;

  // Enhanced workflow fields
  workflowId?: string;
  compositeChartId?: string;
  status?: 'running' | 'completed' | 'error' | 'paused' | 'unknown';
  progress?: {
    percentage: number;
    currentPhase: string;
    currentStep?: string;
    tasksCompleted?: number;
    totalTasks?: number;
  };
  isCompleted?: boolean;
  error?: string;
  analysisData?: any;

  // Active polling state (minimal, just to survive remounts)
  isPollingActive?: boolean;
  activeCompositeChartId?: string;
  completedWorkflowStatus?: any; // RelationshipWorkflowStatusResponse when completed
}

export interface UserSubscription {
  plan: 'free' | 'premium' | 'pro';
  features: string[];
  expiresAt?: string;
}

export type HoroscopeFilter = 'today' | 'thisWeek' | 'thisMonth' | 'chat';

export type TabName = 'horoscope' | 'chart' | 'relationships' | 'celebrity';

// Horoscope Chat Types
export interface HoroscopeChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  selectedTransits?: TransitEvent[];
  loading?: boolean;
}

export interface HoroscopeChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    mode?: 'custom' | 'chat' | 'hybrid';
    selectedTransits?: TransitEvent[];
    period?: 'daily' | 'weekly' | 'monthly';
  };
}

// Backend API Types
export type PlanetName =
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars'
  | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto'
  | 'Ascendant' | 'Midheaven' | 'Chiron' | 'Node';

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo'
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type AspectType =
  | 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile'
  | 'quincunx' | 'semisextile' | 'semisquare' | 'sesquiquadrate';

// Backend Birth Chart Types
export interface BackendPlanet {
  name: PlanetName;
  full_degree: number;   // 0-360 degree position
  norm_degree: number;   // 0-30 degree position within sign
  speed: number;         // Daily motion in degrees
  is_retro: boolean;     // Retrograde status
  sign: ZodiacSign | null;  // null if position cannot be calculated
  house: number;         // 1-12, 0 if birth time unknown
  tags?: string[];       // Astrological tags (dignity, rulership, reception, etc.)
}

export interface BackendAspect {
  aspectingPlanet: PlanetName;
  aspectingPlanetDegree: number;
  aspectedPlanet: PlanetName;
  aspectedPlanetDegree: number;
  aspectType: AspectType;
  orb: number;  // Deviation from exact aspect in degrees
}

export interface BackendHouse {
  house: number;    // 1-12
  degree: number;   // Cusp degree (0-360), NaN if birth time unknown
  sign: ZodiacSign | null;  // null if birth time unknown
}

export interface ElementAnalysis {
  elements: {
    name: 'Fire' | 'Earth' | 'Air' | 'Water';
    planets: PlanetName[];
    count: number;
    points: number;
    percentage: number;
    dominance: string;
  }[];
}

export interface ModalityAnalysis {
  modalities: {
    name: 'Cardinal' | 'Fixed' | 'Mutable';
    planets: PlanetName[];
    count: number;
    percentage: number;
  }[];
}

export interface QuadrantAnalysis {
  quadrants: {
    name: 'SouthEast' | 'SouthWest' | 'NorthWest' | 'NorthEast';
    planets: PlanetName[];
    count: number;
    percentage: number;
    dominance: string;
  }[];
  hemispheres: {
    eastern: { percentage: number; dominance: string; };
    western: { percentage: number; dominance: string; };
    northern: { percentage: number; dominance: string; };
    southern: { percentage: number; dominance: string; };
  };
}

export interface PatternAnalysis {
  patterns: Array<{
    type: 'stellium' | 'grand_trine' | 't_square' | 'mystic_rectangle' | 'grand_cross';
    id: string;
    description: string;
    // Additional pattern-specific fields vary by pattern type
  }>;
}

export interface AnalysisStatus {
  level: 'none' | 'overview' | 'complete';
  completedTasks: number;
  totalTasks: number;
  workflowStatus: string;
}

export interface PlanetaryDominanceAnalysis {
  planets: {
    name: PlanetName;
    rawScore: number;
    normalizedScore: number;
    percentage: number;
    strength: 'very strong' | 'strong' | 'moderately strong' | 'average' | 'weak';
    details: {
      signStrength: number;
      housePlacement: number;
      angularConjunctions: number;
      rulerships: number;
      aspectPoints: number;
      breakdown: string[];
    };
  }[];
  totalRawScore: number;
  calculatedAt: string;
  methodology: {
    signStrength: string;
    housePlacement: string;
    angularConjunctions: string;
    rulerships: string;
    aspectPoints: string;
  };
}

export interface BirthChart {
  date: string;  // "YYYY-M-D" format
  lat: number;   // Latitude
  lon: number;   // Longitude
  tzone: number; // Timezone offset
  jdUT: number;  // Julian day

  planets: BackendPlanet[];
  aspects: BackendAspect[];
  houses: BackendHouse[];

  ascendant: number;   // Degree (0-360), NaN if birth time unknown
  midheaven: number;   // Degree (0-360), NaN if birth time unknown

  // Analysis data
  elements: ElementAnalysis;
  modalities: ModalityAnalysis;
  quadrants: QuadrantAnalysis;
  patterns: PatternAnalysis;
  planetaryDominance: PlanetaryDominanceAnalysis;
}

// Main subject document structure from backend
export interface SubjectDocument {
  // MongoDB fields
  _id: string;  // ObjectId as string in JSON
  createdAt: string;  // ISO date string
  updatedAt: string;  // ISO date string

  // Subject classification
  kind: 'accountSelf' | 'celebrity' | 'guest';
  ownerUserId: string | null;  // ObjectId as string, null for accountSelf/celebrity
  isCelebrity: boolean;
  isReadOnly: boolean;

  // Personal information
  firstName: string;
  lastName: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth: string;  // ISO date string or "YYYY-MM-DD" format
  placeOfBirth: string;

  // Email (only for accountSelf)
  email?: string;  // Required for accountSelf, absent for celebrity/guest

  // Birth time information
  time?: string;  // Format: "HH:MM" (24-hour format)
  birthTimeUnknown?: boolean;  // true if birth time is unknown
  totalOffsetHours: number;  // Timezone offset (-12 to +12)

  // Birth chart data
  birthChart: BirthChart;

  // Analysis status (from backend API)
  analysisStatus?: AnalysisStatus;

  // Profile photo fields
  profilePhotoUrl?: string;
  profilePhotoKey?: string;
  profilePhotoUpdatedAt?: Date;
}
