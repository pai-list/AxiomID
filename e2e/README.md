# AxiomID E2E suite

This directory contains Playwright coverage for the Pi Browser and Pi sandbox paths.
The suite intentionally avoids internal Pi mocks for auth, action claim, and payment
API checks. Those tests are skipped until real sandbox credentials are provided.

Run:

```bash
npm run test:e2e
```

Required for real Pi sandbox auth/action checks:

- `DATABASE_URL` — dedicated disposable test database.
- `PI_SANDBOX_ACCESS_TOKEN` — access token issued by the Pi sandbox login flow.
- `PI_SANDBOX_UID` — UID returned by the same sandbox login flow.
- `PI_SANDBOX_USERNAME` — username returned by the same sandbox login flow.

Optional for payment checks:

- `PI_API_KEY` — server-side Pi API key.
- `PI_SANDBOX_PAYMENT_ID` — payment identifier created in the Pi sandbox.
- `PI_SANDBOX_PAYMENT_TXID` — optional txid used to complete the payment.
