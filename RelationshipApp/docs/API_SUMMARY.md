# Relationship App API Summary

This document summarizes the API surface currently relevant to the relationship-focused mobile app as of April 5, 2026.

It covers:
- Romantic subject creation endpoints that are already implemented
- Shared relationship analysis endpoints the mobile app can use today
- Expected request/response bodies
- Gaps and open questions

## Scope

The current backend split is:
- Classic app: existing full-chart natal analysis APIs
- Relationship app: romantic subject-creation APIs are implemented
- Relationship analysis: still uses the shared relationship endpoints and shared scoring pipeline

The relationship app does **not** yet have a dedicated relationship-specific endpoint namespace. It would currently call the same relationship-analysis endpoints as the classic app.

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

## App Domain

For account-self creation, the backend supports:
- `appDomain: "relationship-app"` in request body, or
- `x-app-domain: relationship-app` header

This is used to separate account-self users across app domains.

Guest subjects do not currently store an `appDomain` field directly.

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
  "referencedCodes": ["Pp-...", "A-..."],
  "overviewMode": "romantic",
  "status": "user_created_with_overview",
  "saveUserResponse": { "...": "mongo insert/update response" }
}
```

Notes:
- `overview` is the romantic overview for this endpoint.
- The overview text returned to the client is stripped of astro codes.
- Referenced codes are returned separately.
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
