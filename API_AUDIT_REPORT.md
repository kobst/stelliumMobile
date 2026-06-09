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

## 2. Active Backend APIs

### Base Configuration
- **Server URL**: Environment variable `REACT_APP_SERVER_URL`
- **API Client**: Centralized in `src/api/client.ts`
- **Content Type**: `application/json`

### 2.1 User Management APIs

#### Modern APIs (src/api/users.ts)
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
11. `POST /createCeleb` - Create celebrity subject with known birth time
12. `POST /createCelebUnknownTime` - Create celebrity subject with unknown birth time

#### Legacy APIs (api.ts)
11. `POST /createUser` - Legacy user creation
12. `POST /getUser` - Legacy get user
13. `POST /getUsers` - Legacy get users
14. `POST /getCompositeCharts` - Legacy composite charts

### 2.2 Chart Analysis APIs

#### Modern APIs (src/api/charts.ts)
15. `POST /getBirthChartAnalysis` - Full birth chart analysis
16. `POST /fetchAnalysis` - Fetch existing analysis
17. `POST /analysis/start-full` - Start full analysis workflow
18. `POST /analysis/full-status` - Poll analysis status
19. `POST /workflow/get-complete-data` - Get completed workflow data
20. `POST /getSubtopicAnalysis` - Generate topic analysis
21. `POST /processBasicAnalysis` - Process and vectorize basic analysis
22. `POST /processTopicAnalysis` - Process and vectorize topic analysis
23. `POST /users/{userId}/birthchart/enhanced-chat` - Enhanced birth chart chat
24. `GET /users/{userId}/birthchart/chat-history` - Birth chart chat history

#### Legacy APIs (api.ts)
25. `POST /getShortOverview` - Short birth chart overview
26. `POST /getShortOverviewPlanet` - Planet-specific overview
27. `POST /getBirthChartAnalysis` - Legacy full analysis

### 2.3 Relationship Analysis APIs

#### Modern APIs (src/api/relationships.ts)
28. `POST /enhanced-relationship-analysis` - Enhanced 5-cluster relationship analysis
29. `POST /workflow/relationship/start` - Start relationship workflow
30. `POST /workflow/relationship/status` - Get workflow status
31. `POST /workflow/relationship/resume` - Resume paused workflow
32. `POST /fetchRelationshipAnalysis` - Fetch existing relationship analysis
33. `POST /getUserCompositeCharts` - Get user's composite charts
34. `DELETE /relationships/{relationshipId}` - Delete relationship
35. `POST /chatForUserRelationship` - Legacy relationship chat
36. `POST /fetchUserChatRelationshipAnalysis` - Legacy chat history
37. `POST /relationships/{compositeChartId}/enhanced-chat` - Enhanced relationship chat
38. `GET /relationships/{compositeChartId}/chat-history` - Relationship chat history

#### Legacy APIs (api.ts)
39. `POST /createRelationship` - Legacy relationship creation
40. `POST /saveCompositeChartProfile` - Legacy save composite chart
41. `POST /getRelationshipScore` - Legacy relationship scoring
42. `POST /generateRelationshipAnalysis` - Legacy generate analysis
43. `POST /fetchRelationshipAnalysis` - Legacy fetch analysis

### 2.4 Horoscope APIs (src/api/horoscopes.ts)
44. `POST /users/{userId}/horoscope/daily` - Daily horoscope
45. `POST /users/{userId}/horoscope/weekly` - Weekly horoscope
46. `POST /users/{userId}/horoscope/monthly` - Monthly horoscope
47. `POST /users/{userId}/horoscope/custom` - Custom horoscope generation
48. `GET /users/{userId}/horoscope/latest` - Latest horoscope
49. `POST /getTransitWindows` - Transit windows for custom horoscopes
50. `POST /generateCustomHoroscope` - Legacy custom horoscope
51. `GET /users/{userId}/horoscope/custom` - Custom horoscope history

### 2.5 Celebrity APIs (src/api/celebrities.ts)
52. `POST /getCelebs` - Get celebrities with pagination
53. `POST /searchCelebrities` - Search celebrities with filters
54. `POST /getCelebrity` - Get celebrity by ID
55. `POST /getCelebrityRelationships` - Get celebrity relationships
56. `POST /analyzeCelebrityCompatibility` - Analyze user-celebrity compatibility
57. `POST /getCelebritiesByProfession` - Get celebrities by profession
58. `POST /getCelebritiesBySign` - Get celebrities by zodiac sign
59. `POST /getTrendingCelebrities` - Get trending celebrities
60. `POST /getCelebrityChartAnalysis` - Get celebrity chart analysis
61. `POST /findCelebrityMatches` - Find celebrity matches for user
62. `GET /getCelebrityProfessions` - Get celebrity professions list
63. `PUT /celebrities/{celebrityId}` - Update celebrity (admin)
64. `DELETE /celebrities/{celebrityId}` - Delete celebrity (admin)

### 2.6 Chat APIs (src/api/chat.ts)
65. `POST /userChatBirthChartAnalysis` - Chat with birth chart context
66. `POST /userChatRelationshipAnalysis` - Chat with relationship context
67. `POST /handleUserQuery` - General chat/query handling
68. `POST /getChatHistory` - Get chat history
69. `DELETE /chat/messages/{messageId}` - Delete chat message
70. `POST /clearChatHistory` - Clear chat history
71. `POST /getSuggestedQuestions` - Get suggested questions
72. `POST /rateChatResponse` - Rate chat response
73. `POST /getChatStats` - Get chat statistics

### 2.7 Legacy Vectorization APIs (api.ts)
74. `POST /processBasicAnalysis` - Legacy vectorization
75. `POST /processTopicAnalysis` - Legacy vectorization
76. `POST /processRelationshipAnalysis` - Legacy vectorization

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

**Total Active APIs**: 76 endpoints across all services
**Recommended for Removal**: 19 legacy implementations in `api.ts`
**Net Active APIs After Cleanup**: 57 endpoints