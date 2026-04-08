# Backlog

## Relationship App

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
