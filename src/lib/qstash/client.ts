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

// Priority configuration: maps priority level to staleness threshold in hours
// All tracked products (3+) are scraped daily - priority determines ORDER of processing
// Lower priority products are scraped less frequently (cost savings)
export const PRIORITY_STALENESS_HOURS: Record<number, number> = {
  5: 1 * 24, // Premium: daily, processed FIRST
  4: 1 * 24, // High: daily, processed second
  3: 1 * 24, // Medium: daily, processed last
  2: 7 * 24, // Low: weekly (7 days)
  1: 28 * 24, // Minimal: every 4 weeks (discovery/backfill)
}

// Batch size for fan-out (QStash has limits per request)
export const BATCH_SIZE = 100
