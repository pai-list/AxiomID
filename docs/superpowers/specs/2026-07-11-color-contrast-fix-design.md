# AxiomID Color Contrast Fix — Design Spec

**Date:** 2026-07-11
**Status:** Draft for review

---

## 1. Problem Statement

The AxiomID frontend has two distinct contrast failures:

1. **Dark mode low contrast**: `text-zinc-500` (#71717a) on `--bg-card` (#1d2027) fails WCAG AA (~3.8:1). `text-zinc-600` (#52525b) and `text-zinc-700` (#3f3f46) are worse — nearly invisible.

2. **Light mode catastrophically broken**: Components use hardcoded `text-white`, `border-white/5`, `bg-white/5` Tailwind classes that do NOT respond to `data-theme="light"`. In light mode, white text on near-white backgrounds renders content invisible. `border-white/10` borders vanish. `bg-white/5` card highlights disappear.

**Root cause**: The theme system (CSS custom properties in `:root` / `[data-theme="light"]`) is well-designed, but ~95% of components bypass it with hardcoded Tailwind utility classes that are static — they do not change when `data-theme` switches.

---

## 2. Goals / Non-Goals / Rollout Order

### Goals

- Every page readable in both dark and light mode at WCAG AA minimum (4.5:1 small text, 3:1 UI components)
- All text, borders, and backgrounds controlled by theme-aware CSS custom properties
- Header and Footer nav states fully defined (text + bg + border combinations)
- No hardcoded `text-white`, `text-zinc-*`, `border-white/*`, `bg-white/*` remaining in any component
- Light mode toggle actually produces a usable UI

### Non-Goals

- No visual redesign — colors remain the same in dark mode, only low-contrast text (`text-zinc-500/600/700`) gets bumped up
- No Tailwind v4 `@theme inline` expansion for colors that already have working manual CSS classes — avoid breaking existing utilities
- No high-contrast theme (future consideration)
- No dark mode value changes — only light mode values and text token upgrades change

### Rollout Order

```
Phase 1: CSS tokens (globals.css)        — 1 file, no visual change
Phase 2: Text colors (all components)     — 25 files, visual change in dark mode
Phase 3: Borders & backgrounds (all)      — 25 files, visual change in light mode
Phase 4: Header & Footer (3 files)        — Shared components, explicit checklist
Phase 5: Hardcoded dark backgrounds (5)   — Isolated components
Phase 6: Verification                     — Tests, build, visual check, WCAG spot check
```

---

## 3. Approach: Semantic Token Migration

Replace every hardcoded color class with theme-aware semantic tokens. No CSS override shim layer, no per-element `dark:` variants.

The project already has working manual CSS classes for text:
- `text-surface` → `var(--text-primary)` (#fafafa / #18181b)
- `text-subtle` → `var(--text-secondary)` (#d4d4d8 / #52525b)
- `text-faint` → `var(--text-muted)` (#a1a1aa / #71717a)

We extend this pattern for borders, backgrounds, and accent colors — adding new manual CSS classes in `globals.css` for what's missing, and using inline `style` with CSS variables for opacity variants.

---

## 4. Token Table

### Existing Text Tokens (already working)

| Class | CSS Variable | Dark Value | Light Value | WCAG AA on `--bg-card` |
|-------|-------------|------------|-------------|------------------------|
| `text-surface` | `var(--text-primary)` | `#fafafa` | `#18181b` | ✅ 15.6:1 / 15.2:1 |
| `text-subtle` | `var(--text-secondary)` | `#d4d4d8` | `#52525b` | ✅ 11.0:1 / 7.3:1 |
| `text-faint` | `var(--text-muted)` | `#a1a1aa` | `#71717a` | ✅ 6.4:1 / 4.6:1 |

### New Tokens to Add (as manual CSS classes in globals.css)

| Class | CSS Variable | Dark Value | Light Value | Purpose |
|-------|-------------|------------|-------------|---------|
| `border-border` | `var(--card-border)` | `#424754` | `#d4d8e3` | Default borders (replaces `border-white/5-15`) |
| `border-border-hover` | `var(--card-border-hover)` | `#8c909f` | `#9ca3b0` | Hover borders |
| `bg-surface-hover` | `var(--bg-card-hover)` | `#272a31` | `#f1f3f7` | Hover backgrounds (replaces `bg-white/5`) |
| `bg-surface-deep` | `var(--bg-deep)` | `#10131a` | `#f8f9fc` | Deep backgrounds (replaces `bg-[#101217]`) |
| `text-primary-color` | `var(--color-primary)` | `#3b82f6` | `#2563eb` | Primary interactive text |
| `text-danger` | `var(--color-danger)` | `#ef4444` | `#dc2626` | Error/danger text (replaces `text-red-400`) |
| `text-warning` | `var(--color-warning)` | `#f59e0b` | `#d97706` | Warning text (replaces `text-yellow-500`) |
| `text-accent` | `var(--axiom-purple)` | `#6366f1` | `#4f46e5` | Premium badge text |

For opacity variants (badge backgrounds, hover glows), use inline `style` with `color-mix()` or define explicit utility classes for the 2-3 common levels:

```css
/* globals.css — opacity utilities for accent backgrounds */
.bg-primary-10 { background: color-mix(in srgb, var(--color-primary) 10%, transparent); }
.bg-primary-20 { background: color-mix(in srgb, var(--color-primary) 20%, transparent); }
.border-primary-20 { border-color: color-mix(in srgb, var(--color-primary) 20%, transparent); }
.bg-danger-10 { background: color-mix(in srgb, var(--color-danger) 10%, transparent); }
.bg-warning-10 { background: color-mix(in srgb, var(--color-warning) 10%, transparent); }
.border-warning-20 { border-color: color-mix(in srgb, var(--color-warning) 20%, transparent); }
```

### Border Contrast Note

`--card-border` (#424754 / #d4d8e3) fails 3:1 minimum for UI components in both themes (~1.4:1 dark, ~2.6:1 light). This is accepted — border is decorative chrome, not functional. The functional interactive elements use text tokens which pass AA.

---

## 5. Mapping Matrix: Old → New

### 5.1 Text Colors

| Old Class | Use Case | New Class | Notes |
|-----------|----------|-----------|-------|
| `text-white` | Headings, body text on dark | `text-surface` | ~130 locations. In light mode resolves to `#18181b` on white bg ✅ |
| `text-white/70` | High-emphasis secondary | `text-surface` | Use solid — no opacity needed |
| `text-white/50-60` | Secondary text | `text-subtle` | ~15 locations |
| `text-white/30-40` | Muted text, labels | `text-faint` | ~15 locations |
| `text-white/20` | Decorative/faint | remove or `text-faint` | ~5 locations |
| `text-white/5-10` | Watermark step numbers | remove | ~5 locations — invisible even in dark mode |
| `text-zinc-400` | Muted text, metadata | `text-faint` | ~40 locations |
| `text-zinc-500` | Secondary text, labels | `text-subtle` | ~25 locations — fixes dark mode AA (3.8:1 → 11.0:1) |
| `text-zinc-600` | Low-priority text | `text-surface` | ~3 locations — was nearly invisible |
| `text-zinc-700` | Almost-invisible text | `text-surface` | ~2 locations — was invisible |
| `text-yellow-500` | Warning text | `text-warning` | ~5 locations — theme-managed |
| `text-red-400` | Error text | `text-danger` | ~3 locations — theme-managed |
| hardcoded `#3b82f6` | Pi badge text | `text-primary-color` | Inline styles replaced |

### 5.2 Border Colors

| Old Class | Use Case | New Class | Notes |
|-----------|----------|-----------|-------|
| `border-white/5` | Subtle card border | `border-border` | ~30 locations |
| `border-white/10` | Default card border | `border-border` | ~80 locations |
| `border-white/15` | Emphasized border | `border-border-hover` | ~10 locations |
| `border-white/20` | Badge/inner border | `border-border` | ~20 locations |
| `border-white/[0.04-0.08]` | Ultra-subtle borders | remove | ~20 locations — invisible |
| `border-white/[0.12]` | Slightly visible | `border-border` | ~5 locations |
| `border-electric-blue/20` | Accent border | `border-primary-20` | ~15 locations |
| `border-neon-green/20` | Success border | keep `border-neon-green/20` | ~5 locations — already correct |

### 5.3 Background Colors

| Old Class | Use Case | New Class | Notes |
|-----------|----------|-----------|-------|
| `bg-white/5` | Subtle highlight, hover | `bg-surface-hover` or remove | ~25 locations |
| `bg-white/10` | Badge background | `bg-surface-hover` | ~10 locations |
| `bg-white/[0.01-0.03]` | Card tint overlay | remove | ~10 locations |
| `bg-white/[0.06]` | Badge bg variant | `bg-surface-hover` | ~5 locations |
| `bg-[#101217]` | Dark card in showcase | `bg-surface-deep` | ~10 locations |
| `bg-[#08080c]` | Terminal overlay | `bg-surface-deep` | ~3 locations |
| `bg-[#050508]` | Terminal inner | `bg-surface-deep` | ~2 locations |
| `bg-electric-blue/10` | Accent tint | `bg-primary-10` | ~10 locations |
| `bg-electric-blue/20` | Icon bg | `bg-primary-20` | ~5 locations |
| `bg-neon-green/10` | Success tint | keep `bg-neon-green/10` | ~5 locations — already correct |
| `bg-yellow-500/5` | Warning tint | `bg-warning-10` | ~2 locations |
| `bg-red-500/10` | Error tint | `bg-danger-10` | ~2 locations |
| inline `rgba(59,130,246,0.1)` | Pi Browser indicator | `bg-primary-10` | Hardcoded rgba replaced |

---

## 6. Header & Footer Contrast & UX

### 6.1 Header Token Rules — Full State Definitions

**Header (public) — `src/components/Header.tsx`**

| Property | Rule | Dark Value | Light Value | Fix |
|----------|------|-----------|-------------|-----|
| **Background** | `bg-surface-deep/92 + backdrop-blur-xl` | `color-mix(#10131a 92%, transparent)` | `color-mix(#f8f9fc 92%, transparent)` | ✅ Already correct |
| **Bottom border** | `border-border` | `#424754` | `#d4d8e3` | ✅ Already correct |
| **Nav state: default** | `text-subtle` + `bg-transparent` + `border-border` | `#d4d4d8` on transparent | `#52525b` on transparent | ✅ Already correct via `btn-ghost` |
| **Nav state: hover** | `text-surface` + `bg-[rgba(var(rgb),0.04)]` + `border-border-hover` | `#fafafa` on rgba(255,255,255,0.04) | `#18181b` on rgba(0,0,0,0.04) | ✅ Already correct via `btn-ghost:hover` |
| **Nav state: active** | `text-primary-color` + `bg-primary-10` + `border-primary-20` | `#3b82f6` on rgba(59,130,246,0.1) | `#2563eb` on rgba(37,99,235,0.1) | 🔧 Was `text-neon-green` — reserved for success |
| **Vertical divider** | `bg-border` | `#424754` | `#d4d8e3` | 🔧 Was `bg-white/10` — invisible in light |
| **Pi badge bg** | `bg-primary-10` | rgba(59,130,246,0.1) | rgba(37,99,235,0.1) | 🔧 Was `bg-white/5` — invisible in light |
| **Pi badge border** | `border-primary-20` | rgba(59,130,246,0.2) | rgba(37,99,235,0.2) | 🔧 Was `border-white/10` |
| **Pi badge text** | `text-primary-color` | `#3b82f6` | `#2563eb` | 🔧 Was hardcoded `#3b82f6` |
| **Pi Browser indicator bg** | `bg-primary-10` | rgba(59,130,246,0.1) | rgba(37,99,235,0.1) | 🔧 Was hardcoded rgba string |
| **Pi Browser indicator border** | `border-primary-20` | rgba(59,130,246,0.2) | rgba(37,99,235,0.2) | 🔧 Was hardcoded rgba |
| **Pi Browser indicator text** | `text-primary-color` | `#3b82f6` | `#2563eb` | 🔧 Was hardcoded |
| **Warning badge bg** | `bg-warning-10` | rgba(245,158,11,0.1) | rgba(217,119,6,0.1) | 🔧 Was `bg-yellow-500/5` — too faint |
| **Warning badge border** | `border-warning/20` via inline style | rgba(245,158,11,0.2) | rgba(217,119,6,0.2) | 🔧 Was too faint |
| **Warning badge text** | `text-warning` | `#f59e0b` | `#d97706` | ✅ Already works |
| **Error bg** | `bg-danger-10` | rgba(239,68,68,0.1) | rgba(220,38,38,0.1) | 🔧 Was `bg-red-500/10` |
| **Error text** | `text-danger` | `#ef4444` | `#dc2626` | 🔧 Was `text-red-400` |

**Dashboard Header — `src/components/dashboard/Header.tsx`**

| Property | Rule | Dark Value | Light Value | Fix |
|----------|------|-----------|-------------|-----|
| **Background** | `bg-surface/90 + backdrop-blur-md` | `color-mix(#1d2027 90%, transparent)` | `color-mix(#ffffff 90%, transparent)` | ✅ Already correct |
| **Bottom border** | `border-border` | `#424754` | `#d4d8e3` | ✅ Already correct |
| **Brand "AXIOM"** | `text-neon-green` (keep) | `#22c55e` on `#1d2027` ✅ | `#16a34a` on `#f1f3f7` ⚠️ 5.6:1 passes AA | Keep — brand color |
| **Brand "ID"** | `text-surface` | `#fafafa` | `#18181b` | Keep |
| **Nav state: default** | `text-subtle` + `bg-transparent` + `border-transparent` | `#d4d4d8` | `#52525b` | ✅ |
| **Nav state: hover** | `text-surface` + `bg-surface-hover` + `border-border` | `#fafafa` on `#272a31` | `#18181b` on `#f1f3f7` | 🔧 Was `hover:bg-white/5` — invisible in light |
| **Nav state: active** | `text-primary-color` + `bg-primary-10` + `border-primary-20` | `#3b82f6` on rgba(59,130,246,0.1) | `#2563eb` on rgba(37,99,235,0.1) | 🔧 Was `text-neon-green` + `bg-neon-green/10` |
| **Vertical divider** | `bg-border` | `#424754` | `#d4d8e3` | 🔧 Was `bg-white/10` |
| **Pi Browser indicator** | Same as public header | theme tokens | theme tokens | 🔧 Was hardcoded |

### 6.2 Footer Token Rules — Full State Definitions

**Footer — `src/components/Footer.tsx`**

| Property | Rule | Dark Value | Light Value | Fix |
|----------|------|-----------|-------------|-----|
| **Top border** | `border-border` | `#424754` | `#d4d8e3` | ✅ Already correct |
| **Copyright text** | `text-faint` | `#a1a1aa` ✅ 7.3:1 | `#71717a` ✅ 4.6:1 | 🔧 Remove `opacity-50` — no stacked opacity on text |
| **Nav state: default** | `text-subtle` + `bg-transparent` + no border | `#d4d4d8` | `#52525b` | ✅ Already uses `text-subtle` |
| **Nav state: hover** | `text-surface` + underline animation `bg-primary` | `#fafafa` | `#18181b` | ✅ Already correct |
| **Nav underline** | `bg-electric-blue` with `group-hover:w-full` | `#3b82f6` | `#2563eb` | ✅ Already correct — `bg-electric-blue` is a valid Tailwind utility |
| **Version badge bg** | `bg-surface` | `#1d2027` | `#ffffff` | 🔧 Was `bg-white/5` — invisible in light |
| **Version badge border** | `border-border` | `#424754` | `#d4d8e3` | 🔧 Was `border-white/10` |
| **Version badge text** | `text-faint` | `#a1a1aa` ✅ 7.3:1 | `#71717a` ✅ 4.6:1 | 🔧 Was `text-zinc-500` — 3.8:1 FAILS AA in dark |

### 6.3 Accent Usage Rules

- **Nav active**: `text-primary-color` (electric-blue) — not neon-green. Reserve green for verified/success states.
- **CTA buttons**: Keep `btn-primary` class (electric-blue gradient). No accent purple on CTAs.
- **Link underlines**: `bg-primary` (electric-blue). Consistent with brand interactive color.
- **Premium badges**: `text-accent` (axiom-purple #6366f1 / #4f46e5) for "PRO", "Premium", "Sovereign" tier labels only.
  - ⚠️ `#6366f1` on `--bg-card` (#1d2027) = 3.67:1 — fails AA for small text. Use at ≥18px or bold only.
  - For small text badges, use `text-primary-color` (electric-blue) or adjust accent to a lighter shade.

---

## 7. Phased Implementation Plan

### Phase 1: New CSS Utility Classes (globals.css only)

**File:** `src/app/globals.css`
**Risk:** Low — no visual change, only adds classes

- [ ] Add utility classes for borders: `.border-border`, `.border-border-hover`
- [ ] Add utility classes for backgrounds: `.bg-surface-hover`, `.bg-surface-deep`
- [ ] Add utility classes for text: `.text-primary-color`, `.text-danger`, `.text-warning`, `.text-accent`
- [ ] Add opacity utility classes: `.bg-primary-10`, `.bg-primary-20`, `.border-primary-20`, `.bg-danger-10`, `.bg-warning-10`

### Phase 2: Text Color Migration (all components)

**Files:** ~25 component/page files
**Risk:** Medium — each replacement changes rendered color
**Validation:** Visual diff in both themes

- [ ] Replace `text-white` → `text-surface`
- [ ] Replace `text-white/50-70` → `text-subtle` or `text-surface`
- [ ] Replace `text-white/30-40` → `text-faint`
- [ ] Replace `text-white/5-20` → remove
- [ ] Replace `text-zinc-400` → `text-faint`
- [ ] Replace `text-zinc-500` → `text-subtle`
- [ ] Replace `text-zinc-600/700` → `text-surface`
- [ ] Replace `text-yellow-500` → `text-warning`
- [ ] Replace `text-red-400` → `text-danger`
- [ ] Replace inline `#3b82f6` → `text-primary-color`

### Phase 3: Border & Background Migration

**Files:** ~25 files (same as Phase 2)
**Risk:** Medium

- [ ] Replace `border-white/5-15` → `border-border`
- [ ] Replace `border-white/20` → `border-border`
- [ ] Replace `border-white/[0.04-0.12]` → `border-border` or remove
- [ ] Replace `border-electric-blue/20` → `border-primary-20`
- [ ] Replace `bg-white/5-10` → `bg-surface-hover` or remove
- [ ] Replace `bg-white/[0.01-0.06]` → remove
- [ ] Replace `bg-electric-blue/10` → `bg-primary-10`
- [ ] Replace `bg-electric-blue/20` → `bg-primary-20`
- [ ] Replace `bg-yellow-500/5` → `bg-warning-10`
- [ ] Replace `bg-red-500/10` → `bg-danger-10`

### Phase 4: Header & Footer

**Files:** `src/components/Header.tsx`, `src/components/dashboard/Header.tsx`, `src/components/Footer.tsx`
**Risk:** Medium — shared components

- [ ] Header vertical divider: `bg-white/10` → `bg-border`
- [ ] Header Pi badge: `bg-white/5 border border-white/10` → `bg-primary-10 border-primary-20`
- [ ] Header Pi badge text: hardcoded `#3b82f6` → `text-primary-color`
- [ ] Header Pi Browser indicator: hardcoded rgba → inline with CSS vars
- [ ] Header warning badge: `bg-yellow-500/5 border-yellow-500/20` → `bg-warning-10 border-warning/20`
- [ ] Header error: `bg-red-500/10 text-red-400` → `bg-danger-10 text-danger`
- [ ] Dashboard header divider: `bg-white/10` → `bg-border`
- [ ] Dashboard nav hover: `hover:bg-white/5` → `hover:bg-surface-hover`
- [ ] Dashboard active nav: `text-neon-green bg-neon-green/10 border-neon-green/20` → `text-primary-color bg-primary-10 border-primary-20`
- [ ] Dashboard Pi Browser indicator: hardcoded → theme tokens
- [ ] Footer version badge: `bg-white/5 border border-white/10 text-zinc-500` → `bg-surface border-border text-faint`
- [ ] Footer copyright: remove `opacity-50`

### Phase 5: Hardcoded Dark Backgrounds

**Files:** `InteractiveShowcase.tsx`, `TerminalOverlay.tsx`, `offline/page.tsx`
**Risk:** Low — isolated components

- [ ] `bg-[#101217]` → `bg-surface-deep`
- [ ] `bg-[#08080c]` → `bg-surface-deep`
- [ ] `bg-[#0a0a0f]` → `bg-surface-deep`
- [ ] `bg-[#050508]` → `bg-surface-deep`
- [ ] `bg-[#10131a]` → `bg-surface-deep`

### Phase 6: Verification

- [ ] `npm test` — no regressions
- [ ] `npm run build` — no type/lint errors
- [ ] Dark mode visual: landing, claim, dashboard, docs, leaderboard, explorer, passport, settings, about, privacy, terms
- [ ] Light mode visual: same 11 pages
- [ ] Header & Footer verification checklist (§7.1)
- [ ] WCAG AA spot check: 5 text elements per page using contrast checker

---

## 7.1 Header & Footer Verification Checklist

### Header (public) — `src/components/Header.tsx`

- [ ] Vertical divider visible — NOT `bg-white/10`, IS `bg-border`
- [ ] Pi Network badge has visible bg + border in light mode
- [ ] Pi badge text uses `text-primary-color`, not hardcoded `#3b82f6`
- [ ] Pi Browser indicator uses theme tokens (bg/border/text), not hardcoded rgba
- [ ] Warning badge visible in light mode — NOT `bg-yellow-500/5`, IS `bg-warning-10`
- [ ] Error bg visible in light mode — NOT `bg-red-500/10`, IS `bg-danger-10`
- [ ] Error text is `text-danger`, not `text-red-400`
- [ ] Nav links: `text-subtle` default, `text-surface` hover — meet WCAG AA in both themes
- [ ] Nav active: `text-primary-color` + `bg-primary-10` + `border-primary-20` — visible in both themes
- [ ] Focus-visible ring on all interactive elements
- [ ] Touch targets ≥ 44px (enforced by `.btn-primary` / `.btn-ghost`)
- [ ] Backdrop-blur header content readable over scrolled page content in both themes

### Dashboard Header — `src/components/dashboard/Header.tsx`

- [ ] Vertical divider visible — NOT `bg-white/10`, IS `bg-border`
- [ ] Nav hover visible — NOT `hover:bg-white/5`, IS `hover:bg-surface-hover`
- [ ] Nav active visible — NOT `bg-neon-green/10 text-neon-green`, IS `bg-primary-10 text-primary-color border-primary-20`
- [ ] Pi Browser indicator uses theme tokens
- [ ] "AXIOM" (`text-neon-green`) + "ID" (`text-surface`) visible in both themes
- [ ] No hardcoded `text-white` or `bg-white/*` remains

### Footer — `src/components/Footer.tsx`

- [ ] Version badge bg + border visible in light mode — NOT `bg-white/5 border-white/10`, IS `bg-surface border-border`
- [ ] Version badge text meets WCAG AA — NOT `text-zinc-500` (~3.8:1), IS `text-faint` (~7.3:1 dark)
- [ ] Copyright text has NO stacked opacity (`opacity-50` removed)
- [ ] Nav link default: `text-subtle`, hover: `text-surface` + underline animation — meets AA
- [ ] Link underline animation uses `bg-primary` (electric-blue), not hardcoded color name
- [ ] No hardcoded `text-white` or `text-zinc-*` remains

---

## 8. Key Constraints

1. **Don't change button classes** — `btn-primary`, `btn-ghost`, `btn-secondary` already have light-mode overrides. Only fix inline styles and utility classes in JSX.

2. **Neon-green is for success states only** — verified badges, checkmarks, "Connected" labels. Not for navigation or default interactive elements.

3. **Electric-blue is the primary interactive color** — links, CTAs, active nav items, underlines. Not for premium badges.

4. **Axiom-purple is the premium accent** — "PRO", "Sovereign" tier labels only. ⚠️ Contrast warning: `#6366f1` on `--bg-card` (#1d2027) fails AA for small text (3.67:1). Use at ≥18px or bold only.

5. **No stacked opacity on text** — `opacity-50` + `text-faint` = broken accessibility. Use the correct semantic token directly.

6. **Opacity patterns `border-white/N` are structural** — they create subtle depth on dark backgrounds. In light mode, replace with `border-border` (solid color) — the depth effect doesn't translate.

7. **Watermark elements** (step numbers like "01", "02", "03") at 5-10% opacity can be removed entirely — they were barely visible decoration even in dark mode.

---

## 9. Future Considerations

- **High-contrast theme**: Adding `[data-theme="high-contrast"]` later would require only a new CSS block — no component changes.
- **Dynamic accent colors**: The accent token could be made user-customizable via the same CSS variable mechanism.
- **Color-blind accessibility**: Interactive states should use more than just color (underline, icon). The Footer's underline animation is good — verify for other interactive elements.
- **`@theme inline` expansion**: If Tailwind v4's `@theme inline` naming conflicts are resolved in the future, the manual CSS classes can be migrated to `@theme` tokens for built-in opacity modifier support.
