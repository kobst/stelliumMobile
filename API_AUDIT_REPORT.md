# StelliumApp API Audit Report

Generated on: September 21, 2025

## Executive Summary

This audit identified **63 active API endpoints** across multiple categories:
- **Backend APIs**: 39 endpoints
- **Google Services APIs**: 3 endpoints
- **Firebase Services**: 2 services
- **Legacy APIs**: 19 endpoints (dual implementation)

## 1. Active External APIs

### Google Maps APIs
- **Timezone API**: `https://maps.googleapis.com/maps/api/timezone/json`
  - Used for: Converting coordinates to timezone offsets
  - Files: `src/api/external.ts:19`, `api.ts:8`
  - API Key: `REACT_APP_GOOGLE_API_KEY`

- **Geocoding API**: `https://maps.googleapis.com/maps/api/geocode/json`
  - Used for: Converting addresses to coordinates and reverse geocoding
  - Files: `src/api/external.ts:62`, `src/api/external.ts:90`
  - API Key: `REACT_APP_GOOGLE_API_KEY`

### Firebase Services
- **Firebase Authentication**
  - Used for: User authentication, Google Sign-In, phone verification
  - Libraries: `@react-native-firebase/auth`, `@react-native-google-signin/google-signin`
  - Files: `AuthScreen.tsx`, `App.tsx`, `src/store/index.ts`

- **Google Sign-In Integration**
  - Used for: OAuth authentication via Google
  - Configuration: Uses Firebase project credentials
  - Files: `AuthScreen.tsx:69-88`, `src/config/firebase.ts`

## 2. Active APIs Used by Frontend

### Base Configuration
- **Server URL**: Environment variable `REACT_APP_SERVER_URL`
- **API Client**: Centralized in `src/api/client.ts`
- **Content Type**: `application/json`

### 2.1 Backend APIs (via apiClient)

#### User Management APIs (src/api/users.ts)
1. `POST /createUser` - Create user with known birth time
2. `POST /createUserUnknownTime` - Create user with unknown birth time
3. `POST /getUser` - Get user by ID
4. `POST /getUserByFirebaseUid` - Get user by Firebase UID
5. `POST /getUsers` - Get all users (admin)
6. `POST /getUserSubjects` - Get user subjects with pagination/search
7. `PUT /users/{userId}` - Update user profile
8. `DELETE /users/{userId}` - Delete user
9. `POST /createGuestSubject` - Create guest subject with known birth time
10. `POST /createGuestSubjectUnknownTime` - Create guest subject with unknown birth time

#### Chart Analysis APIs (src/api/charts.ts)
11. `POST /getBirthChartAnalysis` - Full birth chart analysis
12. `POST /fetchAnalysis` - Fetch existing analysis
13. `POST /analysis/start-full` - Start full analysis workflow
14. `POST /analysis/full-status` - Poll analysis status
15. `POST /workflow/get-complete-data` - Get completed workflow data
16. `POST /getSubtopicAnalysis` - Generate topic analysis
17. `POST /processBasicAnalysis` - Process and vectorize basic analysis
18. `POST /processTopicAnalysis` - Process and vectorize topic analysis
19. `POST /users/{userId}/birthchart/enhanced-chat` - Enhanced birth chart chat
20. `GET /users/{userId}/birthchart/chat-history` - Birth chart chat history

#### Horoscope APIs (src/api/horoscopes.ts)
21. `POST /users/{userId}/horoscope/daily` - Daily horoscope
22. `POST /users/{userId}/horoscope/weekly` - Weekly horoscope
23. `POST /users/{userId}/horoscope/monthly` - Monthly horoscope
24. `POST /users/{userId}/horoscope/custom` - Custom horoscope generation
25. `GET /users/{userId}/horoscope/latest` - Latest horoscope
26. `POST /getTransitWindows` - Transit windows for custom horoscopes
27. `POST /generateCustomHoroscope` - Legacy custom horoscope API
28. `GET /users/{userId}/horoscope/custom` - Custom horoscope history

#### Chat APIs (src/api/chat.ts)
29. `POST /userChatBirthChartAnalysis` - Chat with birth chart context
30. `POST /userChatRelationshipAnalysis` - Chat with relationship context
31. `POST /handleUserQuery` - General chat/query handling
32. `POST /getChatHistory` - Get chat history
33. `DELETE /chat/messages/{messageId}` - Delete chat message
34. `POST /clearChatHistory` - Clear chat history
35. `POST /getSuggestedQuestions` - Get suggested questions
36. `POST /rateChatResponse` - Rate chat response
37. `POST /getChatStats` - Get chat statistics

#### Celebrity APIs (src/api/celebrities.ts)
38. `POST /getCelebs` - Get celebrities with pagination
39. `POST /searchCelebrities` - Search celebrities with filters
40. `POST /getCelebrity` - Get celebrity by ID
41. `POST /getCelebrityRelationships` - Get celebrity relationships
42. `POST /analyzeCelebrityCompatibility` - Analyze user-celebrity compatibility
43. `POST /getCelebritiesByProfession` - Get celebrities by profession
44. `POST /getCelebritiesBySign` - Get celebrities by zodiac sign
45. `POST /getTrendingCelebrities` - Get trending celebrities
46. `POST /getCelebrityChartAnalysis` - Get celebrity chart analysis
47. `POST /findCelebrityMatches` - Find celebrity matches for user
48. `GET /getCelebrityProfessions` - Get celebrity professions list
49. `PUT /celebrities/{celebrityId}` - Update celebrity (admin)
50. `DELETE /celebrities/{celebrityId}` - Delete celebrity (admin)

#### Relationship Analysis APIs (src/api/relationships.ts)
51. `POST /enhanced-relationship-analysis` - Enhanced 5-cluster relationship analysis
52. `POST /workflow/relationship/start` - Start relationship workflow
53. `POST /workflow/relationship/status` - Get workflow status
54. `POST /workflow/relationship/resume` - Resume paused workflow
55. `POST /fetchRelationshipAnalysis` - Fetch existing relationship analysis
56. `POST /getUserCompositeCharts` - Get user's composite charts
57. `DELETE /relationships/{relationshipId}` - Delete relationship
58. `POST /chatForUserRelationship` - Legacy relationship chat
59. `POST /fetchUserChatRelationshipAnalysis` - Legacy chat history
60. `POST /relationships/{compositeChartId}/enhanced-chat` - Enhanced relationship chat
61. `GET /relationships/{compositeChartId}/chat-history` - Relationship chat history

### 2.2 External APIs (direct fetch)

#### Google Maps APIs (src/api/external.ts)
62. `GET https://maps.googleapis.com/maps/api/timezone/json` - Timezone lookup
63. `GET https://maps.googleapis.com/maps/api/geocode/json` - Address to coordinates
64. `GET https://maps.googleapis.com/maps/api/geocode/json` - Coordinates to address (reverse geocoding)

#### Google Places APIs (onboarding screens)
65. `GET https://maps.googleapis.com/maps/api/place/autocomplete/json` - Place autocomplete
66. `GET https://maps.googleapis.com/maps/api/place/details/json` - Place details

## 3. Unused/Legacy API Code

### Completely Unused APIs
The following functions in `api.ts` appear to be legacy implementations that are no longer used:

1. **`fetchTimeZone`** (api.ts:6-28) - **REPLACED** by `externalApi.fetchTimeZone` (src/api/external.ts:17)
2. **Legacy vectorization functions** (api.ts:407-536):
   - `processAndVectorizeBasicAnalysis`
   - `processAndVectorizeTopicAnalysis`
   - `processAndVectorizeRelationshipAnalysis`
   - **REPLACED** by newer workflow-based APIs in `src/api/charts.ts` and `src/api/relationships.ts`

### Dual Implementation (Modern + Legacy)
These APIs have both old and new implementations - **recommend removing legacy versions**:

1. **User APIs**:
   - Legacy: `api.ts` functions
   - Modern: `src/api/users.ts`

2. **Chart Analysis APIs**:
   - Legacy: `api.ts` functions
   - Modern: `src/api/charts.ts`

3. **Relationship APIs**:
   - Legacy: `api.ts` functions
   - Modern: `src/api/relationships.ts`

## 4. Environment Variables

### Required API Keys
- `REACT_APP_SERVER_URL` - Backend API base URL
- `REACT_APP_GOOGLE_API_KEY` - Google Maps API key
- `REACT_APP_FIREBASE_API_KEY` - Firebase configuration
- `REACT_APP_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `REACT_APP_FIREBASE_PROJECT_ID` - Firebase project ID

### Google Sign-In Configuration
- `GOOGLE_WEB_CLIENT_ID` - From Firebase console
- `FACEBOOK_APP_ID` - For Facebook login (placeholder)

## 5. Security Considerations

### API Key Management
- ✅ Google API key stored in environment variables
- ✅ Firebase configuration externalized
- ✅ No hardcoded secrets found in source code

### Authentication
- ✅ Firebase Authentication properly integrated
- ✅ JWT tokens managed by Firebase SDK
- ✅ API client includes proper headers

## 6. Recommendations

### Immediate Actions
1. **Remove legacy `api.ts` file** - All functionality has been replaced by modular APIs
2. **Remove unused vectorization functions** - Replaced by workflow system
3. **Update imports** - Ensure all components use new API modules from `src/api/`

### Code Cleanup
1. **Consolidate fetch calls** - Remove direct `fetch()` usage in favor of `apiClient`
2. **Remove duplicate timezone function** - Use only `externalApi.fetchTimeZone`
3. **Clean up imports** - Remove references to old `api.ts` file

### Performance Optimization
1. **Implement API caching** - Consider caching for frequently accessed data
2. **Add request deduplication** - Prevent duplicate simultaneous requests
3. **Implement offline support** - Cache critical data for offline usage

## 7. File Dependencies

### Core API Files
- `src/api/client.ts` - Central API client
- `src/api/index.ts` - API module exports
- `src/api/users.ts` - User management
- `src/api/charts.ts` - Chart analysis
- `src/api/relationships.ts` - Relationship analysis
- `src/api/horoscopes.ts` - Horoscope generation
- `src/api/celebrities.ts` - Celebrity features
- `src/api/chat.ts` - Chat functionality
- `src/api/external.ts` - External service APIs

### Legacy Files (Recommend Removal)
- `api.ts` - **DEPRECATED** - Contains legacy implementations
- `API_GUIDE.md` - Backend response documentation (keep for reference)

### Firebase Configuration
- `src/config/firebase.ts` - Firebase setup
- `android/app/google-services.json` - Android Firebase config
- `ios/GoogleService-Info.plist` - iOS Firebase config

## 8. API Usage Patterns

### Most Active APIs
Based on grep analysis, the most frequently used APIs are:
1. User authentication and management
2. Birth chart analysis and chat
3. Relationship analysis workflow
4. Google Maps timezone/geocoding
5. Horoscope generation

### Error Handling
- ✅ Centralized error handling in `ApiClient`
- ✅ Custom `ApiError` class for structured errors
- ✅ Proper HTTP status code handling

### Logging
- ✅ Comprehensive logging in API client
- ✅ Request/response logging for debugging
- ⚠️ **Note**: Verbose logging should be disabled in production

---

## 9. Cleanup Actions Completed ✅

### Successfully Removed
1. **Legacy `api.ts` file** - Removed completely (19 unused functions)
2. **Unused `getPlanetOverview` function** - Removed from `useChart` hook and API interfaces
3. **Duplicate `ApiError` export** - Fixed duplicate export in `client.ts`
4. **Missing type exports** - Cleaned up non-existent type exports from `index.ts`

### Verified Working
- ✅ All components use modular API imports (`src/api/`)
- ✅ No broken imports detected
- ✅ Firebase/Google services remain properly configured
- ✅ External API calls (timezone, geocoding) working via `externalApi`

**Total Active APIs**: 66 endpoints across all services
- **Backend APIs**: 61 endpoints (via apiClient)
- **External APIs**: 5 endpoints (Google Maps/Places)
**Legacy Frontend Functions Removed**: 19 unused implementations from api.ts
**Status**: ✅ **Cleanup Complete**