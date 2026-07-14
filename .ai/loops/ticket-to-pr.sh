#!/bin/bash
# Loop: ticket-to-PR-ready
# Turns a ticket/issue into a verified PR
# Usage: ./loops/ticket-to-pr.sh <issue-number>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

ISSUE_NUM="${1:-}"

if [ -z "$ISSUE_NUM" ]; then
  echo "Usage: $0 <issue-number>"
  exit 1
fi

echo "🔍 Ticket-to-PR-Ready Loop"
echo "=========================="
echo "Issue: #$ISSUE_NUM"
echo ""

cd "$PROJECT_DIR"

# Fetch issue details
echo "📋 Fetching issue #$ISSUE_NUM..."
gh issue view "$ISSUE_NUM" --json title,body,labels

# Create feature branch
BRANCH="fix/issue-$ISSUE_NUM"
echo ""
echo "🌿 Creating branch: $BRANCH"
git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"

echo ""
echo "📝 Steps:"
echo "1. Reproduce the failure"
echo "2. Prove root cause"
echo "3. Make smallest fix"
echo "4. Add regression test"
echo "5. Run full test suite"
echo "6. Create PR"
echo ""
echo "Ready to start? Run: npm test"
