import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay — capture 10% of sessions in production, 100% in dev
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // If you wish to use the default error / session replay integrations,
  // remove the `integrations` option entirely — Sentry auto-instruments them.
  integrations: [
    // Replay integration is included automatically with @sentry/nextjs
  ],

  // Don't report errors in development
  enabled: process.env.NODE_ENV !== "development",
});
