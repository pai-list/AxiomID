# Vanity Subdomain → Passport Routing

> Status: SPEC
> Date: 2026-07-07
> Estimated: 1-2 hours

## Problem

Users want a shareable URL that shows their identity. The current `/passport/[slug]` works but isn't memorable. A vanity URL like `amrikyy.axiomid.app` is instant social proof.

## Solution

Route `*.axiomid.app` subdomains to the existing passport page. No new UI needed — the passport viewer already has trust score, stamps, badges, share, and mint.

## Architecture

```text
User visits: amrikyy.axiomid.app
     ↓
Cloudflare DNS: *.axiomid.app → CNAME axiomid.app
     ↓
Cloudflare Worker: extracts subdomain → redirects to axiomid.app/passport/amrikyy
     ↓
Existing PassportView renders the passport
```

## Implementation

### 1. Cloudflare Worker (subdomain-redirect)

```typescript
// workers/subdomain-redirect/src/index.ts
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Extract subdomain: amrikyy.axiomid.app → amrikyy
    const parts = hostname.split('.');
    if (parts.length !== 3 || parts[1] !== 'axiomid' || parts[2] !== 'app') {
      return new Response('Not found', { status: 404 });
    }

    const subdomain = parts[0];

    // Validate subdomain (alphanumeric + hyphens, 3-30 chars)
    if (!/^[a-z0-9][a-z0-9-]{2,29}$/.test(subdomain)) {
      return new Response('Invalid subdomain', { status: 400 });
    }

    // Redirect to passport page
    return Response.redirect(`https://axiomid.app/passport/${subdomain}`, 301);
  },
};
```

### 2. DNS Configuration

```text
*.axiomid.app  CNAME  axiomid.app
```

### 3. Subdomain Claiming (Dashboard)

Add to Settings → Profile tab:
- "Your vanity URL" section
- Shows: `amrikyy.axiomid.app`
- Copy button + share button
- Only available for users with `publicId` set

### 4. Passport Page Enhancement

The existing passport viewer at `/passport/[slug]` already handles everything. Optional enhancements:
- Add `og:title` with username for better social previews
- Add `og:description` with trust score
- Ensure OG image includes the subdomain URL

## What This Does NOT Need

- No chatbot (removed per Ponytail — cost saving)
- No new API endpoints (passport API exists)
- No new database tables (publicId already exists on User)
- No new components (passport viewer is complete)

## Social Flexing Flow

1. User claims identity → gets `amrikyy.axiomid.app`
2. User shares URL on social media
3. Visitor sees: passport card with trust score, stamps, badges
4. Visitor clicks "Claim yours" → goes to `/claim`
5. Network effect: each share is a referral

## Cost

- Cloudflare Worker: free tier (100k requests/day)
- DNS: already on Cloudflare
- No new infrastructure

## Security

- Subdomain validation (alphanumeric + hyphens only)
- 301 redirect (not proxy) — no data leakage
- Rate limiting on the Worker
- Only public passport data is shown (already public)
