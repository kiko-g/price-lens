/**
 * Script to find duplicate store products by base URL (ignoring query parameters)
 * Run with: pnpm tsx scripts/find-duplicate-urls.ts
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
    console.log(`  Fetched ${allProducts.length} products...`)

    if (products.length < pageSize) {
      hasMore = false
    } else {
      offset += pageSize
    }
  }

  return allProducts
}

async function findDuplicates() {
  console.log("Fetching all store products...")
  const products = await fetchAllProducts()

  if (products.length === 0) {
    console.error("No products found")
    return
  }

  console.log(`Found ${products.length} products total\n`)

  // Group by base URL
  const urlGroups = new Map<string, StoreProduct[]>()

  for (const product of products) {
    const baseUrl = getBaseUrl(product.url)
    const group = urlGroups.get(baseUrl) || []
    group.push(product)
    urlGroups.set(baseUrl, group)
  }

  // Find duplicates (groups with more than 1 product)
  const duplicates = Array.from(urlGroups.entries())
    .filter(([_, group]) => group.length > 1)
    .sort((a, b) => b[1].length - a[1].length) // Sort by most duplicates first

  if (duplicates.length === 0) {
    console.log("✅ No duplicates found!")
    return
  }

  console.log(`⚠️  Found ${duplicates.length} base URLs with duplicates:\n`)

  let totalDuplicates = 0
  for (const [baseUrl, group] of duplicates) {
    totalDuplicates += group.length - 1 // Count extra copies
    console.log(`\n📦 Base URL: ${baseUrl}`)
    console.log(`   Duplicates: ${group.length} products`)
    console.log("   Products:")
    for (const p of group) {
      const hasQueryParams = p.url.includes("?")
      const priorityStr = p.priority !== null ? `P${p.priority}` : "no-priority"
      console.log(`     - ID: ${p.id} | ${priorityStr} | barcode: ${p.barcode || "null"} | ${hasQueryParams ? "HAS QUERY PARAMS" : "clean URL"}`)
      if (hasQueryParams) {
        const queryPart = p.url.split("?")[1]
        console.log(`       Query: ?${queryPart.substring(0, 80)}${queryPart.length > 80 ? "..." : ""}`)
      }
    }
  }

  console.log(`\n\n📊 Summary:`)
  console.log(`   Total duplicate groups: ${duplicates.length}`)
  console.log(`   Total extra products to clean: ${totalDuplicates}`)
  console.log(`\n💡 Recommendation: Keep the product with the clean URL (no query params) or the oldest one.`)
}

findDuplicates().catch(console.error)
