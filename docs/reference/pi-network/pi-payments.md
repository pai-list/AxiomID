# Pi Payments

**URL:** <https://github.com/pi-apps/pi-platform-docs/blob/main/pi_payments.md>

**Purpose:** Pi Payments allow Pi apps to request and receive Pi cryptocurrency payments from users. The flow is a three-step server-side process: create → approve → complete, with the SDK handling the in-app approval UI.

## Key concepts

- **Pi.createPayment(args, callbacks)** — Frontend call that initiates the payment flow
- **onReadyForServerApproval** — Callback invoked when the payment is ready for server-side approval; the backend must call the approve endpoint
- **onReadyForServerCompletion** — Callback invoked after user approval; the backend must call the complete endpoint
- **onCancel** — Callback invoked if the user cancels
- **onError** — Callback on failure
- **Payment metadata** — `memo`, `amount`, `metadata` object passed through the lifecycle

## Flow

```
Frontend: Pi.createPayment({ amount, memo, metadata }, {
  onReadyForServerApproval: (paymentId) => POST /api/pi/payment/approve
  onReadyForServerCompletion: (paymentId, txid) => POST /api/pi/payment/complete
  onCancel: () => handle cancellation
  onError: () => handle error
})
```

## How AxiomID uses it

- Payment approval at `src/app/api/pi/payment/approve/route.ts` — approves the payment server-side when SDK signals readiness
- Payment completion at `src/app/api/pi/payment/complete/route.ts` — completes the payment after the user confirms
- Payments used for agent deployment, passport minting, and badge purchases
- Sandbox mode uses `SANDBOX_AUTH_BYPASS` and `SANDBOX_DEV_TOKEN` for testing without real Pi transactions
