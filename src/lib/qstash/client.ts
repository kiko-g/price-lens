import { Client } from "@upstash/qstash"

// QStash client for publishing messages
// Requires QSTASH_TOKEN environment variable
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
})

// Base URL for worker endpoints
// In production, this should be your Vercel deployment URL
export const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  return "http://localhost:3000"
}

export const PRIORITY_STALENESS_HOURS: Record<number, number> = {
  5: 1 * 1 * 24, // Premium: every 1 day
  4: 2 * 1 * 24, // High: every 2 days
  3: 3 * 1 * 24, // Medium: every 3 days
  2: 7 * 1 * 24, // Low: weekly (7 days)
  1: 7 * 2 * 24, // Minimal: every 2 weeks
  // 0: 7 * 4 * 24, // Unprioritized: every 4 weeks
}

// Batch size for fan-out (QStash has limits per request)
export const BATCH_SIZE = 100
