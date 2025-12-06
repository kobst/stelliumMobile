#!/bin/bash

# Script to run development build with correct Firebase config
# Usage: ./run-dev.sh

echo "🔧 Setting up development environment..."

# Copy development Firebase config
echo "📱 Copying development Firebase config..."
cp ios/GoogleService-Info-Dev.plist ios/GoogleService-Info.plist

# Copy development environment variables
echo "⚙️  Copying development environment variables..."
cp .env.dev .env

echo "✅ Development configuration set"
echo ""
echo "🚀 Starting development build..."

# Run the iOS build with dev scheme
ENVFILE=.env.dev npx react-native run-ios --scheme StelliumApp.Dev --simulator="iPhone 16 Pro Max"
