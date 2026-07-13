# AxiomID Loading UI — Design Spec

**Date:** 2026-07-12
**Status:** Draft for review

---

## 1. Problem Statement

The AxiomID frontend has three distinct loading/error UX gaps:

1. **No loading states**: Every page uses raw `useEffect` + `fetch()` with manual `isLoading` booleans. No skeleton screens, no shimmer, no unified loading pattern. Users see blank screens or jarring content flashes on every navigation.

2. **No cache layer**: All 26 fetch calls fire on every mount. No deduplication, no stale-while-revalidate, no optimistic updates, no retry logic. Pi Network wallet operations (auth, payments, spend requests) have no mutation layer — every call is a raw POST with no rollback.

3. **Inconsistent error UI**: ErrorBoundary component exists (wraps dashboard) but most pages use `error.tsx` files without shared error styling. Error recovery is inconsistent — some pages reload the whole app, others show raw error messages.

---

## 2. Goals / Non-Goals / Rollout Order

### Goals

- **Skeleton loading system**: CSS-only shimmer primitives, composable into page-specific shells, matching final layout dimensions to eliminate CLS
- **TanStack Query v5 cache layer**: Unified data fetching with deduplication, stale-while-revalidate, retry, optimistic mutations for Pi payments/wallet ops
- **Standardized error UI**: Shared error boundary strategy, styled error pages, graceful degradation

### Non-Goals

- No visual redesign — skeleton colors use existing `--text-muted` / `--bg-card` tokens
- No server-side streaming (Next.js `loading.tsx`) — all pages are `"use client"`, keep SPA feel
- No React Server Components migration — out of scope
- No full-page refactors — skeletons overlay existing layouts without restructuring

### Rollout Order

```
PR 1: Skeleton system         — globals.css + SkeletonLine/SkeletonCard/SkeletonCircle + page shells
PR 2: TanStack Query cache    — @tanstack/react-query + QueryClientProvider + hooks per page
PR 3: Error boundaries        — shared ErrorFallback, global-error boundary, consistent pattern
```

---

## 3. Approach: Skeleton System

### CSS-Only Shimmer

```css
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

### Primitive Components

```
SkeletonLine(width?: string, height?: string)  — text placeholder, shimmer
SkeletonCard                                     — card outline + content slots
SkeletonCircle(size?: string)                    — avatar/icon placeholder
SkeletonImage(aspectRatio?: string)              — image placeholder
```

All primitives:
- Accept `className` for Tailwind composition
- Respect `prefers-reduced-motion`
- Match exact final component dimensions (CLS = 0)
- Use `aria-hidden="true"` + `data-testid="skeleton"`

### Page Shells (composed from primitives)

```
LandingSkeleton       — Hero demo area + Features grid skeleton
ClaimSkeleton         — AxiomID logo pulse + 3-step card skeletons
DashboardSkeleton     — QuickStatsRow sparkline + tab content skeleton
PassportSkeleton      — PassportHeader avatar + PassportIdentity body
ExplorerSkeleton      — Search bar + result card grid
LeaderboardSkeleton   — TopThreeCards + table rows
DocsSkeleton          — Sidebar nav + content area
StatusSkeleton        — Service card grid
MarketplaceSkeleton   — Filter bar + service card grid
AboutSkeleton         — Content sections
AgentSkeleton         — Profile header + metrics
DiagnosticsSkeleton   — Log table rows
SettingsSkeleton      — Form sections
```

Each shell is a single component exported as `*Skeleton` that replaces the page content when data is loading.

### AxiomID Loading Logo

Inline SVG with pulsing glow using the existing accent gradient:

```tsx
<div className="flex items-center gap-3 animate-pulse-glow">
  <AxiomLogo className="w-8 h-8" />
  <div className="skeleton-line w-32 h-4" />
</div>
```

CSS:

```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; filter: brightness(1); }
  50% { opacity: 1; filter: brightness(1.3); }
}
.animate-pulse-glow {
  animation: pulse-glow 1.5s ease-in-out infinite;
}
```

---

## 4. Approach: TanStack Query v5 Cache Layer

### Architecture

```
<QueryClientProvider>      — wraps layout.tsx
  <ReactQueryDevtools/>    — dev only, initialOpen={false}
```

### Client Setup

```tsx
// src/lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,       // 30s — frequent enough for real-time feel
        gcTime: 5 * 60_000,      // 5min garbage collection
        retry: 2,                 // Pi SDK calls fail ~1% in sandbox
        refetchOnWindowFocus: false,  // Pi Browser tab behavior is unpredictable
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
```

### Per-Page Hooks

| Page | Hook | Key |
|------|------|-----|
| Status | `useStatus()` | `["status"]` |
| Leaderboard | `useLeaderboard()` | `["leaderboard"]` |
| Explorer | `useExplorer()` | `["explorer"]` |
| Passport | `usePassport(slug)` | `["passport", slug]` |
| Agent | `useAgent(username)` | `["agent", username]` |
| Skills | `useSkills()` | `["skills"]` |
| Memory | `useMemory()` | `["memory"]` |
| Wallet | `useWalletStatus()` | `["wallet-status"]` |
| Spend Requests | `useSpendRequests()` | `["spend-requests"]` |
| Diagnostics | `useDiagnosticsLogs()` | `["diagnostics-logs"]` |

### Mutation Hooks

| Mutation | Hook | Invalidation |
|----------|------|-------------|
| Approve spend request | `useApproveSpendRequest()` | `["spend-requests"]` |
| Complete spend request | `useCompleteSpendRequest()` | `["spend-requests"]` |
| Publish skill | `usePublishSkill()` | `["skills"]` |
| Social disconnect | `useSocialDisconnect()` | `["wallet-status"]` |
| Auth / sign-in | `useAuth()` | `["wallet-status"]` |

### Optimistic Updates Pattern

```tsx
const mutation = useMutation({
  mutationFn: (id: string) => fetch(`/api/spend-request/${id}`, { method: "POST" }),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ["spend-requests"] });
    const previous = queryClient.getQueryData(["spend-requests"]);
    queryClient.setQueryData(["spend-requests"], (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((r) => (r.id === id ? { ...r, status: "approved" } : r));
    });
    return { previous };
  },
  onError: (err, id, context) => {
    queryClient.setQueryData(["spend-requests"], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["spend-requests"] });
  },
});
```

---

## 5. Approach: Error Boundaries

### Shared ErrorFallback Component

Already exists in `src/components/ErrorBoundary.tsx`. It:
- Shows an AxiomID-branded error card
- Has a "Try Again" button using `resetErrorBoundary`
- Optionally shows error details for dev/diagnostics pages

### Page-Level Strategy

- Every page with data fetching gets an `ErrorBoundary` wrapper
- Pages already having `error.tsx` keep them but use the shared `ErrorFallback`
- Global `error.tsx` wraps app root
- `not-found.tsx` is already in place

### Skeleton-Toggle Pattern

```tsx
function ExplorerPage() {
  const { data, isLoading, error } = useExplorer();

  if (error) return <ExplorerError error={error} />;
  if (isLoading) return <ExplorerSkeleton />;

  return <ExplorerContent data={data} />;
}
```

---

## 6. File Map

### PR 1 — Skeleton System

```
src/app/globals.css                    + shimmer keyframes + skeleton utility classes
src/components/ui/skeleton.tsx         + SkeletonLine, SkeletonCard, SkeletonCircle, SkeletonImage
src/components/skeletons/LandingSkeleton.tsx
src/components/skeletons/ClaimSkeleton.tsx
src/components/skeletons/DashboardSkeleton.tsx
src/components/skeletons/PassportSkeleton.tsx
src/components/skeletons/ExplorerSkeleton.tsx
src/components/skeletons/LeaderboardSkeleton.tsx
src/components/skeletons/DocsSkeleton.tsx
src/components/skeletons/StatusSkeleton.tsx
src/components/skeletons/MarketplaceSkeleton.tsx
src/components/skeletons/AboutSkeleton.tsx
src/components/skeletons/AgentSkeleton.tsx
src/components/skeletons/DiagnosticsSkeleton.tsx
src/components/skeletons/SettingsSkeleton.tsx
```

### PR 2 — TanStack Query

```
package.json                           + @tanstack/react-query, @tanstack/react-query-devtools
src/lib/query-client.ts                + makeQueryClient()
src/app/layout.tsx                     + QueryClientProvider
src/lib/hooks/useStatus.ts
src/lib/hooks/useLeaderboard.ts
src/lib/hooks/useExplorer.ts
src/lib/hooks/usePassport.ts
src/lib/hooks/useAgent.ts
src/lib/hooks/useSkills.ts
src/lib/hooks/useMemory.ts
src/lib/hooks/useWalletStatus.ts
src/lib/hooks/useSpendRequests.ts
src/lib/hooks/useDiagnosticsLogs.ts
src/lib/hooks/useApproveSpendRequest.ts
src/lib/hooks/useCompleteSpendRequest.ts
src/lib/hooks/usePublishSkill.ts
src/lib/hooks/useSocialDisconnect.ts
src/lib/hooks/useAuth.ts
```

### PR 3 — Error Boundaries

```
src/components/ErrorBoundary.tsx       + enhanced (already exists)
src/components/ui/ErrorFallback.tsx    + standalone fallback component
src/app/error.tsx                      + use ErrorFallback (already exists)
src/app/global-error.tsx               + use ErrorFallback (already exists)
src/app/dashboard/error.tsx            + use ErrorFallback (already exists)
All page error.tsx files               + consistent pattern
```

---

## 7. Dependencies

- `@tanstack/react-query` (v5)
- `@tanstack/react-query-devtools` (dev)

No animation libraries — skeleton uses pure CSS.

---

## 8. Testing Strategy

- Skeleton components: render test (snapshot), verify shimmer class, verify aria-hidden
- Query hooks: mock fetch, verify loading/data/error states
- Error boundaries: render test with thrown error, verify fallback renders
- Integration: mount page with skeleton → verify skeleton visible → resolve query → verify content replaces skeleton
