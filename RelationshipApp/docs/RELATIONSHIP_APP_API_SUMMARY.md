# Relationship App API Summary

Detailed staged onboarding documentation now lives in [RELATIONSHIP_APP_ONBOARDING_API_GUIDE.md](./RELATIONSHIP_APP_ONBOARDING_API_GUIDE.md).

This document summarizes the API surface currently relevant to the relationship-focused mobile app as of April 26, 2026.

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
- Relationship analysis: uses the shared scoring pipeline for pairwise synastry/composite analysis, with relationship-app-specific full-analysis workflow output stored separately from classic output

The relationship app now has its own dedicated endpoint namespace for user-centered romantic analysis:
- `GET /relationship-app/me`
- `GET /relationship-app/discover/collections`
- `GET /relationship-app/users/:userId/entitlements`
- `POST /relationship-app/users/:userId/ask-iris`
- `POST /relationship-app/subjects/:userId/ask-iris`
- `GET /relationship-app/celebs/:userId/profile`
- `POST /relationship-app/enhanced-relationship-analysis`
- `POST /relationship-app/workflow/relationship/start`
- `POST /relationship-app/workflow/relationship/status`
- `POST /relationship-app/workflow/relationship/resume`
- `POST /relationship-app/relationships/:compositeChartId/ask-iris`
- `POST /relationship-app/relationships/:compositeChartId/enhanced-chat`
- `GET /relationship-app/relationships/:compositeChartId/analysis`
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
- `POST /relationship-app/subjects/:subjectId/profile-photo/presigned-url`
  - Returns a presigned S3 upload URL for the authenticated relationship-app user’s own subject or owned guest subject
- `POST /relationship-app/subjects/:subjectId/profile-photo/confirm`
  - Confirms a completed direct-to-S3 upload and persists `profilePhotoUrl` / `profilePhotoKey`
- `DELETE /relationship-app/subjects/:subjectId/profile-photo`
  - Deletes the current profile photo for the authenticated relationship-app user’s own subject or owned guest subject

### Celebrity APIs

- `POST /getCelebs`
  - Returns celebrity subjects
  - Also returns `romanticProfileBlurb`, `romanticOverview`, and `romanticReferencedCodes` directly on each celeb item for list rendering
- `GET /relationship-app/discover/collections`
  - Public read endpoint for Discover tab editorial collections
  - Returns exactly 2 weekly-rotating collections, each populated with up to 8 matching celebrity cards
  - Does not require authentication and can be used by relationship-app or legacy landing-page surfaces
- `GET /relationship-app/users/:userId/discover/charts-like-yours`
  - Authenticated personalized Discover endpoint
  - Returns a weekly lead placement plus up to 8 celebrity charts pre-ranked by total placement overlap
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
  - Generates synastry/composite data, scores the 5 clusters, generates the initial relationship overview, and saves the relationship
  - This does **not** generate the full per-cluster writeups stored under `relationshipAppCompleteAnalysis`
- `POST /relationship-app/workflow/relationship/start`
  - Async full relationship analysis workflow for an existing saved relationship
  - Starts the relationship-app compact 5-cluster workflow
  - This is the path that generates the per-cluster full analysis stored under `relationshipAppCompleteAnalysis`
- `POST /relationship-app/workflow/relationship/status`
  - Polls relationship-app compact workflow status
- `POST /relationship-app/workflow/relationship/resume`
  - Resumes a paused/incomplete relationship-app compact workflow when applicable
- `GET /relationship-app/relationships/:compositeChartId/analysis`
  - Authenticated relationship-app read endpoint for a saved relationship analysis payload
  - Use this for private/owned relationship reads in the relationship app
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
- Start subject profile photo upload: `POST /relationship-app/subjects/:subjectId/profile-photo/presigned-url`
- Confirm subject profile photo upload: `POST /relationship-app/subjects/:subjectId/profile-photo/confirm`
- Delete subject profile photo: `DELETE /relationship-app/subjects/:subjectId/profile-photo`
- List celebrities for browse cards: `POST /getCelebs`
- Read weekly Discover collections: `GET /relationship-app/discover/collections`
- Read personalized charts-like-yours carousel: `GET /relationship-app/users/:userId/discover/charts-like-yours`
- Read celebrity detail: `GET /relationship-app/celebs/:userId/profile`
- Read celebrity relationship cards: `POST /getCelebRelationships`
- Read celeb match bank for the signed-in user: `GET /users/:userId/relationship-app/celeb-aspect-bank`
- Create relationship and get initial scored overview immediately: `POST /relationship-app/enhanced-relationship-analysis`
- Start async relationship workflow: `POST /relationship-app/workflow/relationship/start`
- Poll async relationship workflow: `POST /relationship-app/workflow/relationship/status`
- Read owned relationship analysis: `GET /relationship-app/relationships/:compositeChartId/analysis`
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
- `GET /relationship-app/relationships/:compositeChartId/analysis`
  - Requires app auth via `requireAuth`
  - Relationship must belong to the authenticated user
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
- `POST /relationship-app/subjects/:subjectId/profile-photo/presigned-url`
  - Requires app auth via `requireAuth`
  - Subject must be the authenticated account-self or an owned guest subject
- `POST /relationship-app/subjects/:subjectId/profile-photo/confirm`
  - Requires app auth via `requireAuth`
  - Subject must be the authenticated account-self or an owned guest subject
- `DELETE /relationship-app/subjects/:subjectId/profile-photo`
  - Requires app auth via `requireAuth`
  - Subject must be the authenticated account-self or an owned guest subject
- `GET /users/:userId/relationship-app/celeb-aspect-bank`
  - Requires app auth via `requireAuth`
  - `userId` must match authenticated user
- `POST /enhanced-relationship-analysis`
  - Currently public-rate-limited, not auth-gated at route level
  - Billing/ownership is resolved in controller logic
- `POST /fetchRelationshipAnalysis`
  - Shared fetch route
  - Public for celebrity-to-celebrity relationships
  - Requires authenticated ownership for non-celebrity/private relationships
- `POST /workflow/relationship/start`
  - Requires app auth
- `POST /workflow/relationship/status`
  - Requires app auth
- `POST /workflow/relationship/resume`
  - Requires app auth
- `POST /relationship-app/workflow/relationship/status`
  - Requires app auth
- `POST /relationship-app/workflow/relationship/resume`
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

### `GET /relationship-app/users/:userId/discover/charts-like-yours`

Authenticated personalized Discover endpoint that returns celebrity charts sharing one rotating lead placement with the signed-in relationship-app user.

Auth:
- Requires `requireAuth`
- Route enforces `requireAuthenticatedUserParamMatch`
- Only valid for relationship-app account users (`kind=accountSelf`, `appDomain=relationship-app`)

Behavior:
- Week starts Monday in `America/New_York`
- `weekOf` is the Monday date string for the active week
- Weekly lead placement rotates in this order:
  - `venusSign`
  - `moonSign`
  - `marsSign`
  - `sunSign`
  - `risingSign`
- Celebrities must match the active lead placement exactly
- Results are ranked by total overlap count across `sunSign`, `moonSign`, `venusSign`, `marsSign`, and `risingSign`
- Ties are broken deterministically so the weekly response stays stable
- If the user is missing the current lead placement, or that placement produces fewer than `4` celeb matches, the backend falls forward to the next placement in the rotation
- Returns up to `8` celebrity cards
- Response is cached in memory for 1 hour per `userId + weekOf`

Response body:

```json
{
  "success": true,
  "weekOf": "2026-04-20",
  "matchedPlacement": {
    "field": "venusSign",
    "label": "Venus in Libra",
    "subtitle": "Celebs who share your Venus in Libra"
  },
  "celebs": [
    {
      "id": "celebritySubjectId",
      "firstName": "Ryan",
      "lastName": "Reynolds",
      "profilePhotoUrl": "https://...",
      "sharedPlacements": ["Venus in Libra", "Sun in Scorpio"],
      "overlapCount": 2,
      "romanticProfileBlurb": "Short frontend-friendly romantic blurb"
    }
  ]
}
```

Notes for clients:
- Treat `matchedPlacement` and `sharedPlacements` as already formatted display strings
- `sharedPlacements` is ordered with the current weekly lead placement first
- The client should render the response as-is and does not need to know the weekly placement rotation logic
- Cache key shape is `discover:charts-like-yours:user:{userId}:week:{weekOf}`

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
      "archetypeKey": "iron_and_honey",
      "archetypeLabel": "Iron & Honey",
      "archetypeBlurb": "Short relationship archetype summary",
      "archetype": {
        "version": "archetype-summary-v4-shape-family",
        "archetypeKey": "iron_and_honey",
        "label": "Iron & Honey",
        "blurb": "Short relationship archetype summary",
        "dominantClusters": ["Harmony", "Passion"],
        "supportClusters": ["Harmony"],
        "tensionClusters": [],
        "shape": "balanced",
        "tone": "magnetic",
        "shapeFamily": "Harmony+Passion / Growth low",
        "shapeKind": "ridge_missing",
        "magnitudeTier": "high",
        "modifiers": ["Magnetic", "Highly Active"],
        "meanScore": 74.2,
        "spread": 18.5,
        "weakestCluster": "Growth",
        "confidence": 0.93
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

### Relationship-App Subject Profile Photo Upload

These are the relationship-app-authenticated counterparts to the classic subject photo upload routes. They exist because relationship-app users authenticate against a separate Firebase project, so classic subject-photo routes will reject relationship-app tokens.

Supported subject types:
- The signed-in relationship-app account-self subject
- Guest subjects owned by the signed-in relationship-app user

Not supported:
- Celebrity/read-only subjects

### `POST /relationship-app/subjects/:subjectId/profile-photo/presigned-url`

Returns a short-lived presigned S3 PUT URL for a relationship-app-owned subject photo upload.

Request body:

```json
{
  "contentType": "image/jpeg"
}
```

Required:
- `contentType`

Allowed content types:
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

Notes:
- `image/jpg` is normalized to `image/jpeg`
- The uploaded bytes go directly to S3, not through the backend

Response body:

```json
{
  "success": true,
  "uploadUrl": "https://s3.amazonaws.com/...signed-put-url...",
  "photoKey": "subjectId/1767312000000.jpg",
  "expiresIn": 900,
  "instructions": "PUT the image bytes to uploadUrl with Content-Type header set to image/jpeg."
}
```

Errors:
- `401 INVALID_TOKEN`
- `403 FORBIDDEN`
- `404 SUBJECT_NOT_FOUND`
- `400 INVALID_SUBJECT_ID`
- `400 MISSING_CONTENT_TYPE`
- `400 INVALID_CONTENT_TYPE`

### `POST /relationship-app/subjects/:subjectId/profile-photo/confirm`

Confirms a successful direct-to-S3 upload, verifies the object exists, and persists the resulting `profilePhotoUrl` and `profilePhotoKey` onto the subject record.

Request body:

```json
{
  "photoKey": "subjectId/1767312000000.jpg"
}
```

Behavior:
- `photoKey` must be present
- `photoKey` must belong to the same `:subjectId` key prefix
- Backend verifies the object exists in S3 before saving
- Previous `profilePhotoKey` is deleted from S3 when possible

Response body:

```json
{
  "success": true,
  "profilePhotoUrl": "https://stellium-profile-photos-dev.s3.amazonaws.com/subjectId/1767312000000.jpg",
  "profilePhotoKey": "subjectId/1767312000000.jpg",
  "updatedAt": "2026-04-24T00:00:00.000Z"
}
```

Errors:
- `401 INVALID_TOKEN`
- `403 FORBIDDEN`
- `404 SUBJECT_NOT_FOUND`
- `400 INVALID_SUBJECT_ID`
- `400 MISSING_PHOTO_KEY`
- `400 KEY_MISMATCH`
- `400 UPLOAD_NOT_FOUND`

### `DELETE /relationship-app/subjects/:subjectId/profile-photo`

Deletes the current profile photo for an authenticated relationship-app-owned subject.

Response body:

```json
{
  "success": true,
  "message": "Profile photo deleted successfully",
  "deletedAt": "2026-04-24T00:00:00.000Z"
}
```

Errors:
- `401 INVALID_TOKEN`
- `403 FORBIDDEN`
- `404 SUBJECT_NOT_FOUND`
- `404 PROFILE_PHOTO_NOT_FOUND`

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

### `GET /relationship-app/api/credits/transactions`

Returns relationship-app credit history from the relationship-app ledger.

Important:
- This reads from `relationship_credit_transactions`, not the shared classic `credit_transactions` collection.
- Relationship-app surfaces should use this endpoint for transaction history so the debit rows match the relationship-app balance and costs.

Typical response:

```json
{
  "success": true,
  "appDomain": "relationship-app",
  "transactions": [
    {
      "id": "txn-id",
      "userId": "subjectId",
      "timestamp": "2026-04-25T17:21:00.000Z",
      "type": "deduction",
      "amount": -60,
      "description": "Full relationship analysis workflow",
      "balance_after": 16,
      "balance_before": 76,
      "metadata": {
        "appDomain": "relationship-app",
        "action": "FULL_RELATIONSHIP_ANALYSIS",
        "compositeChartId": "relationshipId"
      }
    }
  ],
  "count": 1
}
```

Notes:
- Auth uses the current relationship-app Firebase user; there is no `:userId` path parameter.
- The JSON shape is intentionally close to the shared `/api/credits/transactions` response, but the data source is relationship-app-specific.

### `POST /relationship-app/enhanced-relationship-analysis`

Creates a saved pairwise relationship record and returns the immediate scored shell for the UI.

Auth:
- Requires `requireAuth`

Billing:
- Charges the relationship-app balance
- Response includes `billingSystem`, which is currently expected to be `"relationship-app"` on this route

This endpoint does:
- create or reuse the composite relationship
- generate `synastryAspects`, `synastryHousePlacements`, and `compositeChart`
- score the 5 relationship clusters
- generate `initialOverview`
- save the relationship analysis shell

This endpoint does **not** do:
- it does **not** generate full per-cluster panels under `relationshipAppCompleteAnalysis`
- it does **not** complete the full workflow

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

Success response:

```json
{
  "success": true,
  "compositeChartId": "relationshipId",
  "creditsDeducted": 5,
  "billingSystem": "relationship-app",
  "userA": {
    "id": "subjectIdA",
    "name": "Person A"
  },
  "userB": {
    "id": "subjectIdB",
    "name": "Person B"
  },
  "clusters": {
    "Harmony": {
      "score": 79,
      "rawScore": 12.4,
      "hasContributions": true,
      "supportPct": 62,
      "challengePct": 25,
      "totalMagnitude": 18.6,
      "polarityIntensity": 70,
      "heatPct": 58,
      "activityPct": 67,
      "sparkElements": 3,
      "quadrant": "Dynamic",
      "keystoneAspects": []
    },
    "Passion": {},
    "Connection": {},
    "Stability": {},
    "Growth": {}
  },
  "overall": {
    "score": 82,
    "formula": "Harmony(25%) + Passion(20%) + Connection(20%) + Stability(25%) + Growth(10%)",
    "dominantCluster": "Passion",
    "challengeCluster": "Stability",
    "profile": "Deprecated legacy summary string",
    "strengthClusters": ["Harmony", "Passion", "Growth"],
    "growthClusters": ["Stability"],
    "tier": "Flourishing",
    "quadrantAnalytics": {
      "distribution": {
        "Easy-going": 1,
        "Dynamic": 3,
        "Hot-button": 1,
        "Flat": 0
      },
      "entropy": 1.2,
      "dominantQuadrant": "Dynamic",
      "isExtreme": false,
      "uniformity": "Moderate"
    },
    "summary": {
      "version": "archetype-summary-v4-shape-family",
      "archetypeKey": "forge",
      "label": "Forge",
      "blurb": "Short overall archetype blurb",
      "dominantClusters": ["Passion", "Growth"],
      "supportClusters": ["Harmony"],
      "tensionClusters": ["Stability"],
      "shape": "balanced",
      "tone": "magnetic",
      "shapeFamily": "Passion+Growth / Stability low",
      "shapeKind": "ridge_missing",
      "magnitudeTier": "high",
      "modifiers": ["Magnetic", "Highly Active"],
      "meanScore": 68.4,
      "spread": 31.2,
      "weakestCluster": "Stability",
      "confidence": 0.82
    },
    "timeSensitivity": {
      "version": "v1",
      "method": "one-unknown-4-point-sweep",
      "level": "stable",
      "sampledPartner": "userA",
      "sampleTimes": ["06:00", "12:00", "18:00", "23:59"],
      "sampleScores": [79, 81, 82, 80],
      "minScore": 79,
      "maxScore": 82,
      "medianScore": 80.5,
      "spread": 3,
      "unknownTimeScore": 80,
      "unknownTimeBiasVsMedian": -0.5
    }
  },
  "scoredItems": [
    {
      "id": "itemId",
      "source": "synastry",
      "type": "aspect",
      "description": "Example aspect description",
      "clusterContributions": [],
      "code": "SynA-SunTrineMoon",
      "overallCentrality": 0.63,
      "maxStarRating": 4
    }
  ],
  "initialOverview": "Short overview text used immediately after creation.",
  "keyAspects": {
    "overview": {
      "codes": ["SynA-...", "CompA-..."]
    }
  },
  "tensionFlowAnalysis": {
    "supportDensity": 0.421,
    "challengeDensity": 0.167,
    "polarityRatio": 2.51,
    "quadrant": "Dynamic",
    "totalAspects": 18,
    "supportAspects": 11,
    "challengeAspects": 4,
    "keystoneAspects": [],
    "networkMetrics": {
      "totalPossibleConnections": 36,
      "actualConnections": 18,
      "connectionDensity": 0.5,
      "averageScore": 2.14
    }
  },
  "compositeChart": {
    "...": "composite chart payload"
  },
  "synastryAspects": [
    {
      "...": "synastry aspect payload"
    }
  ],
  "synastryHousePlacements": [
    {
      "...": "house placement payload"
    }
  ],
  "status": "scores_calculated",
  "metadata": {
    "processingTime": 2147,
    "clustersAnalyzed": 5,
    "totalScoredItems": 43,
    "workflowType": "direct-cluster-scoring",
    "version": "cluster-system-v1",
    "isCelebrityRelationship": false,
    "adminCelebrityBypass": false,
    "initialOverviewGenerated": true
  }
}
```

Error responses currently used by this handler:
- `400` if `userIdA` or `userIdB` is missing
- `404` if either subject does not exist
- `400` if either subject is missing `birthChart.planets`
- `400` if a required `ownerUserId` cannot be inferred for a non-account relationship
- `402` if the caller lacks enough credits

### `POST /relationship-app/workflow/relationship/start`

Starts the relationship-app full pairwise relationship workflow.

Auth:
- Requires `requireAuth`

Billing:
- Charges the relationship-app balance

This endpoint starts the relationship-app compact 5-cluster workflow (`relationship-app-cluster`). It generates `relationshipAppCompleteAnalysis`; the relationship-app read endpoint exposes that same payload through `completeAnalysis` for frontend compatibility.

Preferred request mode:
- analyze-existing: send `compositeChartId` from a successful `POST /relationship-app/enhanced-relationship-analysis`

The direct relationship creation call should run first. The workflow route supports resolving participants from `compositeChartId`; clients should not use this as the primary relationship-creation endpoint.

The deployed environment currently uses the Step Functions implementation. If Step Functions is disabled, the same route falls back to local cluster processing with the same relationship-app compact output style. The response shapes differ slightly; both are documented below.

Typical request body:

```json
{
  "compositeChartId": "relationshipId",
  "ownerUserId": "ownerSubjectId",
  "immediate": true
}
```

Current Step Functions response shape:

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
  "workflowType": "relationship-app-cluster",
  "mode": "immediate",
  "creditsDeducted": 60,
  "billingSystem": "relationship-app"
}
```

Billing note:
- The current server-enforced cost for this endpoint is `CREDIT_COSTS.FULL_RELATIONSHIP_ANALYSIS = 60`.
- Frontends should not hardcode older values like `3` or `15`.

Legacy local-fallback response shape:

```json
{
  "success": true,
  "message": "Relationship workflow started",
  "workflowId": "relationshipId",
  "workflowType": "relationship-app-cluster"
}
```

Frontend guidance:
- use this endpoint to start compact full-analysis generation
- do **not** use its response as the report payload
- after completion, read the report from `GET /relationship-app/relationships/:compositeChartId/analysis`
- relationship-app compact panel targets:
  - support panel: one paragraph, 3-4 sentences
  - challenge panel: one paragraph, 3-4 sentences
  - synthesis panel: two short paragraphs, 5-6 sentences total

### `POST /getUserCompositeCharts`

Lists saved composite relationships for the authenticated owner.

Auth:
- Requires `requireAuth`
- Route middleware requires `ownerUserId` in the body to match the authenticated user

Request body:

```json
{
  "ownerUserId": "ownerSubjectId"
}
```

Success response:
- returns a raw array, not an object wrapper

Typical response item:

```json
[
  {
    "_id": "relationshipId",
    "ownerUserId": "ownerSubjectId",
    "userA_id": "subjectIdA",
    "userB_id": "subjectIdB",
    "userA_name": "Person A",
    "userB_name": "Person B",
    "userA_dateOfBirth": "1990-01-01T00:00:00.000Z",
    "userB_dateOfBirth": "1992-02-02T00:00:00.000Z",
    "userA_profilePhotoUrl": "https://...",
    "userA_photoUrl": "https://...",
    "userB_profilePhotoUrl": "https://...",
    "userB_photoUrl": "https://...",
    "synastryAspects": [
      {
        "...": "synastry aspect payload"
      }
    ],
    "synastryHousePlacements": [
      {
        "...": "house placement payload"
      }
    ],
    "compositeChart": {
      "...": "composite chart payload"
    },
    "isCelebrityRelationship": false,
    "createdAt": "2026-04-22T12:34:56.000Z",
    "updatedAt": "2026-04-22T12:35:03.000Z",
    "relationshipAnalysisStatus": {
      "level": "scores",
      "completionPercentage": 30,
      "hasAnalysis": true,
      "hasCompleteAnalysis": false,
      "workflowStatus": "relationship_created_with_scores",
      "isRunning": false,
      "overall": {
        "score": 82,
        "formula": "Harmony(25%) + Passion(20%) + Connection(20%) + Stability(25%) + Growth(10%)",
        "dominantCluster": "Passion",
        "challengeCluster": "Stability",
        "profile": "Deprecated legacy summary string",
        "strengthClusters": ["Harmony", "Passion", "Growth"],
        "growthClusters": ["Stability"],
        "tier": "Flourishing",
        "summary": {
          "...": "archetype summary"
        },
        "quadrantAnalytics": {
          "...": "quadrant analytics"
        }
      },
      "clusterScores": {
        "Harmony": 79,
        "Passion": 88,
        "Connection": 76,
        "Stability": 70,
        "Growth": 84
      },
      "hasInitialOverview": true,
      "tensionFlowQuadrant": "Dynamic"
    }
  }
]
```

`relationshipAnalysisStatus.level` currently resolves to:
- `"none"`: no analysis record exists
- `"scores"`: the relationship has scored data and maybe `initialOverview`, but full cluster panels are not fully complete
- `"complete"`: `completeAnalysis`, `relationshipAppCompleteAnalysis`, or `clusterAnalyses` exists and cluster scoring exists

Frontend guidance:
- this endpoint is the list/history endpoint
- use `relationshipAnalysisStatus` to determine whether to show:
  - not started
  - scores only
  - full analysis available
  - in-progress state
  - summary card cluster scores

### `GET /relationship-app/relationships/:compositeChartId/analysis`

Authenticated relationship-app read endpoint for a saved relationship analysis payload.

Route params:
- `compositeChartId`

Auth:
- Requires relationship-app auth
- Relationship must belong to the authenticated user

Typical request:

```http
GET /relationship-app/relationships/relationshipId/analysis
Authorization: Bearer <relationship-app-firebase-token>
```

Success response:
- returns the report object directly, not wrapped in `{ "success": true }`

Current response shape:

```json
{
  "v2Analysis": null,
  "v2AnalysisGeneratedAt": null,
  "dynamics": null,
  "clusterScoring": null,
  "completeAnalysis": {
    "Harmony": {
      "synastry": {
        "supportPanel": "Compact relationship-app support text",
        "challengePanel": "Compact relationship-app challenge text",
        "synthesisPanel": "Compact relationship-app synthesis text"
      },
      "composite": {
        "supportPanel": "Compact relationship-app support text",
        "challengePanel": "Compact relationship-app challenge text",
        "synthesisPanel": "Compact relationship-app synthesis text"
      },
      "keyAspects": {
        "synastry": {
          "codes": ["SynA-...", "SynP-..."],
          "synastryAspects": ["SynA-..."],
          "compositeAspects": [],
          "synastryPlacements": ["SynP-..."],
          "compositePlacements": []
        },
        "composite": {
          "codes": ["CompA-...", "CompP-..."],
          "synastryAspects": [],
          "compositeAspects": ["CompA-..."],
          "synastryPlacements": [],
          "compositePlacements": ["CompP-..."]
        }
      },
      "panelFormat": "6-panel",
      "workflowType": "relationship-app-compact-synastry-composite-support-challenge-synthesis",
      "analysisOutputStyle": "relationship-app-compact"
    }
  },
  "relationshipAppCompleteAnalysis": {
    "...": "same relationship-app compact analysis stored separately from classic completeAnalysis"
  },
  "overall": {
    "score": 82,
    "formula": "Harmony(25%) + Passion(20%) + Connection(20%) + Stability(25%) + Growth(10%)",
    "dominantCluster": "Passion",
    "keystoneAspects": [
      {
        "code": "SynA-...",
        "description": "Person A's Venus trine Person B's Mars",
        "primaryCluster": "Passion",
        "contributingClusters": ["Passion", "Harmony"]
      }
    ],
    "keystoneAspectAnnotations": {
      "byCode": {
        "SynA-...": {
          "code": "SynA-...",
          "title": "Venus-Mars trine - easy attraction",
          "sentence": "A short one-sentence annotation explaining why this relationship-wide keystone aspect matters.",
          "generatedBy": "llm",
          "version": "v1",
          "primaryCluster": "Passion",
          "contributingClusters": ["Passion", "Harmony"],
          "source": "synastry",
          "rank": 1
        }
      },
      "synastry": [
        {
          "code": "SynA-...",
          "title": "Venus-Mars trine - easy attraction",
          "sentence": "A short one-sentence annotation explaining why this relationship-wide keystone aspect matters.",
          "generatedBy": "llm",
          "version": "v1",
          "primaryCluster": "Passion",
          "contributingClusters": ["Passion", "Harmony"],
          "source": "synastry",
          "rank": 1
        }
      ],
      "composite": []
    },
    "challengeCluster": "Stability",
    "profile": "Deprecated legacy summary string",
    "strengthClusters": ["Harmony", "Passion", "Growth"],
    "growthClusters": ["Stability"],
    "tier": "Flourishing",
    "quadrantAnalytics": {
      "...": "quadrant analytics"
    },
    "summary": {
      "...": "archetype summary"
    },
    "timeSensitivity": {
      "...": "optional unknown-time stability info"
    }
  },
  "clusterAnalysis": {
    "clusters": {
      "Harmony": {
        "score": 79,
        "rawScore": 12.4,
        "hasContributions": true,
        "supportPct": 62,
        "challengePct": 25,
        "totalMagnitude": 18.6,
        "polarityIntensity": 70,
        "heatPct": 58,
        "activityPct": 67,
        "sparkElements": 3,
        "quadrant": "Dynamic",
        "keystoneAspects": []
      },
      "Passion": {},
      "Connection": {},
      "Stability": {},
      "Growth": {}
    },
    "scoredItems": [
      {
        "...": "scored relationship item"
      }
    ],
    "overall": {
      "...": "same overall object as above"
    },
    "version": "cluster-system-v1",
    "generatedAt": "2026-04-25T12:34:56.000Z",
    "generatedBy": "direct-api"
  },
  "initialOverview": "Short initial overview returned by the direct create endpoint",
  "analysis": null,
  "profileAnalysis": null,
  "workflowStatus": {
    "status": "completed",
    "isRunning": false
  },
  "tensionFlowAnalysis": {
    "supportDensity": 0.421,
    "challengeDensity": 0.167,
    "polarityRatio": 2.51,
    "quadrant": "Dynamic",
    "totalAspects": 18,
    "supportAspects": 11,
    "challengeAspects": 4,
    "keystoneAspects": [],
    "networkMetrics": {
      "totalPossibleConnections": 36,
      "actualConnections": 18,
      "connectionDensity": 0.5,
      "averageScore": 2.14
    }
  },
  "holisticOverview": null,
  "_fullData": {
    "v2Analysis": null,
    "v2Metrics": null,
    "v2AnalysisWorkflowType": null,
    "categoryScoreBreakdown": null,
    "clusterScoring": null,
    "completeAnalysis": {},
    "relationshipAppCompleteAnalysis": {},
    "overall": {},
    "clusterAnalysis": {},
    "clusterAnalyses": null,
    "initialOverview": "Short initial overview text",
    "holisticOverview": null,
    "profileAnalysis": null,
    "tensionFlowAnalysis": {},
    "categoryTensionFlowAnalysis": null,
    "tensionFlowAnalysisGeneratedAt": null,
    "debug": {
      "...": "debug and input summary"
    },
    "analysis": null,
    "relationshipAnalysis": null,
    "vectorizationStatus": {
      "...": "workflow/vectorization status"
    },
    "relationshipAppVectorizationStatus": {
      "...": "relationship-app compact workflow/vectorization status"
    },
    "workflowStatus": {
      "...": "stored workflow status"
    },
    "_id": "analysisRecordId"
  }
}
```

`profileAnalysis` is deprecated. It is a legacy Heart/Body/Mind/Life/Soul profiling payload retained only for backward compatibility. Relationship-app clients should ignore it and use `overall.summary`, `clusterAnalysis`, and `completeAnalysis` instead.

The frontend should treat these fields as primary:
- `completeAnalysis`: relationship-app compact full cluster report on `GET /relationship-app/relationships/:compositeChartId/analysis`; this is populated from `relationshipAppCompleteAnalysis` when available
- `relationshipAppCompleteAnalysis`: persisted relationship-app compact full-analysis field; useful for debugging or clients that need to distinguish app-specific output from classic output
- `clusterAnalysis`: scored metrics used for score chips, bars, and drilldown metadata
- `overall`: top-level relationship score and archetype summary
- `initialOverview`: short overview available before the full workflow completes
- `workflowStatus`: saved workflow state
- `tensionFlowAnalysis`: support/challenge quadrant summary

Current error responses:
- `400` if `compositeChartId` is missing
- `401` if the relationship is private and the request has no valid auth
- `403` if the authenticated user does not own the relationship
- `404` if the relationship record or the analysis record does not exist

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

Classic/shared direct-create route.

This route returns the same create payload shape as `POST /relationship-app/enhanced-relationship-analysis`, but it is not the preferred relationship-app contract.

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
  "creditsDeducted": 60
}
```

Notes:
- The relationship-app should use `POST /relationship-app/workflow/relationship/start`
- The shared route still exists for classic compatibility
- This shared workflow generates classic per-cluster output saved under `completeAnalysis`; relationship-app compact output is generated by `/relationship-app/workflow/relationship/start` and persisted under `relationshipAppCompleteAnalysis`
- The current server-enforced cost is `CREDIT_COSTS.FULL_RELATIONSHIP_ANALYSIS = 60`

### `POST /relationship-app/workflow/relationship/status`

Polls relationship-app compact workflow state only. This is not the canonical report-read endpoint.

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

Current deployed Step Functions response shape:

```json
{
  "success": true,
  "workflowId": "relationshipId",
  "compositeChartId": "relationshipId",
  "workflowType": "relationship-app-cluster",
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

Possible `status` values from the Step Functions path:
- `"in_progress"`
- `"completed"`
- `"failed"`
- `"paused"`
- `"not_started"`
- `"completed_with_failures"`

Local fallback response shape when Step Functions is disabled:

```json
{
  "success": true,
  "workflowStatus": {
    "status": "completed",
    "progress": {
      "completed": 11,
      "total": 11,
      "percentage": 100
    }
  },
  "analysisData": {
    "...": "saved relationship analysis payload"
  },
  "jobs": {
    "clusterScoring": {
      "needsGeneration": false
    },
    "clusters": {
      "Harmony": {
        "needsGeneration": false,
        "needsVectorization": false
      },
      "Passion": {},
      "Connection": {},
      "Stability": {},
      "Growth": {}
    }
  },
  "workflowBreakdown": {
    "needsGeneration": [],
    "needsVectorization": [],
    "completed": [
      "cluster-scoring-generation",
      "cluster-Harmony-generation"
    ],
    "totalNeedsGeneration": 0,
    "totalNeedsVectorization": 0,
    "totalCompleted": 11
  },
  "debug": {
    "isWorkflowComplete": true,
    "completedWithFailures": false,
    "remainingTasks": 0,
    "totalTasks": 11,
    "completedTasks": 11,
    "isCurrentlyRunning": false,
    "workflowStatus": {
      "...": "stored workflow status"
    }
  }
}
```

Important:
- `POST /relationship-app/workflow/relationship/status` is a workflow-status endpoint, not the canonical content-read endpoint for the saved relationship report.
- For relationship-app private/owned reads, the canonical fetch endpoint is `GET /relationship-app/relationships/:compositeChartId/analysis`.
- The shared fallback endpoint remains `POST /fetchRelationshipAnalysis`.
- Frontend should build against the Step Functions shape for polling state and use the fetch endpoint for the actual report body.

### `POST /fetchRelationshipAnalysis`

Shared fetch endpoint for the saved relationship analysis payload for a `compositeChartId`.

Use cases:
- classic app compatibility
- public celebrity-to-celebrity relationship reads
- legacy/shared fetch integration

Auth behavior:
- Public for celebrity-to-celebrity relationships
- Authenticated + owner-scoped for non-celebrity/private relationships
- Relationship-app clients should prefer `GET /relationship-app/relationships/:compositeChartId/analysis` for private reads

Request body:

```json
{
  "compositeChartId": "relationshipId"
}
```

Current response body:
- identical to `GET /relationship-app/relationships/:compositeChartId/analysis`
- same top-level fields
- same `completeAnalysis`, `relationshipAppCompleteAnalysis`, `clusterAnalysis`, `overall`, `initialOverview`, `workflowStatus`, `tensionFlowAnalysis`, and `_fullData` structure

Read semantics:
- If the relationship was only created through `POST /relationship-app/enhanced-relationship-analysis`, expect scored data plus `initialOverview`, but `relationshipAppCompleteAnalysis` / `completeAnalysis` may still be `null` or partial.
- After the relationship-app workflow completes, `completeAnalysis` is the field the mobile app should read for the compact full per-cluster report.
- Internally, relationship-app full analysis is persisted under `relationshipAppCompleteAnalysis` to avoid collisions with classic `completeAnalysis`.
- Relationship-app overview scoring may include `clusterAnalysis.overall.keystoneAspectAnnotations`, a compact LLM-generated annotation set for the relationship-wide overall keystone aspects. Use `byCode` for direct lookup from an aspect code, or `synastry` / `composite` arrays for source-grouped display.
- This route is now public only for celebrity-to-celebrity relationships.
- For non-celebrity/private relationships, it requires auth plus ownership.
- Relationship-app clients should prefer `GET /relationship-app/relationships/:compositeChartId/analysis` for private reads.

### `POST /relationship-app/workflow/relationship/resume`

Resumes a paused or incomplete relationship-app compact workflow.

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

Current Step Functions response:

```json
{
  "success": true,
  "message": "Relationship workflow resumed",
  "workflowId": "relationshipId",
  "compositeChartId": "relationshipId",
  "executionArn": "arn:aws:states:...",
  "workflowType": "relationship-app-cluster",
  "mode": "step-functions"
}
```

Legacy local-fallback behavior:
- falls through to the old local workflow starter
- in that mode, the route behaves like `startRelationshipWorkflow`

## Pairwise Relationship Frontend Contract

If the mobile app is building pairwise relationship UI today, the intended contract is:

1. Create or refresh the scored shell:
   - `POST /relationship-app/enhanced-relationship-analysis`
2. Read relationship cards/history:
   - `POST /getUserCompositeCharts`
3. Kick off compact full-analysis generation:
   - `POST /relationship-app/workflow/relationship/start`
4. Poll state:
   - `POST /relationship-app/workflow/relationship/status`
5. Read the saved full report:
   - `GET /relationship-app/relationships/:compositeChartId/analysis`

The UI should treat these fields as canonical:
- list/history cards: `relationshipAnalysisStatus`
- short immediate relationship summary: `initialOverview`
- score bars, cluster chips, and overall score: `clusterAnalysis` and `overall`
- compact full relationship report: `completeAnalysis` from relationship-app fetch, backed by `relationshipAppCompleteAnalysis`
- lightweight workflow state: `workflow/status`

The mobile app should **not** rely on:
- `POST /relationship-app/workflow/relationship/status` as the source of truth for report content
- the shared `POST /fetchRelationshipAnalysis` for authenticated private reads in the relationship app

## Real Dev Captures

The following examples were captured from the deployed `dev` backend on April 25, 2026. These are included so the frontend can build against real payloads, not just controller-derived summaries.

### 1. Completed `POST /fetchRelationshipAnalysis`

Request used:

```json
{
  "compositeChartId": "68d1e067ef9b96815851c81c"
}
```

Observed top-level keys:

```json
[
  "v2Analysis",
  "v2AnalysisGeneratedAt",
  "dynamics",
  "clusterScoring",
  "completeAnalysis",
  "overall",
  "clusterAnalysis",
  "initialOverview",
  "analysis",
  "profileAnalysis",
  "workflowStatus",
  "tensionFlowAnalysis",
  "holisticOverview",
  "_fullData"
]
```

`profileAnalysis` in the top-level response and inside `_fullData` is deprecated legacy data. It should not be used for archetype labels, blurbs, or current cluster UI.

Observed `overall` excerpt:

```json
{
  "score": 71,
  "formula": "Harmony(25%) + Passion(20%) + Connection(20%) + Stability(25%) + Growth(10%)",
  "dominantCluster": "Harmony",
  "challengeCluster": "Growth",
  "profile": "Well-Matched with Emphasis on Harmony",
  "strengthClusters": ["Harmony", "Stability"],
  "growthClusters": ["Growth"],
  "tier": "Flourishing",
  "quadrantAnalytics": {
    "distribution": {
      "Easy-going": 5,
      "Dynamic": 0,
      "Hot-button": 0,
      "Flat": 0
    },
    "entropy": 0,
    "dominantQuadrant": "Easy-going",
    "isExtreme": true,
    "uniformity": "Uniform"
  },
  "summary": {
    "version": "archetype-summary-v4-shape-family",
    "archetypeKey": "quiet_harbor",
    "label": "Quiet Harbor",
    "blurb": "This connection is shaped most by Harmony and Stability...",
    "dominantClusters": ["Harmony", "Stability"],
    "supportClusters": ["Harmony", "Stability", "Connection", "Passion"],
    "tensionClusters": ["Growth"],
    "shape": "concentrated",
    "tone": "steady",
    "shapeFamily": "Harmony+Stability / Passion low",
    "shapeKind": "ridge_missing",
    "magnitudeTier": "high",
    "modifiers": ["Easy-Flowing", "Highly Active"],
    "meanScore": 73.6,
    "spread": 35.4,
    "weakestCluster": "Passion",
    "confidence": 1
  }
}
```

`overall.summary` is the current relationship-app archetype contract. The primary UI label should come from `overall.summary.label`; do not use deprecated `profile`, `tier`, or `profileAnalysis` for current archetype display.

Important rendering contract:

- `summary.label` is the base archetype label, e.g. `Open Channel`.
- `summary.modifiers` is a separate array of optional texture modifiers, e.g. `["Easy-Flowing", "Magnetic"]`.
- The backend does **not** concatenate modifiers into the label. Do not expect a prebuilt string such as `Easy-Flowing Open Channel`.
- Recommended UI: render `summary.label` as the title and render `summary.modifiers` as chips, badges, or subtitle text.
- Example display: title `Open Channel`, subtitle/chips `Easy-Flowing · Magnetic`.

Current summary fields:

```ts
type RelationshipArchetypeSummary = {
  version: "archetype-summary-v4-shape-family";
  archetypeKey: string;                 // slug for label, e.g. "open_channel"
  label: string;                        // primary display label, e.g. "Open Channel"
  blurb: string;                        // deterministic explanatory copy
  dominantClusters: RelationshipCluster[]; // top two scored clusters
  supportClusters: RelationshipCluster[];  // clusters with score >= 60
  tensionClusters: RelationshipCluster[];  // clusters with score < 50
  shape: "balanced" | "polarized" | "concentrated" | "flat" | "conflicted";
  tone: "steady" | "easy" | "magnetic" | "growth-heavy" | "volatile" | "mixed";
  shapeFamily: string;                  // "Top+Second / Weakest low"
  shapeKind: "even" | "ridge_missing" | "single_spike" | "ridge" | "trough" | "soft_shape";
  magnitudeTier: "low" | "mid" | "high" | "exceptional";
  modifiers: Array<"Magnetic" | "Highly Active" | "Tension-Rich" | "Easy-Flowing" | "Low Signal">;
  meanScore: number;                    // average of the five cluster scores, rounded
  spread: number;                       // top cluster score - weakest cluster score, rounded
  weakestCluster: RelationshipCluster;
  confidence: number;
};
```

Shape-family assignment is based on the literal radar topology:

- even shape: `spread < 18`, labeled by magnitude as `Quiet Balance`, `Full Spectrum`, or `Soulbound`
- oriented shape: top two clusters determine the family; weakest cluster refines the label where useful
- modifiers are additive texture from advanced metrics and are not mutually exclusive

Observed `clusterAnalysis.clusters.Harmony` excerpt:

```json
{
  "score": 92.40768037205788,
  "rawScore": 224.53099999999995,
  "supportPct": 94,
  "challengePct": 6,
  "heatPct": 91,
  "activityPct": 79,
  "sparkElements": 5,
  "quadrant": "Easy-going",
  "keystoneAspects": [
    {
      "rank": 1,
      "description": "Edx's Venus trine Arna's Sun",
      "impact": "Supports Harmony (26.975 pts)"
    }
  ]
}
```

Observed `completeAnalysis.Harmony` excerpt:

```json
{
  "synastry": {
    "supportPanel": "Edx's Venus in Sagittarius (love needs) harmonizes beautifully...",
    "challengePanel": "Edx's Moon square Arna's Venus creates a dynamic tension...",
    "synthesisPanel": "Edx and Arna's connection thrives on a tapestry of vibrant harmony..."
  },
  "composite": {
    "supportPanel": "Their relationship naturally generates a gentle and nurturing atmosphere...",
    "challengePanel": "The relationship between Edx and Arna is infused with opportunities for profound growth...",
    "synthesisPanel": "Edx and Arna's relationship embodies a gentle and nurturing harmony..."
  },
  "generatedAt": {},
  "panelFormat": "6-panel",
  "workflowType": "synastry-composite-support-challenge-synthesis"
}
```

Observed `_fullData` keys:

```json
[
  "v2Analysis",
  "v2AnalysisGeneratedAt",
  "v2Metrics",
  "v2AnalysisWorkflowType",
  "categoryScoreBreakdown",
  "clusterScoring",
  "completeAnalysis",
  "overall",
  "clusterAnalysis",
  "clusterAnalyses",
  "initialOverview",
  "holisticOverview",
  "profileAnalysis",
  "tensionFlowAnalysis",
  "categoryTensionFlowAnalysis",
  "tensionFlowAnalysisGeneratedAt",
  "debug",
  "vectorizationStatus",
  "relationshipAppVectorizationStatus",
  "workflowStatus",
  "_id"
]
```

### 2. Completed `POST /relationship-app/workflow/relationship/status`

Request used:

```json
{
  "compositeChartId": "68d1e067ef9b96815851c81c"
}
```

Observed deployed `dev` response:

```json
{
  "success": true,
  "workflowId": "68d1e067ef9b96815851c81c",
  "compositeChartId": "68d1e067ef9b96815851c81c",
  "workflowType": "relationship-app-cluster",
  "status": "completed",
  "completed": true,
  "phase": "complete",
  "stepFunctionStatus": "not_found",
  "message": "Relationship analysis completed successfully."
}
```

Important:
- The current deployed Step Functions polling path does **not** include `analysisData` when complete.
- The frontend should poll this endpoint for state and then fetch the report from `GET /relationship-app/relationships/:compositeChartId/analysis` or `POST /fetchRelationshipAnalysis`.

### 3. Real `POST /getUserCompositeCharts` list row

Observed first row for an authenticated relationship-app user:

```json
{
  "_id": "69e3c6042a270886e5b9797f",
  "ownerUserId": "69dfcfc1ca76f194cba5b887",
  "userA_id": "69dfcfc1ca76f194cba5b887",
  "userB_id": "69e3c5f42a270886e5b9797c",
  "userA_name": "Edmin",
  "userB_name": "Test",
  "isCelebrityRelationship": false,
  "relationshipAnalysisStatus": {
    "level": "scores",
    "completionPercentage": 30,
    "hasAnalysis": true,
    "hasCompleteAnalysis": false,
    "isRunning": false,
    "overall": {
      "score": 68,
      "formula": "Harmony(25%) + Passion(20%) + Connection(20%) + Stability(25%) + Growth(10%)",
      "dominantCluster": "Connection",
      "challengeCluster": "Growth",
      "profile": "Well-Matched with Emphasis on Connection",
      "strengthClusters": ["Connection", "Passion"],
      "growthClusters": ["Growth"],
      "tier": "Flourishing",
      "summary": {
        "version": "archetype-summary-v4-shape-family",
        "archetypeKey": "live_wire",
        "label": "Live Wire",
        "blurb": "This connection is shaped most by Connection and Passion...",
        "dominantClusters": ["Connection", "Passion"],
        "supportClusters": ["Connection", "Passion", "Harmony", "Stability"],
        "tensionClusters": ["Growth"],
        "shape": "polarized",
        "tone": "easy",
        "shapeFamily": "Connection+Passion / Growth low",
        "shapeKind": "single_spike",
        "magnitudeTier": "high",
        "modifiers": ["Magnetic"],
        "meanScore": 66.8,
        "spread": 42.1,
        "weakestCluster": "Growth",
        "confidence": 0.696
      },
      "quadrantAnalytics": {
        "distribution": {
          "Easy-going": 2,
          "Dynamic": 0,
          "Hot-button": 1,
          "Flat": 2
        },
        "entropy": 1.52,
        "dominantQuadrant": "Easy-going",
        "isExtreme": false,
        "uniformity": "Highly Varied"
      }
    },
    "clusterScores": {
      "Harmony": 64.29959104236288,
      "Passion": 72.48149674547162,
      "Connection": 88.27493929842205,
      "Stability": 60.195726395353525,
      "Growth": 49.93333558019214
    },
    "hasInitialOverview": true
  }
}
```

Important:
- list rows expose `relationshipAnalysisStatus.clusterScores`
- they do **not** expose the full `clusterAnalysis.clusters.<Cluster>` object
- if the UI needs raw cluster metrics, it must fetch the report payload

### 4. Real `POST /enhanced-relationship-analysis` direct-create response

Observed top-level keys:

```json
[
  "success",
  "compositeChartId",
  "creditsDeducted",
  "billingSystem",
  "userA",
  "userB",
  "clusters",
  "overall",
  "scoredItems",
  "initialOverview",
  "keyAspects",
  "tensionFlowAnalysis",
  "compositeChart",
  "synastryAspects",
  "synastryHousePlacements",
  "status",
  "metadata"
]
```

Observed `clusters.Harmony` excerpt:

```json
{
  "score": 46.325828082712725,
  "rawScore": 155.00599999999997,
  "hasContributions": true,
  "supportPct": 85,
  "challengePct": 15,
  "totalMagnitude": 222.2,
  "polarityIntensity": 18,
  "heatPct": 88,
  "activityPct": 74,
  "sparkElements": 1,
  "quadrant": "Flat",
  "keystoneAspects": [
    {
      "rank": 1,
      "description": "Edmin's Jupiter trine Beatrice's Moon",
      "impact": "Supports Harmony (15.74 pts)"
    }
  ]
}
```

Observed `scoredItems[0]` excerpt:

```json
{
  "id": "synastry-Moon_Mercury-quincunx-1.5",
  "source": "synastry",
  "type": "aspect",
  "description": "Edmin's Moon quincunx Beatrice's Mercury",
  "clusterContributions": [
    {
      "cluster": "Harmony",
      "score": -3.325,
      "originalScore": -3.04,
      "weight": 4,
      "intensity": 0.94,
      "valence": -1
    }
  ],
  "aspect": "quincunx",
  "orb": 1.5,
  "planet1": "Moon",
  "planet2": "Mercury",
  "planet1Sign": "Gemini",
  "planet2Sign": "Capricorn",
  "planet1House": 7,
  "planet2House": 3,
  "pairKey": "Moon_Mercury",
  "code": "SynA-P1(MosGe07)-CaQu-P2(MesCp03)",
  "overallCentrality": 0,
  "maxStarRating": 0
}
```

Observed `tensionFlowAnalysis` value:

```json
null
```

Observed `synastryAspects[0]` excerpt:

```json
{
  "planet1": "Moon",
  "planet1Degree": 73.67825295193776,
  "planet1Sign": "Gemini",
  "planet2": "Mercury",
  "planet2Degree": 282.1311554180646,
  "planet2Sign": "Capricorn",
  "aspectType": "quincunx",
  "planet1IsRetro": false,
  "planet2IsRetro": false,
  "orb": 1.5
}
```

Observed `synastryHousePlacements` shape:

```json
{
  "AinB": [
    {
      "planet": "Moon",
      "planetDegree": 73.67825295193776,
      "planetSign": "Gemini",
      "house": 8,
      "direction": "A->B"
    }
  ],
  "BinA": [
    {
      "planet": "Moon",
      "planetDegree": 34.51239603675103,
      "planetSign": "Taurus",
      "house": 6,
      "direction": "B->A"
    }
  ]
}
```

Observed `metadata` excerpt:

```json
{
  "processingTime": "2026-04-25T20:12:58.726Z",
  "clustersAnalyzed": 5,
  "totalScoredItems": 95,
  "workflowType": "direct-cluster-scoring",
  "version": "2.0-clusters",
  "isCelebrityRelationship": false,
  "adminCelebrityBypass": false,
  "initialOverviewGenerated": true
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

## Backend Notes

- Romantic subject creation stores the returned romantic overview internally in a relationship-app-specific field, but the API contract exposes it simply as `overview`.
- Pairwise relationship creation uses the shared underlying scoring pipeline. Full-analysis generation uses a relationship-app workflow variant that calls the same cluster Lambda with compact output settings.
- Missing natal vector context in relationship workflows is already tolerated; the pipeline continues with fallback text if nothing is retrieved.
- The relationship analysis core is chart-data-driven and does not require a separate “full natal analysis” product to produce pairwise relationship output.

## Product Boundary Notes

The pairwise relationship surface is now split like this:

- relationship-app private create:
  - `POST /relationship-app/enhanced-relationship-analysis`
- relationship-app private full-workflow start:
  - `POST /relationship-app/workflow/relationship/start`
- relationship-app private read:
  - `GET /relationship-app/relationships/:compositeChartId/analysis`
- relationship-app private polling/resume:
  - `POST /relationship-app/workflow/relationship/status`
  - `POST /relationship-app/workflow/relationship/resume`
- shared compatibility/public fetch:
  - `POST /fetchRelationshipAnalysis`

That means the relationship app now has clean authenticated private contracts for starting, polling, resuming, and reading saved reports, while the celebrity/public compatibility fetch remains shared.

## Recommended Mobile Contract

For pairwise relationship UI in the mobile app, the intended API set is:

- subject creation:
  - `POST /createUserRomantic`
  - `POST /createUserUnknownTimeRomantic`
  - `POST /createGuestSubjectRomantic`
  - `POST /createGuestSubjectUnknownTimeRomantic`
- relationship creation and initial scored shell:
  - `POST /relationship-app/enhanced-relationship-analysis`
- relationship list/history:
  - `POST /getUserCompositeCharts`
- compact full-analysis generation:
  - `POST /relationship-app/workflow/relationship/start`
  - `POST /relationship-app/workflow/relationship/status`
  - `POST /relationship-app/workflow/relationship/resume`
- saved relationship read:
  - private/owned: `GET /relationship-app/relationships/:compositeChartId/analysis`
  - public celebrity-to-celebrity or legacy/shared: `POST /fetchRelationshipAnalysis`
- relationship chat:
  - `POST /relationships/:compositeChartId/enhanced-chat`
  - `GET /relationships/:compositeChartId/chat-history`
