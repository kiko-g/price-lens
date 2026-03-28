/**
 * Bulk OFF enrichment via the Open Food Facts daily CSV dump.
 *
 * Uses a locally cached gzipped TSV file. Re-downloads only when the
 * local copy is missing or older than the configured max age (default 7 days).
 *
 * Only processes trade_items where off_product_name IS NULL (incremental).
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { createGunzip } from "node:zlib"
import { createInterface } from "node:readline"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import type { SupabaseClient } from "@supabase/supabase-js"

const OFF_CSV_URL = "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz"
const DEFAULT_CSV_PATH = path.join(process.cwd(), "docs", "csv", "en.openfoodfacts.org.products.csv.gz")
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const PAGE_SIZE = 1000

export interface BulkEnrichResult {
  enriched: number
  notFound: number
  skipped: number
}

export interface EnrichOptions {
  csvPath?: string
  forceDownload?: boolean
  dryRun?: boolean
}

function buildDisplayName(productName: string, brands: string | null): string {
  if (!brands) return productName
  const primaryBrand = brands.split(",")[0]?.trim()
  if (primaryBrand && !productName.toLowerCase().startsWith(primaryBrand.toLowerCase())) {
    return `${primaryBrand} ${productName}`
  }
  return productName
}

function isNonFood(gtin: string): boolean {
  if (gtin.length < 8) return true
  if (gtin.startsWith("978") || gtin.startsWith("979")) return true
  if (gtin.startsWith("2") && gtin.length === 13) return true
  if (gtin.length > 14) return true
  return false
}

function isLocalFileFresh(filePath: string, maxAgeMs: number): boolean {
  try {
    const stat = fs.statSync(filePath)
    const ageMs = Date.now() - stat.mtimeMs
    return ageMs < maxAgeMs
  } catch {
    return false
  }
}

async function ensureLocalCsv(filePath: string, forceDownload: boolean, log: (msg: string) => void): Promise<void> {
  if (!forceDownload && isLocalFileFresh(filePath, MAX_AGE_MS)) {
    const stat = fs.statSync(filePath)
    const ageDays = ((Date.now() - stat.mtimeMs) / (24 * 60 * 60 * 1000)).toFixed(1)
    log(`[Enrich] Using cached OFF CSV (${ageDays} days old): ${filePath}`)
    return
  }

  const reason = forceDownload ? "forced" : fs.existsSync(filePath) ? "stale" : "missing"
  log(`[Enrich] Downloading OFF CSV (${reason})...`)

  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })

  const res = await fetch(OFF_CSV_URL, {
    headers: { "User-Agent": "PriceLens/1.0 (https://price-lens.vercel.app)" },
    redirect: "follow",
  })

  if (!res.ok || !res.body) {
    throw new Error(`Failed to download OFF CSV: HTTP ${res.status}`)
  }

  const readable = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0])
  const writeStream = fs.createWriteStream(filePath)
  await pipeline(readable, writeStream)

  const sizeMb = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(0)
  log(`[Enrich] Download complete: ${sizeMb} MB saved to ${filePath}`)
}

async function fetchPendingTradeItems(supabase: SupabaseClient): Promise<Map<string, number>> {
  const gtinToId = new Map<string, number>()
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from("trade_items")
      .select("id, gtin")
      .is("off_product_name", null)
      .order("id")
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`Failed to fetch trade_items: ${error.message}`)
    if (!data || data.length === 0) break
    for (const row of data) gtinToId.set(row.gtin, row.id)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return gtinToId
}

export async function runBulkEnrichment(
  supabase: SupabaseClient,
  log: (msg: string) => void = console.log,
  options: EnrichOptions = {},
): Promise<BulkEnrichResult> {
  const csvPath = options.csvPath ?? DEFAULT_CSV_PATH
  const dryRun = options.dryRun ?? false

  log("[Enrich] Loading pending trade_items (off_product_name IS NULL)...")
  const gtinToId = await fetchPendingTradeItems(supabase)
  log(`[Enrich] ${gtinToId.size} trade_items need enrichment`)

  if (gtinToId.size === 0) {
    log("[Enrich] Nothing to enrich -- all trade_items already processed.")
    return { enriched: 0, notFound: 0, skipped: 0 }
  }

  // Mark non-food barcodes upfront
  const nonFoodIds: number[] = []
  for (const [gtin, id] of gtinToId) {
    if (isNonFood(gtin)) nonFoodIds.push(id)
  }

  if (nonFoodIds.length > 0 && !dryRun) {
    const BATCH = 500
    for (let i = 0; i < nonFoodIds.length; i += BATCH) {
      const batch = nonFoodIds.slice(i, i + BATCH)
      await supabase.from("trade_items").update({ off_product_name: "" }).in("id", batch)
    }
    log(`[Enrich] Marked ${nonFoodIds.length} non-food barcodes as N/A`)
  } else if (nonFoodIds.length > 0) {
    log(`[Enrich] [DRY RUN] Would mark ${nonFoodIds.length} non-food barcodes as N/A`)
  }

  // Remove non-food from the lookup map so we don't double-count
  const nonFoodSet = new Set(nonFoodIds)
  for (const [gtin] of gtinToId) {
    if (nonFoodSet.has(gtinToId.get(gtin)!)) {
      gtinToId.delete(gtin)
    }
  }

  if (gtinToId.size === 0) {
    log("[Enrich] All pending items were non-food. Done.")
    return { enriched: 0, notFound: 0, skipped: nonFoodIds.length }
  }

  // Ensure local CSV exists and is fresh
  await ensureLocalCsv(csvPath, options.forceDownload ?? false, log)

  // Stream from local file
  const fileStream = fs.createReadStream(csvPath)
  const gunzip = createGunzip()
  fileStream.pipe(gunzip)
  const rl = createInterface({ input: gunzip, crlfDelay: Infinity })

  let codeIdx = -1
  let nameIdx = -1
  let brandsIdx = -1
  let lineNum = 0
  let matched = 0
  const matches: { id: number; displayName: string }[] = []

  log("[Enrich] Streaming local CSV and matching barcodes...")

  for await (const line of rl) {
    lineNum++

    if (lineNum === 1) {
      const headers = line.split("\t")
      codeIdx = headers.indexOf("code")
      nameIdx = headers.indexOf("product_name")
      brandsIdx = headers.indexOf("brands")
      if (codeIdx === -1 || nameIdx === -1) {
        throw new Error(`Unexpected CSV headers. code=${codeIdx}, product_name=${nameIdx}`)
      }
      continue
    }

    const fields = line.split("\t")
    const code = fields[codeIdx]
    if (!code) continue

    const tradeItemId = gtinToId.get(code)
    if (tradeItemId === undefined) continue

    const productName = fields[nameIdx]?.trim()
    if (!productName) continue

    const brands = fields[brandsIdx]?.trim() || null
    matches.push({ id: tradeItemId, displayName: buildDisplayName(productName, brands) })
    matched++

    if (lineNum % 500_000 === 0) {
      log(`[Enrich]   Streamed ${(lineNum / 1_000_000).toFixed(1)}M OFF rows, ${matched} matches so far...`)
    }
  }

  log(`[Enrich] CSV done: ${(lineNum - 1).toLocaleString()} OFF products scanned, ${matched} matches found`)

  // Batch update matched trade_items
  if (matches.length > 0 && !dryRun) {
    log(`[Enrich] Updating ${matches.length} trade_items with OFF names...`)
    const BATCH = 50
    let updated = 0
    let lastPct = -1
    for (let i = 0; i < matches.length; i += BATCH) {
      const batch = matches.slice(i, i + BATCH)
      await Promise.all(
        batch.map((m) => supabase.from("trade_items").update({ off_product_name: m.displayName }).eq("id", m.id)),
      )
      updated += batch.length
      const pct = Math.floor((updated / matches.length) * 100)
      if ((pct % 10 === 0 && pct !== lastPct) || updated === matches.length) {
        lastPct = pct
        log(`[Enrich]   Update progress: ${pct}% (${updated}/${matches.length})`)
      }
    }
  } else if (matches.length > 0) {
    log(`[Enrich] [DRY RUN] Would update ${matches.length} trade_items with OFF names`)
  }

  // Mark remaining unmatched (pending) barcodes as not-in-OFF
  let notFound = 0
  if (!dryRun) {
    const { count: remaining } = await supabase
      .from("trade_items")
      .select("*", { count: "exact", head: true })
      .is("off_product_name", null)

    if (remaining && remaining > 0) {
      log(`[Enrich] Marking ${remaining} unmatched barcodes as not-in-OFF...`)
      const MARK_BATCH = 200
      let marked = 0
      let lastMarkPct = -1
      while (true) {
        const { data } = await supabase
          .from("trade_items")
          .select("id")
          .is("off_product_name", null)
          .order("id")
          .range(0, MARK_BATCH - 1)
        if (!data || data.length === 0) break
        await supabase
          .from("trade_items")
          .update({ off_product_name: "" })
          .in(
            "id",
            data.map((d) => d.id),
          )
        marked += data.length
        const pct = Math.floor((marked / remaining) * 100)
        if ((pct % 5 === 0 && pct !== lastMarkPct) || data.length < MARK_BATCH) {
          lastMarkPct = pct
          log(`[Enrich]   Mark progress: ${pct}% (${marked}/${remaining})`)
        }
        if (data.length < MARK_BATCH) break
      }
      notFound = marked
      log(`[Enrich]   Marked ${notFound} barcodes as not-in-OFF`)
    }
  }

  log(`[Enrich] Done: ${matched} enriched, ${notFound} not in OFF, ${nonFoodIds.length} non-food skipped`)
  return { enriched: matched, notFound, skipped: nonFoodIds.length }
}
