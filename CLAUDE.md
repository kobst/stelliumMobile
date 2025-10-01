# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StelliumApp is a React Native mobile application for AI-powered astrology guidance. It uses Firebase Authentication, Google Sign-In, and connects to a backend API for astrological analysis and birth chart generation.

## Branch Strategy

- **`dev`**: Development branch - day-to-day development work, points to dev API
- **`main`** (or `prod`): Production branch - release-ready code, points to prod API
  - Protected with PR requirements and status checks
  - All changes must go through pull request review
  - Never commit directly to this branch

## Development Commands

```bash
# Environment-specific commands
npm run start:dev      # Start Metro bundler with dev config
npm run start:prod     # Start Metro bundler with prod config

# Android
npm run android:dev    # Run dev build on Android
npm run android:prod   # Run prod build on Android
npm run android:build:dev   # Build dev release APK
npm run android:build:prod  # Build prod release APK

# iOS (requires Xcode scheme setup - see IOS_SETUP.md)
npm run ios:dev        # Run dev build on iOS
npm run ios:prod       # Run prod build on iOS

# Code quality
npm run lint          # Run ESLint
npm test             # Run Jest tests

# iOS-specific setup
bundle install        # Install Ruby gems
bundle exec pod install  # Install iOS CocoaPods dependencies (run from ios/ directory)
```

## Environment Configuration

The app uses `react-native-config` for environment-specific configuration:

- **Dev environment** (`.env.dev`): Points to `https://api.dev.stellium.ai`
- **Prod environment** (`.env.prod`): Points to `https://api.stellium.ai`

### Android Build Flavors
- `dev`: Bundle ID `com.stelliumapp.dev`, app name "Stellium Dev"
- `prod`: Bundle ID `com.stelliumapp`, app name "Stellium"

### iOS Schemes
- `StelliumApp.Dev`: Bundle ID `com.stelliumapp.dev`, app name "Stellium Dev"
- `StelliumApp.Prod`: Bundle ID `com.stelliumapp`, app name "Stellium"

See `IOS_SETUP.md` for detailed iOS configuration instructions.

## Architecture

### Authentication Flow
- App starts with `AuthScreen.tsx` until user authenticates
- Firebase Auth integration with Google Sign-In and phone verification
- Auth state managed via Firebase `onAuthStateChanged` listener

### Core Components
- `App.tsx`: Main app container with conditional auth rendering
- `AuthScreen.tsx`: Handles all authentication methods (Google, phone, Facebook placeholder)
- `api.ts`: Centralized API layer for backend communication
- `constants.ts`: Astrology domain data (signs, planets, houses, aspects)

### Backend Integration
API functions in `api.ts` handle:
- User profile management (`createUser`, `getUser`)
- Astrology chart generation (`getBirthChartAnalysis`, `getCompositeCharts`)
- AI-powered analysis (`handleUserQuery`)
- Relationship compatibility scoring

## Platform Configuration

### Android
- Min SDK 24, Target SDK 35
- Namespace: `com.stelliumapp`
- Firebase config: `android/app/google-services.json`

### iOS
- Min iOS 16.0
- Uses static frameworks for Firebase compatibility
- Firebase config: `ios/GoogleService-Info.plist`
- CocoaPods manages dependencies

## Environment Variables

- `REACT_APP_SERVER_URL`: Backend API base URL
- `REACT_APP_GOOGLE_API_KEY`: For timezone/location services

## Astrology Domain

The app includes extensive astrology calculations and data:
- Zodiac signs, planets, houses with comprehensive mappings
- Aspect calculations (conjunction, sextile, square, trine, opposition, quincunx)
- Elements/modalities classification and planetary dominance scoring
- Multiple analysis categories for personality, relationships, career, etc.

## Development Notes

- TypeScript configured with React Native presets
- Jest testing setup with React Native preset
- Metro bundler with default configuration
- Firebase deeply integrated - ensure config files are present before building