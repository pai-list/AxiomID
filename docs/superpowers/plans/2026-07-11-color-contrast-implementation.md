# Color Contrast Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all pages readable in both dark and light mode at WCAG AA by replacing hardcoded colors with theme-aware semantic tokens.

**Architecture:** Extend existing CSS custom properties in `globals.css` with utility classes for borders, backgrounds, and accent colors. Then migrate all 40+ component files from hardcoded `text-white`/`text-zinc-*`/`border-white/*`/`bg-white/*` patterns to these semantic tokens.

**Tech Stack:** CSS custom properties, Tailwind v4, Next.js 16, React 19

## Global Constraints

- **Don't change button classes** — `btn-primary`, `btn-ghost`, `btn-secondary` already have light-mode overrides. Only fix inline styles and utility classes in JSX.
- **Neon-green is for success states only** — verified badges, checkmarks, "Connected" labels. Not for navigation.
- **Electric-blue is the primary interactive color** — links, CTAs, active nav items, underlines.
- **Axiom-purple is the premium accent** — "PRO", "Sovereign" tier labels only. Use at ≥18px or bold (contrast fails AA for small text).
- **No stacked opacity on text** — `opacity-50` + `text-faint` is broken. Use the correct semantic token directly.
- **Opacity patterns `border-white/N` are structural** — replace with `border-border` (solid color), the depth effect doesn't translate to light mode.
- **Watermark elements** at 5-10% opacity can be removed entirely.

---

## Task 1: Add CSS Utility Classes (globals.css)

**Files:** Modify `src/app/globals.css`

This task adds the utility classes that all subsequent tasks depend on. No visual change — components still use old classes until Tasks 2-5.

- [ ] **Step 1: Add border utility classes**

After the existing `.text-faint` block (around line 106), add:

```css
/* ── Border utilities (theme-aware) ─────────────── */
.border-border { border-color: var(--card-border); }
.border-border-hover { border-color: var(--card-border-hover); }
```

- [ ] **Step 2: Add background utility classes**

```css
/* ── Background utilities (theme-aware) ─────────── */
.bg-surface-hover { background: var(--bg-card-hover); }
.bg-surface-deep { background: var(--bg-deep); }
```

- [ ] **Step 3: Add text color utility classes**

```css
/* ── Text color utilities (theme-aware) ─────────── */
.text-primary-color { color: var(--color-primary); }
.text-danger { color: var(--color-danger); }
.text-warning { color: var(--color-warning); }
.text-accent { color: var(--axiom-purple); }
```

- [ ] **Step 4: Add opacity utility classes (for badge backgrounds and glows)**

```css
/* ── Opacity utilities (theme-aware) ────────────── */
.bg-primary-10 { background: color-mix(in srgb, var(--color-primary) 10%, transparent); }
.bg-primary-20 { background: color-mix(in srgb, var(--color-primary) 20%, transparent); }
.border-primary-20 { border-color: color-mix(in srgb, var(--color-primary) 20%, transparent); }
.bg-danger-10 { background: color-mix(in srgb, var(--color-danger) 10%, transparent); }
.bg-warning-10 { background: color-mix(in srgb, var(--color-warning) 10%, transparent); }
.border-warning-20 { border-color: color-mix(in srgb, var(--color-warning) 20%, transparent); }
```

- [ ] **Step 5: Verify no conflicts**

Run: `npm run build`
Expected: No errors. New classes exist but no components use them yet — build should pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(css): add semantic utility classes for borders, backgrounds, and accent colors ۞

Adds .border-border, .border-border-hover, .bg-surface-hover, .bg-surface-deep,
.text-primary-color, .text-danger, .text-warning, .text-accent, and opacity variants
(.bg-primary-10, .bg-primary-20, etc.) as theme-aware replacements for hardcoded
text-white, border-white/*, bg-white/* patterns."
```

---

> **PR Gate:** This is Phase 1 — a standalone PR. The remaining tasks form Phase 2+ and can be split into multiple PRs per file group.

---

## Task 2: Migrate Landing Page Components

**Files:** 4 files
- Modify: `src/components/landing/HeroSection.tsx`
- Modify: `src/components/landing/FeaturesSection.tsx`
- Modify: `src/components/landing/InteractiveShowcase.tsx`
- Modify: `src/components/HeroDemo.tsx`

### HeroSection.tsx

Replace:
- `text-white` → `text-surface` (line 22, headings)
- `text-zinc-400` → `text-faint` (line 34, subtitle; line 64, nav link)
- `hover:text-white` → `hover:text-surface` (line 64)
- `text-zinc-500` → `text-subtle` (line 72, stat labels)
- `bg-white/5 border border-white/10` → `bg-surface-hover border-border` (line 14, Pi badge)

### FeaturesSection.tsx

Replace:
- `text-white` → `text-surface` (line 50, step watermark; line 57, feature title)
- `text-white/5` → remove (line 50, step number watermark — barely visible)
- `text-zinc-400` → `text-faint` (line 61, feature description; line 64, badge)
- `bg-white/5 border border-white/10` → `bg-surface-hover border-border` (line 53, icon container)
- `border-white/5` → `border-border` (line 62, divider; line 25, gradient line)

### InteractiveShowcase.tsx

Replace:
- `text-white` → `text-surface` (lines 27, 52, 60, 70, 80, 102, 109-111, 147, 162, 164 — all headings and labels)
- `text-zinc-400` → `text-faint` (lines 27, 53, 61, 71, 81, 103 — all descriptions)
- `text-zinc-500` → `text-subtle` (line 108 — code comment)
- `text-zinc-600` → `text-subtle` (lines 109-110 — pipe separators in code)
- `border-white/10` → `border-border` (lines 27, 58, 68, 78, 106, 117 — card borders)
- `hover:border-electric-blue/50` → hover semantic (line 58 — accent border on hover)
- `bg-white/5` → `bg-surface-hover` (line 27 — tab inactive bg)
- `hover:bg-white/10` → `hover:bg-surface-hover` (line 27 — tab hover)
- `bg-white/10` → `bg-surface-hover` (line 147 — capsule badge)
- `border-white/20` → `border-border` (line 147 — capsule badge border)
- `bg-[#101217]` → `bg-surface-deep` (lines 58, 68, 78, 106, 117, 120, 123, 126 — dark card backgrounds)

### HeroDemo.tsx

Replace:
- `text-white` → `text-surface` (lines 116, 127 — demo labels/values)
- `text-zinc-400` → `text-faint` (line 89 — step label)

- [ ] **Step 1-4: Apply changes to HeroSection.tsx**
- [ ] **Step 5-8: Apply changes to FeaturesSection.tsx**
- [ ] **Step 9-12: Apply changes to InteractiveShowcase.tsx**
- [ ] **Step 13-16: Apply changes to HeroDemo.tsx**

- [ ] **Step 17: Verify**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 18: Visual check — landing page in dark mode**

Run: `npm run dev` → open `http://localhost:3000`
Verify: Hero section, features section, interactive showcase all render correctly in dark mode. Text colors are readable.

- [ ] **Step 19: Visual check — landing page in light mode**

Toggle theme → verify all landing page elements visible and readable.

- [ ] **Step 20: Commit**

```bash
git add src/components/landing/ src/components/HeroDemo.tsx
git commit -m "feat(landing): migrate landing page to theme-aware semantic tokens ۞

Replaces text-white, text-zinc-*, border-white/*, bg-white/*, and hardcoded
bg-[#101217] in HeroSection, FeaturesSection, InteractiveShowcase, and HeroDemo
with text-surface, text-subtle, text-faint, border-border, bg-surface-hover,
and bg-surface-deep. Landing page now renders correctly in both dark and light mode."
```

---

## Task 3: Migrate Claim Flow Components

**Files:** 4 files
- Modify: `src/components/claim/ConnectStep.tsx`
- Modify: `src/components/claim/VerifyStep.tsx`
- Modify: `src/components/claim/DeployStep.tsx`
- Modify: `src/app/claim/page.tsx`

### ConnectStep.tsx

Replace:
- `text-white/40` → `text-faint` (lines 32, 47, 81 — descriptions and wallet address)
- `text-white/30` → `text-faint` (line 96 — lock notice)
- `text-red-400` → `text-danger` (line 92 — error text)
- `text-yellow-500` → `text-warning` (line 78 — warning heading)
- `border-white/10` → `border-border` (line 59 — button border; line 77 — warning border)
- `bg-yellow-500/5 border-yellow-500/20` → `bg-warning-10 border-warning-20` (line 77 — warning box)
- `bg-red-500/5 border-red-500/20` → `bg-danger-10` (line 91 — error box)
- `border-2 border-white/30 border-t-white` → keep as spinner pattern (line 63 — loading spinner, this is a structural pattern handled by CSS animation, not color)

### VerifyStep.tsx

Replace:
- `text-white/40` → `text-faint` (lines 35, 151 — descriptions)
- `text-white/70` → `text-subtle` (line 83 — item label after connect)
- `text-white` → `text-surface` (line 83 — item label after connect)
- `text-white/30` → `text-faint` (line 91 — pending watermark)

### DeployStep.tsx

Replace:
- `text-white/40` → `text-faint` (lines 31, 54, 62, 70, 140, 172 — descriptions)
- `text-white/50` → `text-subtle` (lines 48, 119 — secondary text)
- `text-white/60` → `text-subtle` (line 73 — secondary text)
- `text-white/80` → `text-surface` (line 171 — item title)
- `text-white/30` → `text-faint` (line 91 — faint hint)
- `border-white/10` → `border-border` (line 131 — button border)

### claim/page.tsx

Replace:
- `text-white/50` → `text-subtle` (line 207 — secondary text)
- `text-white/40` → `text-faint` (lines 218, 221, 373 — labels)
- `text-white/30` → `text-faint` (line 264 — inactive step icon)
- `text-white` → `text-surface` (lines 384, 418 — step content and headings)
- `text-zinc-400` → `text-faint` (line 447 — back button)
- `hover:text-white` → `hover:text-surface` (line 447)
- `bg-white/5 hover:bg-white/10` → `bg-surface-hover hover:bg-surface-hover` (lines 447, 462)
- `bg-white/[0.06] border border-white/[0.1]` → `bg-surface-hover border-border` (line 384 — step container)
- `border-white/10` → `border-border` (lines 384, 462)
- `hover:bg-white/[0.1]` → `hover:bg-surface-hover` (line 384)

- [ ] **Step 1:** Apply ConnectStep.tsx replacements (text-white/40→text-faint, text-red-400→text-danger, text-yellow-500→text-warning, border/bg patterns)
- [ ] **Step 2:** Apply VerifyStep.tsx replacements (text-white/40→text-faint, text-white/70→text-subtle, text-white→text-surface)
- [ ] **Step 3:** Apply DeployStep.tsx replacements (all text-white/N→text-faint/subtle/surface by opacity level)
- [ ] **Step 4:** Apply claim/page.tsx replacements (text-white/N, text-zinc-400, bg-white/N, border-white/N)
- [ ] **Step 5:** Verify build — `npm run build`
- [ ] **Step 6:** Visual check claim flow (Connect, Verify, Deploy) in both themes
- [ ] **Step 7:** Commit

---

## Task 4: Migrate Docs Page

**Files:** 1 file
- Modify: `src/app/docs/page.tsx`

Replace:
- `text-white` → `text-surface` (lines 126, 152, 157, 170, 215, 222, 238, 244, 265, 299, 326, 339, 344, 352 — all headings, labels, code spans)
- `text-zinc-400` → `text-faint` (lines 138, 184 — metadata text)
- `text-zinc-500` → `text-subtle` (line 126 — search placeholder)
- `text-zinc-600` → `text-subtle` (line 329 — less-muted table cell)
- `hover:text-white` → `hover:text-surface` (line 138 — nav hover)
- `hover:bg-white/5` → `hover:bg-surface-hover` (line 138 — nav hover bg)
- `border-white/5` → `border-border` (lines 157, 222, 238, 244, 265, 339, 344 — section dividers)
- `bg-white/5 border border-white/10` → `bg-surface-hover border-border` (line 126 — search input)

- [ ] **Step 1:** Apply doc page text replacements (text-white→text-surface, text-zinc-400→text-faint, text-zinc-500→text-subtle, text-zinc-600→text-subtle, hover:text-white→hover:text-surface)
- [ ] **Step 2:** Apply doc page border/bg replacements (border-white/5→border-border, bg-white/5→bg-surface-hover, hover:bg-white/5→hover:bg-surface-hover)
- [ ] **Step 3:** Verify build — `npm run build`
- [ ] **Step 4:** Visual check docs page in both themes
- [ ] **Step 5:** Commit

---

## Task 5: Migrate Dashboard Pages

**Files:** 5 files
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/settings/page.tsx`
- Modify: `src/components/dashboard/PublishSkillForm.tsx`
- Modify: `src/components/dashboard/SpendRequestsPanel.tsx`
- Modify: `src/components/dashboard/OnboardingModal.tsx`

### dashboard/page.tsx
- `text-white` → `text-surface` (lines 125, 135 — headings)

### dashboard/settings/page.tsx
- `text-white/40` → `text-faint` (lines 268, 296 — nav links, tabs)
- `text-white/60` → `text-subtle` (lines 282, 556 — secondary text)
- `text-white/30` → `text-faint` (lines 283, 566 — tier label, empty state)
- `hover:text-white/70` → `hover:text-surface` (lines 268, 296 — hover states)
- `hover:bg-white/[0.03]` → `hover:bg-surface-hover` (line 296 — tab hover)

### PublishSkillForm.tsx
- `text-surface` ✅ already correct (line 181 — input text)
- `border-white/10` → `border-border` (line 181 — input border)
- `placeholder:text-white/20` → `placeholder:text-faint` (line 181 — placeholder)
- `bg-red-500/10 border border-red-500/20 text-red-400` → `bg-danger-10 border-danger text-danger` (line 253 — error state)

### SpendRequestsPanel.tsx
- `text-red-400` → `text-danger` (lines 173, 224 — error text)
- `bg-red-500/20 hover:bg-red-500/30` → `bg-danger-10 hover:bg-danger-20` (line 224 — error state)

### OnboardingModal.tsx
- `text-zinc-600` → `text-subtle` (line 109 — bullet separator)

- [ ] **Step 1:** Apply text replacements to dashboard/page.tsx, dashboard/settings/page.tsx, PublishSkillForm.tsx, SpendRequestsPanel.tsx, OnboardingModal.tsx per spec §4.1
- [ ] **Step 2:** Apply border/bg replacements to same 5 files per spec §4.2-4.3
- [ ] **Step 3:** Verify build — `npm run build`
- [ ] **Step 4:** Visual check dashboard (main, settings) in both themes
- [ ] **Step 5:** Commit

---

## Task 6: Migrate Dashboard Tab Components

**Files:** 5 files
- Modify: `src/components/dashboard/tabs/IqraMesh.tsx`
- Modify: `src/components/dashboard/tabs/IdentityTab.tsx`
- Modify: `src/components/dashboard/tabs/SkillsTab.tsx`
- Modify: `src/components/dashboard/tabs/MemoryTab.tsx`
- Modify: `src/components/dashboard/tabs/WalletTab.tsx`

### IqraMesh.tsx
- `text-white` → `text-surface` (lines 219, 229 — node labels)

### IdentityTab.tsx
- `text-white` → `text-surface` (line 48 — label)
- `bg-black/60 border border-white/10` → `bg-surface-deep/60 border-border` (line 48 — badge)

### SkillsTab.tsx — exact line replacements

| Line | Old | New | Reason |
|------|-----|-----|--------|
| 55 | `text-zinc-400` | `text-faint` | Section heading "Marketplace" |
| 61 | `border border-white/5 bg-white/[0.02]` | `border border-border` | Skeleton card border; remove invisible overlay |
| 62 | `bg-white/5` | keep | Skeleton loader shimmer — animation, not color |
| 63 | `bg-white/5` | keep | Same — skeleton loader |
| 68 | `text-zinc-500` | `text-subtle` | Empty state text |
| 74 | `border border-white/5 bg-white/[0.02]` | `border border-border` | Skill card border; remove invisible overlay |
| 77 | `text-zinc-200` | `text-surface` | Skill name — #e4e4e7 is ~13:1, maps to near-white |
| 82 | `text-zinc-400` | `text-faint` | Skill description |
| 94 | `text-axiom-purple` | keep | Brand accent — correct as-is |

### MemoryTab.tsx — exact line replacements

| Line | Old | New | Reason |
|------|-----|-----|--------|
| 35 | `text-zinc-400` | `text-faint` | Section heading "IQRA Neural Mesh" |
| 46 | `text-zinc-400` | `text-faint` | Section heading "Skill Nodes" |
| 52 | `bg-white/5` | keep | Skeleton loader animation |
| 56 | `text-zinc-500` | `text-subtle` | Empty state text |
| 62 | `border border-white/5 bg-white/[0.02] text-zinc-400` | `border border-border text-faint` | Skill badge — visible border, readable text |

### WalletTab.tsx — exact line replacements

| Line | Old | New | Reason |
|------|-----|-----|--------|
| 17 | `text-zinc-400` | `text-faint` | Section heading "Wallet" |
| 21 | `text-zinc-500` | `text-subtle` | Label "Connected:" |
| 38 | `text-zinc-400` | `text-faint` | Section heading "Transaction History" |
| 41 | `text-zinc-500` | `text-subtle` | Empty state text |

- [ ] **Step 1:** Apply IqraMesh.tsx + IdentityTab.tsx changes
- [ ] **Step 2:** Apply SkillsTab.tsx changes (7 lines — text-zinc-400/500/200, border-white/5, bg-white/[0.02]; keep skeleton bg-white/5)
- [ ] **Step 3:** Apply MemoryTab.tsx changes (4 lines — text-zinc-400/500, border-white/5, bg-white/[0.02])
- [ ] **Step 4:** Apply WalletTab.tsx changes (4 lines — all text-zinc-400/500)
- [ ] **Step 5:** Verify build — `npm run build`
- [ ] **Step 6:** Visual check dashboard tabs (Skills, Memory, Wallet, Identity) in both themes
- [ ] **Step 7:** Commit

---

## Task 7: Migrate Explorer, Leaderboard, Status Pages

**Files:** 3 files
- Modify: `src/app/explorer/page.tsx`
- Modify: `src/app/leaderboard/page.tsx`
- Modify: `src/app/status/page.tsx`

### explorer/page.tsx
- `text-white` → `text-surface` (lines 187, 207, 285 — headings, labels)
- `text-zinc-400` → `text-faint` (line 264 — percentage)
- `text-red-400` → `text-danger` (line 185 — error icon)

### leaderboard/page.tsx
- `text-white` → `text-surface` (lines 90, 177, 213, 266 — headings, inputs, links)
- `text-zinc-500` → `text-subtle` (line 91 — subtitle)
- `text-red-400` → `text-danger` (line 130 — error)
- `border-white/[0.06]` → `border-border` (line 213 — search input)

### status/page.tsx
- `text-red-400` → `text-danger` (line 34 — offline status)
- `text-white` → `text-surface` (lines 177, 215 — stat values)

- [ ] **Step 1:** Apply replacements to explorer/page.tsx (text-white→text-surface, text-zinc-400→text-faint, text-red-400→text-danger)
- [ ] **Step 2:** Apply replacements to leaderboard/page.tsx (text-white→text-surface, text-zinc-500→text-subtle, text-red-400→text-danger, border-white/[0.06]→border-border)
- [ ] **Step 3:** Apply replacements to status/page.tsx (text-red-400→text-danger, text-white→text-surface)
- [ ] **Step 4:** Verify build — `npm run build`
- [ ] **Step 5:** Visual check explorer, leaderboard, status pages in both themes
- [ ] **Step 6:** Commit

---

## Task 8: Migrate Secondary Pages (Agent, About, Onboarding, Signin, Offline, NotFound)

**Files:** 6 files
- Modify: `src/app/agent/[username]/page.tsx`
- Modify: `src/app/about/page.tsx`
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/app/signin/callback/page.tsx`
- Modify: `src/app/offline/page.tsx`
- Modify: `src/app/not-found.tsx`

### agent/[username]/page.tsx
- `text-white` → `text-surface` (lines 80, 109, 125, 132, 145 — headings, labels)
- `text-zinc-500` → `text-subtle` (line 130 — XP value)

### about/page.tsx
- `text-white` → `text-surface` (lines 23, 71 — headings)
- `border-white/5` → `border-border` (line 71 — section divider)

### onboarding/page.tsx
- `text-white` → `text-surface` (lines 132, 200 — heading, input)
- `text-zinc-500` → `text-subtle` (line 245 — back link)
- `text-zinc-700` → `text-surface` (line 127 — bullet)
- `hover:text-white` → `hover:text-surface` (line 245)
- `bg-white/5 border border-white/10` → `bg-surface-hover border-border` (line 200 — input)
- `text-red-400` → `text-danger` (line 104 — error state)

### signin/callback/page.tsx
- `text-white` → `text-surface` (line 100 — page bg has white text)
- `text-white/70` → `text-subtle` (line 123 — description)
- `text-red-400` → `text-danger` (line 106 — error)

### offline/page.tsx
- `text-white` → `text-surface` (lines 20, 56 — body, button)
- `text-white/50` → `text-subtle` (line 43 — description)
- `text-white/30` → `text-faint` (line 62 — footer)
- `bg-[#10131a]` → `bg-surface-deep` (line 20 — page background)

### not-found.tsx
- `text-neon-green` → keep (404 decorative, brand color)

- [ ] **Steps 1-25:** Apply replacements across 6 files
- [ ] **Step 26:** Verify build
- [ ] **Step 27:** Commit

---

## Task 9: Migrate Passport & Shared UI Components

**Files:** 7 files
- Modify: `src/app/passport/[slug]/PassportView.tsx`
- Modify: `src/app/passport/[slug]/error.tsx`
- Modify: `src/components/ui/TopThreeCards.tsx`
- Modify: `src/components/ui/RoadmapTimeline.tsx`
- Modify: `src/components/ui/NetworkGraph.tsx`
- Modify: `src/components/ui/InteractivePassportCard.tsx`
- Modify: `src/components/ui/CodeBlock.tsx`

### PassportView.tsx
- `text-white` → `text-surface` (lines 93, 109 — headings)
- `text-zinc-700` → `text-surface` (lines 98-99 — was invisible!)

### error.tsx
- `text-red-400` → `text-danger` (line 30 — error icon)

### TopThreeCards.tsx
- `text-white` → `text-surface` (line 85 — username)
- `text-zinc-500` → `text-subtle` (line 91 — score label)

### RoadmapTimeline.tsx
- `text-white` → `text-surface` (line 113 — phase title)
- `text-zinc-600` → `text-subtle` (line 120 — inactive phase)

### NetworkGraph.tsx
- `text-white` → `text-surface` (line 265 — node label)

### InteractivePassportCard.tsx
- `text-white` → `text-surface` (lines 214, 239, 286, 313 — all labels and values)

### CodeBlock.tsx
- `hover:bg-white/5` → `hover:bg-surface-hover` (line 32 — copy button hover)
- `hover:text-white` → `hover:text-surface` (line 32)

- [ ] **Steps 1-20:** Apply replacements across 7 files
- [ ] **Step 21:** Verify build
- [ ] **Step 22:** Commit

---

## Task 10: Migrate Error & Utility Components

**Files:** 5 files
- Modify: `src/components/RouteErrorPage.tsx`
- Modify: `src/components/ErrorBoundary.tsx`
- Modify: `src/components/DevModeBanner.tsx`
- Modify: `src/components/TrustTiers.tsx`
- Modify: `src/components/dashboard/QuickStatsRow.tsx`

### RouteErrorPage.tsx
- `text-red-400` → `text-danger` (line 29 — error icon)

### ErrorBoundary.tsx
- `text-yellow-500` → `text-warning` (line 22 — warning icon)

### DevModeBanner.tsx
- `bg-red-500/10 border border-red-500/30 text-red-400` → `bg-danger-10 border-danger/30 text-danger` (line 12 — dev banner)

### TrustTiers.tsx
- `text-white` → `text-surface` (line 113 — tier name)

### QuickStatsRow.tsx
- `bg-gray-500` / `bg-green-500` → keep (these are chart colors, not theme text)

- [ ] **Steps 1-10:** Apply replacements
- [ ] **Step 11:** Verify build
- [ ] **Step 12:** Commit

---

## Task 11: Migrate PWA Components

**Files:** 2 files
- Modify: `src/components/pwa/SovereignSplash.tsx`
- Modify: `src/components/pwa/InstallPWA.tsx`

### SovereignSplash.tsx
- `text-white/80` → `text-subtle` (line 66 — title)
- `text-white/30` → `text-faint` (line 75 — subtitle)

### InstallPWA.tsx
- `text-white` → `text-surface` (line 61 — install title)
- `text-white/40` → `text-faint` (line 62 — description)
- `hover:text-white` → `hover:text-surface` (line 67 — button hover)

- [ ] **Steps 1-8:** Apply replacements
- [ ] **Step 9:** Verify build
- [ ] **Step 10:** Commit

---

## Task 12: Migrate Header & Footer (Phase 4)

**Files:** 3 files
- Modify: `src/components/Header.tsx`
- Modify: `src/components/dashboard/Header.tsx`
- Modify: `src/components/Footer.tsx`

See spec §6.1 and §6.2 for full state definitions.

### Header.tsx
- Divider: `bg-white/10` → `bg-border` (line 59)
- Pi badge: `bg-white/5 border border-white/10` → `bg-primary-10 border-primary-20` (line 60)
- Pi badge text: inline `style={{ color: '#3b82f6' }}` → `text-primary-color` (line 65 wraps in inline style — change to `style={{ color: 'var(--color-primary)' }}`)
- Pi Browser indicator: inline rgba → `bg-primary-10 border-primary-20 text-primary-color` (line 83)
- Warning badge: `bg-yellow-500/5 border-yellow-500/20 text-yellow-500` → `bg-warning-10 border-warning-20 text-warning` (line 105)
- Error msg: `bg-red-500/10 text-red-400` → `bg-danger-10 text-danger` (line 115)
- Error border: `border-red-500/20` → `border-danger-20`

### dashboard/Header.tsx
- Divider: `bg-white/10` → `bg-border` (line 50)
- Nav hover: `hover:bg-white/5` → `hover:bg-surface-hover` (line 68)
- Active nav: `text-neon-green bg-neon-green/10 border-neon-green/20` → `text-primary-color bg-primary-10 border-primary-20` (lines 67-69)
- Pi Browser indicator: as above
- "AXIOM" `text-neon-green` → keep (brand color)
- "ID" `text-surface` → keep

### Footer.tsx
- Version badge: `bg-white/5 border border-white/10 text-zinc-500` → `bg-surface border-border text-faint` (line 53)
- Copyright: remove `opacity-50` (line 42 — change to `opacity-100` or remove attribute)
- Version dot: `bg-neon-green` → keep (success indicator)

- [ ] **Steps 1-20:** Apply replacements across 3 files
- [ ] **Step 21:** Verify build
- [ ] **Step 22:** Run `npm test` — no regressions (Header/Footer are shared, affect many pages)
- [ ] **Step 23:** Visual check both headers + footer in dark/light mode
- [ ] **Step 24:** Commit

---

## Task 13: Migrate Hardcoded Dark Backgrounds (Phase 5)

**Files:** 5 files
- Modify: `src/components/landing/InteractiveShowcase.tsx` (bg-[#101217] in tab content panels)
- Modify: `src/components/dashboard/TerminalOverlay.tsx` (bg-[#08080c], bg-[#0a0a0f], bg-[#050508])
- Modify: `src/app/offline/page.tsx` (bg-[#10131a])

### InteractiveShowcase.tsx
- `bg-[#101217]` → `bg-surface-deep` (lines 58, 68, 78, 106, 117 — already partially done in Task 2, verify)

### TerminalOverlay.tsx
- `bg-[#08080c]` → `bg-surface-deep`
- `bg-[#0a0a0f]` → `bg-surface-deep`
- `bg-[#050508]` → `bg-surface-deep`

### offline/page.tsx
- `bg-[#10131a]` → `bg-surface-deep` (line 20)

- [ ] **Steps 1-8:** Apply replacements
- [ ] **Step 9:** Verify build
- [ ] **Step 10:** Commit

---

## Task 14: Verification (Phase 6)

- [ ] **Step 1: Run test suite**

Run: `npm test`
Expected: All tests pass. If any snapshot tests fail (they likely will since colors changed), update snapshots with `npm test -- -u`.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no type errors or lint warnings.

- [ ] **Step 3: Dark mode visual check**

Open each page in dark mode:
- [ ] Landing (/) — Hero, Features, Interactive Showcase tabs
- [ ] Claim (/claim) — Connect, Verify, Deploy steps
- [ ] Dashboard (/dashboard) — main, settings, each tab
- [ ] Docs (/docs) — search, sections, route table
- [ ] Leaderboard (/leaderboard)
- [ ] Explorer (/explorer)
- [ ] Passport (/passport/test-slug)
- [ ] Agent (/agent/test-user)
- [ ] Status (/status)
- [ ] About (/about)
- [ ] Onboarding (/onboarding)
- [ ] Signin callback (/signin/callback)
- [ ] Offline (/offline)
- [ ] 404 page

- [ ] **Step 4: Light mode visual check** — same 14 pages, verify all text visible

- [ ] **Step 5: Header & Footer checklist** (see spec §7.1)

- [ ] **Step 6: WCAG AA spot check**

Use browser DevTools color picker contrast checker on 5 text elements per page:
- [ ] Main heading contrast ≥ 4.5:1
- [ ] Body text contrast ≥ 4.5:1
- [ ] Muted/label text contrast ≥ 4.5:1
- [ ] Border chrome contrast ≥ 3:1 (note: decorative borders at ~1.4:1 are accepted)

- [ ] **Step 7: Final commit with verification evidence**

```bash
git add -A
git commit -m "verification: color contrast fix — all pages pass AA, light/dark mode verified ۞"
```
