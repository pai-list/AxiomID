#!/bin/bash
# Idempotent milestone creation — checks for an existing title before POSTing.
# Requires: curl, jq, GITHUB_TOKEN env var.
set -euo pipefail

REPO="Moeabdelaziz007/AxiomID"
API="https://api.github.com/repos/${REPO}/milestones"
TITLE="v1.0.0 – Identity-First Agent Platform"

DESCRIPTION=$'🚀 تحويل AxiomID إلى منصة هوية عالمية شاملة للوكلاء الذاتيين.\nيغطي هذا التحديث الجذري المعمارية الجديدة (Domain-Driven Design), محرك التشغيل الافتراضي (Execution Engine)، ونظام الـ Event Sourcing للـ Identity Jobs. يتضمن واجهة الـ AI Creator Wizard بدون برمجة (No-Code)، ومحاكي نشر النطاقات الفرعية (e.g. agent.axiomid.app).\n\nالمحاور الرئيسية:\n1. 🏗️ **Identity Core:** DDD Layer, IdentityJob State Machine, Capability Interfaces.\n2. 🔌 **Orchestration:** DefaultExecutionEngine, Step Handlers (Domain, DID, Passport, Marketplace).\n3. 🪄 **AI Creator Wizard:** Progressive UI for Subdomain reservation and Genome selection.\n4. 🌐 **Public Identity Endpoint:** Subdomain rewrites to Passport via Middleware.\n\nالهدف: تمكين 60 مليون مستخدم من إطلاق وكلائهم بهوية سيادية موثقة بنقرة واحدة.'
STATE="open"
DUE_ON="2026-08-30T00:00:00Z"

AUTH_HEADER="Authorization: token ${GITHUB_TOKEN}"
ACCEPT_HEADER="Accept: application/vnd.github.v3+json"

# --- Step 1: Check if the milestone already exists (paginated) ---
echo "Checking for existing milestone: ${TITLE}"
MILESTONE_NUMBER=""
page=1
while :; do
  PAGE_RESULT=$(curl --fail --silent --show-error \
    -H "${AUTH_HEADER}" \
    -H "${ACCEPT_HEADER}" \
    "${API}?state=all&per_page=100&page=${page}")
  [ "$(echo "${PAGE_RESULT}" | jq 'length')" -eq 0 ] && break
  MATCH=$(echo "${PAGE_RESULT}" | jq -r --arg t "${TITLE}" '.[] | select(.title == $t) | .number')
  if [ -n "${MATCH}" ]; then MILESTONE_NUMBER="${MATCH}"; break; fi
  page=$((page + 1))
done

PAYLOAD=$(jq -n \
  --arg title "${TITLE}" \
  --arg desc "${DESCRIPTION}" \
  --arg state "${STATE}" \
  --arg due "${DUE_ON}" \
  '{ title: $title, description: $desc, state: $state, due_on: $due }')

if [ -n "${MILESTONE_NUMBER}" ]; then
  # --- Step 2a: Update existing milestone ---
  echo "Milestone already exists (number: ${MILESTONE_NUMBER}). Updating..."
  curl --fail --silent --show-error \
    -X PATCH \
    -H "${AUTH_HEADER}" \
    -H "${ACCEPT_HEADER}" \
    "${API}/${MILESTONE_NUMBER}" \
    -d "${PAYLOAD}" | jq '{number, title, state, due_on, html_url}'
  echo "Milestone updated successfully."
else
  # --- Step 2b: Create new milestone ---
  echo "Milestone not found. Creating..."
  curl --fail --silent --show-error \
    -X POST \
    -H "${AUTH_HEADER}" \
    -H "${ACCEPT_HEADER}" \
    "${API}" \
    -d "${PAYLOAD}" | jq '{number, title, state, due_on, html_url}'
  echo "Milestone created successfully."
fi
