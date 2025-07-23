// Export API client and base types
export { apiClient, ApiError } from './client';
export type { ApiResponse } from './client';

// Export all API modules
export { usersApi } from './users';
export { chartsApi } from './charts';
export { horoscopesApi } from './horoscopes';
export { relationshipsApi } from './relationships';
export { celebritiesApi } from './celebrities';
export { chatApi } from './chat';
export { externalApi } from './external';

// Export types for convenience
export type {
  CreateUserRequest,
  CreateUserUnknownTimeRequest,
  UserResponse,
  GetUserSubjectsRequest,
  PaginatedUserSubjectsResponse,
  CreateGuestSubjectRequest,
  CreateGuestSubjectUnknownTimeRequest,
} from './users';

export type {
  AnalysisWorkflowResponse,
  ChartAnalysisResponse,
  PlanetOverviewRequest,
} from './charts';

export type {
  HoroscopeRequest,
  HoroscopeResponse,
  TransitWindowsResponse,
  CustomHoroscopeRequest,
  CustomHoroscopeResponse,
} from './horoscopes';

export type {
  RelationshipCreateRequest,
  RelationshipResponse,
  RelationshipScore,
  RelationshipWorkflowResponse,
  UserCompositeChart,
  RelationshipAnalysisResponse,
  SynastryAspect,
  SynastryHousePlacement,
  SynastryHousePlacements,
  CompositeChart,
} from './relationships';

export type {
  Celebrity,
  CreateCelebrityRequest,
  CelebritySearchRequest,
  CelebrityCompatibilityResponse,
} from './celebrities';

export type {
  ChatMessage,
  ChatBirthChartRequest,
  ChatRelationshipRequest,
  ChatGeneralRequest,
  ChatResponse,
} from './chat';

export type { TimeZoneResponse } from './external';
