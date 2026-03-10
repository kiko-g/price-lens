/**
 * One-time cleanup: delete existing store_products in untracked canonical categories
 * and populate vetoed_store_skus to prevent re-discovery.
 *
 * Run with: pnpm tsx scripts/cleanup-excluded-products.ts
 * Dry run:  pnpm tsx scripts/cleanup-excluded-products.ts --dry
 *
 * Prerequisites:
 * - Migration 027_discovery_governance.sql must be applied
 * - Run against LOCAL or PRODUCTION depending on .env.local config
 */

import * as fs from "fs"
import * as path from "path"
import { createClient } from "@supabase/supabase-js"

const envPath = path.resolve(process.cwd(), ".env.local")
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
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const dryRun = process.argv.includes("--dry")

const BATCH_SIZE = 500

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

async function cleanupProducts(products: ProductToCleanup[], label: string) {
  console.log(`\n--- Cleaning up ${products.length} products (${label}) ---`)

  if (products.length === 0) {
    console.log("Nothing to clean up.")
    return { vetoed: 0, deleted: 0, errors: 0 }
  }

  // Group by origin for SKU extraction
  const byOrigin: Record<number, ProductToCleanup[]> = {}
  for (const p of products) {
    if (!byOrigin[p.origin_id]) byOrigin[p.origin_id] = []
    byOrigin[p.origin_id].push(p)
  }

  for (const [originId, prods] of Object.entries(byOrigin)) {
    console.log(`  Origin ${originId}: ${prods.length} products`)
  }

  // Category breakdown
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

  // Process in batches
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(products.length / BATCH_SIZE)
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} products)`)

    // 1. Extract SKUs and insert into vetoed_store_skus
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
        console.error(`  Veto insert error: ${vetoError.message}`)
        errors += vetoRows.length
      } else {
        vetoed += vetoRows.length
      }
    }

    // 2. Delete dependent rows (prices, favorites)
    const ids = batch.map((p) => p.id)

    const { error: priceError } = await supabase.from("prices").delete().in("store_product_id", ids)
    if (priceError) {
      console.error(`  Price delete error: ${priceError.message}`)
    }

    const { error: favError } = await supabase.from("user_favorites").delete().in("store_product_id", ids)
    if (favError) {
      console.error(`  Favorites delete error: ${favError.message}`)
    }

    // 3. Delete the store_products
    const { error: deleteError, count } = await supabase.from("store_products").delete({ count: "exact" }).in("id", ids)

    if (deleteError) {
      console.error(`  Delete error: ${deleteError.message}`)
      errors += batch.length
    } else {
      deleted += count ?? batch.length
    }
  }

  console.log(`  Done: ${vetoed} SKUs vetoed, ${deleted} products deleted, ${errors} errors`)
  return { vetoed, deleted, errors }
}

async function main() {
  console.log(`Cleanup Excluded Products ${dryRun ? "(DRY RUN)" : "(LIVE)"}`)
  console.log(`Target: ${supabaseUrl}\n`)

  // Phase 1: Products in untracked categories
  const untrackedProducts = await fetchProductsInUntrackedCategories()
  const untrackedResult = await cleanupProducts(untrackedProducts, "untracked categories")

  // Phase 2: Products with no category mapping (unmapped)
  const unmappedProducts = await fetchProductsWithNoMapping()
  // Filter out any that were already handled in phase 1
  const handledIds = new Set(untrackedProducts.map((p) => p.id))
  const newUnmapped = unmappedProducts.filter((p) => !handledIds.has(p.id))
  const unmappedResult = await cleanupProducts(newUnmapped, "unmapped categories")

  console.log("\n=== SUMMARY ===")
  console.log(`Untracked categories: ${untrackedProducts.length} products found, ${untrackedResult.deleted} deleted`)
  console.log(`Unmapped categories: ${newUnmapped.length} products found, ${unmappedResult.deleted} deleted`)
  console.log(`Total SKUs vetoed: ${untrackedResult.vetoed + unmappedResult.vetoed}`)
  console.log(`Total products deleted: ${untrackedResult.deleted + unmappedResult.deleted}`)

  if (dryRun) {
    console.log("\nThis was a DRY RUN. Run without --dry to execute.")
  } else {
    console.log("\nDone. Run VACUUM in Supabase SQL editor to reclaim disk space.")
  }
}

main().catch(console.error)
