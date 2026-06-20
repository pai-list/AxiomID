#!/bin/bash
# Loop: 100% test coverage
# Measures test coverage and identifies gaps
# Usage: ./loops/coverage.sh [--fix]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "🔍 100% Test Coverage Loop"
echo "=========================="
echo ""

cd "$PROJECT_DIR"

# Run coverage
echo "📊 Running test coverage..."
npx jest --coverage --silent 2>/dev/null | tail -20

# Parse coverage output
COVERAGE_LINE=$(npx jest --coverage --silent 2>&1 | grep "Lines" | head -1)
COVERAGE_PCT=$(echo "$COVERAGE_LINE" | grep -oE '[0-9]+\.[0-9]+' | head -1)

echo ""
echo "📈 Current coverage: ${COVERAGE_PCT:-0}%"

# Identify uncovered files
echo ""
echo "📁 Files needing coverage:"
npx jest --coverage --silent 2>&1 | grep -E "^\s*\│" | grep -v "100" | head -10

# Check if we hit 100%
if [ "$(echo "${COVERAGE_PCT:-0} >= 100" | bc -l 2>/dev/null || echo 0)" -eq 1 ]; then
  echo ""
  echo "🎉 100% coverage achieved!"
  exit 0
else
  echo ""
  echo "⚠️ Coverage below 100% — identify gaps and add tests"
  exit 1
fi
