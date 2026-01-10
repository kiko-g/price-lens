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

/**
 * SCHEDULE CONFIGURATION
 *
 * Defines how often each priority level should be scraped.
 * The scheduler uses these thresholds to determine which products are "stale".
 *
 * Priority 5 (Premium): Daily - high-value products users care most about
 * Priority 4 (High): Every 2 days - important but less critical
 * Priority 3 (Medium): Every 3 days - moderate importance
 * Priority 2 (Low): Weekly - low priority, minimal tracking (DISABLED)
 * Priority 1 (Minimal): Bi-weekly - rarely tracked (DISABLED)
 * Priority 0: Never scheduled - excluded from tracking
 */
export const PRIORITY_REFRESH_HOURS: Record<number, number | null> = {
  5: 24, // Premium: every 1 day
  4: 48, // High: every 2 days
  3: 72, // Medium: every 3 days
  2: 168, // Low: every 7 days
  1: 336, // Minimal: every 14 days
  0: null, // Never scheduled
}

// Priorities that are actively scheduled (must have non-null value in PRIORITY_REFRESH_HOURS)
export const ACTIVE_PRIORITIES = [5, 4, 3, 2] as const

// How many products to include in a single worker batch
// Each worker has 300 seconds max, ~5 sec per scrape = ~50 products max
export const WORKER_BATCH_SIZE = 40

// How many batches to send to QStash per scheduler run
// With 40 products per batch and 10 batches = 400 products per scheduler run
export const MAX_BATCHES_PER_RUN = 10

// Legacy: Batch size for QStash fan-out (used by bulk-scrape)
export const BATCH_SIZE = 100

// Cost estimation (USD per scrape - includes Vercel function, QStash, external API)
// Adjust this based on your actual costs
export const ESTIMATED_COST_PER_SCRAPE = 0.0005 // $0.0005 per scrape (~$0.50 per 1000)
