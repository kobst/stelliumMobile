# Simulator Runbook

## Default Development App

The development target is Iris (`RelationshipApp/`). The legacy classic app is
deleted; there is no other target.

From the repo root:

1. Start Metro

```bash
npm run start
```

2. Launch iOS simulator

```bash
npm run ios
```

These commands use:

- `ENVFILE=RelationshipApp/.env.dev`
- iOS scheme `StelliumApp.Dev`

Equivalent explicit commands: `npm run start:dev` and `npm run ios:dev`.

## If The Simulator Gets Stuck

Use the in-app dev session panel:

- check auth status
- check Firebase UID
- check self profile id
- tap `Reset Session`

Then start a fresh temporary session from the welcome screen.

## If You Change Relationship App Env Vars

Rebuild the app:

```bash
npm run ios
```

Hot reload is not sufficient for `react-native-config` changes like `GOOGLE_API_KEY`.
