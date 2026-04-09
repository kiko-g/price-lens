import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV !== "development" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0,
})
