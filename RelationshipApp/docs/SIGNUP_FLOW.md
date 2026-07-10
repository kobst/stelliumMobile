# Iris Signup Flow

Describes the current first-run flow as implemented. Source of truth:
`RelationshipApp/src/navigation/RootNavigator.tsx` and the screens it registers.

## Principle: value before signup

The user builds a full birth-chart profile and sees their romantic profile
reveal before any account exists. Account creation happens last, and claims the
pre-auth work.

```text
Welcome
  |
  v
CreateSelfProfile (8-step wizard, no auth)
  |   submitPreview() -> previewId + claimToken
  v
ProfileReveal (romantic profile + top celeb matches)
  |
  v
CreateAccount (Apple / Google / email via Firebase)
  |   claimPreview({previewId, claimToken}) attaches the guest profile
  v
Main tabs (Home / Relationships / Discover / Profile)
```

Existing users take `Welcome -> SignIn` instead.

## Initial route selection

`RootNavigator` picks the initial route from store state after
`useBootstrapSession` resolves:

- `hasCompletedSelfProfile` -> `Main`
- `profileReveal && guestProfileDraft` -> `ProfileReveal` (reveal generated, account not yet created)
- `guestProfileDraft` only -> `CreateSelfProfile` (wizard abandoned mid-way)
- otherwise -> `Welcome`

Bootstrap loading and error states render `BootstrapStatusScreen` before any
route mounts.

## Screens

### 1. Welcome (`WelcomeScreen.tsx`)

Wordmark, tagline, two actions:

- `Create your profile` -> `CreateSelfProfile`
- `I already have an account` -> `SignIn`

Terms & Privacy line is display-only text, not tappable (known gap, audit §
top-10 #4).

### 2. Create Self Profile (`CreateSelfProfileScreen.tsx`)

Eight-step wizard, one question per screen, progress dashes on top:

1. Name (first / last)
2. Photo (optional; uploaded later, after account creation)
3. Gender identity
4. Partner-gender preference (filters the first celebrity match set)
5. Birth date
6. Birth time (skippable; "birth time unknown" supported with honest copy)
7. Birth city (Google Places autocomplete resolves coordinates + timezone)
8. Review and confirm

Submit calls `onboardingApi.submitPreview()` with the draft. No account exists
yet; the response returns `previewId` + `claimToken` plus the reveal content.
The draft persists in the store as `guestProfileDraft`, so a killed app resumes
at the wizard.

### 3. Profile Reveal (`ProfileRevealScreen.tsx`)

The payoff screen before signup:

- romantic profile blurb / overview
- top natal aspects with plain-language annotations
- top celebrity matches (generated async; the screen polls
  `celebMatchesStatus` / `celebAnnotationsStatus` until completed)

Primary action -> `CreateAccount`.

### 4. Create Account (`CreateAccountScreen.tsx`)

Firebase auth with three methods: Apple, Google, email/password.

After Firebase sign-up, `finalizeAuth`:

1. forces an ID-token refresh
2. calls `onboardingApi.claimPreview({previewId, claimToken})`, which creates
   the backend user and attaches the guest profile/preview
3. uploads the onboarding photo (best-effort; failure never blocks account
   creation)
4. writes profile + auth state to the store, clears the onboarding flow, and
   resets navigation to `Main`

If `claimPreview` fails, `resetPartialAuthState` rolls back the half-created
Firebase user so the flow can retry cleanly.

### 5. Sign In (`SignInScreen.tsx`)

For returning users: email/password, Google, Apple. On success the normal
bootstrap path resolves the profile and lands on `Main`.

## After signup

From the Main tabs the user adds connections:

- real person: `AddConnection -> PartnerIdentity -> PartnerBirthDate ->
  PartnerBirthTime -> PartnerBirthCity -> PartnerConfirm`
- celebrity: `SelectCelebrity -> CelebrityDetail`

Both paths lead to `RelationshipPreview`, then `Unlock` (credit-gated) and
`FullRelationshipAnalysis`.

## Dev notes

- `relationshipAppEnv.enableLocalUxMode` (default `false` in
  `src/config/env.ts`) plus the store's `isLocalUxMode` short-circuit the
  wizard submit with local demo data instead of live `submitPreview` calls.
  The demo branch lives in the wizard submit handler; flagged by the audit for
  removal from production code.
- `DevSessionPanel` (dev builds) inspects auth status / Firebase UID / profile
  id and resets the session.

## Known gaps

- Terms & Privacy on Welcome are not real links.
- Default DOB (`1995-01-01` / 12:00) passes validation untouched; fast tappers
  get silently wrong charts (audit).
- Full birth data is logged to console in the onboarding path (compliance
  flag).
- No dedicated "account created" transition moment after `claimPreview`.
