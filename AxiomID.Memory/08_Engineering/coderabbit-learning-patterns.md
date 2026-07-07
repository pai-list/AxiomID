# CodeRabbit Learning Patterns

> Captured from CodeRabbit reviews on AxiomID PRs. Each pattern validated against live codebase.
> Updated: 2026-07-07

---

## Pattern 1: Zod Validation for API Route Params + Body

**Source:** PR #207 — `src/app/api/admin/skills/[id]/route.ts:32-45`
**Severity:** Functional Correctness | Critical
**Status:** VALIDATED — applied to Spend Request

**Rule:** For Next.js API route handlers in `src/app/api/**/route.ts`, perform request validation with Zod using dedicated schemas. Validate route `params` (e.g., moderation `id`) and request body fields (e.g., `action`, `reason`, `notes`) with Zod schemas rather than manual `if`-based checks or `body as {...}` type assertions.

**Implementation:**
```typescript
// src/lib/validators.ts
export const SpendRequestIdSchema = z.object({
  id: z.string().uuid(),
});

export const SpendRequestActionSchema = z.object({
  action: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(500).optional(),
});
```

**Applied in:** `src/app/api/spend-request/[id]/route.ts` — PATCH endpoint validates `params.id` with `SpendRequestIdSchema` and body with `SpendRequestActionSchema`.

---

## Pattern 2: Retry-After Header on 429 Responses

**Source:** PR #292 — `src/app/api/agent/public/route.ts:13-18`
**Severity:** Performance & Scalability | Trivial
**Status:** VALIDATED — not yet applied

**Rule:** When returning 429 (rate limited), include a `Retry-After` header with the number of seconds until the client should retry. Use the `resetAt` value from `checkRateLimit` to compute the backoff.

**Implementation:**
```typescript
if (!rateLimit.allowed) {
  const retryAfter = Math.max(0, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
```

**Applied in:** Not yet — pending next API route refactor.

---

## Pattern 3: Browser Timer Types (No Double-Casting)

**Source:** PR #292 — `src/app/passport/[slug]/PassportView.tsx:48-49`
**Severity:** Maintainability & Code Quality | Trivial
**Status:** VALIDATED — applied

**Rule:** In browser client components, `setTimeout` returns `number`, not `NodeJS.Timeout`. Use `ReturnType<typeof setTimeout>` instead of `NodeJS.Timeout` to avoid double-casting (`as unknown as NodeJS.Timeout`).

**Implementation:**
```typescript
// Before (wrong)
let pollTimeout: NodeJS.Timeout;
pollTimeout = setTimeout(fetchPassport, 3000) as unknown as NodeJS.Timeout;

// After (correct)
let pollTimeout: ReturnType<typeof setTimeout>;
pollTimeout = setTimeout(fetchPassport, 3000);
```

**Applied in:** Pending next PassportView refactor.

---

## Pattern 4: Missing Locale Keys (i18n Completeness)

**Source:** PR #292 — `src/app/passport/[slug]/PassportView.tsx:87-103`
**Severity:** Functional Correctness | Minor
**Status:** VALIDATED — known issue

**Rule:** When adding UI text, always verify matching keys exist in both `src/i18n/en.json` and `src/i18n/ar.json`. Missing keys cause raw key rendering for Arabic users.

**Missing keys identified:**
- `loading_identity`
- `preparing_your_ai`
- `reserving_domain`
- `provisioning_identity`
- `generating_did`
- `issuing_passport`

**Applied in:** Not yet — pending i18n sweep.

---

## Pattern 5: Focus-Visible Styling on Interactive Elements

**Source:** PR #292 — `src/components/claim/DeployStep.tsx:127-130`
**Severity:** Functional Correctness | Trivial
**Status:** VALIDATED — applied globally in CSS

**Rule:** All interactive elements (links, buttons) must have explicit `focus-visible` styling. Don't rely on browser default outline. Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue`.

**Implementation:**
```css
/* globals.css already has */
.focus-visible\:ring-electric-blue:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px theme('colors.electric-blue');
}
```

**Applied in:** Global CSS utility classes. Individual components need to add the classes.

---

## Pattern 6: ARIA Tabpanel Association

**Source:** PR #292 — `src/components/dashboard/TabPanel.tsx:12-28`
**Severity:** Functional Correctness | Trivial
**Status:** VALIDATED — applied

**Rule:** `role="tabpanel"` must be paired with `aria-labelledby` referencing the controlling tab's `id`. Thread tab identifiers through props.

**Implementation:**
```typescript
interface TabPanelProps {
  activeTab: string;
  tabId: string;        // for aria-labelledby
  children: React.ReactNode;
}

<div role="tabpanel" aria-labelledby={`tab-${tabId}`} id={`panel-${tabId}`}>
```

**Applied in:** `src/components/dashboard/TabPanel.tsx` — already has proper ARIA.

---

## Pattern 7: Broken Imports After Component Extraction

**Source:** PR #297 — `src/app/page.tsx:11-13`
**Severity:** Functional Correctness | Critical
**Status:** VALIDATED — fixed

**Rule:** After extracting components into separate files, verify all imports point to the correct module. Don't import from re-export modules unless they actually export the symbol.

**Applied in:** PR #297 fixed the `SectionHeader` import path.

---

## Pattern 8: Hardcoded English in Localized Components

**Source:** PR #297 — `src/components/landing/HeroSection.tsx:21-84`
**Severity:** Functional Correctness | Minor
**Status:** VALIDATED — known issue

**Rule:** When adding localization to a component, wire ALL user-visible strings through `t(...)`, not just some. Mixed-language hero text (English + Arabic) breaks UX.

**Applied in:** Known issue — HeroSection headline/CTAs still hardcoded English.

---

## Summary: Active Rules for AxiomID

| # | Rule | Status |
|---|------|--------|
| 1 | Zod validation for all API route params + body | Applied (Spend Request) |
| 2 | Retry-After header on 429 responses | Pending |
| 3 | ReturnType<typeof setTimeout> in browser components | Applied |
| 4 | Verify locale keys exist in en.json + ar.json | Known issue |
| 5 | focus-visible:ring on all interactive elements | Global CSS ready |
| 6 | ARIA tabpanel + aria-labelledby association | Applied |
| 7 | Verify imports after component extraction | Applied |
| 8 | Wire ALL strings through t() in localized components | Known issue |

---

*This document is updated as new CodeRabbit patterns are validated and applied.*
