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
// Each worker has 300s max. With useAntiBlock (300-1500ms delay) + ~5s scrape:
// 40 products × ~5.9s avg = ~236s (safe margin within 300s limit)
export const WORKER_BATCH_SIZE = 40

// How many batches to send to QStash per scheduler run
// NOTE: Temporarily reduced from 20 to 10 to halve egress. Revert after ~20 Mar 2026.
// With 40 products per batch and 10 batches = 400 products per scheduler run
export const MAX_BATCHES_PER_RUN = 20

// Cron runs every 30 minutes = 48 runs/day (temporarily slowed from 15 min)
// Max daily capacity: 40 × 10 × 48 = 19,200 products/day
export const CRON_FREQUENCY_MINUTES = 30

// Legacy: Batch size for QStash fan-out (used by bulk-scrape)
export const BATCH_SIZE = 100

// Cost estimation (USD per scrape - includes Vercel function, QStash, external API)
// Adjust this based on your actual costs
export const ESTIMATED_COST_PER_SCRAPE = 0.0005 // $0.0005 per scrape (~$0.50 per 1000)
