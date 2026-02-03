import { Client } from "@upstash/qstash"

// Re-export priority constants for convenience
export { PRIORITY_REFRESH_HOURS, ACTIVE_PRIORITIES } from "@/lib/business/priority"

// QStash client for publishing messages
// Requires QSTASH_TOKEN environment variable
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
})

// Base URL for worker endpoints
// Use production domain for QStash callbacks (not deployment-specific preview URLs)
export const getBaseUrl = () => {
  // Always prefer explicit site URL (your production domain)
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL

  // Fallback to Vercel URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  return "http://localhost:3000"
}

// How many products to include in a single worker batch
// Each worker has 300 seconds max, ~5 sec per scrape = ~60 products max
// Using 50 with buffer for safety
export const WORKER_BATCH_SIZE = 50

// How many batches to send to QStash per scheduler run
// With 50 products per batch and 20 batches = 1000 products per scheduler run
// Note: Requires QStash paid plan (~$10/mo) for >500 messages/day
export const MAX_BATCHES_PER_RUN = 20

// Cron runs every 15 minutes = 96 runs/day
// Max daily capacity: 50 × 20 × 96 = 96,000 products/day
export const CRON_FREQUENCY_MINUTES = 15

// Legacy: Batch size for QStash fan-out (used by bulk-scrape)
export const BATCH_SIZE = 100

// Cost estimation (USD per scrape - includes Vercel function, QStash, external API)
// Adjust this based on your actual costs
export const ESTIMATED_COST_PER_SCRAPE = 0.0005 // $0.0005 per scrape (~$0.50 per 1000)
