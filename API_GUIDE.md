# Stellium Backend API Guide

This document describes the actual response structures from the Stellium backend APIs.

## User/Subject API Responses

### Core Response Structures

```typescript
// Core response structures
interface GetUsersResponse {
  success?: boolean;  // Only present when using pagination
  data?: SubjectDocument[];  // When using pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  // OR (legacy non-paginated response)
  [index: number]: SubjectDocument;  // Direct array when not using pagination
}

interface GetUserSingleResponse extends SubjectDocument {}

// Main subject document structure
interface SubjectDocument {
  // MongoDB fields
  _id: string;  // ObjectId as string in JSON
  createdAt: string;  // ISO date string
  updatedAt: string;  // ISO date string

  // Subject classification
  kind: "accountSelf" | "celebrity" | "guest";
  ownerUserId: string | null;  // ObjectId as string, null for accountSelf/celebrity
  isCelebrity: boolean;
  isReadOnly: boolean;

  // Personal information
  firstName: string;
  lastName: string;
  gender?: "male" | "female" | "other";
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
}

// Birth chart structure
interface BirthChart {
  date: string;  // "YYYY-M-D" format
  lat: number;   // Latitude
  lon: number;   // Longitude  
  tzone: number; // Timezone offset
  jdUT: number;  // Julian day

  planets: Planet[];
  aspects: Aspect[];
  houses: House[];

  ascendant: number;   // Degree (0-360), NaN if birth time unknown
  midheaven: number;   // Degree (0-360), NaN if birth time unknown

  // Analysis data
  elements: ElementAnalysis;
  modalities: ModalityAnalysis;
  quadrants: QuadrantAnalysis;
  patterns: PatternAnalysis;
  planetaryDominance: PlanetaryDominanceAnalysis;
}
```

### Supporting Interfaces

```typescript
interface Planet {
  name: PlanetName;
  full_degree: number;   // 0-360 degree position
  norm_degree: number;   // 0-30 degree position within sign
  speed: number;         // Daily motion in degrees
  is_retro: boolean;     // Retrograde status
  sign: ZodiacSign | null;  // null if position cannot be calculated
  house: number;         // 1-12, 0 if birth time unknown
}

interface Aspect {
  aspectingPlanet: PlanetName;
  aspectingPlanetDegree: number;
  aspectedPlanet: PlanetName;
  aspectedPlanetDegree: number;
  aspectType: AspectType;
  orb: number;  // Deviation from exact aspect in degrees
}

interface House {
  house: number;    // 1-12
  degree: number;   // Cusp degree (0-360), NaN if birth time unknown
  sign: ZodiacSign | null;  // null if birth time unknown
}
```

### Type Definitions

```typescript
type PlanetName =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars"
  | "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto"
  | "Ascendant" | "Midheaven" | "Chiron" | "Node";

type ZodiacSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

type AspectType =
  | "conjunction" | "opposition" | "trine" | "square" | "sextile"
  | "quincunx" | "semisextile" | "semisquare" | "sesquiquadrate";
```

### Analysis Structures

```typescript
interface ElementAnalysis {
  elements: {
    name: "Fire" | "Earth" | "Air" | "Water";
    planets: PlanetName[];
    count: number;
    points: number;
    percentage: number;
    dominance: string;
  }[];
}

interface ModalityAnalysis {
  modalities: {
    name: "Cardinal" | "Fixed" | "Mutable";
    planets: PlanetName[];
    count: number;
    percentage: number;
  }[];
}

interface QuadrantAnalysis {
  quadrants: {
    name: "SouthEast" | "SouthWest" | "NorthWest" | "NorthEast";
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

interface PatternAnalysis {
  patterns: Array<{
    type: "stellium" | "grand_trine" | "t_square" | "mystic_rectangle" | "grand_cross";
    id: string;
    description: string;
    // Additional pattern-specific fields vary by pattern type
  }>;
}

interface PlanetaryDominanceAnalysis {
  planets: {
    name: PlanetName;
    rawScore: number;
    normalizedScore: number;
    percentage: number;
    strength: "very strong" | "strong" | "moderately strong" | "average" | "weak";
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
```

## Important Notes

1. **User vs Subject**: The backend returns `SubjectDocument` objects, not the simplified `UserResponse` that the frontend currently expects.

2. **ID Field**: Backend uses `_id` (MongoDB ObjectId as string), not `id`.

3. **Name Fields**: Backend provides `firstName` and `lastName` separately, not a combined `name` field.

4. **Birth Data**: Backend spreads birth information across multiple fields rather than nesting in a `birthData` object.

5. **Birth Time**: Can be unknown (`birthTimeUnknown: true`), in which case house-related data will have NaN or 0 values.

6. **Subject Types**: 
   - `accountSelf`: The main user account
   - `celebrity`: Public figures
   - `guest`: Other users added by the account owner

7. **Email**: Only present for `accountSelf` subjects, not for celebrity or guest subjects.

## Usage Examples

```typescript
// Get single user/subject
const user: SubjectDocument = await apiClient.post('/getUser', { userId: 'objectId123' });

// Get users with pagination
const response: GetUsersResponse = await apiClient.post('/getUsers', { 
  ownerUserId: 'objectId123',
  usePagination: true,
  page: 1,
  limit: 20 
});

// Access paginated data
if (response.success && response.data) {
  const users: SubjectDocument[] = response.data;
  const { currentPage, totalPages, hasNext } = response.pagination;
}

// Legacy non-paginated response
const users: SubjectDocument[] = await apiClient.post('/getUsers', { 
  ownerUserId: 'objectId123' 
});
```