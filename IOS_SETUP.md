# iOS Build Configuration Setup

This guide walks through setting up separate Dev and Prod schemes in Xcode for the StelliumApp project.

## Prerequisites
- Xcode installed
- CocoaPods configured (`cd ios && pod install`)

## Step-by-Step Configuration

### 1. Duplicate Build Configurations

1. Open `ios/StelliumApp.xcworkspace` in Xcode
2. Select the project in the Project Navigator (top-level "StelliumApp")
3. Select the "StelliumApp" project (not target) in the editor
4. Go to the "Info" tab
5. Under "Configurations", duplicate existing configurations:
   - Duplicate "Debug" → Rename to "Debug.Dev"
   - Duplicate "Debug" → Rename to "Debug.Prod"
   - Duplicate "Release" → Rename to "Release.Dev"
   - Duplicate "Release" → Rename to "Release.Prod"

### 2. Create Schemes

1. Go to **Product → Scheme → Manage Schemes**
2. Duplicate the "StelliumApp" scheme:
   - Click "StelliumApp" and click the gear icon → "Duplicate"
   - Name it "StelliumApp.Dev"
3. For **StelliumApp.Dev** scheme:
   - Click "Edit"
   - For each phase (Build, Run, Test, Profile, Analyze, Archive):
     - Set Build Configuration to use `.Dev` variants
     - Run: Debug.Dev
     - Archive: Release.Dev
4. Duplicate again for "StelliumApp.Prod":
   - For each phase, use `.Prod` variants
   - Run: Debug.Prod
   - Archive: Release.Prod

### 3. Configure Bundle Identifiers

1. Select the "StelliumApp" target
2. Go to "Build Settings"
3. Search for "Product Bundle Identifier"
4. Click the disclosure triangle to expand configurations
5. Set bundle IDs per configuration:
   - Debug.Dev: `com.stelliumapp.dev`
   - Release.Dev: `com.stelliumapp.dev`
   - Debug.Prod: `com.stelliumapp`
   - Release.Prod: `com.stelliumapp`

### 4. Configure Display Names

1. Still in "Build Settings"
2. Search for "Product Name"
3. Set per configuration:
   - Debug.Dev: `Stellium Dev`
   - Release.Dev: `Stellium Dev`
   - Debug.Prod: `Stellium`
   - Release.Prod: `Stellium`

### 5. Add Pre-Build Environment Script

1. Select the "StelliumApp" target
2. Go to "Build Phases"
3. Click "+" → "New Run Script Phase"
4. Drag it to the top (before "Check Pods Manifest.lock")
5. Name it "Setup Environment Config"
6. Add script content:
```bash
"${PROJECT_DIR}/scripts/env-config.sh"
```
7. Check "Run script: Based on dependency analysis"

### 6. Configure Firebase per Environment

You'll need separate Firebase projects for dev and prod:

1. Create two Firebase projects:
   - `stellium-dev`
   - `stellium-prod`

2. Download `GoogleService-Info.plist` for each project

3. Add both to Xcode:
   - Rename them: `GoogleService-Info-Dev.plist` and `GoogleService-Info-Prod.plist`
   - Add to project (don't add to target)

4. Add another Run Script Phase (after "Setup Environment Config"):
   - Name: "Select Firebase Config"
   - Script:
```bash
if [ "${CONFIGURATION}" == *"Dev"* ]; then
    cp "${PROJECT_DIR}/GoogleService-Info-Dev.plist" "${PROJECT_DIR}/GoogleService-Info.plist"
else
    cp "${PROJECT_DIR}/GoogleService-Info-Prod.plist" "${PROJECT_DIR}/GoogleService-Info.plist"
fi
```

### 7. Run Pod Install

After making these changes:
```bash
cd ios
pod install
```

## Building and Running

### Development Build
```bash
# From project root
npm run ios:dev
# or in Xcode, select "StelliumApp.Dev" scheme
```

### Production Build
```bash
# From project root
npm run ios:prod
# or in Xcode, select "StelliumApp.Prod" scheme
```

## Verification

To verify the configuration is working:
1. Build with Dev scheme - should see "Stellium Dev" app name
2. Check bundle ID in Xcode: Product → Scheme → Edit Scheme → Info tab
3. Verify API endpoint in app (add temporary log in `apiClient.ts` if needed)

## Troubleshooting

**Pod Installation Issues:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

**Firebase Configuration Not Loading:**
- Verify Run Script phase order (Environment Config must be first)
- Check script has execute permissions: `chmod +x ios/scripts/env-config.sh`

**Bundle ID Conflicts:**
- Ensure dev and prod use different bundle IDs
- Update provisioning profiles if using Apple Developer Account