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
