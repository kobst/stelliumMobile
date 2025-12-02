#!/bin/bash

# This script copies the appropriate Firebase config file based on the build configuration and scheme
# It should be added as a pre-build script in Xcode

GOOGLE_SERVICE_INFO_PLIST=""

echo "Firebase Config Script - CONFIGURATION: ${CONFIGURATION}"
echo "Firebase Config Script - TARGET_NAME: ${TARGET_NAME}"

# Select config strictly by build configuration
if [ "${CONFIGURATION}" == "Debug" ]; then
    GOOGLE_SERVICE_INFO_PLIST="${PROJECT_DIR}/GoogleService-Info-Dev.plist"
    echo "Using Firebase Dev configuration (Debug)"
elif [ "${CONFIGURATION}" == "Release" ]; then
    GOOGLE_SERVICE_INFO_PLIST="${PROJECT_DIR}/GoogleService-Info-Prod.plist"
    echo "Using Firebase Prod configuration (Release)"
else
    # Default to Dev for safety
    echo "warning: Unknown CONFIGURATION='${CONFIGURATION}', defaulting to Dev"
    GOOGLE_SERVICE_INFO_PLIST="${PROJECT_DIR}/GoogleService-Info-Dev.plist"
fi

# Copy the appropriate Firebase config to GoogleService-Info.plist
cp "${GOOGLE_SERVICE_INFO_PLIST}" "${PROJECT_DIR}/GoogleService-Info.plist"

echo "Firebase configuration loaded successfully from ${GOOGLE_SERVICE_INFO_PLIST}"
