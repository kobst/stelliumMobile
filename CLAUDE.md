# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repo builds **Iris**, a React Native app for astrology-based relationship
compatibility. Users create a birth-chart profile, add partners (real people or
celebrities), and get AI-generated compatibility analysis. Monetization is a
credit system plus subscriptions via RevenueCat.

The repo name (`StelliumApp`) and native project names are legacy. The live app
is Iris; bundle IDs are `com.irisapp.ios` / `com.irisapp` (Android), with
`.dev`-suffixed variants for the dev environment.

## Repository Layout

```
index.js                 # entry → App.tsx → RelationshipApp/App.tsx
RelationshipApp/         # the app
  App.tsx                # providers + RootNavigator
  .env.dev / .env.prod   # environment config (react-native-config)
  src/
    navigation/          # RootNavigator (stack) + MainTabs (Home/Relationships/Discover/Profile)
    screens/             # all screens
    components/          # shared UI
    api/                 # app-level API modules (wrap shared/api)
    store/               # zustand store (single store in index.ts)
    hooks/               # useBootstrapSession, useRelationshipAnalysisWorkflow, etc.
    services/            # irisRevenueCatService (purchases)
    config/env.ts        # typed access to react-native-config vars
  docs/                  # SIGNUP_FLOW.md, DESIGN_SYSTEM.md, API summaries, HTML mocks
shared/                  # backend integration layer (imported by RelationshipApp)
  api/                   # baseClient + endpoint modules (relationships, onboarding, users, …)
  auth/session.ts        # Firebase ID-token helper
  config/firebase.ts     # Firebase init
  domain/                # domain constants/types
  types/                 # shared TS types
android/ ios/            # the native projects (root-level; RelationshipApp has no native dirs)
__tests__/               # Jest suites
```

## Development Commands

```bash
npm run start            # Metro with dev env (ENVFILE=RelationshipApp/.env.dev)
npm run ios              # dev build, scheme StelliumApp.Dev (copies dev Firebase plist)
npm run ios:prod         # prod build, scheme StelliumApp.Prod
npm run android:dev      # dev flavor (com.irisapp.dev)
npm run android:prod     # prod flavor
npm run android:build:dev|prod   # release APKs

npm test                 # Jest
npm run lint             # ESLint
npx tsc -p RelationshipApp/tsconfig.json --noEmit   # typecheck the live app (must stay at 0 errors)

# iOS native deps (run after changing native dependencies)
bundle install && cd ios && bundle exec pod install
```

Sanity check after structural changes. The release bundle must build:

```bash
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output /tmp/bundle-check.bundle
```

## Branch Strategy

- **`dev`**: day-to-day development, points to dev API
- **`main`**: production. Protected; all changes via PR. Never commit directly.

## Environment Configuration

`react-native-config` reads `RelationshipApp/.env.dev` or `.env.prod`
(npm scripts set `ENVFILE`; Android flavors map dev/prod to the same files in
`android/app/build.gradle`). Typed access is `relationshipAppEnv` in
`RelationshipApp/src/config/env.ts`. Variables:

- `API_URL` — backend base URL (dev: `https://api.dev.stellium.ai`, prod: `https://api.stellium.ai`)
- `ENV` — `development` | `production`
- `GOOGLE_API_KEY` — Google Places/timezone lookups
- `IRIS_REVENUECAT_API_KEY` — RevenueCat
- `APP_VARIANT` — legacy selector, always `relationship`

Firebase: separate dev/prod projects. iOS plists are copied by the npm run
scripts (`ios/GoogleService-Info-{Dev,Prod}.plist`); Android configs live at
`android/app/src/{dev,prod}/google-services.json`.

Env changes require a rebuild (`npm run ios`), not just a Metro reload.

## Architecture

### Entry and session

`RelationshipApp/App.tsx` mounts providers and `RootNavigator`.
`useBootstrapSession` listens to Firebase `onAuthStateChanged` and resolves the
session against the backend; the store's `authStatus`
(`booting`/`signedOut`/`signedIn`) plus onboarding state pick the initial route
(`Main`, `ProfileReveal`, `CreateSelfProfile`, or `Welcome`).

### Onboarding (value before signup)

Welcome → CreateSelfProfile (8-step wizard) → ProfileReveal → CreateAccount
(Apple/Google via Firebase; `claimPreview` attaches the pre-auth profile to the
new account) → Main tabs. Details: `RelationshipApp/docs/SIGNUP_FLOW.md`.

### State

One zustand store: `RelationshipApp/src/store/index.ts`. Auth status, self
profile, subjects, relationship/preview analysis caches, credits, UI state.

### API layer

`shared/api/baseClient.ts` is the HTTP client: per-endpoint timeout/retry
config, explicit **no retry on billed endpoints** (e.g. `/ask-iris`). Endpoint
modules in `shared/api/*` are wrapped by feature modules in
`RelationshipApp/src/api/*`. Auth uses Firebase ID tokens
(`shared/auth/session.ts`).

### Payments

RevenueCat (`react-native-purchases`) via
`RelationshipApp/src/services/irisRevenueCatService.ts` and
`useIrisRevenueCat`. Server-authoritative: purchases land via RevenueCat
webhooks; the client polls entitlements. Credit costs live in
`RelationshipApp/src/api/paywall.ts` and the analysis workflow hook.

## Platform Configuration

- **Android**: min SDK 24, target SDK 35, flavors `dev`/`prod`
  (`com.irisapp.dev` "Iris Dev" / `com.irisapp` "Iris")
- **iOS**: min iOS 16, static frameworks (Firebase), schemes
  `StelliumApp.Dev` (Debug) / `StelliumApp.Prod` (Release), bundle IDs
  `com.irisapp.dev` / `com.irisapp.ios`. See `IOS_SETUP.md`.

## Testing

Jest with `jest.config.js` + `jest.setup.js` (mocks for Firebase, Google/Apple
sign-in, purchases, blob-util). Suites live in `__tests__/`. All suites and
`tsc --noEmit` must pass before merging.

## Other Docs

- `RUNBOOK.md` — simulator workflows, dev session reset
- `RELATIONSHIP_APP_MVP_BLUEPRINT.md` — product blueprint
- `BACKLOG.md` — known work
- `IRIS_APP_AUDIT_2026-07-06.md` — full app audit (security, dead code, release gaps)
- `RelationshipApp/docs/DESIGN_SYSTEM.md` — UI tokens/patterns
