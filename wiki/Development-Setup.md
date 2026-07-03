# Development Setup

> Back to [Home](./Home) | See also: [Architecture](./Architecture)

---

## Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** (or yarn/pnpm)
- **Git**
- **Pi Browser** (for testing Pi SDK features)
- **Cloudflare account** (for backend Worker)
- **PostgreSQL database** (Ghost.build, Supabase, or local)

---

## Frontend Setup

```bash
git clone https://github.com/Moeabdelaziz007/AxiomID.git
cd AxiomID
npm install
cp .env.example .env.local
```

### Environment Variables

Fill in `.env.local`:

| Variable | Required | Description |
|:---|:---:|:---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PI_API_KEY` | ✅ | Pi Network API key |
| `SOVEREIGN_KEY_SALT` | ✅ | HMAC salt for key derivation |
| `OAUTH_STATE_SECRET` | ✅ | CSRF protection secret |
| `PI_TOKEN_ENCRYPTION_KEY` | ✅ | Token encryption (32-byte hex) |
| `ISSUER_PRIVATE_KEY` | ✅ | Ed25519 private key for VC signing |
| `ISSUER_PUBLIC_KEY` | ✅ | Ed25519 public key for VC verification |
| `NEXT_PUBLIC_PI_SANDBOX` | Optional | `true` for Pi sandbox mode |
| `CLOUDFLARE_BACKEND_URL` | Optional | Cloudflare Worker URL |

### Run Development Server

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## HTTPS for Pi Browser

Pi SDK requires HTTPS. Use `portless` for local HTTPS:

```bash
npm install -g portless
portless axiomid next dev
# → https://axiomid.localhost (auto-trusted certs)
```

---

## Backend Setup (Cloudflare Worker)

```bash
cd backend
npm install
```

### Initialize D1 Databases

```bash
# Edge database
npx wrangler d1 execute axiomid-edge --remote --file=./migrations/0001_init.sql

# Truth database (Quran verses)
npx wrangler d1 execute truth-db --remote --file=./migrations/0002_truth.sql
```

### Set Secrets

```bash
echo "your-token" | npx wrangler secret put SHARED_SECRET_TOKEN_VERCEL_CF
```

### Run Backend Locally

```bash
npx wrangler dev
```

### Deploy Backend

```bash
npx wrangler deploy
```

---

## Testing

```bash
# Run all tests (3085 tests, 153 suites)
npm test

# Run with coverage
npx jest --coverage

# Watch mode
npm run test:watch

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Dead code detection
npx knip

# Accessibility
npm run a11y
```

---

## Project Structure

```
AxiomID/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API route handlers
│   │   │   ├── auth/           # Authentication routes
│   │   │   ├── agent/          # Agent lifecycle
│   │   │   ├── passport/       # Passport CRUD
│   │   │   ├── skills/         # Marketplace
│   │   │   ├── stamp/          # Verifiable Credentials
│   │   │   ├── pi/             # Pi Network integration
│   │   │   └── stellar/        # Stellar anchoring
│   │   ├── claim/              # 3-step onboarding
│   │   ├── dashboard/          # Authenticated dashboard
│   │   ├── passport/[slug]/    # Public passport viewer
│   │   ├── leaderboard/        # Top users
│   │   ├── explorer/           # Browse agents
│   │   ├── docs/               # Documentation
│   │   └── status/             # Service health
│   ├── components/             # Shared UI components
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── passport/           # Passport sections
│   │   ├── pwa/                # PWA components
│   │   └── ui/                 # Base UI components
│   ├── lib/                    # Core libraries
│   │   ├── did.ts              # DID creation
│   │   ├── did-document.ts     # DID Document builder
│   │   ├── trust.ts            # Trust score computation
│   │   ├── tiers.ts            # Tier definitions
│   │   ├── soul-principles.ts  # Soul System principles
│   │   ├── pi-sdk.ts           # Pi SDK loader
│   │   ├── pi-sandbox.ts       # Sandbox detection
│   │   ├── pi-native-features.ts # Native Pi features
│   │   ├── stellar-anchoring.ts # Stellar VC anchoring
│   │   ├── sovereign-keys.ts   # Ed25519 key derivation
│   │   └── vc.ts               # Verifiable Credentials
│   ├── i18n/                   # Internationalization
│   │   ├── en.json             # English
│   │   └── ar.json             # Arabic
│   └── __tests__/              # Test files
├── backend/                    # Cloudflare Worker
│   ├── src/
│   │   ├── routes/             # Backend routes
│   │   │   ├── truth-rag.ts    # Truth Q&A pipeline
│   │   │   ├── skills.ts       # Skills API
│   │   │   └── search.ts       # Vectorize search
│   │   ├── lib/                # Backend libraries
│   │   ├── mcp/                # MCP server
│   │   └── vectors/            # Embedding generation
│   └── wrangler.toml           # Cloudflare config
├── packages/
│   ├── sdk/                    # @axiomid/sdk (MIT)
│   └── crypto/                 # @axiomid/crypto (MIT)
├── prisma/                     # Prisma schema + migrations
├── public/                     # Static assets
└── scripts/                    # Build/maintenance scripts
```

---

## CI/CD

### GitHub Actions

CI runs on every push/PR to `main`:

1. **Type check** (`tsc --noEmit`)
2. **Lint** (`eslint`)
3. **Build** (`next build`)
4. **Test** (`jest --ci --runInBand`)
5. **Dead code check** (`knip`)

### Vercel Deployment

- Deploys automatically from `main`
- Preview deployments on PRs
- Environment variables set in Vercel dashboard

---

## Useful Commands

| Command | Description |
|:---|:---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run tests |
| `npm run lint` | Lint code |
| `npx tsc --noEmit` | Type check |
| `npx knip` | Dead code detection |
| `npm run a11y` | Accessibility audit |
| `npm run deploy` | Deploy to Vercel |
| `npx wrangler dev` | Run CF Worker locally |
| `npx wrangler deploy` | Deploy CF Worker |

---

*← [Architecture](./Architecture)*
