/**
 * Reset Pass 2 canonical data.
 *
 * Clears all canonical_product_id links and deletes all canonical_products,
 * while preserving Pass 1 (trade_items) and Pass 1.5 (OFF enrichment) data.
 *
 * Usage:
 *   pnpm canonical:reset-pass2          # local DB
 *   pnpm canonical:reset-pass2:prod     # production DB
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

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BATCH_SIZE = 500

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

async function batchClearColumn(
  supabase: SupabaseClient,
  table: "store_products" | "trade_items",
  label: string,
): Promise<void> {
  let cleared = 0
  for (;;) {
    const { data: batch, error: fetchErr } = await supabase
      .from(table)
      .select("id")
      .not("canonical_product_id", "is", null)
      .order("id")
      .limit(BATCH_SIZE)

    if (fetchErr) throw new Error(`Fetch ${label} failed: ${fetchErr.message}`)
    if (!batch || batch.length === 0) break

    const ids = batch.map((r: { id: number }) => r.id)
    const { error: updateErr } = await supabase.from(table).update({ canonical_product_id: null }).in("id", ids)

    if (updateErr) throw new Error(`Update ${label} failed: ${updateErr.message}`)
    cleared += ids.length
    log(`  ${label}: cleared ${cleared} rows...`)
  }
  log(`  ${label}: done (${cleared} total)`)
}

async function batchDeleteAll(supabase: SupabaseClient): Promise<void> {
  let deleted = 0
  for (;;) {
    const { data: batch, error: fetchErr } = await supabase
      .from("canonical_products")
      .select("id")
      .order("id")
      .limit(BATCH_SIZE)

    if (fetchErr) throw new Error(`Fetch canonical_products failed: ${fetchErr.message}`)
    if (!batch || batch.length === 0) break

    const ids = batch.map((r: { id: number }) => r.id)
    const { error: delErr } = await supabase.from("canonical_products").delete().in("id", ids)

    if (delErr) throw new Error(`Delete canonical_products failed: ${delErr.message}`)
    deleted += ids.length
    log(`  canonical_products: deleted ${deleted} rows...`)
  }
  log(`  canonical_products: done (${deleted} total)`)
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
    process.exit(1)
  }

  const dryRun = process.argv.includes("--dry-run")
  if (dryRun) log("*** DRY RUN — no writes ***")

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  log("=== Reset Pass 2 (canonical_products) ===")
  log(`Target: ${SUPABASE_URL}`)

  const [spCount, tiCount, cpCount] = await Promise.all([
    supabase
      .from("store_products")
      .select("id", { count: "exact", head: true })
      .not("canonical_product_id", "is", null),
    supabase.from("trade_items").select("id", { count: "exact", head: true }).not("canonical_product_id", "is", null),
    supabase.from("canonical_products").select("id", { count: "exact", head: true }),
  ])

  log(`Before:`)
  log(`  store_products with canonical_product_id: ${spCount.count ?? 0}`)
  log(`  trade_items with canonical_product_id:    ${tiCount.count ?? 0}`)
  log(`  canonical_products:                       ${cpCount.count ?? 0}`)

  if (dryRun) {
    log("DRY RUN — would clear all the above. Exiting.")
    return
  }

  log("Step 1/3: Clearing canonical_product_id on store_products (batched)...")
  await batchClearColumn(supabase, "store_products", "store_products")

  log("Step 2/3: Clearing canonical_product_id on trade_items (batched)...")
  await batchClearColumn(supabase, "trade_items", "trade_items")

  log("Step 3/3: Deleting all canonical_products (batched)...")
  await batchDeleteAll(supabase)

  const [spAfter, tiAfter, cpAfter] = await Promise.all([
    supabase
      .from("store_products")
      .select("id", { count: "exact", head: true })
      .not("canonical_product_id", "is", null),
    supabase.from("trade_items").select("id", { count: "exact", head: true }).not("canonical_product_id", "is", null),
    supabase.from("canonical_products").select("id", { count: "exact", head: true }),
  ])

  log(`After:`)
  log(`  store_products with canonical_product_id: ${spAfter.count ?? 0}`)
  log(`  trade_items with canonical_product_id:    ${tiAfter.count ?? 0}`)
  log(`  canonical_products:                       ${cpAfter.count ?? 0}`)
  log("=== Reset complete ===")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
