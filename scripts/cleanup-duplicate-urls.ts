/**
 * Script to clean up duplicate store products by base URL
 * Run with: pnpm tsx scripts/cleanup-duplicate-urls.ts
 *
 * Strategy: Keep the product with the clean URL (no query params), or if all have
 * query params, keep the oldest one. Delete the rest.
 */

import * as fs from "fs"
import * as path from "path"
import { createClient } from "@supabase/supabase-js"

// Load environment variables from .env.local
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
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required for this script")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface StoreProduct {
  id: number
  url: string
  name: string | null
  barcode: string | null
  created_at: string
  priority: number | null
}

function getBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `${urlObj.origin}${urlObj.pathname}`
  } catch {
    return url.split("?")[0]
  }
}

function hasQueryParams(url: string): boolean {
  return url.includes("?")
}

async function fetchAllProducts(): Promise<StoreProduct[]> {
  const allProducts: StoreProduct[] = []
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data: products, error } = await supabase
      .from("store_products")
      .select("id, url, name, barcode, created_at, priority")
      .not("url", "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error("Error fetching products:", error)
      return allProducts
    }

    allProducts.push(...products)
    if (products.length < pageSize) {
      hasMore = false
    } else {
      offset += pageSize
    }
  }

  return allProducts
}

function selectProductToKeep(products: StoreProduct[]): StoreProduct {
  // Priority 1: Clean URL (no query params) with barcode
  const cleanWithBarcode = products.find((p) => !hasQueryParams(p.url) && p.barcode)
  if (cleanWithBarcode) return cleanWithBarcode

  // Priority 2: Clean URL (no query params)
  const cleanUrl = products.find((p) => !hasQueryParams(p.url))
  if (cleanUrl) return cleanUrl

  // Priority 3: Has barcode
  const withBarcode = products.find((p) => p.barcode)
  if (withBarcode) return withBarcode

  // Priority 4: Highest priority tracking
  const sorted = [...products].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  return sorted[0]
}

async function cleanupDuplicates(dryRun = true) {
  console.log(`\n${dryRun ? "🔍 DRY RUN" : "🗑️  CLEANUP"} MODE\n`)
  console.log("Fetching all store products...")
  const products = await fetchAllProducts()
  console.log(`Found ${products.length} products total\n`)

  // Group by base URL
  const urlGroups = new Map<string, StoreProduct[]>()
  for (const product of products) {
    const baseUrl = getBaseUrl(product.url)
    const group = urlGroups.get(baseUrl) || []
    group.push(product)
    urlGroups.set(baseUrl, group)
  }

  // Find duplicates
  const duplicates = Array.from(urlGroups.entries()).filter(([_, group]) => group.length > 1)

  if (duplicates.length === 0) {
    console.log("✅ No duplicates found!")
    return
  }

  console.log(`Found ${duplicates.length} duplicate groups\n`)

  const idsToDelete: number[] = []

  for (const [baseUrl, group] of duplicates) {
    const toKeep = selectProductToKeep(group)
    const toDelete = group.filter((p) => p.id !== toKeep.id)

    console.log(`\n📦 ${baseUrl}`)
    console.log(
      `   Keep: ID ${toKeep.id} (${hasQueryParams(toKeep.url) ? "has params" : "clean URL"}, barcode: ${toKeep.barcode || "null"})`,
    )
    console.log(`   Delete: ${toDelete.map((p) => `ID ${p.id}`).join(", ")}`)

    idsToDelete.push(...toDelete.map((p) => p.id))
  }

  console.log(`\n\n📊 Summary:`)
  console.log(`   Products to delete: ${idsToDelete.length}`)

  if (dryRun) {
    console.log(`\n⚠️  This was a DRY RUN. No changes were made.`)
    console.log(`   To actually delete, run with: pnpm tsx scripts/cleanup-duplicate-urls.ts --execute`)
    return
  }

  // Actually delete
  console.log(`\n🗑️  Deleting ${idsToDelete.length} products...`)

  // Delete in batches
  const batchSize = 100
  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize)

    // First delete related prices
    const { error: priceError } = await supabase.from("prices").delete().in("store_product_id", batch)

    if (priceError) {
      console.error(`Error deleting prices for batch ${i}:`, priceError)
    }

    // Then delete the products
    const { error } = await supabase.from("store_products").delete().in("id", batch)

    if (error) {
      console.error(`Error deleting batch ${i}:`, error)
    } else {
      console.log(`   Deleted batch ${i + 1}-${Math.min(i + batchSize, idsToDelete.length)}`)
    }
  }

  console.log(`\n✅ Cleanup complete!`)
}

const execute = process.argv.includes("--execute")
cleanupDuplicates(!execute).catch(console.error)
