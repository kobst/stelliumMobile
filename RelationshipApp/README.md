# RelationshipApp (Iris)

This directory is the Iris app: all screens, navigation, state, and UI live
here. Backend integration (HTTP clients, endpoint modules, Firebase config,
shared types) lives in the sibling `shared/` directory. The root `android/`
and `ios/` projects are the native targets; this directory has no native code.

Entry chain: root `index.js` -> root `App.tsx` -> `RelationshipApp/App.tsx`
(providers + `RootNavigator`).

## Running

From the repo root:

- `npm run start` (Metro, dev env)
- `npm run ios` (dev scheme) / `npm run ios:prod`
- `npm run android:dev` / `npm run android:prod`

Env files live at `RelationshipApp/.env.dev` and `RelationshipApp/.env.prod`
(templates alongside). The npm scripts pass the right `ENVFILE`. Env changes
require a rebuild, not a Metro reload.

## Layout

- `src/navigation/` — `RootNavigator` (stack) + `MainTabs` (Home /
  Relationships / Discover / Profile)
- `src/screens/` — all screens
- `src/components/` — shared UI
- `src/api/` — feature API modules wrapping `shared/api`
- `src/store/` — single zustand store
- `src/hooks/` — session bootstrap, analysis workflow, RevenueCat
- `src/services/` — `irisRevenueCatService`
- `src/config/env.ts` — typed `react-native-config` access

## Docs

- [`docs/SIGNUP_FLOW.md`](docs/SIGNUP_FLOW.md) — first-run/onboarding flow
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — UI tokens and patterns
- [`../RUNBOOK.md`](../RUNBOOK.md) — simulator workflows
- [`../CLAUDE.md`](../CLAUDE.md) — architecture overview
