# iOS Environment Setup (Dev vs Prod)

This project uses **branch-based configuration** for Dev and Prod environments:

- **`dev` branch** → Dev Firebase project (stellium-dev)
- **`main` branch** → Prod Firebase project (stellium-70a2a)

## How It Works

Each branch contains the correct configuration files committed directly:

| File | dev branch | main branch |
|------|------------|-------------|
| `ios/StelliumApp/GoogleService-Info.plist` | stellium-dev | stellium-70a2a |
| `ios/StelliumApp/Info.plist` (URL scheme) | Dev CLIENT_ID | Prod CLIENT_ID |
| `.env` | .env.dev values | .env.prod values |

**No build scripts swap these files.** The config is part of the branch.

## Prerequisites

- Xcode installed
- CocoaPods configured (`cd ios && pod install`)

## Development Workflow

### Daily Development (Dev)

```bash
git checkout dev
npm run ios:dev
```

This runs with:
- Firebase: stellium-dev
- API: https://api.dev.stellium.ai
- Bundle ID: com.stelliumapp.dev

### TestFlight / App Store (Prod)

```bash
git checkout main
git merge dev  # Merge your changes (configs will conflict - keep main's)
# Open Xcode, Archive with StelliumApp.Prod scheme
```

This runs with:
- Firebase: stellium-70a2a
- API: https://api.stellium.ai
- Bundle ID: com.stelliumapp

## Handling Merge Conflicts

When merging `dev` → `main`, you'll get conflicts in config files. **Always keep main's version:**

```bash
git checkout main
git merge dev

# If conflicts in these files, keep main's version:
git checkout --ours ios/StelliumApp/GoogleService-Info.plist
git checkout --ours ios/StelliumApp/Info.plist
git add ios/StelliumApp/GoogleService-Info.plist ios/StelliumApp/Info.plist

git commit
```

## Configuration Reference

### Dev (stellium-dev)
- CLIENT_ID: `1056285065517-bm65rgfa23gehv91ftjl63shphiaqe4b.apps.googleusercontent.com`
- URL Scheme: `com.googleusercontent.apps.1056285065517-bm65rgfa23gehv91ftjl63shphiaqe4b`
- Bundle ID: `com.stelliumapp.dev`

### Prod (stellium-70a2a)
- CLIENT_ID: `63614597334-8mamegt0j0lt54p20su2orrvpbt0qeio.apps.googleusercontent.com`
- URL Scheme: `com.googleusercontent.apps.63614597334-8mamegt0j0lt54p20su2orrvpbt0qeio`
- Bundle ID: `com.stelliumapp`

## Schemes

- `StelliumApp.Dev`: Debug configuration, for local development
- `StelliumApp.Prod`: Release configuration, for TestFlight/App Store

## Running

CLI:
- Dev: `./run-dev.sh` or `npm run ios:dev`
- Prod: `./run-prod.sh` or `npm run ios:prod`

Xcode UI:
- Select scheme → Run

## Archiving for TestFlight

1. Ensure you're on `main` branch with Prod config
2. Open `ios/StelliumApp.xcworkspace`
3. Select `StelliumApp.Prod` scheme
4. Product → Archive
5. Distribute to App Store Connect

## Troubleshooting

### Google Sign-In crashes
- Verify `Info.plist` URL scheme matches `GoogleService-Info.plist` REVERSED_CLIENT_ID
- Both must be from the same Firebase project (Dev or Prod)

### Pod installation issues
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

### Wrong environment after branch switch
```bash
cd ios
rm -rf build DerivedData
pod install
# Clean build in Xcode: Product → Clean Build Folder
```
