# Repository DNA — AxiomID

> **The first file any new agent should read.**
> Updated: 2026-07-06

---

## 1. Architecture Overview

### Project Structure
```
AxiomID/
├── src/
│   ├── app/              # Next.js App Router (routes + pages)
│   │   ├── api/          # API route handlers (27 dirs)
│   │   ├── dashboard/    # Authenticated dashboard (tabs, not routes)
│   │   ├── passport/     # Public passport viewer
│   │   └── ...           # Other pages
│   ├── components/       # Shared React components
│   ├── lib/              # Shared libraries (auth, crypto, validators)
│   ├── __tests__/        # Unit & integration tests
│   └── types/            # TypeScript type definitions
├── e2e/                  # Playwright E2E tests (13 files)
├── prisma/               # Database schema & migrations
├── packages/
│   ├── crypto/           # @axiomid/crypto (MIT, Ed25519)
│   └── sdk/              # @axiomid/sdk (MIT, client SDK)
├── backend/              # Cloudflare Worker backend
├── public/               # PWA assets, icons
├── docs/                 # Documentation
├── scripts/              # Build & utility scripts
└── AxiomID.Memory/       # Knowledge base (this vault)
```

---

## 2. Languages & Frameworks

| Language | Framework | Purpose |
|----------|-----------|---------|
| TypeScript | Next.js 16, React 19 | Frontend + API routes |
| TypeScript | Prisma 6 | Database ORM |
| TypeScript | Tailwind 4, Framer Motion 12 | UI styling + animations |
| TypeScript | Zod | Input validation |
| TypeScript | Playwright | E2E testing |
| TypeScript | Jest | Unit & integration testing |
| TypeScript | Cloudflare Workers | Edge compute |

---

## 3. Code Patterns

### API Route Pattern
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { requireAuth } from "@/lib/auth-middleware";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    // 1. Rate limit
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`route:${ip}`, RATE_LIMITS.authenticated);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // 2. Auth (if needed)
    const user = await requireAuth(request);

    // 3. Validate input
    const body = await request.json();
    const parsed = SomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    // 4. Business logic
    const result = await prisma.model.operation({ ... });

    // 5. Return response
    return NextResponse.json({ data: result });
  } catch (error) {
    logger.error("Route failed", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Validation Pattern (Zod)
```typescript
import { z } from "zod";

export const SomeSchema = z.object({
  field: z.string().min(1, "field is required"),
  optionalField: z.string().optional(),
});
```

### Error Handling
```typescript
import { apiError, apiSuccess } from "@/lib/errors";

return apiError("NOT_FOUND", "Resource not found");
return apiSuccess(data, 201);
```

### Test Pattern
```typescript
jest.mock("@/lib/some-module", () => ({
  someFunction: jest.fn(),
}));

describe("Feature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should do something", async () => {
    // Arrange
    (someFunction as jest.Mock).mockResolvedValue(result);

    // Act
    const response = await handler(request);

    // Assert
    expect(response.status).toBe(200);
    expect(someFunction).toHaveBeenCalledWith(expected);
  });
});
```

---

## 4. Coding Conventions

| Convention | Style |
|------------|-------|
| Indentation | 2 spaces (TS), 4 spaces (Python) |
| Semicolons | Required (TypeScript) |
| Quotes | Double quotes (TypeScript) |
| Trailing commas | All (ES5+) |

### Naming
- **Files:** `kebab-case` for components, `camelCase` for utilities
- **Variables:** `camelCase` (TS), `snake_case` (Python)
- **Classes:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Types/Interfaces:** `PascalCase`
- **Test files:** `*.test.ts` or `__tests__/` directory

---

## 5. Key Entry Points

| System | Entry Point |
|--------|-------------|
| Pi Authentication | `src/app/api/auth/pi/route.ts` |
| DID Resolution | `src/app/api/did-document/route.ts` |
| Passport Publish | `src/app/api/passport/[slug]/publish/route.ts` |
| Skill Execution | `src/app/api/skills/[slug]/execute/route.ts` |
| Admin Moderation | `src/app/api/admin/skills/[id]/route.ts` |
| Agent Registration | `src/app/api/agent/route.ts` |
| Truth RAG | `src/app/api/truth/route.ts` |
| Health Check | `src/app/api/health/route.ts` |
| Database Schema | `schema.prisma` |
| Auth Middleware | `src/lib/auth-middleware.ts` |
| Pi SDK Loader | `src/lib/pi-sdk.ts` |
| Trust Calculator | `src/lib/trust.ts` |

---

## 6. Database Schema (25 Models)

See `prisma/schema.prisma` for full schema. Key models:

| Model | Purpose |
|-------|---------|
| `User` | User accounts (piUid, tier, xp, level, passportUrl) |
| `UserAgent` | AI agents (status, mode, publicKey, permissions) |
| `PiPayment` | Payment records |
| `Action` | User actions |
| `XpLedger` | XP ledger |
| `AgentLog` | Agent activity logs |
| `Stamp` | Identity stamps |
| `Skill` | Marketplace skills |
| `SkillInstallation` | Skill installs |
| `SkillExecution` | Skill run history |
| `SkillPipeline` | Skill pipelines |
| `SkillPipelineStep` | Pipeline steps |
| `SkillReview` | Skill reviews |
| `SkillTag` | Skill tags |
| `SkillTagRelation` | Tag-skill relations |
| `SkillVersion` | Skill versions |
| `SkillModeration` | Admin moderation |
| `DelegatedTrust` | Trust delegation |
| `EphemeralDid` | Ephemeral DIDs |
| `SelfReviewLog` | Self-review audit |
| `HarvestResult` | Harvest results |
| `AgentPresence` | Agent presence status |
| `Claim` | Identity claims |
| `Stake` | Staking records |
| `SlashingEvent` | Slashing events |

---

## 7. Security Patterns

### Authentication Flow
1. Pi Browser → `Pi.authenticate()` → accessToken
2. Server: `requireAuth()` → verify token against Pi API
3. Server: Rate limit check (5/min for auth)
4. Server: User upsert in database

### Cryptographic Operations
- **Signing:** Ed25519 for Agent Passports
- **Verification:** Public key verification via `pemToMultibase()`
- **Storage:** Environment variables for secrets (SOVEREIGN_KEY_SALT)
- **DID:** `did:axiom:axiomid.app:pi:{uid}` format

### Data Protection
- Pi tokens: Never stored, verified server-side only
- Private keys: Client-side only
- Biometric data: Never collected
- Session tokens: Stateless (JWT-free design)

---

## 8. Testing Patterns

### Test File Locations
- Unit tests: `src/__tests__/lib/`
- API tests: `src/__tests__/api/`
- Component tests: `src/__tests__/components/`
- E2E tests: `e2e/`

### Running Tests
```bash
npm test              # Full suite (~2,800+ tests, 168 suites)
npm run lint          # ESLint (0 errors, 0 warnings)
npm run type-check    # TypeScript (tsc --noEmit)
npx playwright test   # E2E (requires npm run build first)
```

### Test Conventions
- Standard Jest matchers only (no `.toBeFinite()`)
- Mock `useLanguage` for i18n: `{ t: (key) => key, language: "en" }`
- Mock `useParams` for route params
- Pi Browser `User-Agent` header for auth mocks
- Valid v4 UUIDs for Zod schema tests
- `@testing-library/react` for component tests

---

## 9. CI/CD

### Workflows
- `ci.yml` — Lint, type-check, test, build
- `ai-pr-health.yml` — PR hygiene checks
- `label.yml` — Auto-labeling (7 stages)
- `npm-publish.yml` — Publish @axiomid/sdk + @axiomid/crypto
- `loops.yml` — Continuous improvement loops

### Merge Requirements
1. All CI checks passing
2. CodeRabbit review approved
3. User's explicit approval
4. Build passes locally
5. No merge conflicts

---

## 10. Quick Reference

### Environment Variables
```
DATABASE_URL           # PostgreSQL connection
PI_API_KEY             # Pi Network API key
SOVEREIGN_KEY_SALT     # HMAC key material for key derivation
AUTH_TOKEN_SECRET      # Token signing secret
OAUTH_STATE_SECRET     # OAuth state signing
NEXT_PUBLIC_PI_SANDBOX # Pi sandbox mode (true/false)
```

### Build Commands
```bash
npm run build          # Production build
npm run dev            # Development server
npx prisma generate    # Generate Prisma client
npx prisma migrate deploy  # Run migrations
```

---

*This document is auto-generated from the live codebase. Update it when patterns change.*
