#!/bin/bash

# Script to run production build with correct Firebase config
# Usage: ./run-prod.sh

echo "🔧 Setting up production environment..."

# Copy production Firebase config
echo "📱 Copying production Firebase config..."
cp ios/GoogleService-Info-Prod.plist ios/StelliumApp/GoogleService-Info.plist

# Copy production environment variables
echo "⚙️  Copying production environment variables..."
cp RelationshipApp/.env.prod .env

echo "✅ Production configuration set"
echo ""
echo "🚀 Starting production build..."

# Run the iOS build with prod scheme (Release)
ENVFILE=RelationshipApp/.env.prod npx react-native run-ios --scheme StelliumApp.Prod --simulator="iPhone 16 Pro Max"
