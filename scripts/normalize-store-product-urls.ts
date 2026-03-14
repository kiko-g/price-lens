/**
 * Normalize store_product URLs and merge duplicates.
 *
 * Uses cleanUrl() from src/lib/scrapers/utils.ts to strip tracking params
 * and fix encoding. Rows that share the same normalized URL are merged:
 * the winner (latest scraped_at) keeps prices + user_favorites from losers.
 *
 * Usage:
 *   pnpm tsx scripts/normalize-store-product-urls.ts              # dry run, prod (.env.production)
 *   pnpm tsx scripts/normalize-store-product-urls.ts --local      # dry run, local (.env.local)
 *   pnpm tsx scripts/normalize-store-product-urls.ts --execute    # execute, prod
 *   pnpm tsx scripts/normalize-store-product-urls.ts --execute --local  # execute, local
 */

import * as fs from "fs"
import * as path from "path"

const args = process.argv.slice(2)
const useLocal = args.includes("--local")
const execute = args.includes("--execute")
const dryRun = !execute

const envFile = useLocal ? ".env.local" : ".env.production"
const envPath = path.resolve(process.cwd(), envFile)
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
} else {
  console.error(`Env file not found: ${envFile}`)
  process.exit(1)
}

import { createClient } from "@supabase/supabase-js"
import { cleanUrl } from "../src/lib/scrapers/utils"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Row {
  id: number
  url: string
  name: string | null
  scraped_at: string | null
  updated_at: string | null
  created_at: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchAllProducts(): Promise<Row[]> {
  const all: Row[] = []
  const pageSize = 900
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from("store_products")
      .select("id, url, name, scraped_at, updated_at, created_at")
      .not("url", "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error("Error fetching products:", error)
      break
    }

    all.push(...data)
    console.log(`  Fetched ${all.length} rows...`)

    if (data.length < pageSize) break
    offset += pageSize
  }

  return all
}

function pickWinner(group: Row[]): Row {
  return group.reduce((best, r) => {
    const bestScraped = !!best.scraped_at
    const rScraped = !!r.scraped_at

    // Prefer rows that have actually been scraped
    if (rScraped && !bestScraped) return r
    if (bestScraped && !rScraped) return best

    // Both scraped or both unscraped: compare timestamps
    const bestTs = best.scraped_at ?? best.updated_at ?? best.created_at ?? ""
    const rTs = r.scraped_at ?? r.updated_at ?? r.created_at ?? ""
    if (rTs > bestTs) return r
    if (rTs === bestTs && r.id < best.id) return r
    return best
  })
}

// ---------------------------------------------------------------------------
// Migration actions
// ---------------------------------------------------------------------------

async function migratePrices(winnerId: number, loserIds: number[]): Promise<number> {
  const { count, error } = await supabase
    .from("prices")
    .update({ store_product_id: winnerId }, { count: "exact" })
    .in("store_product_id", loserIds)

  if (error) {
    console.error(`  Error migrating prices to winner ${winnerId}:`, error)
    return 0
  }
  return count ?? 0
}

async function migrateFavorites(winnerId: number, loserIds: number[]): Promise<{ migrated: number; deduped: number }> {
  // Find favorites that belong to losers
  const { data: loserFavs, error: fetchErr } = await supabase
    .from("user_favorites")
    .select("id, user_id, store_product_id")
    .in("store_product_id", loserIds)

  if (fetchErr || !loserFavs?.length) return { migrated: 0, deduped: 0 }

  // Find favorites already pointing to the winner (same user)
  const { data: winnerFavs } = await supabase
    .from("user_favorites")
    .select("user_id")
    .eq("store_product_id", winnerId)

  const winnerUserIds = new Set((winnerFavs ?? []).map((f) => f.user_id))

  // Split: duplicates (user already favorites winner) vs transferable
  const toDelete: number[] = []
  const toUpdate: number[] = []

  for (const fav of loserFavs) {
    if (winnerUserIds.has(fav.user_id)) {
      toDelete.push(fav.id)
    } else {
      toUpdate.push(fav.id)
      winnerUserIds.add(fav.user_id) // prevent duplicates within this batch
    }
  }

  if (toDelete.length) {
    const { error } = await supabase.from("user_favorites").delete().in("id", toDelete)
    if (error) console.error(`  Error deleting duplicate favorites:`, error)
  }

  if (toUpdate.length) {
    const { error } = await supabase
      .from("user_favorites")
      .update({ store_product_id: winnerId })
      .in("id", toUpdate)
    if (error) console.error(`  Error migrating favorites to winner ${winnerId}:`, error)
  }

  return { migrated: toUpdate.length, deduped: toDelete.length }
}

async function deleteLosers(loserIds: number[]): Promise<void> {
  const batchSize = 100
  for (let i = 0; i < loserIds.length; i += batchSize) {
    const batch = loserIds.slice(i, i + batchSize)
    const { error } = await supabase.from("store_products").delete().in("id", batch)
    if (error) console.error(`  Error deleting losers batch:`, error)
  }
}

async function updateUrl(id: number, newUrl: string): Promise<void> {
  const { error } = await supabase.from("store_products").update({ url: newUrl }).eq("id", id)
  if (error) console.error(`  Error updating URL for ${id}:`, error)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n${dryRun ? "DRY RUN" : "EXECUTE"} | DB: ${useLocal ? "local" : "prod"} (${supabaseUrl})\n`)

  console.log("Fetching all store_products...")
  const products = await fetchAllProducts()
  console.log(`Total rows: ${products.length}\n`)

  // Build groups by normalized URL
  const groups = new Map<string, Row[]>()
  let urlsAlreadyClean = 0

  for (const row of products) {
    const normalized = cleanUrl(row.url)
    const group = groups.get(normalized) ?? []
    group.push(row)
    groups.set(normalized, group)

    if (row.url === normalized) urlsAlreadyClean++
  }

  const duplicateGroups = Array.from(groups.entries()).filter(([, g]) => g.length > 1)
  const dirtysingles = Array.from(groups.entries()).filter(
    ([normalizedUrl, g]) => g.length === 1 && g[0].url !== normalizedUrl,
  )

  console.log(`URLs already clean: ${urlsAlreadyClean}`)
  console.log(`Single-row URL updates needed: ${dirtysingles.length}`)
  console.log(`Duplicate groups to merge: ${duplicateGroups.length}`)
  console.log(
    `Total loser rows to delete: ${duplicateGroups.reduce((sum, [, g]) => sum + g.length - 1, 0)}`,
  )

  // ---- Process duplicate groups ----
  let totalPricesMigrated = 0
  let totalFavsMigrated = 0
  let totalFavsDeduped = 0
  let totalLosersDeleted = 0

  if (duplicateGroups.length > 0) {
    console.log(`\n--- Duplicate groups ---\n`)
  }

  for (const [normalizedUrl, group] of duplicateGroups) {
    const winner = pickWinner(group)
    const losers = group.filter((r) => r.id !== winner.id)
    const loserIds = losers.map((r) => r.id)

    console.log(`Group: ${normalizedUrl}`)
    console.log(`  Winner: id=${winner.id} scraped_at=${winner.scraped_at ?? "null"}`)
    for (const l of losers) {
      console.log(`  Loser:  id=${l.id} scraped_at=${l.scraped_at ?? "null"} url=${l.url}`)
    }

    if (!dryRun) {
      const priceCount = await migratePrices(winner.id, loserIds)
      const favResult = await migrateFavorites(winner.id, loserIds)
      totalPricesMigrated += priceCount
      totalFavsMigrated += favResult.migrated
      totalFavsDeduped += favResult.deduped

      await deleteLosers(loserIds)
      totalLosersDeleted += loserIds.length

      if (winner.url !== normalizedUrl) {
        await updateUrl(winner.id, normalizedUrl)
      }

      console.log(`  -> Migrated ${priceCount} prices, ${favResult.migrated} favs (${favResult.deduped} deduped), deleted ${loserIds.length} losers`)
    }
  }

  // ---- Process single-row URL updates ----
  if (dirtysingles.length > 0) {
    console.log(`\n--- Single-row URL updates ---\n`)
  }

  let urlsUpdated = 0
  const batchSize = 100

  for (let i = 0; i < dirtysingles.length; i += batchSize) {
    const batch = dirtysingles.slice(i, i + batchSize)

    if (dryRun) {
      for (const [normalizedUrl, [row]] of batch) {
        if (i < batchSize) {
          // Only log first batch in dry run to avoid noise
          console.log(`  id=${row.id}: ${row.url} -> ${normalizedUrl}`)
        }
      }
      if (dirtysingles.length > batchSize) {
        console.log(`  ... and ${dirtysingles.length - batchSize} more`)
      }
      urlsUpdated += batch.length
    } else {
      for (const [normalizedUrl, [row]] of batch) {
        await updateUrl(row.id, normalizedUrl)
        urlsUpdated++
      }
      console.log(`  Updated batch ${i + 1}-${Math.min(i + batchSize, dirtysingles.length)}`)
    }

    if (dryRun) break // only print one batch for preview
  }

  // ---- Summary ----
  console.log(`\n--- Summary ---`)
  console.log(`Duplicate groups:       ${duplicateGroups.length}`)
  console.log(`Losers deleted:         ${dryRun ? duplicateGroups.reduce((s, [, g]) => s + g.length - 1, 0) + " (would be)" : totalLosersDeleted}`)
  console.log(`Prices migrated:        ${dryRun ? "(skipped in dry run)" : totalPricesMigrated}`)
  console.log(`Favorites migrated:     ${dryRun ? "(skipped in dry run)" : totalFavsMigrated}`)
  console.log(`Favorites deduped:      ${dryRun ? "(skipped in dry run)" : totalFavsDeduped}`)
  console.log(`Single-row URL updates: ${urlsUpdated}${dryRun ? " (would be)" : ""}`)

  if (dryRun) {
    console.log(`\nThis was a DRY RUN. No changes were made.`)
    console.log(`Run with --execute to apply changes.`)
  } else {
    console.log(`\nDone.`)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
