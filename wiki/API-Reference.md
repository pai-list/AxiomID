# API Reference

> Back to [Home](./Home) | See also: [Architecture](./Architecture)

---

## Base URL

```
Production:  https://axiomid.app
Local:       http://localhost:3000
```

All API routes are prefixed with `/api/`.

---

## Authentication

Pi Network SDK v2.0 handles authentication. Endpoints check:

1. **Pi Browser User-Agent** — requests must come from Pi Browser (or have sandbox headers in dev)
2. **Pi access token** — validated server-side via Pi API
3. **OAuth state** — CSRF protection via `OAUTH_STATE_SECRET`

```typescript
// Server-side auth check
const user = await requireAuth(request); // throws 401 if not authenticated
```

---

## API Routes

### Auth Routes

| Method | Route | Description | Auth |
|:---:|:---|:---|:---:|
| POST | `/api/auth/connect` | Connect Pi account, upsert user | Required |
| POST | `/api/auth/pi` | Pi SDK OAuth authentication | Public |
| GET | `/api/auth/state` | OAuth state verification | Public |
| POST | `/api/auth/logout` | Logout and clear session | Required |

### Agent Routes

| Method | Route | Description | Auth |
|:---:|:---|:---|:---:|
| GET | `/api/agent` | Get agent status | Required |
| POST | `/api/agent/activate` | Activate agent | Required |
| POST | `/api/agent/pause` | Pause agent | Required |
| POST | `/api/agent/identity` | Set agent identity | Required |
| POST | `/api/agent/identity/claim` | Claim agent identity | Required |
| GET | `/api/agent/manifest` | Agent manifest (capabilities) | Required |
| POST | `/api/agent/sign` | Sign data with agent key | Required |
| GET | `/api/agent/main` | Agent main endpoint | Required |
| POST | `/api/agents/harvest` | Harvest agent data (cron) | Service |

### Passport Routes

| Method | Route | Description | Auth |
|:---:|:---|:---|:---:|
| GET | `/api/passport/[slug]` | Get passport by slug | Public |
| POST | `/api/passport/[slug]/publish` | Publish passport | Required |
| POST | `/api/passport/[slug]/verify` | Verify passport VC | Public |

### Skills Marketplace Routes

| Method | Route | Description | Auth |
|:---:|:---|:---|:---:|
| GET | `/api/skills` | List all skills | Public |
| GET | `/api/skills/tags` | List all skill tags | Public |
| GET | `/api/skills/[slug]` | Get skill details | Public |
| POST | `/api/skills/[slug]/install` | Install skill | Required |
| POST | `/api/skills/[slug]/pay` | Pay for skill (Pi) | Required |
| POST | `/api/skills/[slug]/purchase` | Complete purchase | Required |
| GET | `/api/skills/[slug]/review` | Get skill reviews | Public |
| POST | `/api/skills/[slug]/review` | Submit review | Required |
| GET | `/api/skills/[slug]/stats` | Skill statistics | Public |
| GET | `/api/skills/[slug]/tags` | Skill tags | Public |
| GET | `/api/skills/[slug]/versions` | Skill version history | Public |
| POST | `/api/skills/[slug]/execute` | Execute skill (sandboxed) | Required |

### Admin Routes

| Method | Route | Description | Auth |
|:---:|:---|:---|:---:|
| POST | `/api/admin/skills` | Create skill (admin) | Admin |
| PUT | `/api/admin/skills/[id]` | Update skill (admin) | Admin |

### Pi Integration Routes

| Method | Route | Description | Auth |
|:---:|:---|:---|:---:|
| POST | `/api/pi/kya/claim` | Claim KYA (Know Your Agent) | Required |
| POST | `/api/pi/kya/verify` | Verify KYA status (server-side) | Required |
| POST | `/api/pi/payment/approve` | Approve Pi payment | Required |
| POST | `/api/pi/payment/complete` | Complete Pi payment | Required |
| POST | `/api/pi/ads/verify` | Verify Pi ad completion | Required |

### Stamp Routes

| Method | Route | Description | Auth |
|:---:|:---|:---|:---:|
| GET | `/api/stamp` | List user stamps | Required |
| POST | `/api/stamp/claim` | Claim a stamp (VC) | Required |

### Social Routes

| Method | Route | Description | Auth |
|:---:|:---|:---|:---:|
| POST | `/api/social/disconnect` | Disconnect social account | Required |

### Stellar Routes

| Method | Route | Description | Auth |
|:---:|:---|:---|:---:|
| POST | `/api/stellar/anchor` | Anchor VC hash on Stellar | Required |

### System Routes

| Method | Route | Description | Auth |
|:---:|:---|:---|:---:|
| GET | `/api/health` | Health check | Public |
| GET | `/api/status` | Service status (DB, Stellar, Pi, Workers AI) | Public |
| GET | `/api/did-document` | DID document | Public |
| GET | `/api/credential-status` | Credential status | Public |
| GET | `/api/explorer` | Explorer data | Public |
| GET | `/api/leaderboard` | Leaderboard | Public |
| GET | `/api/user/status` | User status | Required |
| GET | `/api/daily-review` | Daily review (cron) | Service |
| GET | `/api/presence/heartbeat` | Presence heartbeat | Required |
| POST | `/api/upload/presign` | Presigned upload URL (R2) | Required |
| POST | `/api/vault/stake` | Vault staking | Required |
| POST | `/api/telegram` | Telegram webhook | Service |
| POST | `/api/sync` | Data sync (cron) | Service |

---

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|:---|:---:|:---|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMITED` | 429 | Too many requests (Upstash Redis) |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

Production uses **Upstash Redis** for rate limiting:

| Tier | Limit |
|:---|:---|
| Unauthenticated | 10 req/min |
| Authenticated | 100 req/min |
| Admin | 500 req/min |

---

## OpenAPI Spec

A machine-readable OpenAPI spec is available at [`/public/openapi.json`](https://github.com/Moeabdelaziz007/AxiomID/blob/main/public/openapi.json).

---

*← [Soul System](./Soul-System) | → [MCP Server Tools](./MCP-Server-Tools)*
