#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Setup Vercel deployment secrets for GitHub Actions
#
# Prerequisites:
#   1. `gh` CLI authenticated (gh auth login)
#   2. A Vercel token (https://vercel.com/account/tokens)
#
# Usage:
#   ./scripts/setup-vercel-secrets.sh <VERCEL_TOKEN>
#
# The VERCEL_ORG_ID and VERCEL_PROJECT_ID are read from
# .vercel/project.json automatically.
# ──────────────────────────────────────────────────────────────

REPO="Moeabdelaziz007/AxiomID"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <VERCEL_TOKEN>"
  echo ""
  echo "Get your token from: https://vercel.com/account/tokens"
  exit 1
fi

VERCEL_TOKEN="$1"

# Read project.json
PROJECT_JSON="$(dirname "$0")/../.vercel/project.json"
if [ ! -f "$PROJECT_JSON" ]; then
  echo "ERROR: .vercel/project.json not found. Run 'vercel link' first."
  exit 1
fi

VERCEL_ORG_ID=$(grep -o '"orgId":"[^"]*"' "$PROJECT_JSON" | cut -d'"' -f4)
VERCEL_PROJECT_ID=$(grep -o '"projectId":"[^"]*"' "$PROJECT_JSON" | cut -d'"' -f4)

if [ -z "$VERCEL_ORG_ID" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
  echo "ERROR: Could not parse orgId/projectId from $PROJECT_JSON"
  exit 1
fi

echo "Repo:         $REPO"
echo "VERCEL_ORG_ID:      $VERCEL_ORG_ID"
echo "VERCEL_PROJECT_ID:  $VERCEL_PROJECT_ID"
echo "VERCEL_TOKEN:       ${VERCEL_TOKEN:0:8}...${VERCEL_TOKEN: -4}"
echo ""

# Set secrets via gh CLI
gh secret set VERCEL_TOKEN --repo "$REPO" --body "$VERCEL_TOKEN" && echo "✅ VERCEL_TOKEN set"
gh secret set VERCEL_ORG_ID --repo "$REPO" --body "$VERCEL_ORG_ID" && echo "✅ VERCEL_ORG_ID set"
gh secret set VERCEL_PROJECT_ID --repo "$REPO" --body "$VERCEL_PROJECT_ID" && echo "✅ VERCEL_PROJECT_ID set"

echo ""
echo "Done! All 3 secrets configured."
echo "Push to main or open a PR to trigger the deploy workflow."
