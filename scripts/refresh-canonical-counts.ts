/**
 * Refresh pre-computed barcode_count / store_count on canonical_products.
 *
 * Usage:
 *   pnpm refresh:counts          # local DB
 *   pnpm refresh:counts:prod     # production DB
 */

import * as fs from "fs"
import * as path from "path"

for (const envFile of [".env.local", ".env.development.local"]) {
  const envPath = path.join(process.cwd(), envFile)
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8")
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=")
        const value = valueParts.join("=").replace(/^["']|["']$/g, "")
        if (key && !process.env[key]) {
          process.env[key] = value
        }
      }
    }
    break
  }
}

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  log(`Connecting to ${SUPABASE_URL}`)
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  let totalUpdated = 0
  let batchSize = 2000
  let consecutiveErrors = 0

  log("Refreshing canonical_products barcode_count / store_count...")

  for (;;) {
    const { data, error } = await supabase.rpc("refresh_canonical_counts_batch", {
      batch_size: batchSize,
    })

    if (error) {
      consecutiveErrors++
      if (consecutiveErrors >= 3) {
        log(`ERROR: 3 consecutive failures at ${totalUpdated} rows: ${error.message}`)
        process.exit(1)
      }
      batchSize = Math.max(200, Math.floor(batchSize / 2))
      log(`WARN: batch failed, reducing to ${batchSize}: ${error.message}`)
      continue
    }

    consecutiveErrors = 0
    const updated = typeof data === "number" ? data : 0
    if (updated === 0) break

    totalUpdated += updated
    log(`Progress: ${totalUpdated} canonical_products refreshed...`)
  }

  log(`Done. Refreshed ${totalUpdated} canonical_products.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
