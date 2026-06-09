# Relationship App MVP Blueprint

## Purpose

This document defines the implementation blueprint for a new relationship-first mobile product that reuses Stellium backend services while avoiding a risky rewrite inside the existing horoscope/chart-first app shell.

The goal is to begin implementation with a stable frontend structure, clear shared-module boundaries, and a phased MVP plan.

## Decision

We will build the new product as a second mobile app in this repository.

We will not implement it as a large refactor inside the current `StelliumApp` shell.

We will keep the existing app intact while extracting shared infrastructure that both apps can use.

## Current Status

The plan is now partially implemented.

Completed so far:

- `RelationshipApp/` scaffold exists as a separate mobile app shell
- relationship-app Firebase project configs have been added via local env templates and app config files
- backend user/account lookup is app-domain aware
- backend auth supports separate Firebase projects by app domain
- shared API/client extraction has started under `shared/`
- relationship-app auth/bootstrap flow is wired
- a basic self-profile form scaffold now submits to the real relationship-app user domain
- the first real-person compatibility preview path is now wired end to end:
  - `CreatePartnerScreen` collects partner data
  - guest subject creation runs against the shared backend
  - free preview generation calls the shared relationship analysis API
  - `RelationshipPreviewScreen` renders the real preview payload

Still intentionally placeholder:

- celebrity selection flow
- unlock flow
- chat flow
- romantic profile flow

## Current Next Step

Build the first unlockable post-preview path:

1. Persist preview/composite-chart records into relationship-app history surfaces
2. Implement `UnlockScreen` against a real entitlement or placeholder unlock contract
3. Trigger `startFullRelationshipAnalysis` from the preview/unlock flow
4. Poll workflow status and render the paused/completed states cleanly

This is now the highest-value next milestone because it turns the preview slice into a usable conversion path instead of a dead-end demo.

## Why

The existing mobile app has reusable backend integration, but its frontend shell is tightly coupled to a different product shape:

- app bootstrap couples auth, onboarding, subscription bootstrap, and current-user hydration
- navigation assumes horoscope, chart, relationship, and celebrity tabs
- global state includes horoscope, chart, guest-subject, and relationship concerns in one store
- onboarding is astrology-data-first rather than relationship-value-first
- monetization is credit/subscription-first rather than relationship-preview-to-unlock-first

The brief defines a materially different product:

- relationship-first positioning
- narrower App Store surface
- lighter onboarding
- persistent "You" profile
- real-person and celebrity compatibility flows
- preview-first economics
- controlled Q&A as a premium layer

That is enough product divergence to justify a separate app shell.

## Implementation Strategy

### Working model

Phase 1 should use a second app in the same git repository, plus extracted shared modules.

This gives us:

- fast reuse of the current API layer
- less release risk to the current app
- freedom to design a new UX without old navigation/state assumptions
- easier backend coordination because both apps live close to the same contracts

### Recommended target shape

Short term:

```text
StelliumApp/
  app/
    stellium-classic/         # current app, gradually pointed at shared modules
    relationship-app/         # new app
  packages/
    api-core/
    auth-core/
    domain-core/
    ui-core/                  # optional later, do not force early
  docs/
    RELATIONSHIP_APP_MVP_BLUEPRINT.md
```

Practical note:

The repository does not currently use a workspace/monorepo layout. We do not need to migrate everything on day one. The initial implementation can begin with:

```text
StelliumApp/
  RelationshipApp/
  shared/
```

and later normalize into `app/` and `packages/` once the second app is stable.

## What Gets Shared

These modules should be extracted first because they are already product-agnostic enough:

- API client and request/retry/auth plumbing
- Firebase auth bootstrap helpers
- backend DTO types
- user/profile APIs
- relationship APIs
- celebrity APIs
- shared transformers for backend documents
- environment/config loading helpers

Initial shared candidates from the current codebase:

- `src/api/client.ts`
- `src/api/users.ts`
- `src/api/relationships.ts`
- `src/api/celebrities.ts`
- `src/api/external.ts`
- selected files under `src/transformers`
- selected files under `src/types`

### Data domain boundary

The celebrity database remains shared with the current product.

The account-user domain does not.

The new relationship app should use a separate user/account namespace from:

- the existing web frontend user base
- the original mobile app account-self user base

This is a product and data-model boundary, not just a frontend routing preference.

The new app may reuse similar document structure, but it should not assume that an authenticated person in the old product automatically maps to the new product's primary self-profile record.

### Recommendation for backend modeling

Preferred options, in order:

1. Separate collection for relationship-app account users
2. Same collection with an explicit app-domain discriminator and strict query isolation

Option 1 is cleaner and safer.

If backend constraints force option 2, then every account-self style record must include an app-domain field such as:

- `appDomain: 'stellium-classic' | 'relationship-app'`

and every user lookup path must filter on it.

The new app should not call generic "find user by Firebase UID" APIs unless those APIs are domain-aware.

## What Stays App-Specific

The new app should not inherit old presentation/state just because it exists.

Keep separate per app:

- app shell and root bootstrap
- navigation
- screens
- onboarding flow
- store shape
- paywall UX
- copy, design system, and visual language
- product analytics events

Do not try to share UI components early unless they are plainly generic.

## Existing Backend Reuse Map

### Reusable now

#### User profile

The current API surface already supports the new app's persistent self-profile model:

- `getUserByFirebaseUid`
- `createUser`
- `createUserUnknownTime`
- `updateUser`

However, these endpoints must become relationship-app aware before they are treated as final shared contracts. The new app should not read or create account-self records in the same logical namespace as the existing web/frontend account users.

#### Real-person relationship analysis

The current API surface already supports the preview and full-analysis split:

- `createGuestSubject`
- `createGuestSubjectUnknownTime`
- `enhancedRelationshipAnalysis`
- `startFullRelationshipAnalysis`
- `getRelationshipWorkflowStatus`
- `fetchRelationshipAnalysis`
- `getUserCompositeCharts`

#### Celebrity analysis

The current API surface already supports celebrity search and selection:

- `getCelebrities`
- `getCelebrity`
- `searchCelebrities`
- `getTrendingCelebrities`

If needed, celebrity compatibility can either:

- use existing celebrity compatibility endpoints directly, or
- route through the same relationship-analysis pipeline when backend models align

#### Ask Stellium

Relationship chat already exists in usable form:

- `enhancedChatForRelationship`
- `fetchRelationshipEnhancedChatHistory`

### Backend/product gaps to confirm

These items should be validated before implementation spreads:

1. Relationship-app user/account model
   Need a backend contract for separate relationship-app users while preserving the shared celebrity dataset.

2. Global romantic profile
   Need a clear backend artifact or generation contract for user-level relationship style.

3. Free weekly limits
   Need server-side tracking for:
   - celebrity previews per week
   - real-person previews per week
   - one free question per week across the app

4. Unlock model
   Need a durable entitlement model for:
   - unlocked real-person relationship
   - unlocked celebrity relationship
   - optional romantic-profile unlock
   - optional chat extension

5. Relationship-specific personal layer
   Need confirmation whether this is:
   - part of the full relationship report, or
   - a separate generation step

6. Preview payload contract
   Need confirmation that free preview can be served primarily from structured scoring output plus lightweight overview generation.

## Product Architecture

### Core product objects

The new frontend should center on these domain objects:

- `SelfProfile`
- `AnalysisTarget`
- `RelationshipPreview`
- `RelationshipUnlock`
- `RelationshipReport`
- `RomanticProfilePreview`
- `RomanticProfileFull`
- `ChatContext`
- `UsageEntitlements`

### Suggested frontend domain model

```ts
type AnalysisTarget =
  | { kind: 'person'; subjectId: string; displayName: string }
  | { kind: 'celebrity'; celebrityId: string; displayName: string };

type AnalysisContext =
  | { kind: 'relationship'; compositeChartId: string }
  | { kind: 'romantic-profile'; profileId: string };

interface UsageEntitlements {
  celebrityPreviewsRemaining: number;
  realRelationshipPreviewsRemaining: number;
  freeQuestionsRemaining: number;
  unlockedRelationshipIds: string[];
  unlockedRomanticProfile: boolean;
}
```

This is intentionally narrower than the current global store.

## New App Screen Map

### Onboarding and first-run

1. `WelcomeScreen`
   Relationship-first positioning and entry CTA.

2. `CreateSelfProfileScreen`
   Collect "You" profile data once.

3. `ChooseTargetTypeScreen`
   Choose:
   - someone I know
   - celebrity

4. `CreatePartnerScreen`
   For real-person analysis.

5. `SelectCelebrityScreen`
   For celebrity analysis.

6. `RelationshipPreviewScreen`
   Show:
   - overall compatibility score
   - category bars
   - short overview
   - one free question entry point
   - teaser for "Your Relationship Style"

7. `UnlockScreen`
   Show relationship unlock options.

### Main logged-in product

1. `HomeScreen`
   Show:
   - analyze a relationship
   - try a celebrity match
   - your relationship style
   - recent analyses

2. `RelationshipPreviewScreen`
   Free view for locked analyses.

3. `RelationshipFullReportScreen`
   Paid longform relationship analysis.

4. `RelationshipChatScreen`
   Ask Stellium for unlocked relationship contexts.

5. `RomanticProfileScreen`
   Global relationship style and personal pattern analysis.

6. `HistoryScreen`
   Recent analyses and unlocked items.

7. `ProfileSettingsScreen`
   Edit self profile and account details.

### Navigation recommendation

Do not use the current 4-tab shell.

For MVP, use:

- auth stack
- onboarding stack
- main stack with a simple bottom nav

Suggested bottom nav:

- Home
- History
- Ask
- Profile

The relationship analysis flow itself should mostly live in pushed screens, not tabs.

## State Model

The new app should get its own store instead of adapting the existing large Zustand store.

### Recommended slices

- `session`
- `selfProfile`
- `usage`
- `analysisDraft`
- `analysisResults`
- `chat`
- `ui`

### Suggested store shape

```ts
interface RelationshipAppState {
  session: {
    firebaseUserId: string | null;
    isAuthenticated: boolean;
    isBootstrapping: boolean;
  };
  selfProfile: {
    subjectId: string | null;
    profile: unknown | null;
    isComplete: boolean;
  };
  usage: {
    entitlements: UsageEntitlements | null;
    lastSyncedAt: string | null;
  };
  analysisDraft: {
    targetType: 'person' | 'celebrity' | null;
    selectedCelebrityId: string | null;
    draftPartnerSubjectId: string | null;
  };
  analysisResults: {
    recentRelationshipIds: string[];
    activeRelationshipId: string | null;
    activePreview: unknown | null;
    activeFullReport: unknown | null;
  };
  chat: {
    activeContext: AnalysisContext | null;
    messagesByContext: Record<string, unknown[]>;
  };
  ui: {
    activePaywallSource: string | null;
  };
}
```

This should remain deliberately small.

## Monetization Blueprint

The brief points toward preview-first, unlock-second monetization.

### MVP recommendation

Primary model:

- a la carte unlocks first

Initial purchase types:

- real relationship unlock
- celebrity relationship unlock
- optional romantic profile unlock

Deferred:

- broad subscription products
- complex credit-pack UX
- multiple paid tiers

### Frontend requirement

The new app should treat monetization as entitlement-based, even if backend implementation uses credits internally.

That lets the product feel like:

- "unlock this relationship"
- "unlock your profile"

instead of:

- "spend credits on astrology features"

## Design Constraints

The new app must not feel like a reskinned horoscope product.

Guardrails:

- no horoscope-first IA
- no chart-first language
- avoid exposing astrological mechanics in primary UX
- use relationship vocabulary everywhere
- keep onboarding lightweight
- show value before paywall

Astrology remains an engine detail, not the visible product frame.

## Phased Build Plan

### Phase 0: Foundation

- create blueprint
- confirm repo layout
- confirm backend gaps and product decisions
- choose app name and bundle identifiers

### Phase 1: App scaffold

- create `RelationshipApp`
- wire env/config
- wire Firebase auth
- wire shared API client
- establish navigation shell
- create new lightweight store

### Phase 2: Shared extraction

- extract shared API client
- extract shared auth bootstrap helpers
- extract users/relationships/celebrity APIs
- extract selected shared types/transformers
- point old app imports to shared modules where safe

### Phase 3: Onboarding to preview

- `WelcomeScreen`
- `CreateSelfProfileScreen`
- `ChooseTargetTypeScreen`
- `CreatePartnerScreen`
- `SelectCelebrityScreen`
- `RelationshipPreviewScreen`

This phase is the first usable vertical slice.

### Phase 4: Unlock and full report

- unlock flow
- workflow start/polling
- full report screen
- recent analyses list

### Phase 5: Ask Stellium

- relationship chat context
- weekly free question logic
- unlocked multi-question mode
- suggested prompts

### Phase 6: Romantic profile

- profile preview
- full romantic profile
- optional profile chat context

### Phase 7: Hardening

- analytics
- error states
- caching
- usage sync
- QA
- App Store polish

## First Vertical Slice

The first end-to-end build should prove this path:

1. User signs in
2. User creates "You" profile
3. User chooses celebrity or real person
4. User creates/selects target
5. App generates free preview
6. App shows unlock entry point

Do not start with chat or full monetization complexity first.

## File/Module Blueprint For Initial Implementation

If we start with the minimal short-term structure, create:

```text
RelationshipApp/
  App.tsx
  app.json
  package.json
  src/
    api/
      index.ts
    config/
      env.ts
    domain/
      relationship.ts
      usage.ts
    navigation/
      RootNavigator.tsx
      AuthStack.tsx
      OnboardingStack.tsx
      MainStack.tsx
    screens/
      WelcomeScreen.tsx
      CreateSelfProfileScreen.tsx
      ChooseTargetTypeScreen.tsx
      CreatePartnerScreen.tsx
      SelectCelebrityScreen.tsx
      RelationshipPreviewScreen.tsx
      UnlockScreen.tsx
      HomeScreen.tsx
      HistoryScreen.tsx
      ProfileSettingsScreen.tsx
    store/
      index.ts
      sessionSlice.ts
      selfProfileSlice.ts
      usageSlice.ts
      analysisSlice.ts
      chatSlice.ts
    theme/
      index.ts
shared/
  api/
    client.ts
    users.ts
    relationships.ts
    celebrities.ts
    external.ts
  auth/
    session.ts
  types/
  transformers/
```

## Rules For Extraction

1. Extract infrastructure before reusing screens.
2. Do not pull current navigation into the new app.
3. Do not pull current global store into the new app.
4. Do not expose horoscope concepts unless backend requires them.
5. Preserve backward compatibility for the current app during extraction.

## Immediate Next Actions

1. Create the blueprint document.
2. Scaffold `RelationshipApp` as a second app inside this repository.
3. Create `shared/api/client.ts` and migrate API modules into `shared`.
4. Build the onboarding-to-preview vertical slice.

## Open Questions

These should be answered before monetization and romantic-profile work goes deep:

1. Will relationship-app users live in a separate collection, or in the same collection with a mandatory `appDomain` discriminator?
2. Will relationship-app user creation and lookup get dedicated endpoints, or will existing endpoints become domain-aware?
3. Is "romantic profile" a new backend resource or a generated view over existing self-profile data?
4. Are unlocks permanent per relationship/profile?
5. Does celebrity analysis create the same composite-chart identifier model as real-person analysis?
6. Where is weekly usage enforced: backend only, or backend plus local cache?
7. Should the new app share Firebase project and RevenueCat app, or get separate product identities?

## Recommendation Summary

Build a new relationship-first app in this repository.

Keep the current app alive.

Extract shared infrastructure selectively.

Keep celebrity data shared.

Keep relationship-app users separate from the existing web/original-mobile user domain.

Start implementation with the onboarding-to-preview vertical slice.
