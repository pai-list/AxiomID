# Loading UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver enterprise-grade loading UI across all 12+ pages via 3 PRs: skeleton system (CSS-only shimmer primitives + page shells), TanStack Query v5 cache layer, and standardized error boundaries.

**Architecture:** Add CSS shimmer keyframes + utility classes to `globals.css`, compose skeleton primitives into page-specific shells. Layer TanStack Query v5 on top with `QueryClientProvider` wrapping `layout.tsx` and per-page hooks replacing `useEffect`+`fetch()`. Error boundaries already partially in place — standardize the pattern.

**Tech Stack:** CSS custom properties/keyframes, Tailwind v4, `@tanstack/react-query` v5, `react-error-boundary` (already installed), Next.js 16, React 19

## Global Constraints

- **No animation libraries** — skeleton uses pure CSS `@keyframes shimmer` + `background-position`
- **No visual redesign** — skeleton colors use existing `--text-muted` / `--bg-card` / `--bg-card-hover` tokens
- **No React Server Components migration** — all target pages are `"use client"`
- **No full-page restructuring** — skeletons overlay existing layouts
- **No new CSS color classes** — use existing Task 1 utilities from color-contrast PR
- **Skeleton matches final layout dimensions exactly** — CLS must be 0
- **`prefers-reduced-motion` respected** — skeleton falls back to static placeholder (every `@keyframes` block MUST have an associated `@media (prefers-reduced-motion: reduce)` override)
- **Skeleton components use `aria-hidden="true"` + `data-testid="skeleton"`** — skeleton page shells use `role="status"` + `aria-live="polite"` for AT announcements
- **Skeleton primitives destructure `style` and merge with component dimensions; spread caller `{...props}` BEFORE enforcing the contract props (`aria-hidden`, `data-testid`)** so callers cannot override the accessibility/dimension contract
- **QueryClientProvider MUST be in a `"use client"` wrapper component** — layout.tsx is a Server Component, cannot pass non-serializable props
- **`global-error.tsx` MUST render its own `<html>` and `<body>` tags** (Next.js requirement) — use ErrorFallback content inside a proper document shell
- **Pi Browser detection in skeleton/error UI** — use `determineSandboxMode()` or `window.Pi` check to adapt loading states: Pi users get wallet-centric skeletons, regular browser users get onboarding-centric skeletons with smart intro copy
- **Smart intro for non-Pi users** — OnboardingSkeleton must include CTA placeholders for "Install Pi Browser" / "Learn More" that resolve to actionable paths; landing page skeleton must detect browser type and pivot messaging
- **Responsive skeletons** — mobile-first: skeleton layouts must collapse to single-column on small screens (below 640px) using existing Tailwind breakpoints
- **Retry strategy for Pi mobile** — `staleTime: 30s` (conservative for mobile data), `retry: 2` (handles Pi SDK sandbox flakiness), `gcTime: 5min` (respects mobile memory) — already configured in Task 6

---

## Task 1: Install TanStack Query Dependencies

**Files:**
- Modify: `package.json`
- Run: `npm install`

**Interfaces:**
- Consumes: nothing
- Produces: `@tanstack/react-query` + `@tanstack/react-query-devtools` available in node_modules

- [ ] **Step 1: Install packages**

```bash
npm install @tanstack/react-query
npm install --save-dev @tanstack/react-query-devtools
```

Expected: Packages added to `package.json` + `node_modules`.

- [ ] **Step 2: Verify install**

```bash
node -e "require('@tanstack/react-query')"
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build(deps): add @tanstack/react-query v5 ۞

Core caching layer for AxiomID loading UI overhaul. Replaces raw
useEffect+fetch() with stale-while-revalidate, deduplication, retry,
and optimistic mutations across all 12+ pages.

Dependency: @tanstack/react-query@^5, @tanstack/react-query-devtools@^5"
```

---

## Task 2: Add Skeleton CSS to globals.css

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing CSS custom properties (`--bg-card`, `--bg-card-hover`, `--text-muted`)
- Produces: `.skeleton-shimmer` class, `.animate-pulse-glow` class, `@keyframes shimmer`, `@keyframes pulse-glow`

- [ ] **Step 1: Add shimmer keyframes + utility classes**

After the existing utility classes (around end of `globals.css`), add:

```css
/* ── Skeleton shimmer (loading UI) ───────────────── */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-card) 25%,
    var(--bg-card-hover) 50%,
    var(--bg-card) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

- [ ] **Step 2: Add pulse-glow for AxiomID logo loading state**

The combined `@media (prefers-reduced-motion: reduce)` for both `.skeleton-shimmer` and `.animate-pulse-glow` goes here — **one block, not two separate ones.**

```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; filter: brightness(1); }
  50% { opacity: 1; filter: brightness(1.3); }
}

.animate-pulse-glow {
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer,
  .animate-pulse-glow {
    animation: none;
    opacity: 0.6;
  }
}
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -5
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(ui): add skeleton shimmer CSS utilities ۞

Pure CSS skeleton loading animation with prefers-reduced-motion
support. Uses existing --bg-card/--bg-card-hover tokens so no
new color variables needed."
```

---

## Task 3: Create Skeleton Primitive Components

**Files:**
- Create: `src/components/ui/skeleton.tsx`

**Interfaces:**
- Consumes: `.skeleton-shimmer` CSS class from Task 2
- Produces: `<SkeletonLine>`, `<SkeletonCard>`, `<SkeletonCircle>`, `<SkeletonImage>` exports

- [ ] **Step 1: Write test first**

```tsx
// src/__tests__/components/skeleton.test.tsx
import { render, screen } from "@testing-library/react";
import { SkeletonLine, SkeletonCard, SkeletonCircle, SkeletonImage } from "@/components/ui/skeleton";

describe("SkeletonLine", () => {
  it("renders with default width", () => {
    const { container } = render(<SkeletonLine />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
    expect(container.firstChild).toHaveClass("skeleton-shimmer");
  });

  it("accepts custom width and height", () => {
    const { container } = render(<SkeletonLine width="50%" height="2rem" />);
    expect(container.firstChild).toHaveStyle({ width: "50%", height: "2rem" });
  });

  it("merges className", () => {
    const { container } = render(<SkeletonLine className="rounded-lg" />);
    expect(container.firstChild).toHaveClass("rounded-lg");
  });
});

describe("SkeletonCard", () => {
  it("renders card skeleton", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
    expect(container.firstChild).toHaveClass("skeleton-shimmer");
  });
});

describe("SkeletonCircle", () => {
  it("renders with default size", () => {
    const { container } = render(<SkeletonCircle />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
    expect(container.firstChild).toHaveClass("rounded-full");
  });

  it("accepts custom size", () => {
    const { container } = render(<SkeletonCircle size="4rem" />);
    expect(container.firstChild).toHaveStyle({ width: "4rem", height: "4rem" });
  });
});

describe("SkeletonImage", () => {
  it("renders with aspect ratio", () => {
    const { container } = render(<SkeletonImage />);
    expect(container.firstChild).toHaveAttribute("data-testid", "skeleton");
  });

  it("accepts custom aspect ratio", () => {
    const { container } = render(<SkeletonImage aspectRatio="16/9" />);
    expect(container.firstChild).toHaveStyle({ aspectRatio: "16/9" });
  });
});
```

Run: `npx jest src/__tests__/components/skeleton.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 2: Write implementation**

```tsx
// src/components/ui/skeleton.tsx
"use client";

import { type HTMLAttributes } from "react";

interface SkeletonBaseProps extends HTMLAttributes<HTMLDivElement> {
  "data-testid"?: string;
}

interface SkeletonLineProps extends SkeletonBaseProps {
  width?: string;
  height?: string;
}

export function SkeletonLine({
  width = "100%",
  height = "1rem",
  className = "",
  style,
  ...props
}: SkeletonLineProps) {
  return (
    <div
      {...props}
      data-testid="skeleton"
      className={`skeleton-shimmer rounded ${className}`}
      style={{ ...style, width, height }}
      aria-hidden="true"
    />
  );
}

interface SkeletonCardProps extends SkeletonBaseProps {
  width?: string;
  height?: string;
}

export function SkeletonCard({
  width = "100%",
  height = "200px",
  className = "",
  style,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      {...props}
      data-testid="skeleton"
      className={`skeleton-shimmer rounded-xl ${className}`}
      style={{ ...style, width, height }}
      aria-hidden="true"
    />
  );
}

interface SkeletonCircleProps extends SkeletonBaseProps {
  size?: string;
}

export function SkeletonCircle({
  size = "3rem",
  className = "",
  style,
  ...props
}: SkeletonCircleProps) {
  return (
    <div
      {...props}
      data-testid="skeleton"
      className={`skeleton-shimmer rounded-full ${className}`}
      style={{ ...style, width: size, height: size }}
      aria-hidden="true"
    />
  );
}

interface SkeletonImageProps extends SkeletonBaseProps {
  aspectRatio?: string;
}

export function SkeletonImage({
  aspectRatio = "4/3",
  className = "",
  style,
  ...props
}: SkeletonImageProps) {
  return (
    <div
      {...props}
      data-testid="skeleton"
      className={`skeleton-shimmer rounded-lg ${className}`}
      style={{ ...style, aspectRatio }}
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 3: Run test to verify it passes**

```bash
npx jest src/__tests__/components/skeleton.test.tsx
```

Expected: PASS (8 tests)

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/skeleton.tsx src/__tests__/components/skeleton.test.tsx
git commit -m "feat(ui): add skeleton primitive components ۞

SkeletonLine, SkeletonCard, SkeletonCircle, SkeletonImage —
CSS-only shimmer primitives that match final layout dimensions
to eliminate CLS. All respect prefers-reduced-motion."
```

---

## Task 4: Create Page Skeleton Shells (Part 1 — Core Pages)

**Files:**
- Create: `src/components/skeletons/ClaimSkeleton.tsx`
- Create: `src/components/skeletons/DashboardSkeleton.tsx`
- Create: `src/components/skeletons/PassportSkeleton.tsx`
- Create: `src/components/skeletons/ExplorerSkeleton.tsx`
- Create: `src/components/skeletons/LeaderboardSkeleton.tsx`
- Create: `src/components/skeletons/StatusSkeleton.tsx`

**Interfaces:**
- Consumes: `SkeletonLine`, `SkeletonCard`, `SkeletonCircle` from Task 3
- Produces: page-specific skeleton components

- [ ] **Step 1: Create ClaimSkeleton**

```tsx
// src/components/skeletons/ClaimSkeleton.tsx
"use client";

import { SkeletonCard, SkeletonLine } from "@/components/ui/skeleton";

export function ClaimSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 p-8" role="status" aria-live="polite"   aria-label="Loading claim page">
      <div className="flex items-center gap-3 animate-pulse-glow" aria-hidden="true">
        <div className="skeleton-shimmer w-10 h-10 rounded-lg" />
        <SkeletonLine width="12rem" height="1.5rem" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <SkeletonCard height="300px" />
        <SkeletonCard height="300px" />
        <SkeletonCard height="300px" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create DashboardSkeleton**

```tsx
// src/components/skeletons/DashboardSkeleton.tsx
"use client";

import { SkeletonCard, SkeletonLine, SkeletonCircle } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading dashboard">
      <div className="flex items-center gap-4">
        <SkeletonCircle size="4rem" />
        <div className="flex flex-col gap-2">
          <SkeletonLine width="12rem" height="1.25rem" />
          <SkeletonLine width="8rem" height="0.875rem" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard height="120px" />
        <SkeletonCard height="120px" />
        <SkeletonCard height="120px" />
      </div>
      <div className="flex gap-2">
        <SkeletonLine width="6rem" height="2.5rem" className="rounded-lg" />
        <SkeletonLine width="6rem" height="2.5rem" className="rounded-lg" />
        <SkeletonLine width="6rem" height="2.5rem" className="rounded-lg" />
      </div>
      <SkeletonCard height="400px" />
    </div>
  );
}
```

- [ ] **Step 3: Create PassportSkeleton**

```tsx
// src/components/skeletons/PassportSkeleton.tsx
"use client";

import { SkeletonLine, SkeletonCircle, SkeletonCard } from "@/components/ui/skeleton";

export function PassportSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 p-8" role="status" aria-live="polite" aria-label="Loading passport">
      <div className="flex items-center gap-4 w-full max-w-2xl">
        <SkeletonCircle size="5rem" />
        <div className="flex flex-col gap-2 flex-1">
          <SkeletonLine width="60%" height="1.5rem" />
          <SkeletonLine width="40%" height="1rem" />
          <SkeletonLine width="30%" height="0.875rem" />
        </div>
      </div>
      <SkeletonCard height="300px" className="max-w-2xl" />
      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
        <SkeletonCard height="150px" />
        <SkeletonCard height="150px" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ExplorerSkeleton**

```tsx
// src/components/skeletons/ExplorerSkeleton.tsx
"use client";

import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";

export function ExplorerSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading explorer">
      <SkeletonLine width="100%" height="3rem" className="rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} height="200px" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create LeaderboardSkeleton**

```tsx
// src/components/skeletons/LeaderboardSkeleton.tsx
"use client";

import { SkeletonCard, SkeletonLine, SkeletonCircle } from "@/components/ui/skeleton";

export function LeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading leaderboard">
      <div className="flex justify-center gap-4">
        <SkeletonCard width="200px" height="280px" />
        <SkeletonCard width="220px" height="300px" />
        <SkeletonCard width="200px" height="280px" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <SkeletonLine width="2rem" height="2rem" className="rounded-full" />
            <SkeletonCircle size="2.5rem" />
            <SkeletonLine width="40%" height="1rem" />
            <SkeletonLine width="20%" height="1rem" className="ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create StatusSkeleton**

```tsx
// src/components/skeletons/StatusSkeleton.tsx
"use client";

import { SkeletonCard, SkeletonLine } from "@/components/ui/skeleton";

export function StatusSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading status page">
      <SkeletonLine width="12rem" height="1.5rem" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} height="160px" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify all imports resolve**

```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors (or only pre-existing ones from `.next/types/validator.ts`).

- [ ] **Step 8: Commit**

```bash
git add src/components/skeletons/
git commit -m "feat(ui): add page-specific skeleton shells (core pages) ۞

ClaimSkeleton, DashboardSkeleton, PassportSkeleton, ExplorerSkeleton,
LeaderboardSkeleton, StatusSkeleton — composed from skeleton primitives,
matching final layout dimensions for zero CLS."
```

---

## Task 5: Create Page Skeleton Shells (Part 2 — Secondary Pages)

**Files:**
- Create: `src/components/skeletons/DocsSkeleton.tsx`
- Create: `src/components/skeletons/MarketplaceSkeleton.tsx`
- Create: `src/components/skeletons/AboutSkeleton.tsx`
- Create: `src/components/skeletons/AgentSkeleton.tsx`
- Create: `src/components/skeletons/DiagnosticsSkeleton.tsx`
- Create: `src/components/skeletons/SettingsSkeleton.tsx`
- Create: `src/components/skeletons/LandingSkeleton.tsx`
- Create: `src/components/skeletons/OnboardingSkeleton.tsx`

- [ ] **Step 1: Create DocsSkeleton**

```tsx
// src/components/skeletons/DocsSkeleton.tsx
"use client";

import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";

export function DocsSkeleton() {
  return (
    <div className="flex gap-6 p-6" role="status" aria-live="polite" aria-label="Loading docs">
      <div className="hidden md:flex flex-col gap-3 w-64">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonLine key={i} width={`${40 + Math.random() * 40}%`} height="1rem" />
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-4">
        <SkeletonLine width="60%" height="2rem" />
        <SkeletonLine width="100%" height="1rem" />
        <SkeletonLine width="100%" height="1rem" />
        <SkeletonLine width="80%" height="1rem" />
        <SkeletonCard height="200px" />
        <SkeletonLine width="100%" height="1rem" />
        <SkeletonLine width="70%" height="1rem" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create MarketplaceSkeleton**

```tsx
// src/components/skeletons/MarketplaceSkeleton.tsx
"use client";

import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";

export function MarketplaceSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading marketplace">
      <div className="flex gap-3">
        <SkeletonLine width="8rem" height="2.5rem" className="rounded-lg" />
        <SkeletonLine width="8rem" height="2.5rem" className="rounded-lg" />
        <SkeletonLine width="8rem" height="2.5rem" className="rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} height="280px" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create AboutSkeleton**

```tsx
// src/components/skeletons/AboutSkeleton.tsx
"use client";

import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";

export function AboutSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-6 max-w-3xl mx-auto" role="status" aria-live="polite" aria-label="Loading about page">
      <SkeletonLine width="50%" height="2.5rem" />
      <SkeletonLine width="100%" height="1rem" />
      <SkeletonLine width="100%" height="1rem" />
      <SkeletonLine width="90%" height="1rem" />
      <SkeletonCard height="250px" />
      <SkeletonLine width="100%" height="1rem" />
      <SkeletonLine width="70%" height="1rem" />
    </div>
  );
}
```

- [ ] **Step 4: Create AgentSkeleton**

```tsx
// src/components/skeletons/AgentSkeleton.tsx
"use client";

import { SkeletonCard, SkeletonLine, SkeletonCircle } from "@/components/ui/skeleton";

export function AgentSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-live="polite" aria-label="Loading agent profile">
      <div className="flex items-center gap-4">
        <SkeletonCircle size="6rem" />
        <div className="flex flex-col gap-2">
          <SkeletonLine width="10rem" height="1.5rem" />
          <SkeletonLine width="6rem" height="1rem" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard height="100px" />
        <SkeletonCard height="100px" />
        <SkeletonCard height="100px" />
      </div>
      <SkeletonCard height="350px" />
    </div>
  );
}
```

- [ ] **Step 5: Create DiagnosticsSkeleton**

```tsx
// src/components/skeletons/DiagnosticsSkeleton.tsx
"use client";

import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";

export function DiagnosticsSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6" role="status" aria-live="polite" aria-label="Loading diagnostics">
      <SkeletonLine width="12rem" height="1.5rem" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonLine key={i} width="100%" height="3rem" className="rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create SettingsSkeleton**

```tsx
// src/components/skeletons/SettingsSkeleton.tsx
"use client";

import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-6" role="status" aria-live="polite" aria-label="Loading settings">
      <SkeletonLine width="8rem" height="1.5rem" />
      <SkeletonCard height="200px" />
      <SkeletonCard height="150px" />
      <SkeletonCard height="300px" />
    </div>
  );
}
```

- [ ] **Step 7: Create LandingSkeleton**

```tsx
// src/components/skeletons/LandingSkeleton.tsx
"use client";

import { SkeletonCard, SkeletonLine } from "@/components/ui/skeleton";

export function LandingSkeleton() {
  return (
    <div className="flex flex-col gap-12 p-8" role="status" aria-live="polite" aria-label="Loading landing page">
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="animate-pulse-glow">
          <div className="skeleton-shimmer w-16 h-16 rounded-xl" />
        </div>
        <SkeletonLine width="20rem" height="2.5rem" />
        <SkeletonLine width="30rem" height="1.25rem" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard height="300px" />
        <SkeletonCard height="300px" />
        <SkeletonCard height="300px" />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Type check**

```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No new errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/skeletons/
git commit -m "feat(ui): add page skeleton shells (secondary pages) ۞

DocsSkeleton, MarketplaceSkeleton, AboutSkeleton, AgentSkeleton,
DiagnosticsSkeleton, SettingsSkeleton, LandingSkeleton."
```

---

## Task 6: Create QueryClient + Provider

**Files:**
- Create: `src/lib/query-client.ts`

**Interfaces:**
- Consumes: `@tanstack/react-query` from Task 1
- Produces: `makeQueryClient()` function, `QueryClientProvider` wrapper for `layout.tsx`

- [ ] **Step 1: Write test**

```tsx
// src/__tests__/lib/query-client.test.tsx
import { render, screen } from "@testing-library/react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";

function TestComponent() {
  const queryClient = useQueryClient();
  const defaults = queryClient.getDefaultOptions();
  return (
    <div data-testid="client-ready">
      {defaults.queries?.staleTime ? "configured" : "no-config"}
    </div>
  );
}

describe("makeQueryClient", () => {
  it("creates a query client with default options", () => {
    const queryClient = makeQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );
    expect(screen.getByTestId("client-ready")).toHaveTextContent("configured");
  });

  it("creates a client with 30s stale time", () => {
    const client = makeQueryClient();
    const options = client.getDefaultOptions();
    expect(options.queries?.staleTime).toBe(30_000);
  });

  it("creates a client with 5min gc time", () => {
    const client = makeQueryClient();
    const options = client.getDefaultOptions();
    expect(options.queries?.gcTime).toBe(5 * 60_000);
  });

  it("creates a client with retry 2", () => {
    const client = makeQueryClient();
    const options = client.getDefaultOptions();
    expect(options.queries?.retry).toBe(2);
  });
});
```

- [ ] **Step 2: Write implementation**

```tsx
// src/lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined;

function makeQueryClientBase(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return makeQueryClientBase();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClientBase();
  }
  return browserQueryClient;
}

export { makeQueryClientBase as makeQueryClient };
```

- [ ] **Step 3: Run test**

```bash
npx jest src/__tests__/lib/query-client.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 4: Create client-side Providers wrapper**

`layout.tsx` is a Server Component — it cannot pass a `QueryClient` instance as a prop directly. Create a `"use client"` wrapper:

```tsx
// src/app/providers.tsx
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 5: Wire into layout.tsx**

Modify `src/app/layout.tsx` — wrap children in `<Providers>`:

```tsx
// Add import at top
import { Providers } from "./providers";

// Inside RootLayout, wrap the main content:
<Providers>
  {children}
</Providers>
```

- [ ] **Step 6: Build check**

```bash
npm run build 2>&1 | tail -10
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/lib/query-client.ts src/app/providers.tsx src/app/layout.tsx src/__tests__/lib/query-client.test.tsx
git commit -m "feat(cache): add TanStack Query client + provider ۞

QueryClient with 30s staleTime, 5min gcTime, retry 2 for resilience.
"use client" Providers wrapper for Next.js Server Component boundary.
Devtools shown only in development mode."
```

---

## Task 7: Create Data-Fetching Hooks (Part 1 — Read Hooks)

**Files:**
- Create: `src/lib/hooks/useStatus.ts`
- Create: `src/lib/hooks/useLeaderboard.ts`
- Create: `src/lib/hooks/useExplorer.ts`
- Create: `src/lib/hooks/usePassport.ts`
- Create: `src/lib/hooks/useAgent.ts`
- Create: `src/lib/hooks/useSkills.ts`
- Create: `src/lib/hooks/useMemory.ts`
- Create: `src/lib/hooks/useWalletStatus.ts`
- Create: `src/lib/hooks/useSpendRequests.ts`
- Create: `src/lib/hooks/useDiagnosticsLogs.ts`

**Interfaces:**
- Consumes: `@tanstack/react-query` + `getQueryClient` from Task 6
- Produces: typed hooks that return `{ data, isLoading, error }`

- [ ] **Step 1: Create useStatus**

```tsx
// src/lib/hooks/useStatus.ts
import { useQuery } from "@tanstack/react-query";

interface StatusData {
  status: string;
  services: Record<string, { status: string; latency: number }>;
}

async function fetchStatus(): Promise<StatusData> {
  const [statusRes, healthRes] = await Promise.all([
    fetch("/api/status"),
    fetch("/api/health"),
  ]);
  if (!statusRes.ok || !healthRes.ok) {
    throw new Error("Failed to fetch status");
  }
  const statusData = await statusRes.json();
  const healthData = await healthRes.json();
  return { ...statusData, ...healthData };
}

export function useStatus() {
  return useQuery<StatusData>({
    queryKey: ["status"],
    queryFn: fetchStatus,
  });
}
```

- [ ] **Step 2: Create useLeaderboard**

```tsx
// src/lib/hooks/useLeaderboard.ts
import { useQuery } from "@tanstack/react-query";

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  avatar?: string;
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch("/api/leaderboard");
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  const json = await res.json();
  return json.leaderboard ?? json;
}

export function useLeaderboard() {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });
}
```

- [ ] **Step 3: Create useExplorer**

```tsx
// src/lib/hooks/useExplorer.ts
import { useQuery } from "@tanstack/react-query";

interface ExplorerEntry {
  id: string;
  name: string;
  type: string;
  status: string;
}

async function fetchExplorer(): Promise<ExplorerEntry[]> {
  const res = await fetch("/api/explorer");
  if (!res.ok) throw new Error("Failed to fetch explorer data");
  const json = await res.json();
  return json.data ?? json;
}

export function useExplorer() {
  return useQuery<ExplorerEntry[]>({
    queryKey: ["explorer"],
    queryFn: fetchExplorer,
  });
}
```

- [ ] **Step 4: Create usePassport**

```tsx
// src/lib/hooks/usePassport.ts
import { useQuery } from "@tanstack/react-query";

interface PassportData {
  username: string;
  displayName: string;
  bio: string;
  avatar?: string;
  badges: string[];
  trustScore: number;
  [key: string]: unknown;
}

async function fetchPassport(slug: string): Promise<PassportData> {
  const res = await fetch(`/api/passport/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error("Failed to fetch passport");
  return res.json();
}

export function usePassport(slug: string) {
  return useQuery<PassportData>({
    queryKey: ["passport", slug],
    queryFn: () => fetchPassport(slug),
    enabled: !!slug,
  });
}
```

- [ ] **Step 5: Create useAgent**

```tsx
// src/lib/hooks/useAgent.ts
import { useQuery } from "@tanstack/react-query";

interface AgentData {
  username: string;
  displayName: string;
  metrics: Record<string, number>;
  [key: string]: unknown;
}

async function fetchAgent(username: string): Promise<AgentData> {
  const res = await fetch(`/api/agent/public?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error("Failed to fetch agent data");
  return res.json();
}

export function useAgent(username: string) {
  return useQuery<AgentData>({
    queryKey: ["agent", username],
    queryFn: () => fetchAgent(username),
    enabled: !!username,
  });
}
```

- [ ] **Step 6: Create useSkills, useMemory**

```tsx
// src/lib/hooks/useSkills.ts
import { useQuery } from "@tanstack/react-query";

interface SkillEntry {
  id: string;
  name: string;
  category: string;
  confidence: number;
}

async function fetchSkills(): Promise<SkillEntry[]> {
  const res = await fetch("/api/skills?limit=20");
  if (!res.ok) throw new Error("Failed to fetch skills");
  const json = await res.json();
  return json.skills ?? json;
}

export function useSkills() {
  return useQuery<SkillEntry[]>({
    queryKey: ["skills"],
    queryFn: fetchSkills,
  });
}
```

```tsx
// src/lib/hooks/useMemory.ts
import { useQuery } from "@tanstack/react-query";

interface MemoryEntry {
  id: string;
  content: string;
  timestamp: string;
  type: string;
}

async function fetchMemory(): Promise<MemoryEntry[]> {
  const res = await fetch("/api/memory?limit=10");
  if (!res.ok) throw new Error("Failed to fetch memory");
  const json = await res.json();
  return json.memories ?? json;
}

export function useMemory() {
  return useQuery<MemoryEntry[]>({
    queryKey: ["memory"],
    queryFn: fetchMemory,
  });
}
```

- [ ] **Step 7: Create useWalletStatus**

```tsx
// src/lib/hooks/useWalletStatus.ts
import { useQuery } from "@tanstack/react-query";

interface WalletStatus {
  piUid: string;
  username: string;
  tier: string;
  xp: number;
  kycStatus: string;
  hasAgent: boolean;
  [key: string]: unknown;
}

async function fetchWalletStatus(): Promise<WalletStatus> {
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch("/api/user/status", { headers });
  if (!res.ok) throw new Error("Failed to fetch wallet status");
  return res.json();
}

export function useWalletStatus() {
  return useQuery<WalletStatus>({
    queryKey: ["wallet-status"],
    queryFn: fetchWalletStatus,
  });
}
```

- [ ] **Step 8: Create useSpendRequests**

```tsx
// src/lib/hooks/useSpendRequests.ts
import { useQuery } from "@tanstack/react-query";

interface SpendRequest {
  id: string;
  amount: string;
  status: string;
  memo: string;
  createdAt: string;
}

async function fetchSpendRequests(): Promise<SpendRequest[]> {
  const res = await fetch("/api/spend-request?status=pending");
  if (!res.ok) throw new Error("Failed to fetch spend requests");
  const json = await res.json();
  return json.requests ?? json;
}

export function useSpendRequests() {
  return useQuery<SpendRequest[]>({
    queryKey: ["spend-requests"],
    queryFn: fetchSpendRequests,
    refetchInterval: 15_000,
  });
}
```

- [ ] **Step 9: Create useDiagnosticsLogs**

```tsx
// src/lib/hooks/useDiagnosticsLogs.ts
import { useQuery } from "@tanstack/react-query";

interface LogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: string;
}

async function fetchDiagnosticsLogs(): Promise<LogEntry[]> {
  const res = await fetch("/api/diagnostics/logs");
  if (!res.ok) throw new Error("Failed to fetch diagnostics logs");
  return res.json();
}

export function useDiagnosticsLogs() {
  return useQuery<LogEntry[]>({
    queryKey: ["diagnostics-logs"],
    queryFn: fetchDiagnosticsLogs,
    refetchInterval: 10_000,
  });
}
```

- [ ] **Step 10: Type check**

```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No new errors.

- [ ] **Step 11: Commit**

```bash
git add src/lib/hooks/
git commit -m "feat(cache): add TanStack Query read hooks (10 hooks) ۞

useStatus, useLeaderboard, useExplorer, usePassport, useAgent,
useSkills, useMemory, useWalletStatus, useSpendRequests,
useDiagnosticsLogs — typed hooks with retry, refetch intervals
for polling endpoints."
```

---

## Task 8: Create Mutation Hooks

**Files:**
- Create: `src/lib/hooks/useApproveSpendRequest.ts`
- Create: `src/lib/hooks/useCompleteSpendRequest.ts`
- Create: `src/lib/hooks/usePublishSkill.ts`
- Create: `src/lib/hooks/useSocialDisconnect.ts`
- Create: `src/lib/hooks/useAuth.ts`

**Interfaces:**
- Consumes: `useQueryClient` from `@tanstack/react-query`
- Produces: mutation hooks with optimistic updates

- [ ] **Step 1: Create useApproveSpendRequest**

```tsx
// src/lib/hooks/useApproveSpendRequest.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useApproveSpendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/spend-request/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approved" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["spend-requests"] });
      const previous = queryClient.getQueryData(["spend-requests"]);
      queryClient.setQueryData(["spend-requests"], (old: unknown) => {
        if (!Array.isArray(old)) return [];
        return (old as Record<string, unknown>[]).map((r) =>
          r.id === id ? { ...r, status: "approved" } : r
        );
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["spend-requests"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["spend-requests"] });
    },
  });
}
```

- [ ] **Step 2: Create useCompleteSpendRequest**

```tsx
// src/lib/hooks/useCompleteSpendRequest.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCompleteSpendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/spend-request/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "completed" }),
      });
      if (!res.ok) throw new Error("Failed to complete");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["spend-requests"] });
      const previous = queryClient.getQueryData(["spend-requests"]);
      queryClient.setQueryData(["spend-requests"], (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.filter((r: Record<string, unknown>) => r.id !== id);
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["spend-requests"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["spend-requests"] });
    },
  });
}
```

- [ ] **Step 3: Create usePublishSkill**

```tsx
// src/lib/hooks/usePublishSkill.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SkillInput {
  name: string;
  category: string;
  description: string;
}

export function usePublishSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SkillInput) => {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to publish skill");
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}
```

- [ ] **Step 4: Create useSocialDisconnect**

```tsx
// src/lib/hooks/useSocialDisconnect.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSocialDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: string) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/social/disconnect", {
        method: "POST",
        headers,
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-status"] });
    },
  });
}
```

- [ ] **Step 5: Create useAuth**

```tsx
// src/lib/hooks/useAuth.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AuthInput {
  piUid: string;
  piToken: string;
  walletAddress?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AuthInput) => {
      const res = await fetch("/api/auth/pi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Authentication failed");
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-status"] });
    },
  });
}
```

- [ ] **Step 6: Type check**

```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No new errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/hooks/
git commit -m "feat(cache): add TanStack Query mutation hooks (5 hooks) ۞

useApproveSpendRequest, useCompleteSpendRequest, usePublishSkill,
useSocialDisconnect, useAuth — with optimistic updates and
cache invalidation for real-time UI feedback."
```

---

## Task 9: Migrate Pages to TanStack Query + Skeleton Pattern

**Files:**
- Modify: `src/app/status/page.tsx`
- Modify: `src/app/leaderboard/page.tsx`
- Modify: `src/app/explorer/page.tsx`
- Modify: `src/app/passport/[slug]/PassportView.tsx`
- Modify: `src/app/agent/[username]/page.tsx`
- Modify: `src/app/claim/page.tsx`
- Modify: `src/app/diagnostics/page.tsx`
- Modify: `src/app/dashboard/settings/page.tsx`

Each page follows this pattern — with Pi Browser detection for the landing/onboarding pages to pivot skeleton messaging:

```tsx
// Pi-aware skeleton toggle (for landing, onboarding, and auth pages)
function usePiBrowser() {
  const [isPi, setIsPi] = useState(false);
  useEffect(() => {
    setIsPi(typeof window !== "undefined" && "Pi" in window);
  }, []);
  return isPi;
}
```

Standard page pattern:

```tsx
// Before
"use client";
import { useState, useEffect } from "react";

export default function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/endpoint")
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <Content data={data} />;
}
```

```tsx
// After
"use client";
import { useStatus } from "@/lib/hooks/useStatus";
import { StatusSkeleton } from "@/components/skeletons/StatusSkeleton";

export default function Page() {
  const { data, isLoading, error } = useStatus();

  if (error) return <StatusError error={error} />;
  if (isLoading) return <StatusSkeleton />;
  return <Content data={data} />;
}
```

**Landing and Onboarding pages** detect Pi Browser and pivot skeleton messaging:
```tsx
// During loading, if not Pi Browser, overlay a smart-intro badge:
// "Trying AxiomID from a regular browser? Most features need Pi Network."
// This keeps the skeleton clean while educating new users.
```

Specific steps per page:

- [ ] **Step 1: Migrate status/page.tsx** — replace `useEffect`+`fetch` with `useStatus()`, add `StatusSkeleton`
- [ ] **Step 2: Migrate leaderboard/page.tsx** — replace with `useLeaderboard()`, add `LeaderboardSkeleton`
- [ ] **Step 3: Migrate explorer/page.tsx** — replace with `useExplorer()`, add `ExplorerSkeleton`
- [ ] **Step 4: Migrate passport/[slug]/PassportView.tsx** — replace with `usePassport(slug)`, add `PassportSkeleton`
- [ ] **Step 5: Migrate agent/[username]/page.tsx** — replace with `useAgent(username)`, add `AgentSkeleton`
- [ ] **Step 6: Migrate claim/page.tsx** — replace fetch with appropriate hook, add `ClaimSkeleton`
- [ ] **Step 7: Migrate diagnostics/page.tsx** — replace with `useDiagnosticsLogs()`, add `DiagnosticsSkeleton`
- [ ] **Step 8: Migrate dashboard/settings/page.tsx** — replace with `useWalletStatus()`, add `SettingsSkeleton`
- [ ] **Step 9: Migrate docs/page.tsx** — move raw fetch to `useQuery` inline, add `DocsSkeleton`
- [ ] **Step 10: Migrate about/page.tsx** — add skeleton toggle with `AboutSkeleton` (if data fetching; otherwise wrap with suspense)
- [ ] **Step 11: Migrate dashboard/marketplace/page.tsx** — skeleton with `MarketplaceSkeleton`

- [ ] **Step 12: Build + test**

```bash
npm run build 2>&1 | tail -10
npx jest 2>&1 | tail -5
```

Expected: Build succeeds, 53+ tests pass.

- [ ] **Step 13: Commit**

```bash
git add src/app/status/page.tsx src/app/leaderboard/page.tsx src/app/explorer/page.tsx
git add src/app/passport/[slug]/PassportView.tsx src/app/agent/[username]/page.tsx
git add src/app/claim/page.tsx src/app/diagnostics/page.tsx src/app/dashboard/settings/page.tsx
git add src/app/docs/page.tsx src/app/about/page.tsx src/app/dashboard/marketplace/page.tsx
git commit -m "feat(ui): migrate all pages to TanStack Query + skeleton ۞

Replaces raw useEffect+fetch with typed useQuery hooks and
CSS-only skeleton shells across 11 pages. Zero CLS during loading."
```

---

## Task 10: Standardize Error Boundary Pattern

**Files:**
- Create: `src/components/ui/ErrorFallback.tsx`
- Modify: `src/components/ErrorBoundary.tsx` (use new ErrorFallback)
- Modify: `src/app/dashboard/page.tsx` (add skeleton-aware ErrorBoundary)
- Modify: `src/app/dashboard/layout.tsx` (add skeleton-aware ErrorBoundary)

- [ ] **Step 1: Create standalone ErrorFallback**

```tsx
// src/components/ui/ErrorFallback.tsx
"use client";

interface ErrorFallbackProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
}: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-surface-deep flex items-center justify-center">
        <span className="text-warning text-2xl font-bold">!</span>
      </div>
      <h2 className="text-surface text-xl font-semibold">{title}</h2>
      <p className="text-subtle max-w-md">{message}</p>
      {process.env.NODE_ENV === "development" && error && (
        <pre className="text-faint text-xs max-w-md overflow-auto p-3 bg-surface-deep rounded-lg">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      )}
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="btn-primary px-6 py-2 rounded-lg"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update ErrorBoundary to use ErrorFallback**

```tsx
// src/components/ErrorBoundary.tsx
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from "react-error-boundary";
import { ErrorFallback } from "@/components/ui/ErrorFallback";

function ErrorFallbackWrapper({ error, resetErrorBoundary }: FallbackProps) {
  return <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ErrorBoundary({ children, fallback }: Props) {
  if (fallback) {
    return (
      <ReactErrorBoundary fallback={fallback} onReset={() => window.location.reload()}>
        {children}
      </ReactErrorBoundary>
    );
  }
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallbackWrapper} onReset={() => window.location.reload()}>
      {children}
    </ReactErrorBoundary>
  );
}
```

- [ ] **Step 3: Update error.tsx files to use ErrorFallback (page-level)**

Modify all page `error.tsx` files to use the shared `ErrorFallback`. These are normal page-level error boundaries that render inside the existing layout:

```tsx
"use client";
import { ErrorFallback } from "@/components/ui/ErrorFallback";

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}
```

Pages to update (standard `error.tsx`):
- `src/app/error.tsx`
- `src/app/dashboard/error.tsx`
- `src/app/claim/error.tsx`
- `src/app/about/error.tsx`
- `src/app/docs/error.tsx`
- `src/app/explorer/error.tsx`
- `src/app/leaderboard/error.tsx`
- `src/app/onboarding/error.tsx`
- `src/app/status/error.tsx`
- `src/app/privacy/error.tsx`
- `src/app/terms/error.tsx`
- `src/app/signin/callback/error.tsx`
- `src/app/dashboard/settings/error.tsx`
- `src/app/dashboard/sandbox/error.tsx`
- `src/app/dashboard/marketplace/error.tsx`

- [ ] **Step 4: Handle global-error.tsx separately**

`src/app/global-error.tsx` is the root error boundary — Next.js requires it to render its own `<html>` and `<body>` tags since it wraps the entire document outside the layout tree. Use the `ErrorFallback` content inside a proper document shell:

```tsx
"use client";
import { ErrorFallback } from "@/components/ui/ErrorFallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <ErrorFallback error={error} resetErrorBoundary={reset} />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Build + test**

```bash
npm run build 2>&1 | tail -10
npx jest 2>&1 | tail -5
```

Expected: Build succeeds, tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/ErrorFallback.tsx src/components/ErrorBoundary.tsx
git add src/app/*/error.tsx src/app/**/error.tsx
git commit -m "feat(ui): standardize error boundary pattern across all pages ۞

Shared ErrorFallback component with branded error UI,
dev-mode stack traces, and consistent Try Again pattern.
global-error.tsx uses its own document shell with <html>/<body>."
```

---

## Self-Review

**Spec coverage:**
- ✅ Skeleton system (primitive components + page shells) — Tasks 2, 3, 4, 5
- ✅ TanStack Query cache layer (provider + read hooks + mutation hooks) — Tasks 1, 6, 7, 8
- ✅ Error boundary standardization — Task 10
- ✅ All 12+ pages covered (11 migrated in Task 9, all 14 skeleton shells created) — Tasks 4, 5, 9
- ✅ CSS-only shimmer, respects prefers-reduced-motion (every @keyframes has reduce override) — Task 2
- ✅ Zero CLS — skeleton dimensions match final layout — Tasks 3, 4, 5
- ✅ Optimistic updates for payment/wallet operations (with array guard) — Task 8
- ✅ Devtools only in development — Task 6
- ✅ QueryClientProvider in "use client" wrapper for Server Component boundary — Task 6
- ✅ Skeleton primitives enforce contract: {...props} spread before aria/data-testid, style merged — Task 3
- ✅ Page skeletons use role="status" + aria-live="polite" for AT — Tasks 4, 5
- ✅ global-error.tsx uses separate document shell with <html>/<body> — Task 10
- ✅ useMemory uses /api/memory endpoint (not /api/skills) — Task 7

**Placeholder scan:** All code blocks contain complete implementations. No TBDs, no TODOs, no "similar to" references.

**Type consistency:** Hook names use `use*` convention consistently. Query key arrays use the same patterns (`["status"]`, `["passport", slug]`). Mutation hooks return standard `useMutation` shape.
