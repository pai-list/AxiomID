#!/bin/bash
# Loop: logging coverage
# Checks that all route handlers have proper logging
# Usage: ./loops/logging-coverage.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "🔍 Logging Coverage Loop"
echo "========================"
echo ""

cd "$PROJECT_DIR"

# Find all route handlers
ROUTES=$(find src/app/api -name "route.ts" -type f)

TOTAL=0
WITH_LOGGER=0
WITHOUT_LOGGER=()

for route in $ROUTES; do
  TOTAL=$((TOTAL + 1))
  
  if grep -q "logger\." "$route" 2>/dev/null; then
    WITH_LOGGER=$((WITH_LOGGER + 1))
  else
    WITHOUT_LOGGER+=("$route")
  fi
done

echo "📊 Route handlers: $TOTAL"
echo "✅ With logging: $WITH_LOGGER"
echo "❌ Without logging: $((TOTAL - WITH_LOGGER))"

if [ ${#WITHOUT_LOGGER[@]} -gt 0 ]; then
  echo ""
  echo "📁 Routes missing logging:"
  for route in "${WITHOUT_LOGGER[@]}"; do
    echo "  - $route"
  done
  echo ""
  echo "⚠️ Add logger.error() to catch blocks in these routes"
  exit 1
else
  echo ""
  echo "🎉 All routes have logging coverage!"
  exit 0
fi
