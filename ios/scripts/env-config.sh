#!/bin/bash

# This script copies the appropriate .env file based on the build configuration
# It should be added as a pre-build script in Xcode

ENV_FILE=""

if [ "${CONFIGURATION}" == "Debug.Dev" ] || [ "${CONFIGURATION}" == "Release.Dev" ]; then
    ENV_FILE=".env.dev"
elif [ "${CONFIGURATION}" == "Debug.Prod" ] || [ "${CONFIGURATION}" == "Release.Prod" ] || [ "${CONFIGURATION}" == "Debug" ] || [ "${CONFIGURATION}" == "Release" ]; then
    ENV_FILE=".env.prod"
else
    echo "warning: Unknown configuration '${CONFIGURATION}', defaulting to .env.dev"
    ENV_FILE=".env.dev"
fi

echo "Using environment config: ${ENV_FILE}"

# Copy the appropriate env file to the project root
cp "${PROJECT_DIR}/../${ENV_FILE}" "${PROJECT_DIR}/../.env"

echo "Environment configuration loaded successfully"