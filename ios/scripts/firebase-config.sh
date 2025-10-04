#!/bin/bash

# This script copies the appropriate Firebase config file based on the build configuration and scheme
# It should be added as a pre-build script in Xcode

GOOGLE_SERVICE_INFO_PLIST=""

echo "Firebase Config Script - CONFIGURATION: ${CONFIGURATION}"
echo "Firebase Config Script - TARGET_NAME: ${TARGET_NAME}"

# Check if we're building the Dev scheme (scheme name contains .Dev)
if [[ "${TARGET_NAME}" == *".Dev"* ]] || [[ "${CONFIGURATION}" == *"Dev"* ]]; then
    GOOGLE_SERVICE_INFO_PLIST="${PROJECT_DIR}/GoogleService-Info-Dev.plist"
    echo "Using Firebase Dev configuration"
elif [[ "${TARGET_NAME}" == *".Prod"* ]] || [[ "${CONFIGURATION}" == *"Prod"* ]]; then
    GOOGLE_SERVICE_INFO_PLIST="${PROJECT_DIR}/GoogleService-Info-Prod.plist"
    echo "Using Firebase Prod configuration"
else
    # Default to Dev for safety
    echo "warning: Could not determine environment from TARGET_NAME or CONFIGURATION, defaulting to Dev"
    GOOGLE_SERVICE_INFO_PLIST="${PROJECT_DIR}/GoogleService-Info-Dev.plist"
fi

# Copy the appropriate Firebase config to GoogleService-Info.plist
cp "${GOOGLE_SERVICE_INFO_PLIST}" "${PROJECT_DIR}/GoogleService-Info.plist"

echo "Firebase configuration loaded successfully from ${GOOGLE_SERVICE_INFO_PLIST}"
