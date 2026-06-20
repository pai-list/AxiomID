#!/bin/bash
# Loop: fresh-clone
# Tests onboarding from scratch
# Usage: ./loops/fresh-clone.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "🔍 Fresh Clone Loop"
echo "==================="
echo ""

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo "📁 Cloning to: $TEMP_DIR"

# Clone the repo
cd "$TEMP_DIR"
git clone "$PROJECT_DIR" test-clone 2>/dev/null
cd test-clone

echo ""
echo "📋 Following README steps..."
echo ""

# Check if README exists
if [ ! -f "README.md" ]; then
  echo "❌ No README.md found!"
  exit 1
fi

# Try to install dependencies
echo "📦 Installing dependencies..."
if npm install 2>&1 | tail -5; then
  echo "✅ npm install succeeded"
else
  echo "❌ npm install failed"
  exit 1
fi

# Try to build
echo ""
echo "🔨 Building project..."
if npm run build 2>&1 | tail -5; then
  echo "✅ Build succeeded"
else
  echo "❌ Build failed"
  exit 1
fi

# Try to run tests
echo ""
echo "🧪 Running tests..."
if npm test 2>&1 | tail -5; then
  echo "✅ Tests passed"
else
  echo "❌ Tests failed"
  exit 1
fi

# Cleanup
cd /
rm -rf "$TEMP_DIR"

echo ""
echo "🎉 Fresh clone onboarding complete!"
echo "All steps passed without issues."
