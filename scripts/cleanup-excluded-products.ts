/**
 * One-time cleanup: delete existing store_products in untracked canonical categories
 * and populate vetoed_store_skus to prevent re-discovery.
 *
 * Usage:
 *   pnpm tsx scripts/cleanup-excluded-products.ts [flags]
 *
 * Flags:
 *   --dry             Preview only, no changes
 *   --prod            Target production DB (.env.production) instead of local (.env.local)
 *   --skip-unmapped   Skip phase 2 (unmapped categories) -- use when mappings are incomplete
 *
 * Recommended first run:
 *   pnpm tsx scripts/cleanup-excluded-products.ts --prod --dry --skip-unmapped
 *
 * Prerequisites:
 * - Migration 027_discovery_governance.sql must be applied on the target DB
 */

import * as fs from "fs"
import * as path from "path"
import { createClient } from "@supabase/supabase-js"

const useProd = process.argv.includes("--prod")
const envFile = useProd ? ".env.production" : ".env.local"
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const dryRun = process.argv.includes("--dry")
const skipUnmapped = process.argv.includes("--skip-unmapped")

const INITIAL_BATCH_SIZE = 100
const MIN_BATCH_SIZE = 10

const ORIGIN_SKU_PATTERNS: Record<number, RegExp> = {
  1: /-(\d+)\.html$/, // Continente
  2: /\/(\d+)\.html$/, // Auchan
  3: /-(\d+)\.html$/, // Pingo Doce
}

function extractSku(originId: number, url: string): string | null {
  const pattern = ORIGIN_SKU_PATTERNS[originId]
  if (!pattern) return null
  const match = url.match(pattern)
  return match ? match[1] : null
}

interface ProductToCleanup {
  id: number
  url: string | null
  origin_id: number
  category: string | null
}

async function fetchProductsInUntrackedCategories(): Promise<ProductToCleanup[]> {
  console.log("Fetching products in untracked canonical categories...")

  const { data, error } = await supabase.rpc("get_products_in_untracked_categories")

  if (!error && data && data.length > 0) {
    return data as ProductToCleanup[]
  }

  // Fallback: manual query if RPC doesn't exist yet
  console.log("RPC not available, using manual pagination...")
  return await fetchManually()
}

async function fetchManually(): Promise<ProductToCleanup[]> {
  // Get untracked canonical category IDs
  const { data: untrackedCats, error: catError } = await supabase
    .from("canonical_categories")
    .select("id")
    .eq("tracked", false)

  if (catError || !untrackedCats) {
    console.error("Failed to fetch untracked categories:", catError?.message)
    return []
  }

  const untrackedIds = untrackedCats.map((c) => c.id)
  console.log(`Found ${untrackedIds.length} untracked canonical categories`)

  // Get category mappings that point to untracked categories
  const { data: mappings, error: mapError } = await supabase
    .from("category_mappings")
    .select("origin_id, store_category, store_category_2, store_category_3")
    .in("canonical_category_id", untrackedIds)

  if (mapError || !mappings) {
    console.error("Failed to fetch mappings:", mapError?.message)
    return []
  }

  console.log(`Found ${mappings.length} category mappings to untracked categories`)

  // For each mapping, find matching store_products
  const allProducts: ProductToCleanup[] = []

  for (const mapping of mappings) {
    let query = supabase
      .from("store_products")
      .select("id, url, origin_id, category")
      .eq("origin_id", mapping.origin_id)
      .eq("category", mapping.store_category)

    if (mapping.store_category_2) {
      query = query.eq("category_2", mapping.store_category_2)
    } else {
      query = query.is("category_2", null)
    }

    if (mapping.store_category_3) {
      query = query.eq("category_3", mapping.store_category_3)
    } else {
      query = query.is("category_3", null)
    }

    let offset = 0
    while (true) {
      const { data, error } = await query.range(offset, offset + 999)
      if (error) {
        console.error(`Query error for ${mapping.store_category}:`, error.message)
        break
      }
      if (!data || data.length === 0) break
      allProducts.push(...(data as ProductToCleanup[]))
      if (data.length < 1000) break
      offset += 1000
    }
  }

  return allProducts
}

async function fetchProductsWithNoMapping(): Promise<ProductToCleanup[]> {
  console.log("\nFetching products with categories but no mapping (unmapped)...")

  // Products that have a category but don't match any category_mapping
  // This is expensive so we'll do it per-origin
  const allUnmapped: ProductToCleanup[] = []

  for (const originId of [1, 2, 3]) {
    // Get all mapped category tuples for this origin
    const { data: mappings } = await supabase
      .from("category_mappings")
      .select("store_category, store_category_2, store_category_3")
      .eq("origin_id", originId)

    if (!mappings) continue

    const mappedKeys = new Set(
      mappings.map((m) => `${m.store_category}||${m.store_category_2 ?? ""}||${m.store_category_3 ?? ""}`),
    )

    // Get distinct category tuples for this origin
    let offset = 0
    while (true) {
      const { data: products, error } = await supabase
        .from("store_products")
        .select("id, url, origin_id, category, category_2, category_3")
        .eq("origin_id", originId)
        .not("category", "is", null)
        .range(offset, offset + 999)
        .order("id", { ascending: true })

      if (error || !products || products.length === 0) break

      for (const p of products) {
        const key = `${p.category}||${p.category_2 ?? ""}||${p.category_3 ?? ""}`
        if (!mappedKeys.has(key)) {
          allUnmapped.push({
            id: p.id,
            url: p.url,
            origin_id: p.origin_id!,
            category: p.category,
          })
        }
      }

      if (products.length < 1000) break
      offset += 1000
    }
  }

  return allUnmapped
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Deletes a batch of IDs from a table with adaptive sizing.
 * Halves batch size on timeout, retries. Returns count of deleted rows.
 */
async function deleteBatchAdaptive(
  table: string,
  column: string,
  ids: number[],
  label: string,
): Promise<{ deleted: number; errors: number }> {
  let batchSize = Math.min(ids.length, INITIAL_BATCH_SIZE)
  let offset = 0
  let totalDeleted = 0
  let totalErrors = 0

  while (offset < ids.length) {
    const chunk = ids.slice(offset, offset + batchSize)

    const { error, count } = await supabase.from(table).delete({ count: "exact" }).in(column, chunk)

    if (error) {
      if (error.message.includes("statement timeout") && batchSize > MIN_BATCH_SIZE) {
        batchSize = Math.max(MIN_BATCH_SIZE, Math.floor(batchSize / 2))
        console.log(`    ${label}: timeout, reducing batch to ${batchSize}`)
        await delay(2000)
        continue // retry same offset with smaller batch
      }
      console.error(`    ${label}: error (batch ${batchSize}): ${error.message}`)
      totalErrors += chunk.length
      offset += batchSize
    } else {
      totalDeleted += count ?? chunk.length
      offset += batchSize
    }

    await delay(200)
  }

  return { deleted: totalDeleted, errors: totalErrors }
}

async function cleanupProducts(products: ProductToCleanup[], label: string) {
  console.log(`\n--- Cleaning up ${products.length} products (${label}) ---`)

  if (products.length === 0) {
    console.log("Nothing to clean up.")
    return { vetoed: 0, deleted: 0, errors: 0 }
  }

  const byOrigin: Record<number, ProductToCleanup[]> = {}
  for (const p of products) {
    if (!byOrigin[p.origin_id]) byOrigin[p.origin_id] = []
    byOrigin[p.origin_id].push(p)
  }

  for (const [originId, prods] of Object.entries(byOrigin)) {
    console.log(`  Origin ${originId}: ${prods.length} products`)
  }

  const categoryBreakdown: Record<string, number> = {}
  for (const p of products) {
    const cat = p.category ?? "NULL"
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1
  }
  const sortedCats = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])
  console.log("\n  Category breakdown (top 20):")
  for (const [cat, count] of sortedCats.slice(0, 20)) {
    console.log(`    ${cat}: ${count}`)
  }

  if (dryRun) {
    console.log("\n  [DRY RUN] Would delete these products and add SKUs to vetoed_store_skus")
    return { vetoed: 0, deleted: 0, errors: 0 }
  }

  let vetoed = 0
  let deleted = 0
  let errors = 0

  // Step 1: Insert all vetoed SKUs (small rows, unlikely to timeout)
  console.log("\n  Step 1/3: Recording vetoed SKUs...")
  for (let i = 0; i < products.length; i += INITIAL_BATCH_SIZE) {
    const batch = products.slice(i, i + INITIAL_BATCH_SIZE)

    const vetoRows = batch
      .filter((p) => p.url)
      .map((p) => {
        const sku = extractSku(p.origin_id, p.url!)
        return sku
          ? { origin_id: p.origin_id, sku, store_category: p.category, vetoed_at: new Date().toISOString() }
          : null
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    if (vetoRows.length > 0) {
      const { error: vetoError } = await supabase
        .from("vetoed_store_skus")
        .upsert(vetoRows, { onConflict: "origin_id,sku", ignoreDuplicates: true })

      if (vetoError) {
        console.error(`    Veto insert error: ${vetoError.message}`)
        errors += vetoRows.length
      } else {
        vetoed += vetoRows.length
      }
    }

    if (i % 1000 === 0 && i > 0) {
      console.log(`    ${i}/${products.length} SKUs recorded`)
    }
  }
  console.log(`    ${vetoed} SKUs recorded`)

  // Step 2: Delete prices (the heaviest table - products can have many price points)
  const allIds = products.map((p) => p.id)
  console.log(`\n  Step 2/3: Deleting prices for ${allIds.length} products...`)
  const priceResult = await deleteBatchAdaptive("prices", "store_product_id", allIds, "prices")
  console.log(`    ${priceResult.deleted} price rows deleted (${priceResult.errors} errors)`)

  // Step 3a: Delete favorites
  console.log(`\n  Step 3/3: Deleting favorites + store_products...`)
  const favResult = await deleteBatchAdaptive("user_favorites", "store_product_id", allIds, "favorites")
  if (favResult.deleted > 0) {
    console.log(`    ${favResult.deleted} favorites deleted`)
  }

  // Step 3b: Delete store_products
  const spResult = await deleteBatchAdaptive("store_products", "id", allIds, "store_products")
  deleted = spResult.deleted
  errors += spResult.errors
  console.log(`    ${deleted} store_products deleted (${spResult.errors} errors)`)

  console.log(`\n  Done: ${vetoed} SKUs vetoed, ${deleted} products deleted, ${errors} errors`)
  return { vetoed, deleted, errors }
}

async function main() {
  const flags = [dryRun && "DRY RUN", skipUnmapped && "SKIP UNMAPPED"].filter(Boolean).join(", ")
  console.log(`Cleanup Excluded Products ${flags ? `(${flags})` : "(LIVE)"}`)
  console.log(`Target: ${supabaseUrl}\n`)

  // Phase 1: Products in untracked categories (safe - these have confirmed bad mappings)
  const untrackedProducts = await fetchProductsInUntrackedCategories()
  const untrackedResult = await cleanupProducts(untrackedProducts, "untracked categories")

  // Phase 2: Products with no category mapping (risky - may include valid food products)
  let unmappedResult = { vetoed: 0, deleted: 0, errors: 0 }
  let newUnmapped: ProductToCleanup[] = []

  if (skipUnmapped) {
    console.log("\n--- Skipping unmapped categories (--skip-unmapped) ---")
    console.log("  Run without --skip-unmapped after adding missing category_mappings.")
  } else {
    const unmappedProducts = await fetchProductsWithNoMapping()
    const handledIds = new Set(untrackedProducts.map((p) => p.id))
    newUnmapped = unmappedProducts.filter((p) => !handledIds.has(p.id))
    unmappedResult = await cleanupProducts(newUnmapped, "unmapped categories")
  }

  console.log("\n=== SUMMARY ===")
  console.log(`Untracked categories: ${untrackedProducts.length} products found, ${untrackedResult.deleted} deleted`)
  if (!skipUnmapped) {
    console.log(`Unmapped categories: ${newUnmapped.length} products found, ${unmappedResult.deleted} deleted`)
  }
  console.log(`Total SKUs vetoed: ${untrackedResult.vetoed + unmappedResult.vetoed}`)
  console.log(`Total products deleted: ${untrackedResult.deleted + unmappedResult.deleted}`)

  if (dryRun) {
    console.log("\nThis was a DRY RUN. Run without --dry to execute.")
  } else {
    console.log("\nDone. Run VACUUM in Supabase SQL editor to reclaim disk space.")
  }
}

main().catch(console.error)
