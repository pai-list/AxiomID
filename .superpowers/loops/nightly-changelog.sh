#!/bin/bash
# Loop: nightly changelog
# Updates changelog with recent changes
# Usage: ./loops/nightly-changelog.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "🔍 Nightly Changelog Loop"
echo "========================="
echo ""

cd "$PROJECT_DIR"

# Get commits from last 24 hours
echo "📋 Commits from last 24 hours:"
git log --since="24 hours ago" --oneline --format="%h %s" | head -20

# Count commits
COMMIT_COUNT=$(git log --since="24 hours ago" --oneline | wc -l)

echo ""
echo "📊 Total commits: $COMMIT_COUNT"

if [ "$COMMIT_COUNT" -eq 0 ]; then
  echo "ℹ️ No changes in last 24 hours — nothing to update"
  exit 0
fi

# Check if CHANGELOG.md exists
if [ ! -f "CHANGELOG.md" ]; then
  echo "📝 Creating CHANGELOG.md..."
  cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to AxiomID will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

EOF
fi

# Get today's date
TODAY=$(date +%Y-%m-%d)

# Check if today's entry exists
if grep -q "## \[$TODAY\]" CHANGELOG.md 2>/dev/null; then
  echo "ℹ️ Today's entry already exists in CHANGELOG.md"
else
  echo ""
  echo "📝 Adding entry for $TODAY..."
  
  # Generate changelog entry
  ENTRY="## [$TODAY]

### Added
$(git log --since="24 hours ago" --oneline | grep -i "feat\|add\|new" | sed 's/^/- /')

### Fixed
$(git log --since="24 hours ago" --oneline | grep -i "fix\|bug\|patch" | sed 's/^/- /')

### Changed
$(git log --since="24 hours ago" --oneline | grep -i "refactor\|update\|change\|improve" | sed 's/^/- /')

"
  
  # Insert after [Unreleased]
  sed -i.bak "/^## \[Unreleased\]/a\\
\\
$ENTRY" CHANGELOG.md
  
  rm -f CHANGELOG.md.bak
  
  echo "✅ CHANGELOG.md updated"
fi

echo ""
echo "🎉 Nightly changelog update complete!"
