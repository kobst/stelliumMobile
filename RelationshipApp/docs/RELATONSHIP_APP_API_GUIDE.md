# Relationship App API Summary

Detailed staged onboarding documentation now lives in [RELATIONSHIP_APP_ONBOARDING_API_GUIDE.md](./RELATIONSHIP_APP_ONBOARDING_API_GUIDE.md).

This document summarizes the API surface currently relevant to the relationship-focused mobile app as of April 22, 2026.

It covers:
- Romantic subject creation endpoints that are already implemented
- Relationship-app celebrity aspect bank APIs that are now implemented
- Relationship-app Discover tab collection APIs
- Relationship-app celebrity romantic profile APIs
- Relationship-app romantic analysis read/generate APIs
- Shared relationship analysis endpoints the mobile app can use today
- Expected request/response bodies
- Current persistence model for relationship-app-only artifacts

Current production-oriented model choices for onboarding artifacts:
- Romantic summary: `claude-haiku-4-5`
- Romantic profile blurb: `claude-haiku-4-5`
- Celebrity match annotations: `claude-haiku-4-5`

## Scope

The current backend split is:
- Classic app: existing full-chart natal analysis APIs
- Relationship app: romantic subject creation, celebrity aspect bank, onboarding preview, and user-centered romantic analysis APIs
- Relationship analysis: still uses the shared relationship endpoints and shared scoring pipeline for pairwise synastry/composite analysis

The relationship app now has its own dedicated endpoint namespace for user-centered romantic analysis:
- `GET /relationship-app/me`
- `GET /relationship-app/discover/collections`
- `GET /relationship-app/users/:userId/entitlements`
- `POST /relationship-app/users/:userId/ask-iris`
- `POST /relationship-app/subjects/:userId/ask-iris`
- `GET /relationship-app/celebs/:userId/profile`
- `POST /relationship-app/enhanced-relationship-analysis`
- `POST /relationship-app/workflow/relationship/start`
- `POST /relationship-app/relationships/:compositeChartId/ask-iris`
- `POST /relationship-app/relationships/:compositeChartId/enhanced-chat`
- `GET /relationship-app/subjects/:userId/romantic-analysis`
- `POST /relationship-app/subjects/:userId/romantic-analysis/generate`

## Endpoint Catalog

This section is the quickest survey of the relationship-app-relevant API surface.

### Account And Onboarding

- `POST /relationship-app/onboarding-preview`
  - Pre-signup onboarding preview
  - Creates a temporary relationship-app preview subject and returns the initial romantic overview
- `POST /relationship-app/onboarding-preview/:previewId/celeb-matches`
  - Starts celebrity-match computation for an onboarding preview
- `POST /relationship-app/onboarding-preview/:previewId/celeb-annotations`
  - Starts LLM annotation generation for surfaced onboarding celeb matches
- `GET /relationship-app/onboarding-preview/:previewId/celeb-matches?claimToken=...`
  - Poll/read endpoint for onboarding preview match state, surfaced celeb cards, and annotation completion
- `POST /relationship-app/onboarding-claim`
  - Claims a preview and converts it into the authenticated relationship-app account
- `GET /relationship-app/me`
  - Returns the authenticated relationship-app account profile
- `POST /createUserRomantic`
  - Creates a full-time authenticated relationship-app account subject
- `POST /createUserUnknownTimeRomantic`
  - Creates an authenticated relationship-app account subject without exact birth time

### Subject Creation And Subject Reads

- `POST /createGuestSubjectRomantic`
  - Creates a timed guest subject owned by the authenticated relationship-app user
  - Credit-gated on relationship-app billing when `appDomain=relationship-app`
- `POST /createGuestSubjectUnknownTimeRomantic`
  - Creates an unknown-time guest subject owned by the authenticated relationship-app user
  - Credit-gated on relationship-app billing when `appDomain=relationship-app`
- `POST /getGuestSubjectRomantic`
  - Returns the owned guest subject plus stored relationship-app romantic summary fields
- `POST /getUserSubjects`
  - Returns the authenticated owner’s saved subjects
  - This is not relationship-app-namespaced, but the relationship app uses it to enumerate owned guest subjects

### Celebrity APIs

- `POST /getCelebs`
  - Returns celebrity subjects
  - Also returns `romanticProfileBlurb`, `romanticOverview`, and `romanticReferencedCodes` directly on each celeb item for list rendering
- `GET /relationship-app/discover/collections`
  - Public read endpoint for Discover tab editorial collections
  - Returns exactly 2 weekly-rotating collections, each populated with up to 8 matching celebrity cards
  - Does not require authentication and can be used by relationship-app or legacy landing-page surfaces
- `GET /relationship-app/celebs/:userId/profile`
  - Returns the full celebrity profile payload for detail screens
  - Includes the shared celebrity subject, birth chart, and relationship-app romantic summary fields
- `POST /getCelebRelationships`
  - Public read endpoint for celebrity-to-celebrity relationship cards
  - Returns existing composite relationship fields plus `overallScore`, `clusterScores`, `archetypeLabel`, and `archetypeBlurb` when relationship scoring data exists
  - Includes `userA_profilePhotoUrl` and `userB_profilePhotoUrl` directly on each relationship card
  - `POST /getCelebrityRelationships` remains supported as a legacy alias
- `GET /users/:userId/relationship-app/celeb-aspect-bank`
  - Returns the authenticated relationship-app user’s persisted celebrity aspect bank / celeb match data
- `POST /admin/relationship-app/celebs/:userId/profile/generate`
  - Admin regeneration endpoint for relationship-app celebrity profile copy

### Relationship Creation And Relationship Reads

- `POST /relationship-app/enhanced-relationship-analysis`
  - Primary direct relationship-creation endpoint for the relationship app
  - Generates synastry/composite data, scores the clusters, generates the initial relationship overview, and saves the relationship
- `POST /relationship-app/workflow/relationship/start`
  - Async workflow-based relationship creation path
  - Use this when the client wants the longer-running workflow orchestration path
- `POST /workflow/relationship/status`
  - Polls workflow status for async relationship generation
- `POST /workflow/relationship/resume`
  - Resumes a paused/incomplete relationship workflow when applicable
- `POST /getUserCompositeCharts`
  - Returns saved relationships for the authenticated owner
- `POST /fetchRelationshipAnalysis`
  - Returns stored relationship analysis / composite relationship payload for a composite chart id

### AskIris And Relationship Chat

- `POST /relationship-app/users/:userId/ask-iris`
  - AskIris for the authenticated relationship-app account-self subject
- `POST /relationship-app/subjects/:userId/ask-iris`
  - AskIris for guest subjects and celebrity subjects in the relationship app
- `POST /relationship-app/relationships/:compositeChartId/ask-iris`
  - Relationship AskIris endpoint for saved relationships
- `POST /relationship-app/relationships/:compositeChartId/enhanced-chat`
  - Alias path into the same relationship chat handler
- `GET /relationships/:compositeChartId/chat-history`
  - Fetches saved relationship chat history

### Romantic Analysis

- `GET /relationship-app/subjects/:userId/romantic-analysis`
  - Returns the saved full personal romantic analysis for a relationship-app subject
- `POST /relationship-app/subjects/:userId/romantic-analysis/generate`
  - Generates and saves the full personal romantic analysis for a relationship-app subject

### Relationship-App Billing

- `GET /relationship-app/users/:userId/entitlements`
  - Returns the relationship-app-specific balance snapshot
  - This is backed by `relationship_user_entitlements` and `relationship_credit_transactions`

## Frontend Defaults

If the relationship app wants the simplest stable integration path, the default endpoint choices should be:

- Current account profile: `GET /relationship-app/me`
- Credit balance: `GET /relationship-app/users/:userId/entitlements`
- Create timed guest subject: `POST /createGuestSubjectRomantic`
- Create unknown-time guest subject: `POST /createGuestSubjectUnknownTimeRomantic`
- Read guest subject onboarding summary: `POST /getGuestSubjectRomantic`
- List saved owned subjects: `POST /getUserSubjects`
- List celebrities for browse cards: `POST /getCelebs`
- Read weekly Discover collections: `GET /relationship-app/discover/collections`
- Read celebrity detail: `GET /relationship-app/celebs/:userId/profile`
- Read celebrity relationship cards: `POST /getCelebRelationships`
- Read celeb match bank for the signed-in user: `GET /users/:userId/relationship-app/celeb-aspect-bank`
- Create relationship and get initial scored overview immediately: `POST /relationship-app/enhanced-relationship-analysis`
- Start async relationship workflow: `POST /relationship-app/workflow/relationship/start`
- AskIris about self: `POST /relationship-app/users/:userId/ask-iris`
- AskIris about another subject: `POST /relationship-app/subjects/:userId/ask-iris`
- AskIris about a relationship: `POST /relationship-app/relationships/:compositeChartId/ask-iris`
- Read/generate full personal romantic analysis: `GET/POST /relationship-app/subjects/:userId/romantic-analysis`

## Auth Summary

- `POST /createUserRomantic`
  - Requires Firebase auth via `verifyFirebaseToken`
- `POST /createUserUnknownTimeRomantic`
  - Requires Firebase auth via `verifyFirebaseToken`
- `POST /createGuestSubjectRomantic`
  - Requires app auth via `requireAuth`
  - `ownerUserId` must match authenticated user
- `POST /createGuestSubjectUnknownTimeRomantic`
  - Requires app auth via `requireAuth`
  - `ownerUserId` must match authenticated user
- `POST /getGuestSubjectRomantic`
  - Requires app auth via `requireAuth`
  - Subject must belong to the authenticated user
- `GET /relationship-app/me`
  - Requires app auth via `requireAuth`
- `GET /relationship-app/users/:userId/entitlements`
  - Requires app auth via `requireAuth`
  - `userId` must match authenticated user
- `POST /relationship-app/users/:userId/ask-iris`
  - Requires app auth via `requireAuth`
  - `userId` must belong to the authenticated user in the relationship app
- `POST /relationship-app/subjects/:userId/ask-iris`
  - Requires app auth via `requireAuth`
  - Subject must belong to the authenticated user in the relationship app
- `GET /relationship-app/celebs/:userId/profile`
  - Public read
  - Returns celebrity base subject data plus relationship-app romantic summary fields when available
- `GET /relationship-app/discover/collections`
  - Public read
  - No auth required
- `POST /getCelebRelationships`
  - Public read
  - Returns celebrity-to-celebrity composite relationship cards with scoring/archetype fields when available
- `POST /getCelebrityRelationships`
  - Public read
  - Legacy alias for `POST /getCelebRelationships`
- `POST /relationship-app/enhanced-relationship-analysis`
  - Requires app auth via `requireAuth`
- `POST /relationship-app/workflow/relationship/start`
  - Requires app auth via `requireAuth`
- `POST /relationship-app/relationships/:compositeChartId/ask-iris`
  - Requires app auth via `requireAuth`
  - Relationship must belong to the authenticated user
- `POST /relationship-app/relationships/:compositeChartId/enhanced-chat`
  - Requires app auth via `requireAuth`
  - Relationship must belong to the authenticated user
- `GET /relationship-app/subjects/:userId/romantic-analysis`
  - Requires app auth via `requireAuth`
  - Subject must belong to the authenticated user
- `POST /relationship-app/subjects/:userId/romantic-analysis/generate`
  - Requires app auth via `requireAuth`
  - Subject must belong to the authenticated user
- `GET /users/:userId/relationship-app/celeb-aspect-bank`
  - Requires app auth via `requireAuth`
  - `userId` must match authenticated user
- `POST /enhanced-relationship-analysis`
  - Currently public-rate-limited, not auth-gated at route level
  - Billing/ownership is resolved in controller logic
- `POST /workflow/relationship/start`
  - Requires app auth
- `POST /workflow/relationship/status`
  - Requires app auth
- `POST /workflow/relationship/resume`
  - Requires app auth
- `POST /relationships/:compositeChartId/enhanced-chat`
  - Requires app auth
- `GET /relationships/:compositeChartId/chat-history`
  - Requires app auth

## App Domain And Persistence

For account-self creation, the backend supports:
- `appDomain: "relationship-app"` in request body, or
- `x-app-domain: relationship-app` header

This is used to separate account-self users across app domains.

Relationship-app-only romantic artifacts are now persisted under a dedicated namespace inside `birth_chart_analysis`:

```json
{
  "interpretation": {
    "relationshipApp": {
      "romanticOverview": "...",
      "romanticProfileBlurb": "...",
      "romanticReferencedCodes": ["..."],
      "partnershipsReport": {
        "reportType": "partnerships-romance",
        "categoryKey": "PARTNERSHIPS",
        "...": "full romantic report payload"
      }
    }
  }
}
```

There is no legacy fallback read path for romantic summary/report fields now. Relationship-app reads expect the dedicated `interpretation.relationshipApp.*` namespace.

Relationship-app billing is now beginning to separate at the storage layer as well:
- relationship-app entitlements/balance: `relationship_user_entitlements`
- relationship-app credit transactions: `relationship_credit_transactions`

For now, the first relationship-app billing cutover is:
- `GET /relationship-app/users/:userId/entitlements`
- `POST /relationship-app/users/:userId/ask-iris`
- `POST /relationship-app/subjects/:userId/ask-iris`
- romantic guest-subject creation charges against the relationship-app balance when `appDomain=relationship-app`
- relationship creation via `POST /relationship-app/enhanced-relationship-analysis`
- full relationship workflow start via `POST /relationship-app/workflow/relationship/start`
- relationship chat via `POST /relationship-app/relationships/:compositeChartId/ask-iris`
- relationship chat via `POST /relationship-app/relationships/:compositeChartId/enhanced-chat`

On first relationship-app billing access, the balance is bootstrapped once from the user's current shared credit snapshot and then maintained separately going forward.

## Relationship-App Discover Collections

### `GET /relationship-app/discover/collections`

Public endpoint for the Discover tab and public landing-page surfaces.

Returns exactly 2 editorially curated collections for the current week. Each collection is populated with a deterministic weekly subset of celebrity cards whose current chart placements match that collection's rule.

Behavior:
- The selected collections are global and fixed for the normalized week
- Week starts Monday in `America/New_York`
- `weekOf` is the Monday date string for the active week, for example `2026-04-20`
- The two returned collections always have different moods when a valid pair exists
- Each collection must have at least 4 matching celebrities to be eligible
- Each returned collection includes up to 8 celebrities
- Celebrity IDs are not hardcoded into collections; membership is computed from the current celebrity database
- The returned celebrity subset is deterministic for the week, so repeated calls during the same week return the same ordering/subset until the 1-hour endpoint cache expires and recomputes to the same seed

Current implementation details:
- Collection definitions are static code-defined seed data
- V1 matching supports sign/rising/placement rules only
- Aspect-dependent editorial collections are excluded from the launch rotation until aspect-pattern matching is added
- Matching uses `birthChart.planets` and relationship-app celebrity preview fields from `subjects.relationshipAppProfile`
- Endpoint response is cached in memory for 1 hour per `weekOf`

Response body:

```json
{
  "success": true,
  "weekOf": "2026-04-20",
  "collections": [
    {
      "id": "the-nurturers",
      "title": "The nurturers",
      "description": "Cancer Moon or Cancer Venus. They build safety around the people they love.",
      "mood": "soft",
      "accent": "green",
      "celebs": [
        {
          "id": "celebritySubjectId",
          "firstName": "Zendaya",
          "lastName": "Coleman",
          "gender": "female",
          "profilePhotoUrl": "https://...",
          "romanticProfileBlurb": "Short frontend-friendly romantic blurb",
          "sunSign": "Virgo",
          "moonSign": "Taurus",
          "venusSign": "Cancer",
          "marsSign": "Cancer",
          "risingSign": "Aquarius"
        }
      ]
    },
    {
      "id": "freedom-first",
      "title": "Freedom first",
      "description": "Aquarius Venus or Sagittarius Mars. Love has to leave room to breathe.",
      "mood": "restless",
      "accent": "coral",
      "celebs": [
        {
          "id": "celebritySubjectId2",
          "firstName": "Timothée",
          "lastName": "Chalamet",
          "gender": "male",
          "profilePhotoUrl": "https://...",
          "romanticProfileBlurb": "Short frontend-friendly romantic blurb",
          "sunSign": "Capricorn",
          "moonSign": "Pisces",
          "venusSign": "Aquarius",
          "marsSign": "Capricorn",
          "risingSign": null
        }
      ]
    }
  ]
}
```

Notes for clients:
- Treat `collections` as the full render payload for the Discover tab card/carousel
- Do not implement collection rotation or filtering on the client
- `risingSign` can be `null` for celebrities without a usable Ascendant
- `romanticProfileBlurb` can be `null` if a celebrity has not been backfilled yet
- `gender` is included in the current response but is not required for display

## Relationship-App Celebrity Profiles

Celebrity source records remain shared across the backend. The relationship-app celebrity profile now uses a split persistence model:

- Canonical analysis artifact: `birth_chart_analysis.interpretation.relationshipApp.*`
- Denormalized celebrity-list preview fields: `subjects.relationshipAppProfile.*`

Storage:

```json
{
  "birth_chart_analysis": {
    "interpretation": {
      "relationshipApp": {
        "romanticOverview": "...",
        "romanticProfileBlurb": "...",
        "romanticReferencedCodes": ["..."]
      }
    }
  },
  "subjects": {
    "relationshipAppProfile": {
      "romanticOverview": "...",
      "romanticProfileBlurb": "...",
      "romanticReferencedCodes": ["..."],
      "updatedAt": "2026-04-19T00:00:00.000Z"
    }
  }
}
```

Why the split exists:
- The full relationship-app analysis remains in `birth_chart_analysis`
- Celebrity listing endpoints can return the blurb directly from `subjects` without joining on every request

### `GET /relationship-app/celebs/:userId/profile`

Returns the celebrity’s shared base subject plus any persisted relationship-app romantic fields.

Response body:

```json
{
  "success": true,
  "celebrity": {
    "_id": "celebritySubjectId",
    "firstName": "Zendaya",
    "lastName": "",
    "gender": "female",
    "kind": "celebrity",
    "profilePhotoUrl": "https://..."
  },
  "userId": "celebritySubjectId",
  "birthChart": { "...": "chart data" },
  "overview": "Romance-focused celebrity overview",
  "romanticProfileBlurb": "Short frontend-friendly romantic blurb",
  "referencedCodes": ["Pp-...", "A-..."],
  "romanticAnalysis": null,
  "overviewMode": "romantic"
}
```

Admin/backfill generation paths:
- New celebrity creation now also generates and stores the relationship-app `romanticOverview` and `romanticProfileBlurb`
- Existing celebrities can be backfilled with `npm run backfill:relationship-celeb-profiles`
- Existing persisted analysis can be copied into celebrity list-preview fields with `npm run migrate:relationship-celeb-profile-preview`
- One-off admin regeneration is available via `POST /admin/relationship-app/celebs/:userId/profile/generate`

## Celebrity Relationship Cards

### `POST /getCelebRelationships`

Public endpoint for reading celebrity-to-celebrity relationships. `POST /getCelebrityRelationships` remains available as a legacy alias to the same handler.

Request body:

```json
{
  "limit": 50
}
```

Behavior:
- `limit` is optional and defaults to `50`
- `limit` accepts a number or numeric string
- `limit` is clamped to `1..100`
- Only celebrity-to-celebrity relationships are returned
- Mixed user-celebrity relationships are excluded even if `isCelebrityRelationship` is true
- Results are sorted by relationship creation date descending
- Relationship scoring fields are joined from `relationship_analysis` by `debug.inputSummary.compositeChartId`

Response body:

```json
{
  "success": true,
  "count": 1,
  "relationships": [
    {
      "_id": "compositeChartId",
      "userA_id": "celebritySubjectIdA",
      "userB_id": "celebritySubjectIdB",
      "userA_name": "Zendaya",
      "userB_name": "Tom",
      "userA_firstName": "Zendaya",
      "userA_lastName": "Coleman",
      "userB_firstName": "Tom",
      "userB_lastName": "Holland",
      "userA_profilePhotoUrl": "https://...",
      "userB_profilePhotoUrl": "https://...",
      "synastryAspects": [],
      "synastryHousePlacements": {},
      "compositeChart": {},
      "isCelebrityRelationship": true,
      "overallScore": 76,
      "clusterScores": {
        "Harmony": 78,
        "Passion": 82,
        "Connection": 74,
        "Stability": 69,
        "Growth": 73
      },
      "archetypeKey": "safe_harbor_open_sea",
      "archetypeLabel": "Safe Harbor, Open Sea",
      "archetypeBlurb": "Short relationship archetype summary",
      "archetype": {
        "version": "archetype-summary-v3",
        "archetypeKey": "safe_harbor_open_sea",
        "label": "Safe Harbor, Open Sea",
        "blurb": "Short relationship archetype summary",
        "dominantClusters": ["Harmony", "Passion"],
        "supportClusters": ["Harmony"],
        "tensionClusters": [],
        "shape": "balanced",
        "tone": "magnetic",
        "confidence": "high"
      },
      "initialOverview": "Initial relationship overview when available",
      "clusterAnalysisGeneratedAt": "2026-04-23T00:00:00.000Z",
      "createdAt": "2026-04-23T00:00:00.000Z",
      "updatedAt": "2026-04-23T00:00:00.000Z"
    }
  ],
  "metadata": {
    "limit": 50,
    "isCelebrityRelationships": true,
    "includesRelationshipScoring": true,
    "fetchedAt": "2026-04-23T00:00:00.000Z"
  }
}
```

Notes:
- Scoring/archetype fields can be absent or `null` for older relationships that do not have a matching `relationship_analysis` document
- `clusterScores` contains the 5 current relationship clusters: `Harmony`, `Passion`, `Connection`, `Stability`, and `Growth`
- `userA_profilePhotoUrl` and `userB_profilePhotoUrl` are sourced from the joined celebrity subject records and can be `null` if no photo is stored

## AskIris APIs

AskIris is the relationship-app-specific chat surface. It reuses the existing enhanced chat request shapes, but for subject-based requests it applies a romance- and partnership-focused prompt lens and charges against relationship-app credits.

### `POST /relationship-app/users/:userId/ask-iris`

Alias for authenticated self-subject chat in the relationship app.

Request body:

```json
{
  "query": "What does my chart say about the kind of partner I am drawn to?",
  "selectedAspects": [
    {
      "type": "aspect",
      "id": "A-VenMar-01",
      "planet1": "Venus",
      "aspectType": "trine",
      "planet2": "Mars"
    }
  ]
}
```

### `POST /relationship-app/subjects/:userId/ask-iris`

Same request/response contract as the `/users/:userId/ask-iris` route, but intended for guest subjects saved under the relationship app.

Behavior:
- `query` only: conversational AskIris mode
- `selectedAspects` only: custom romance-focused analysis mode
- both: hybrid mode
- subject must be a relationship-app subject unless it is a celebrity subject
- bills against `relationship_user_entitlements`

Response body:

```json
{
  "success": true,
  "answer": "Text answer without inline astro codes",
  "referencedCodes": ["A-VenMar-01"],
  "chatHistoryResult": { "...": "saved chat record" },
  "analysisId": "chatMessageId",
  "billingSystem": "relationship-app",
  "vectorized": false,
  "mode": "chat"
}
```

### `POST /relationship-app/relationships/:compositeChartId/ask-iris`

Relationship-chat alias for the relationship app.

Request body:

```json
{
  "query": "What is the strongest long-term theme in this relationship?",
  "scoredItems": [
    {
      "code": "SynA-P1(MosGe07)-GaCo-P2(JusGe02)",
      "description": "Moon conjunct Jupiter",
      "type": "aspect",
      "source": "synastry"
    }
  ]
}
```

Response body:

```json
{
  "success": true,
  "answer": "Relationship-focused answer without inline astro codes",
  "referencedCodes": ["SynA-P1(MosGe07)-GaCo-P2(JusGe02)"],
  "chatHistoryResult": { "...": "saved chat record" },
  "analysisId": "chatMessageId",
  "billingSystem": "relationship-app",
  "vectorized": false,
  "mode": "chat"
}
```

## Romantic Subject Creation APIs

### `POST /createUserRomantic`

Creates an `accountSelf` subject with a birth chart and a short romantic overview.

Request body:

```json
{
  "firstName": "Edward",
  "lastName": "Han",
  "gender": "male",
  "email": "ed@example.com",
  "dateOfBirth": "1990-01-15",
  "time": "13:45",
  "placeOfBirth": "New York, NY",
  "lat": "40.7128",
  "lon": "-74.0060",
  "tzone": "-5",
  "totalOffsetHours": -5,
  "profilePhotoUrl": "https://...",
  "appDomain": "relationship-app"
}
```

Required fields in practice:
- `firstName`
- `lastName`
- `dateOfBirth` in `YYYY-MM-DD`
- `placeOfBirth`
- `lat`
- `lon`
- `tzone`
- `email`

Optional:
- `gender`
- `time`
- `totalOffsetHours`
- `profilePhotoUrl`

Response body:

```json
{
  "success": true,
  "user": {
    "_id": "subjectId",
    "firstName": "Edward",
    "lastName": "Han",
    "email": "ed@example.com",
    "kind": "accountSelf",
    "appDomain": "relationship-app"
  },
  "userId": "subjectId",
  "birthChart": { "...": "chart data" },
  "overview": "Romance-focused overview text",
  "romanticProfileBlurb": "Short image-first romantic profile blurb",
  "referencedCodes": ["Pp-...", "A-..."],
  "celebMatchesStatus": {
    "status": "pending",
    "startedAt": null,
    "completedAt": null,
    "error": null,
    "lastRequestedAt": null
  },
  "celebAnnotationsStatus": {
    "status": "pending",
    "startedAt": null,
    "completedAt": null,
    "error": null,
    "lastRequestedAt": null
  },
  "celebAspectBank": null,
  "topAspects": [],
  "overviewMode": "romantic",
  "status": "user_created_with_overview",
  "saveUserResponse": { "...": "mongo insert/update response" }
}
```

Notes:
- `overview` is the romantic overview for this endpoint.
- `romanticProfileBlurb` is returned alongside the overview for relationship-app reads.
- The overview text returned to the client is stripped of astro codes.
- Referenced codes are returned separately.
- For `relationship-app` onboarding preview, the initial preview call returns the summary first and initializes both `celebMatchesStatus` and `celebAnnotationsStatus` to `pending`.
- Celebrity matches are fetched in a second request using the returned `previewId`.
- Celebrity annotations are fetched lazily in a third request after matches are ready.
- If a matching account-self already exists in the same `appDomain` and already has a romantic overview saved, the endpoint returns the existing subject.

### `POST /createUserUnknownTimeRomantic`

Same as `createUserRomantic`, except:
- no `time` field is expected
- chart is generated using noon time and then house-dependent data is removed
- saved subject includes `birthTimeUnknown: true`

Request body:

```json
{
  "firstName": "Edward",
  "lastName": "Han",
  "gender": "male",
  "email": "ed@example.com",
  "dateOfBirth": "1990-01-15",
  "placeOfBirth": "New York, NY",
  "lat": "40.7128",
  "lon": "-74.0060",
  "tzone": "-5",
  "profilePhotoUrl": "https://...",
  "appDomain": "relationship-app"
}
```

Response body shape matches `createUserRomantic`.

### `POST /createGuestSubjectRomantic`

Creates a guest subject owned by the authenticated user and generates a short romantic overview.

Request body:

```json
{
  "firstName": "Angelina",
  "lastName": "Jolie",
  "gender": "female",
  "dateOfBirth": "1975-06-04",
  "time": "09:09",
  "placeOfBirth": "Los Angeles, CA",
  "lat": "34.0522",
  "lon": "-118.2437",
  "tzone": "-8",
  "ownerUserId": "authenticatedOwnerSubjectId",
  "profilePhotoUrl": "https://..."
}
```

Required fields in practice:
- `firstName`
- `lastName`
- `dateOfBirth`
- `placeOfBirth`
- `lat`
- `lon`
- `tzone`
- `ownerUserId`

Optional:
- `gender`
- `time`
- `profilePhotoUrl`

Response body:

```json
{
  "success": true,
  "guestSubject": {
    "firstName": "Angelina",
    "lastName": "Jolie",
    "gender": "female",
    "dateOfBirth": "1975-06-04T09:09:00",
    "placeOfBirth": "Los Angeles, CA",
    "time": "09:09",
    "totalOffsetHours": "-8",
    "profilePhotoUrl": "https://..."
  },
  "userId": "guestSubjectId",
  "birthChart": { "...": "chart data" },
  "overview": "Romance-focused overview text",
  "romanticProfileBlurb": "Short image-first romantic profile blurb",
  "referencedCodes": ["Pp-...", "A-..."],
  "overviewMode": "romantic",
  "status": "guest_created_with_overview",
  "saveGuestResponse": { "...": "mongo insert response" },
  "creditsDeducted": 1
}
```

Notes:
- This charges `CREDIT_COSTS.GUEST_SUBJECT_OVERVIEW`.
- `ownerUserId` must match the authenticated user.

### `POST /getGuestSubjectRomantic`

Returns the stored relationship-app romantic summary for an owned guest subject.

Request body:

```json
{
  "userId": "guestSubjectId"
}
```

Response body:

```json
{
  "success": true,
  "guestSubject": {
    "_id": "guestSubjectId",
    "firstName": "Angelina",
    "lastName": "Jolie",
    "kind": "guest",
    "ownerUserId": "authenticatedOwnerSubjectId"
  },
  "userId": "guestSubjectId",
  "birthChart": { "...": "chart data" },
  "overview": "Romance-focused overview text",
  "romanticProfileBlurb": "Short image-first romantic profile blurb",
  "referencedCodes": ["Pp-...", "A-..."],
  "overviewMode": "romantic",
  "status": "guest_subject_loaded"
}
```

Notes:
- This is a private read endpoint for relationship-app guest-subject romantic summary data.
- Reads prefer `interpretation.relationshipApp.*` and fall back to older `basicAnalysis.romantic*` fields when present.

### `POST /createGuestSubjectUnknownTimeRomantic`

Same as `createGuestSubjectRomantic`, except:
- no `time` field is required
- chart uses noon-time fallback and strips house-dependent data
- guest subject includes `birthTimeUnknown: true`

Request body:

```json
{
  "firstName": "Angelina",
  "lastName": "Jolie",
  "gender": "female",
  "dateOfBirth": "1975-06-04",
  "placeOfBirth": "Los Angeles, CA",
  "lat": "34.0522",
  "lon": "-118.2437",
  "tzone": "-8",
  "ownerUserId": "authenticatedOwnerSubjectId",
  "profilePhotoUrl": "https://..."
}
```

Response body shape matches `createGuestSubjectRomantic`.

## Celebrity Aspect Bank APIs

This is relationship-app-specific functionality. The bank is:
- computed from the subject's existing natal positions against the celebrity catalog
- stored on the `subjects` document for `kind: "accountSelf"` + `appDomain: "relationship-app"`
- returned directly on romantic account-self creation responses

### `GET /users/:userId/relationship-app/celeb-aspect-bank`

Returns the stored celebrity aspect bank for the authenticated relationship-app account user.

Response body:

```json
{
  "success": true,
  "userId": "subjectId",
  "celebAspectBank": {
    "version": "v2",
    "configVersion": "v2",
    "annotationStrategy": "llm-v1",
    "annotationRefreshNeeded": false,
    "computedAt": "2026-04-07T12:00:00.000Z",
    "lastCelebSyncAt": "2026-04-07T12:00:00.000Z",
    "celebGenderFilter": "all",
    "celebrityCountScanned": 500,
    "aspectCountConfigured": 10,
    "topAspects": [
      {
        "aspectType": "sun_moon_trine",
        "label": "Sun-Moon trine",
        "shortMeaning": "emotional recognition",
        "primaryCluster": "Harmony",
        "clusterThemes": ["Harmony", "Connection"],
        "weight": 1.2,
        "maxOrb": 8,
        "score": 0.41,
        "matchCount": 3,
        "sweetSpotPenalty": 0.68,
        "averageOrb": 3.98,
        "matches": [
          {
            "celebId": "subjectId1",
            "orb": 2.78,
            "annotation": {
              "title": "Sun-Moon trine · easy emotional recognition",
              "sentence": "Your Sun in Aries seems to draw out Taylor's Moon in Leo naturally, so being yourself can feel warmly received rather than translated.",
              "generatedBy": "llm",
              "version": "v1"
            }
          },
          { "celebId": "subjectId2", "orb": 3.59 }
        ]
      }
    ],
    "fullBank": [{ "...": "all ranked aspect buckets" }]
  }
}
```

Notes:
- This endpoint normally returns stored data, but it will refresh the stored bank when the payload version is outdated or missing.
- The bank is currently generated automatically for romantic `accountSelf` creation in the `relationship-app` domain.
- `matches[].annotation` is intended for tight frontend UI space: a compact title plus one personalized sentence using the actual planet placements for the user and celebrity.
- The primary path is stored Gemini-generated annotation for the highest-value matches in `topAspects`.
- Non-annotated matches remain structurally present without an `annotation` field until the lazy annotation step completes.
- `annotationStrategy` and `annotationRefreshNeeded` indicate whether the stored bank is already enriched with LLM copy or should be refreshed on the next read/build.
- `matches[].userPlacement` and `matches[].celebPlacement` are also returned so the frontend can render its own variant later without re-deriving chart details.
- When a new celebrity is added, the stored banks are incrementally updated rather than fully recomputed.

## Onboarding Preview Match APIs

### `POST /relationship-app/onboarding-preview/:previewId/celeb-matches`

Generates and stores celebrity matches for the existing onboarding preview subject. This step does not block on LLM annotations.

Request body:

```json
{
  "claimToken": "preview-claim-token"
}
```

Response body when ready:

```json
{
  "success": true,
  "previewId": "subjectId",
  "celebMatchesStatus": {
    "status": "completed",
    "startedAt": "2026-04-09T12:00:00.000Z",
    "completedAt": "2026-04-09T12:00:12.000Z",
    "error": null,
    "lastRequestedAt": "2026-04-09T12:00:00.000Z"
  },
  "celebAnnotationsStatus": {
    "status": "pending",
    "startedAt": null,
    "completedAt": null,
    "error": null,
    "lastRequestedAt": null
  },
  "celebAspectBank": {
    "version": "v2",
    "configVersion": "v2",
    "annotationStrategy": "llm-v1",
    "annotationRefreshNeeded": false,
    "topAspects": [
      {
        "aspectType": "sun_moon_trine",
        "label": "Sun-Moon trine",
        "shortMeaning": "emotional recognition",
        "primaryCluster": "Harmony",
        "clusterThemes": ["Harmony", "Connection"],
        "weight": 1.2,
        "maxOrb": 8,
        "score": 0.41,
        "matchCount": 3,
        "sweetSpotPenalty": 0.68,
        "averageOrb": 3.98,
        "matches": [
          {
            "celebId": "subjectId1",
            "celebName": "Taylor Swift",
            "profilePhotoUrl": "https://...",
            "orb": 2.78,
            "userPlacement": {
              "planet": "Sun",
              "sign": "Aries",
              "house": 1,
              "display": "Sun in Aries in the 1st house",
              "compactDisplay": "Sun in Aries"
            },
            "celebPlacement": {
              "planet": "Moon",
              "sign": "Leo",
              "house": 7,
              "display": "Moon in Leo in the 7th house",
              "compactDisplay": "Moon in Leo"
            },
          }
        ]
      }
    ],
    "fullBank": [{ "...": "all ranked aspect buckets" }]
  },
  "topAspects": [{ "...": "same entries as celebAspectBank.topAspects" }],
  "status": "celeb_matches_ready"
}
```

### `POST /relationship-app/onboarding-preview/:previewId/celeb-annotations`

Starts lazy celebrity annotation generation for the already-computed top matches and returns immediately. The frontend should poll the `GET /celeb-matches` endpoint for `celebAnnotationsStatus`.

Request body:

```json
{
  "claimToken": "preview-claim-token"
}
```

Typical response:

```json
{
  "success": true,
  "previewId": "preview-id",
  "celebMatchesStatus": {
    "status": "completed"
  },
  "celebAnnotationsStatus": {
    "status": "running"
  },
  "celebAspectBank": {
    "...": "stored matches without annotations yet"
  },
  "topAspects": [{ "...": "same entries as celebAspectBank.topAspects" }],
  "status": "celeb_annotations_running"
}
```

### `GET /relationship-app/onboarding-preview/:previewId/celeb-matches?claimToken=...`

Returns the current status for preview-scoped celebrity matches and annotations and, when ready, the stored bank.

### Service-Level Gender Filter

The underlying bank-builder service supports an optional celebrity gender filter:
- `all` (default)
- `male`
- `female`

Current state:
- This filter exists at the service layer today.
- It is not yet exposed as a public HTTP query/body parameter on the read endpoint or creation endpoints.
- If the app later needs gender-scoped banks, the stored-bank model should likely include the filter used to generate that bank.

## Relationship-App Romantic Analysis APIs

### `GET /relationship-app/me`

Returns the signed-in relationship-app account user plus their current romantic summary artifacts.

Response body includes:

```json
{
  "success": true,
  "userId": "subjectId",
  "overview": "Romance-focused overview text",
  "romanticProfileBlurb": "Short image-first romantic profile blurb",
  "referencedCodes": ["Pp-...", "A-..."],
  "celebAspectBank": { "...": "bank payload" },
  "status": "relationship_profile_loaded"
}
```

Notes:
- Reads prefer `interpretation.relationshipApp.romanticOverview`, `romanticProfileBlurb`, and `romanticReferencedCodes`.
- Older dev records stored in `basicAnalysis.romantic*` are still supported as a fallback.

### `GET /relationship-app/users/:userId/entitlements`

Returns the relationship-app-only billing summary for the signed-in relationship-app user.

Typical response:

```json
{
  "success": true,
  "appDomain": "relationship-app",
  "billingSystem": "relationship-app",
  "plan": "free",
  "planActiveUntil": null,
  "isSubscriptionActive": false,
  "hasEverSubscribed": false,
  "credits": {
    "total": 10,
    "monthly": 10,
    "pack": 0,
    "monthlyLimit": 10,
    "resetDate": null
  },
  "bootstrapSource": "classic_snapshot"
}
```

Notes:
- This endpoint reads only from relationship-app billing storage.
- On first access, the relationship-app balance is initialized from the current shared credit snapshot so existing dev users do not get stranded at zero.

### `POST /relationship-app/enhanced-relationship-analysis`

Creates a relationship overview/cluster analysis and charges the relationship-app balance.

Notes:
- This is the relationship-app-specific route for relationship creation/overview.
- Billing uses relationship-app entitlements and transactions.

### `POST /relationship-app/workflow/relationship/start`

Starts the full relationship analysis workflow and charges the relationship-app balance.

Notes:
- This is the relationship-app-specific route for full relationship analysis unlock/start.
- Billing uses relationship-app entitlements and transactions.

### `POST /relationship-app/relationships/:compositeChartId/enhanced-chat`

Runs relationship chat and charges the relationship-app balance per question.

Notes:
- This is the relationship-app-specific route for relationship chat.
- Billing uses relationship-app entitlements and transactions.

### `GET /relationship-app/subjects/:userId/romantic-analysis`

Returns the full relationship-app-only romantic report for an owned subject.

Typical response:

```json
{
  "success": true,
  "userId": "subjectId",
  "romanticAnalysis": {
    "reportType": "partnerships-romance",
    "categoryKey": "PARTNERSHIPS",
    "categoryName": "Partnerships & Romance",
    "overview": "Long-form romantic overview",
    "tensionFlow": null,
    "subtopics": {
      "...": "category subtopics"
    },
    "synthesis": "Closing synthesis",
    "dataRichness": 0.82,
    "generatedAt": "2026-04-19T14:45:00.000Z",
    "sourceEngine": "broad-category-analysis",
    "sourceCategoryKey": "PARTNERSHIPS",
    "analysisMetadata": {
      "success": true,
      "executionSummary": { "...": "engine summary" }
    },
    "userId": "subjectId"
  }
}
```

Notes:
- Reads prefer `interpretation.relationshipApp.partnershipsReport`.
- Older dev records stored at `interpretation.romanticAnalysis` are still supported as a fallback.

### `POST /relationship-app/subjects/:userId/romantic-analysis/generate`

Generates the full relationship-app-only romantic report for an owned subject and stores it under `interpretation.relationshipApp.partnershipsReport`.

Request body:

```json
{}
```

Typical response:

```json
{
  "success": true,
  "userId": "subjectId",
  "romanticAnalysis": {
    "reportType": "partnerships-romance",
    "categoryKey": "PARTNERSHIPS",
    "...": "same payload as the GET response"
  }
}
```

## Relationship Analysis APIs Available Today

These are not relationship-app-specific, but the mobile app can use them as-is today.

### `POST /enhanced-relationship-analysis`

Creates a composite relationship record and returns immediate cluster-scored relationship analysis with a generated relationship overview.

Request body:

```json
{
  "userIdA": "subjectIdA",
  "userIdB": "subjectIdB",
  "ownerUserId": "ownerSubjectId",
  "celebRelationship": false
}
```

Required:
- `userIdA`
- `userIdB`

Optional:
- `ownerUserId`
- `celebRelationship`

Behavior:
- Fetches both subjects
- Requires both to have `birthChart.planets`
- Generates synastry aspects, synastry house placements, and composite chart
- Scores the relationship into 5 clusters
- Generates an `initialOverview`
- Saves a `composite_chart` plus relationship analysis record
- Deducts `CREDIT_COSTS.RELATIONSHIP_OVERVIEW` unless exempted by admin-celebrity path

Response body:

```json
{
  "success": true,
  "compositeChartId": "relationshipId",
  "creditsDeducted": 5,
  "userA": { "id": "subjectIdA", "name": "Edward" },
  "userB": { "id": "subjectIdB", "name": "Angelina" },
  "clusters": {
    "Harmony": { "...": "cluster metrics" },
    "Passion": { "...": "cluster metrics" },
    "Connection": { "...": "cluster metrics" },
    "Stability": { "...": "cluster metrics" },
    "Growth": { "...": "cluster metrics" }
  },
  "overall": { "...": "overall relationship metrics" },
  "scoredItems": [{ "...": "scored relationship item" }],
  "initialOverview": "Relationship overview text",
  "keyAspects": {
    "overview": {
      "codes": ["SynA-...", "CompA-..."]
    }
  },
  "tensionFlowAnalysis": { "...": "tension flow output" },
  "compositeChart": { "...": "composite chart data" },
  "synastryAspects": [{ "...": "synastry aspect" }],
  "synastryHousePlacements": [{ "...": "house placement" }],
  "status": "scores_calculated",
  "metadata": {
    "workflowType": "direct-cluster-scoring",
    "initialOverviewGenerated": true
  }
}
```

### `POST /workflow/relationship/start`

Starts the full relationship workflow. This can either:
- analyze an existing `compositeChartId`, or
- create the relationship first from `userIdA + userIdB` and then start the workflow

Request body:

```json
{
  "userIdA": "subjectIdA",
  "userIdB": "subjectIdB",
  "ownerUserId": "ownerSubjectId",
  "immediate": true
}
```

or

```json
{
  "compositeChartId": "relationshipId",
  "ownerUserId": "ownerSubjectId",
  "immediate": true
}
```

Response body:

```json
{
  "success": true,
  "message": "Relationship workflow started successfully via Step Functions",
  "workflowId": "relationshipId",
  "executionArn": "arn:aws:states:...",
  "executionName": "relationshipId-...",
  "status": "RUNNING",
  "startedAt": "2026-04-05T...",
  "compositeChartId": "relationshipId",
  "userIdA": "subjectIdA",
  "userIdB": "subjectIdB",
  "mode": "immediate",
  "creditsDeducted": 15
}
```

Notes:
- Requires auth
- Deducts `CREDIT_COSTS.FULL_RELATIONSHIP_ANALYSIS`
- Uses Step Functions if enabled, otherwise local workflow fallback

### `POST /workflow/relationship/status`

Checks status of the relationship workflow.

Request body:

```json
{
  "compositeChartId": "relationshipId"
}
```

or

```json
{
  "workflowId": "relationshipId"
}
```

Step Functions-style response shape:

```json
{
  "success": true,
  "workflowId": "relationshipId",
  "compositeChartId": "relationshipId",
  "status": "in_progress",
  "completed": false,
  "phase": "running",
  "stepFunctionStatus": "running",
  "startedAt": "2026-04-05T...",
  "completedAt": null,
  "executionArn": "arn:aws:states:...",
  "message": "Relationship analysis in progress."
}
```

Local fallback response shape includes:
- `workflowStatus`
- `analysisData`
- `jobs`
- `workflowBreakdown`
- `debug`

### `POST /workflow/relationship/resume`

Resumes a paused workflow.

Request body:

```json
{
  "compositeChartId": "relationshipId"
}
```

or

```json
{
  "workflowId": "relationshipId"
}
```

Response body:

```json
{
  "success": true,
  "message": "Relationship workflow resumed",
  "workflowId": "relationshipId",
  "compositeChartId": "relationshipId",
  "executionArn": "arn:aws:states:...",
  "mode": "step-functions"
}
```

## Relationship Chat APIs Available Today

### `POST /relationships/:compositeChartId/enhanced-chat`

Authenticated relationship chat over saved relationship analysis.

Route params:
- `compositeChartId`

Expected request body varies by mode, but typically includes:

```json
{
  "query": "Why does this relationship feel emotionally intense?",
  "mode": "chat"
}
```

Known modes:
- `chat`
- `hybrid`
- `custom`

Response body includes:

```json
{
  "success": true,
  "answer": "Cleaned relationship chat answer",
  "referencedCodes": ["SynA-...", "CompA-..."],
  "chatHistoryId": "..."
}
```

### `GET /relationships/:compositeChartId/chat-history`

Authenticated fetch of saved relationship chat history.

## Current Backend Behavior Notes

- Romantic subject creation stores the returned romantic overview internally in a separate romantic field, but the API contract exposes it simply as `overview`.
- Relationship analysis currently still uses the shared relationship controllers and workflows.
- Missing natal vector context in relationship workflows is already tolerated; the pipeline continues with fallback text if nothing is retrieved.
- The relationship analysis core is still chart-data-driven, not hard-blocked on a full natal-analysis product.

## Gaps and Open Questions

### 1. No relationship-app-specific relationship endpoints yet

Current state:
- The mobile app would still call the shared endpoints:
  - `/enhanced-relationship-analysis`
  - `/workflow/relationship/start`
  - `/workflow/relationship/status`
  - `/workflow/relationship/resume`
  - relationship chat endpoints

Gap:
- There is no explicit `relationship-app` relationship-analysis API contract yet.

Impact:
- Mobile can use the current endpoints, but the product boundary is implicit rather than explicit.

### 2. No romantic email-validation creation variants

Implemented:
- `createUserRomantic`
- `createUserUnknownTimeRomantic`

Missing:
- `createUserRomanticEmailValidation`
- `createUserUnknownTimeRomanticEmailValidation`

Impact:
- If the mobile app wants the same email validation behavior as classic signup, dedicated romantic variants are not yet present.

### 3. Guest subjects are not app-domain partitioned

Account-self subjects are partitioned by `appDomain`.

Guest subjects currently are not saved with an `appDomain` in the subject record.

Impact:
- This may be fine operationally because guest subjects are owner-scoped, but it means app-domain separation is currently stronger for account-self than for guest subjects.

### 4. No dedicated relationship-app “full natal analysis” API/workflow yet

Current state:
- Romantic short overview creation exists
- Romantic full natal analysis does not yet exist as a separate workflow/API product

Impact:
- Relationship app has creation coverage, but not yet a defined romance-only full subject-analysis product.

### 5. Relationship workflow still uses shared prompts and optional natal context retrieval

Current state:
- Shared relationship workflow is used for both apps
- Missing natal context is tolerated already

Impact:
- This is acceptable short-term
- If the mobile app later needs intentionally different relationship tone/structure, a product-specific branch will still need to be defined

### 6. Analysis/fetch endpoints for romantic subjects are not yet specialized

Current state:
- Romantic creation endpoints return `overview` correctly
- Existing broader analysis fetch endpoints are still classic-oriented

Impact:
- The mobile app can create romantic subjects now, but follow-on analysis APIs are not yet fully formalized as a relationship-app-specific surface

## Recommended Near-Term API Plan

For the mobile app, the minimal workable API set today is:

- Subject creation
  - `POST /createUserRomantic`
  - `POST /createUserUnknownTimeRomantic`
  - `POST /createGuestSubjectRomantic`
  - `POST /createGuestSubjectUnknownTimeRomantic`

- Relationship creation and immediate analysis
  - `POST /enhanced-relationship-analysis`

- Full relationship workflow
  - `POST /workflow/relationship/start`
  - `POST /workflow/relationship/status`
  - `POST /workflow/relationship/resume`

- Relationship chat
  - `POST /relationships/:compositeChartId/enhanced-chat`
  - `GET /relationships/:compositeChartId/chat-history`

If the relationship app needs a cleaner dedicated product boundary, the next likely additions are:
- romantic email-validation signup variants
- dedicated romantic full-subject-analysis API/workflow
- explicit relationship-app relationship-analysis contract or endpoint aliases
