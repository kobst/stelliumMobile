#!/bin/bash
set -euxo pipefail

# Install Node dependencies
npm ci

# Install Ruby gems
bundle install

# Install iOS pods
npx pod-install ios
