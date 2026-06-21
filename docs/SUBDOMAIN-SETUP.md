# Subdomain Passport DNS Configuration

Enable `*.axiomid.app` subdomains so users get `username.axiomid.app` passport URLs.

## Prerequisites

- Cloudflare account managing `axiomid.app`
- Vercel project linked to the AxiomID repo
- `wrangler` CLI authenticated (`npx wrangler whoami`)

---

## Step 1: Cloudflare DNS

Add a **wildcard CNAME** record:

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| CNAME | `*` | `cname.vercel-dns.com` | **DNS only** (gray cloud) | Auto |

### Via Cloudflare Dashboard

1. Go to **Cloudflare Dashboard** → `axiomid.app` → **DNS** → **Records**
2. Click **Add record**
3. Type: `CNAME`, Name: `*`, Target: `cname.vercel-dns.com`, Proxy: **off** (gray cloud)
4. Click **Save**

### Via Wrangler CLI

```bash
npx wrangler dns create axiomid.app --type CNAME --name "*" --content cname.vercel-dns.com --no-proxied
```

> **Important:** The CNAME must be **DNS-only** (gray cloud), not proxied (orange cloud). Vercel handles TLS termination.

---

## Step 2: Vercel Wildcard Domain

1. Go to **Vercel Dashboard** → `axiomid` project → **Settings** → **Domains**
2. Type `*.axiomid.app` and click **Add**
3. Vercel will verify the DNS record and issue a wildcard TLS certificate
4. Wait for the certificate to provision (usually < 5 minutes)

---

## Step 3: Verify

```bash
# DNS resolution
dig amrikyy.axiomid.app +short
# → 76.76.21.21 (Vercel's IP)

# TLS certificate
openssl s_client -connect amrikyy.axiomid.app:443 -servername amrikyy.axiomid.app </dev/null 2>/dev/null | openssl x509 -noout -subject
# → CN=*.axiomid.app

# Browser test
open https://amrikyy.axiomid.app
# → Shows passport page (or 404 if user doesn't exist)
```

---

## Reserved Subdomains

These cannot be claimed by users (enforced in `src/middleware.ts`):

```
www, api, mail, app, admin, dashboard,
docs, blog, status, cdn, assets, static
```

---

## How It Works

```
1. User visits: amrikyy.axiomid.app
2. Cloudflare DNS resolves *.axiomid.app → Vercel
3. Next.js middleware extracts "amrikyy" from Host header
4. Middleware rewrites to /passport/amrikyy
5. Passport viewer fetches user by piUsername, walletAddress, or did
6. Found → renders passport | Not found → 404
```

---

## Implementation References

| File | Purpose |
|------|---------|
| `src/middleware.ts` (lines 103-125) | Subdomain extraction + rewrite |
| `prisma/schema.prisma` | `User.subdomain` + `UserAgent.subdomain` (unique VARCHAR(50)) |
| `src/app/passport/[slug]/page.tsx` | Passport viewer (existing, no changes needed) |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `NXDOMAIN` | DNS not propagated | Wait 5 min, check Cloudflare DNS tab |
| `SSL_ERROR` | Vercel cert not provisioned | Re-add domain in Vercel Settings → Domains |
| Shows axiomid.app homepage | Subdomain not extracted | Check middleware.ts Host header logic |
| 404 for valid user | User has no subdomain set | User must claim subdomain via dashboard |
