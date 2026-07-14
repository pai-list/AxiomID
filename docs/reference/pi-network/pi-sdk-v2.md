# Pi SDK v2

**URL:** <https://github.com/pi-apps/pi-platform-docs>

**Purpose:** The Pi SDK v2 enables Pi Network applications to authenticate users, process Pi payments, display ads, and invoke native mobile features — all within the Pi Browser ecosystem. It is the primary integration layer between AxiomID and the Pi Network platform.

## Key concepts

- **Pi.init()** — Initialises the SDK with the app's Pi Network configuration
- **Pi.authenticate()** — Authenticates the Pi user, returning a `user` object with `uid`, `username`, and access token
- **Pi.createPayment()** — Creates a Pi payment with metadata, to be approved and completed
- **Pi.Ads.showAd()** — Displays interstitial or rewarded ads
- **Pi.nativeFeature.openShareDialog()** — Opens the native Pi Browser share dialog
- **Pi.nativeFeature.openConsentDialog()** — Opens native KYC consent flow
- **Access Tokens** — Short-lived tokens used to authenticate backend API requests from the Pi ecosystem

## How AxiomID uses it

- Authentication at `src/app/api/auth/pi/route.ts` — `Pi.authenticate()` called from the frontend, token verified server-side
- Pi Payments integrated in marketplace via `createPiPayment()` helper
- Native features wrapper at `src/lib/pi-native-features.ts` with fallback chain (Pi native → navigator.share → clipboard)
- Diagnostics capture at `src/app/api/diagnostics/capture/route.ts` logs Pi API response shapes
- Share dialog used in `InteractivePassportCard` and `PassportView` components
- Consent dialog requested on claim page before KYC verification
