# Backlog

## Relationship App

### Wire real profile metadata endpoints (name + gender)

- Problem: `EditNameScreen` and `EditGenderScreen` let the user update their first name, last name, and gender, but the destructive action currently calls stubs (`updateName`, `updateGender` in `src/api/profile.ts`) that only resolve with `success: true` after 250ms. Changes never reach the backend.
- Goal: Real authenticated endpoints that persist name and gender changes to the user's profile document. These edits do not trigger chart recalculation and are not subject to the birth-edit rate cap.
- Frontend scope:
  - Replace the stub implementations with real API calls that return the updated profile.
  - On success, update the `profile` slice in the store so downstream surfaces (top bar, chips, relationship cards) reflect the new values immediately.
  - Surface backend validation errors in the drill-in screens inline, not via Alert.
- Backend scope:
  - Two authenticated endpoints or one combined `/updateProfileMetadata`. Must tolerate partial updates (only `firstName`, only `gender`, etc.).
  - Must NOT recompute relationship scores or the romantic blurb.

### Wire real delete-account endpoint

- Problem: `PrivacyScreen` ships a functional "Delete my account" confirmation flow, but the destructive action is currently a stub (`deleteAccount()` in `src/api/profile.ts`) that only signs the user out locally. Apple will require a real deletion path on first store submit.
- Goal: Implement a real backend endpoint that hard-deletes the user's profile, all relationship composite charts they own, Ask Iris conversation history, and unspent purchased credits, then signs the device out.
- Frontend scope:
  - Replace the stub `deleteAccount` call with the real endpoint.
  - Keep the existing confirmation UI and inline double-confirm pattern.
  - On success: clear all persisted stores, reset navigation to Welcome, and show a one-shot toast "Your account has been deleted."
  - On failure: surface the backend error message in the Danger Zone card.
- Backend scope:
  - New authenticated endpoint that deletes the caller's user document, owned composite charts, ask threads, and any purchased credit ledger.
  - Active RevenueCat subscriptions remain the user's responsibility to cancel via the App Store — surface that fact in the confirmation copy.

### Persist unclaimed onboarding previews across app relaunch

- Problem: `POST /relationship-app/onboarding-preview` creates preview users that are orphaned when onboarding is aborted before claim. The app currently keeps `previewId`, `claimToken`, `guestProfileDraft`, and reveal data only in memory, so a cold restart loses the only client state that could reclaim that preview.
- Goal: If a user closes or reloads the app before claiming their preview, restore them to the existing onboarding reveal flow instead of creating a duplicate preview user.
- Frontend scope:
  - Persist a `pendingOnboardingPreview` object to durable local storage immediately after `/relationship-app/onboarding-preview` succeeds.
  - Persist enough state to restore the reveal/save-profile screens without re-running preview creation:
    - `previewId`
    - `claimToken`
    - `guestProfileDraft`
    - reveal payload required by `ProfileReveal`
  - On bootstrap:
    - if a claimed signed-in user exists, load that user and clear stale pending preview state
    - else if a fresh pending preview exists, hydrate onboarding state and route to the reveal flow
    - else start at the normal welcome flow
  - Clear pending preview state after successful claim, explicit onboarding reset, or expiry.
- Backend scope:
  - Not required for the minimal fix.
  - Recommended follow-up: add cleanup for stale unclaimed previews.
  - Optional follow-up: add a preview rehydrate/validation endpoint so the client does not need to persist the full reveal payload.
- Notes:
  - Persisting only `previewId` and `claimToken` is not enough for the current UI because the reveal flow also depends on locally stored draft and reveal data.
  - Anonymous guest continuation already claims the preview, so this issue applies specifically to users who exit before `SaveProfile` or `CreateAccount` completes.

### Full-page loading screen on relationship creation

- Problem: When the user picks a partner from the "Add Connection" sheet to create a new relationship, we only show a small inline spinner on the partner row. This is visually inconsistent with the rest of the app — onboarding uses a full-page loading screen for equivalent "we are computing your chart" moments.
- Goal: Show a full-page loading screen (matching the onboarding loading aesthetic) immediately after the user taps a partner, and keep it on screen until the relationship is created and ready to navigate into.
- Frontend scope:
  - Replace the inline row spinner with a full-screen overlay/route that mirrors the onboarding loading screen (copy, animation, branding).
  - Drive the loading screen from the same async create-relationship state already powering the inline spinner.
  - On success, transition directly into the relationship detail screen.
  - On failure, dismiss the loader and surface the error inline on the Add Connection sheet (do not strand the user on a blank loading screen).
- Backend scope:
  - Not required.

### Handle navigating away while the full analysis is generating

- Problem: The relationship detail page kicks off the long-running full-analysis generation. If the user navigates away (back to the list, switches tabs, backgrounds the app) before it finishes, there is no signal that work is still in flight, and the user has no breadcrumb back to it.
- Goal: Make in-progress analysis generation visible from the relationship list so the user can find their way back to it without re-triggering the work.
- Frontend scope:
  - Decide and document where generation continues to run when the detail screen unmounts (likely a background task tied to the relationship id, not the screen lifecycle).
  - On the relationship list row, show a "Generating..." status (small inline spinner + label) for any relationship whose full analysis is still in flight.
  - Tapping a generating row should re-enter the detail page in its loading state, not re-kick the generation.
  - Clear the status as soon as the analysis completes (or fails) and reflect the new state on the row.
- Backend scope:
  - Confirm the analysis generation request is idempotent / safe to observe from multiple clients, or expose a status endpoint the list can poll if needed.
- Open questions:
  - Should we also show a toast / push when generation completes while the user is on a different screen?

### Aspect-scoped mini charts for the user's personal chart sections

- Problem: The personal chart sections (e.g. "Your Romantic Placements") today list planet positions only — sign, degree, house. There is no chart visualization tied to the lens of the section, and no surfacing of the aspects between those planets.
- Goal: Add a mini chart to each personal chart section that is scoped to the planets relevant to that lens, and that draws the aspects between them — not just their positions.
- Frontend scope:
  - Reuse the aspect-focus mini chart component already built for the keystone / double-whammy / cluster-lens rows on the relationship app side, parameterized for a single (personal) chart instead of a composite.
  - For each section (Romantic Placements, etc.), pass in the relevant planet set and have the mini chart render those planets plus the aspects between them.
  - Place the mini chart at the top of each section, above the per-planet placement rows.
- Backend scope:
  - Confirm the personal chart payload already includes the aspects between planets at the granularity the mini chart needs; if not, extend the personal chart endpoint to return them.

### Aspect-scoped mini charts for user-created subjects and celebrities

- Problem: User-created subjects and celebrity charts currently lack the same aspect-aware mini chart UI we are adding for the user's personal chart.
- Goal: Bring the same aspect-scoped mini chart UI to subject and celebrity chart screens for visual and conceptual consistency across all single-chart surfaces in the app.
- Frontend scope:
  - Once the personal chart mini chart component is in place, reuse it on the subject detail and celebrity detail screens.
  - Mirror the section structure (lens → mini chart → placement rows) so subjects and celebs feel like the same product surface.
- Backend scope:
  - Same as the personal chart item: confirm subject and celebrity chart payloads include aspects between the relevant planets, and extend the endpoints if not.
- Notes:
  - Do this after the personal chart version is shipped so the component API is settled before being reused in two more places.
