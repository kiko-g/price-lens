import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled:
    process.env.NODE_ENV !== "development" &&
    !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Error monitoring only — no tracing, no replay, no feedback
  tracesSampleRate: 0,
})
