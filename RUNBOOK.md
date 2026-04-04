# Simulator Runbook

## Default Development App

The default development target is now the relationship app.

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
- `APP_VARIANT=relationship`

## Explicit Relationship App Commands

These are equivalent to the default commands:

```bash
npm run start:relationship:dev
npm run ios:relationship:dev
```

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

## Classic App

The classic app is still available, but no longer the default development path.

Use:

```bash
npm run start:classic:dev
npm run ios:classic:dev
```
