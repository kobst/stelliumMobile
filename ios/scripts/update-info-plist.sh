#!/bin/bash

# This script updates Info.plist with environment-specific values
# It should be added as a pre-build script in Xcode (before Copy Bundle Resources)

INFO_PLIST="${TARGET_BUILD_DIR}/${INFOPLIST_PATH}"
PROJECT_INFO_PLIST="${PROJECT_DIR}/StelliumApp/Info.plist"

# Determine which Firebase config we're using
FIREBASE_CONFIG=""
REVERSED_CLIENT_ID=""

echo "Info.plist Update Script - CONFIGURATION: ${CONFIGURATION}"
echo "Info.plist Update Script - TARGET_NAME: ${TARGET_NAME}"

# Check if we're building the Dev scheme
if [[ "${TARGET_NAME}" == *".Dev"* ]] || [[ "${CONFIGURATION}" == *"Dev"* ]]; then
    # Dev environment
    REVERSED_CLIENT_ID="com.googleusercontent.apps.1056285065517-bm65rgfa23gehv91ftjl63shphiaqe4b"
    echo "Using Dev Google Sign-In configuration"
elif [[ "${TARGET_NAME}" == *".Prod"* ]] || [[ "${CONFIGURATION}" == *"Prod"* ]]; then
    # Prod environment
    REVERSED_CLIENT_ID="com.googleusercontent.apps.63614597334-8mamegt0j0lt54p20su2orrvpbt0qeio"
    echo "Using Prod Google Sign-In configuration"
else
    # Default to Dev
    echo "warning: Could not determine environment, defaulting to Dev"
    REVERSED_CLIENT_ID="com.googleusercontent.apps.1056285065517-bm65rgfa23gehv91ftjl63shphiaqe4b"
fi

# Update Info.plist with the correct REVERSED_CLIENT_ID
# Use PlistBuddy to update the URL scheme
/usr/libexec/PlistBuddy -c "Set :CFBundleURLTypes:0:CFBundleURLSchemes:0 ${REVERSED_CLIENT_ID}" "${PROJECT_INFO_PLIST}"

echo "Updated Info.plist with REVERSED_CLIENT_ID: ${REVERSED_CLIENT_ID}"
