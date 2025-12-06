# iOS Environment Setup (Dev vs Prod)

This project uses two Xcode schemes and the standard Debug/Release configurations to manage Dev and Prod:

- StelliumApp.Dev → Debug (Dev)
- StelliumApp.Prod → Release (Prod)

Environment selection and setup are automated via build scripts.

## Prerequisites
- Xcode installed
- CocoaPods configured (`cd ios && pod install`)

## Schemes and Configurations

1. Open `ios/StelliumApp.xcworkspace` in Xcode.
2. Product → Scheme → Manage Schemes.
3. Ensure schemes exist:
   - `StelliumApp.Dev`: Run configuration = `Debug`.
   - `StelliumApp.Prod`: Run configuration = `Release` (set to ensure Prod behavior when running).
4. Archive uses `Release` by default (suitable for Prod archives).

This simplified approach avoids maintaining four custom configurations and keeps logic clear: Debug = Dev, Release = Prod.

## Build Scripts (already added)

Under Target → Build Phases (before "Copy Bundle Resources"):

1. Setup Environment Config
   - Script: `"${PROJECT_DIR}/scripts/env-config.sh"`
   - Behavior: copies `.env.dev` for `Debug` and `.env.prod` for `Release` to project root as `.env`.
2. Copy Firebase Config
   - Script: `"${PROJECT_DIR}/scripts/firebase-config.sh"`
   - Behavior: copies `GoogleService-Info-Dev.plist` (Debug) or `GoogleService-Info-Prod.plist` (Release) to `ios/GoogleService-Info.plist`.
3. Update Info-Plist
   - Script: `bash "${PROJECT_DIR}/scripts/update-info-plist.sh"`
   - Behavior: sets the correct Google Sign-In reversed client ID in `Info.plist` based on `Debug`/`Release`.

Notes:
- Leave "Run script only when installing" unchecked so these run every build.
- The scripts decide environment strictly by `CONFIGURATION` (`Debug` vs `Release`).

## Firebase Files

- Place both plists in `ios/` and add to the Xcode project (not to a target):
  - `GoogleService-Info-Dev.plist`
  - `GoogleService-Info-Prod.plist`
- The script copies the correct one to `ios/GoogleService-Info.plist` at build time.

## Bundle Identifiers

- Current development setup uses `com.stelliumapp.dev` for both Debug and Release to simplify local runs.
- For true production archives, set the Release bundle identifier to `com.stelliumapp` and ensure provisioning/signing and Firebase Prod plist match that bundle ID.

## Running

CLI:
- Dev: `./run-dev.sh` or `npm run ios:dev` or `npx react-native run-ios --scheme StelliumApp.Dev`
- Prod: `./run-prod.sh` or `npm run ios:prod` or `npx react-native run-ios --scheme StelliumApp.Prod`

Xcode UI:
- Select scheme → `StelliumApp.Dev` (Run = Debug) or `StelliumApp.Prod` (Run = Release) → Run.

## Verification

- In Xcode build logs:
  - "Using Firebase Dev configuration (Debug)" or "Using Firebase Prod configuration (Release)".
  - "Using Dev/Prod Google Sign-In configuration (Debug/Release)".
- In-app: `Config.ENV` is `development` (Dev) or `production` (Prod).

## Troubleshooting

Pod installation issues:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

Firebase config not loading:
- Verify Build Phases order (Environment → Firebase → Info-plist → Copy Bundle Resources).
- Check execute permissions: `chmod +x ios/scripts/*.sh`.

PIF error (Xcode package manager):
```bash
pkill -9 -f xcodebuild; pkill -9 -f swift; pkill -9 -f SourceKit; pkill -9 -f XCBBuildService
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Developer/Xcode/SourcePackages/*
# Optional: remove Package.resolved files in the workspace
```
Then reopen Xcode → File → Packages → Reset Package Caches → Resolve Package Versions → Clean Build Folder.
