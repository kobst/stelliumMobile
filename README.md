This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

If you are running this project in the Codex environment, execute `./setup.sh` to install Node modules and CocoaPods before network access is disabled.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
# stelliumMobile

## Environments (Dev vs Prod)

This app supports separate Dev and Prod environments across iOS and Android. Below is how the two environments are selected, run, and verified.

### iOS
- Build selection: we use Xcode schemes to select the environment
  - StelliumApp.Dev → Debug configuration (Dev)
  - StelliumApp.Prod → Release configuration (Prod)
- Build scripts (run on every build):
  - `ios/scripts/env-config.sh`: copies `.env.dev` for Debug and `.env.prod` for Release
  - `ios/scripts/firebase-config.sh`: copies the correct `GoogleService-Info-*.plist` into `ios/GoogleService-Info.plist`
  - `ios/scripts/update-info-plist.sh`: injects the correct Google Sign-In reversed client ID into `Info.plist`
- Run commands:
  - Dev: `./run-dev.sh` or `npm run ios:dev` or `npx react-native run-ios --scheme StelliumApp.Dev --simulator "iPhone 16 Pro Max"`
  - Prod: `./run-prod.sh` or `npm run ios:prod` or `npx react-native run-ios --scheme StelliumApp.Prod --simulator "iPhone 16 Pro Max"`
  - Simulator is optional; if omitted, the last-booted device is used. List devices with `npx react-native run-ios --list-devices`.
- Verify the environment (build logs):
  - Look for: "Using Firebase Dev configuration (Debug)" or "Using Firebase Prod configuration (Release)"
  - Look for: "Using Dev/Prod Google Sign-In configuration (Debug/Release)"
  - In-app: `Config.ENV` should be `development` for Dev and `production` for Prod
- Recommended when switching environments:
  - Stop Metro (Ctrl+C)
  - Uninstall the app from the simulator: `xcrun simctl uninstall booted com.stelliumapp.dev`
  - Then run the desired environment as above

Notes:
- The Release build currently uses bundle id `com.stelliumapp.dev` for local simulator runs. For App Store archives, update the Release bundle identifier to `com.stelliumapp` and ensure the provisioning/signing and Firebase plist match.

### Android
- Product flavors: `dev` and `prod` (see `android/app/build.gradle`)
  - `.env` mapping is set via `project.ext.envConfigFiles` (Dev ↔ .env.dev, Prod ↔ .env.prod)
  - Firebase configs: `android/app/src/dev/google-services.json` and `android/app/src/prod/google-services.json`
- Run commands:
  - Dev: `npm run android:dev`
  - Prod (debuggable): `npm run android:prod`
  - Build release: `npm run android:build:prod`
- Verify:
  - `Config.ENV` inside the app shows `development` (Dev) or `production` (Prod)
  - The correct Firebase project is used on login

### Build Phase Order (iOS)
- Ensure these run before "Copy Bundle Resources":
  - Setup Environment Config
  - Copy Firebase Config
  - Update Info-Plist
- Keep "Run script only when installing" unchecked for both scripts so they run for every build.

### Troubleshooting
- PIF error (unable to initiate PIF transfer session):
  - Quit Xcode and Simulator completely
  - Kill build processes: `pkill -9 -f xcodebuild; pkill -9 -f swift; pkill -9 -f SourceKit; pkill -9 -f XCBBuildService`
  - Clear caches:
    - DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
    - SwiftPM: `rm -rf ~/Library/Developer/Xcode/SourcePackages/*`
  - Optional: remove workspace `Package.resolved` files; Xcode will recreate them
  - Reopen Xcode → File → Packages → Reset Package Caches → Resolve Package Versions → Clean Build Folder
