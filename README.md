# Iris (stelliumMobile)

React Native app for astrology-based relationship compatibility. Users build a
birth-chart profile, add partners (real people or celebrities), and unlock
AI-generated compatibility analysis.

The app code lives in `RelationshipApp/` with a backend-integration layer in
`shared/`. The root `android/` and `ios/` projects are the native targets (the
`StelliumApp` naming there is legacy; the product and bundle IDs are Iris /
`com.irisapp.*`). See `CLAUDE.md` for the full architecture overview.

## Setup

```sh
npm install

# iOS native deps (first clone, and after native dependency changes)
bundle install
cd ios && bundle exec pod install
```

If running in the Codex environment, execute `./setup.sh` to install Node
modules and CocoaPods before network access is disabled.

Environment files live at `RelationshipApp/.env.dev` and
`RelationshipApp/.env.prod` (templates alongside). Firebase configs:
`ios/GoogleService-Info-{Dev,Prod}.plist` and
`android/app/src/{dev,prod}/google-services.json`.

## Run

```sh
npm run start        # Metro (dev env)

npm run ios          # iOS dev build — scheme StelliumApp.Dev, bundle id com.irisapp.dev
npm run ios:prod     # iOS prod build — scheme StelliumApp.Prod

npm run android:dev  # Android dev flavor (com.irisapp.dev, "Iris Dev")
npm run android:prod # Android prod flavor
```

Convenience wrappers `./run-dev.sh` and `./run-prod.sh` exist for iOS.
Day-to-day simulator workflows (session reset, stuck states) are in
`RUNBOOK.md`.

### Environments

- Dev points at `https://api.dev.stellium.ai`, prod at
  `https://api.stellium.ai` (`API_URL` in the env files).
- iOS selects env by scheme (Dev → Debug → `.env.dev`; Prod → Release →
  `.env.prod`); Android by product flavor (`android/app/build.gradle`).
- Verify in-app: `Config.ENV` is `development` (dev) or `production` (prod).
- Env var changes need a rebuild (`npm run ios`). Metro hot reload does not
  pick up `react-native-config` changes.
- When switching environments on iOS, stop Metro and uninstall the app first:
  `xcrun simctl uninstall booted com.irisapp.dev`.

## Quality Gates

```sh
npm test                                            # Jest
npm run lint                                        # ESLint
npx tsc -p RelationshipApp/tsconfig.json --noEmit   # typecheck (0 errors expected)
```

## Troubleshooting

### iOS PIF error ("unable to initiate PIF transfer session")

1. Quit Xcode and Simulator completely
2. Kill build processes: `pkill -9 -f xcodebuild; pkill -9 -f swift; pkill -9 -f SourceKit; pkill -9 -f XCBBuildService`
3. Clear caches:
   - DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
   - SwiftPM: `rm -rf ~/Library/Developer/Xcode/SourcePackages/*`
4. Reopen Xcode → File → Packages → Reset Package Caches → Resolve Package
   Versions → Clean Build Folder

For general React Native issues, see the
[Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.
