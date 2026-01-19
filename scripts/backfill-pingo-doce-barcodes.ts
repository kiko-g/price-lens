/**
 * Backfill Pingo Doce Barcodes
 *
 * This script fetches Pingo Doce products without barcodes from Supabase,
 * uses Puppeteer to extract barcodes from window.BV, and outputs a CSV file.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-pingo-doce-barcodes.ts
 *
 * Options:
 *   --dry-run      Only generate CSV, don't update Supabase
 *   --limit=N      Only process N products (for testing)
 *   --offset=N     Skip the first N products (to avoid re-processing failed ones)
 *   --update       Update Supabase directly after scraping
 *   --debug        Show detailed window.BV structure for debugging
 *   --skip-failed  Skip products that previously failed (reads from failed-ids.txt)
 *
 * The script saves failed product IDs to scripts/pingo-doce-failed-ids.txt
 * Use --skip-failed on subsequent runs to skip these products.
 *
 * Recommended usage:
 * pnpm backfill:pingo-doce-barcodes --limit=100 --update --debug
 * pnpm backfill:pingo-doce-barcodes --limit=100 --update --skip-failed --debug
 */

import * as fs from "fs"
import * as path from "path"

// Load .env.local manually (Next.js does this automatically, but standalone scripts don't)
const envPath = path.join(process.cwd(), ".env.local")
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

import puppeteer, { Browser, Page } from "puppeteer"
import { createClient } from "@supabase/supabase-js"

// Types
interface StoreProduct {
  id: number
  url: string
  name: string
  barcode: string | null
}

interface BarcodeResult {
  id: number
  url: string
  barcode: string | null
  error?: string
}

// Config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const PINGO_DOCE_ORIGIN_ID = 3
const CONCURRENCY = 3 // Number of parallel browser pages
const DELAY_BETWEEN_REQUESTS = 1000 // ms

// Parse CLI args
const args = process.argv.slice(2)
const isDryRun = args.includes("--dry-run")
const shouldUpdate = args.includes("--update")
const isDebug = args.includes("--debug")
const skipFailed = args.includes("--skip-failed")
const limitArg = args.find((a) => a.startsWith("--limit="))
const limit = limitArg ? parseInt(limitArg.split("=")[1]) : undefined
const offsetArg = args.find((a) => a.startsWith("--offset="))
const offset = offsetArg ? parseInt(offsetArg.split("=")[1]) : 0

// Failed IDs file path
const FAILED_IDS_FILE = path.join(process.cwd(), "scripts", "pingo-doce-failed-ids.txt")

/**
 * Load previously failed IDs from file
 */
function loadFailedIds(): Set<number> {
  if (!fs.existsSync(FAILED_IDS_FILE)) {
    return new Set()
  }
  const content = fs.readFileSync(FAILED_IDS_FILE, "utf-8")
  const ids = content
    .split("\n")
    .map((line) => parseInt(line.trim()))
    .filter((id) => !isNaN(id))
  return new Set(ids)
}

/**
 * Save failed IDs to file (appends new IDs)
 */
function saveFailedIds(ids: number[]): void {
  if (ids.length === 0) return

  const existingIds = loadFailedIds()
  const allIds = new Set([...existingIds, ...ids])
  const content = [...allIds].sort((a, b) => a - b).join("\n") + "\n"
  fs.writeFileSync(FAILED_IDS_FILE, content)
  console.log(`\n📝 Saved ${ids.length} new failed IDs to: ${FAILED_IDS_FILE}`)
  console.log(`   Total failed IDs: ${allIds.size}`)
}

// Validate env vars
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing environment variables:")
  console.error("   - NEXT_PUBLIC_SUPABASE_URL")
  console.error("   - SUPABASE_SERVICE_ROLE_KEY")
  console.error("\nMake sure to load your .env.local file:")
  console.error("   source .env.local && pnpm tsx scripts/backfill-pingo-doce-barcodes.ts")
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Fetch Pingo Doce products without barcodes
 */
async function fetchProductsWithoutBarcodes(): Promise<StoreProduct[]> {
  console.log("📦 Fetching Pingo Doce products without barcodes...")

  // Load failed IDs to skip
  const failedIds = skipFailed ? loadFailedIds() : new Set<number>()
  if (skipFailed && failedIds.size > 0) {
    console.log(`   Skipping ${failedIds.size} previously failed products`)
  }

  // Build query
  let query = supabase
    .from("store_products")
    .select("id, url, name, barcode")
    .eq("origin_id", PINGO_DOCE_ORIGIN_ID)
    .is("barcode", null)
    .eq("available", true)

  // Exclude failed IDs directly in the query (more efficient than filtering after)
  if (skipFailed && failedIds.size > 0) {
    const failedIdsArray = [...failedIds]
    query = query.not("id", "in", `(${failedIdsArray.join(",")})`)
  }

  // Apply offset and limit
  if (offset > 0) {
    query = query.range(offset, offset + (limit || 1000) - 1)
  } else if (limit) {
    query = query.limit(limit)
  } else {
    query = query.limit(1000)
  }

  query = query.order("id", { ascending: true })

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  console.log(`   Found ${data?.length || 0} products to process`)
  return data || []
}

interface BVDebugInfo {
  hasBV: boolean
  hasRatingSummary: boolean
  hasData: boolean
  hasResults: boolean
  resultKeys: string[]
  eans: string[]
  gtin14: string | null
  apiDataKeys: string[]
}

/**
 * Extract barcode from a Pingo Doce product page using Puppeteer
 */
async function extractBarcode(
  page: Page,
  url: string,
  debug: boolean = false,
): Promise<{ barcode: string | null; debugInfo?: BVDebugInfo }> {
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 })

    // Wait for BV to potentially load (it's async)
    // Try waiting up to 5 seconds for window.BV to appear
    await page
      .waitForFunction(
        () => {
          // @ts-expect-error - BV is a global variable
          return typeof window.BV !== "undefined" && window.BV?.rating_summary?.data
        },
        { timeout: 5000 },
      )
      .catch(() => {
        // BV didn't load in time, continue anyway
      })

    // Additional wait for data to populate
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Try to extract barcode from window.BV
    const result = await page.evaluate((debugMode: boolean) => {
      const debugInfo: BVDebugInfo = {
        hasBV: false,
        hasRatingSummary: false,
        hasData: false,
        hasResults: false,
        resultKeys: [],
        eans: [],
        gtin14: null,
        apiDataKeys: [],
      }

      try {
        // @ts-expect-error - BV is a global variable set by Bazaarvoice
        const bv = window.BV
        debugInfo.hasBV = !!bv
        debugInfo.hasRatingSummary = !!bv?.rating_summary
        debugInfo.hasData = !!bv?.rating_summary?.data

        // Check apiData
        if (bv?.rating_summary?.apiData) {
          debugInfo.apiDataKeys = Object.keys(bv.rating_summary.apiData)
        }

        // Try different data indices (sometimes it's [0], sometimes [1])
        let resultData = null
        for (let i = 0; i < 3; i++) {
          if (bv?.rating_summary?.data?.[i]?.data?.Results?.[0]) {
            resultData = bv.rating_summary.data[i].data.Results[0]
            break
          }
        }

        if (!resultData) {
          return { barcode: null, debugInfo: debugMode ? debugInfo : undefined }
        }

        debugInfo.hasResults = true
        debugInfo.resultKeys = Object.keys(resultData)

        // Try EANs array first
        if (resultData.EANs && Array.isArray(resultData.EANs)) {
          debugInfo.eans = resultData.EANs
          if (resultData.EANs.length > 0) {
            return { barcode: resultData.EANs[0], debugInfo: debugMode ? debugInfo : undefined }
          }
        }

        // Try GTIN14 attribute
        if (resultData.Attributes?.GTIN14?.Values?.[0]?.Value) {
          debugInfo.gtin14 = resultData.Attributes.GTIN14.Values[0].Value
          return { barcode: debugInfo.gtin14, debugInfo: debugMode ? debugInfo : undefined }
        }

        // Try searching in apiData for EAN patterns
        if (bv?.rating_summary?.apiData) {
          const apiDataStr = JSON.stringify(bv.rating_summary.apiData)
          // Look for EAN-13 pattern (13 digits)
          const eanMatch = apiDataStr.match(/"EAN[s]?":\s*\["?(\d{13})"?\]?/i)
          if (eanMatch) {
            return { barcode: eanMatch[1], debugInfo: debugMode ? debugInfo : undefined }
          }
          // Look for GTIN pattern
          const gtinMatch = apiDataStr.match(/"GTIN(?:14)?":\s*"?(\d{13,14})"?/i)
          if (gtinMatch) {
            return { barcode: gtinMatch[1], debugInfo: debugMode ? debugInfo : undefined }
          }
        }

        return { barcode: null, debugInfo: debugMode ? debugInfo : undefined }
      } catch {
        return { barcode: null, debugInfo: debugMode ? debugInfo : undefined }
      }
    }, debug)

    return result
  } catch (error) {
    console.error(`   ⚠️ Error loading page:`, error instanceof Error ? error.message : error)
    return { barcode: null }
  }
}

/**
 * Process products in batches with concurrency
 */
async function processProducts(products: StoreProduct[], browser: Browser): Promise<BarcodeResult[]> {
  const results: BarcodeResult[] = []
  const total = products.length
  let found = 0
  let failed = 0

  // Process one at a time for better logging (or in chunks if not debug mode)
  const batchSize = isDebug ? 1 : CONCURRENCY

  for (let i = 0; i < products.length; i += batchSize) {
    const chunk = products.slice(i, i + batchSize)

    // Process chunk sequentially for cleaner logging
    const chunkResults: BarcodeResult[] = []

    for (let j = 0; j < chunk.length; j++) {
      const product = chunk[j]
      const productIndex = i + j + 1
      const page = await browser.newPage()
      const scrapeStart = Date.now()

      try {
        // Log the URL being visited
        console.log(`\n🔗 [${productIndex}/${total}] Visiting: ${product.url}`)
        console.log(`   Product: ${product.name.substring(0, 50)}${product.name.length > 50 ? "..." : ""}`)

        const { barcode, debugInfo } = await extractBarcode(page, product.url, isDebug)
        const scrapeDuration = ((Date.now() - scrapeStart) / 1000).toFixed(1)

        if (isDebug && debugInfo) {
          console.log(`   🔍 Debug info:`)
          console.log(`      - window.BV exists: ${debugInfo.hasBV}`)
          console.log(`      - Has rating_summary: ${debugInfo.hasRatingSummary}`)
          console.log(`      - Has data: ${debugInfo.hasData}`)
          console.log(`      - Has Results: ${debugInfo.hasResults}`)
          if (debugInfo.resultKeys.length > 0) {
            console.log(`      - Result keys: ${debugInfo.resultKeys.join(", ")}`)
          }
          if (debugInfo.eans.length > 0) {
            console.log(`      - EANs found: ${debugInfo.eans.join(", ")}`)
          }
          if (debugInfo.gtin14) {
            console.log(`      - GTIN14: ${debugInfo.gtin14}`)
          }
          if (debugInfo.apiDataKeys.length > 0) {
            console.log(`      - apiData keys: ${debugInfo.apiDataKeys.join(", ")}`)
          }
        }

        if (barcode) {
          found++
          console.log(`   ✅ Barcode found: ${barcode} (${scrapeDuration}s)`)
        } else {
          failed++
          console.log(`   ❌ No barcode found (${scrapeDuration}s)`)
        }

        chunkResults.push({
          id: product.id,
          url: product.url,
          barcode,
        })
      } finally {
        await page.close()
      }
    }

    results.push(...chunkResults)

    // Delay between batches
    if (i + batchSize < products.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))
    }
  }

  console.log(`\n${"=".repeat(50)}`)
  console.log(`📊 Summary: ${found} found, ${failed} not found, ${total} total`)
  return results
}

/**
 * Write results to CSV
 */
function writeCSV(results: BarcodeResult[]): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = `pingo-doce-barcodes-${timestamp}.csv`
  const filepath = path.join(process.cwd(), "scripts", filename)

  const csvContent = [
    "id,url,barcode",
    ...results.filter((r) => r.barcode).map((r) => `${r.id},"${r.url}","${r.barcode}"`),
  ].join("\n")

  fs.writeFileSync(filepath, csvContent)
  console.log(`\n📄 CSV saved to: ${filepath}`)
  console.log(`   ${results.filter((r) => r.barcode).length} rows with barcodes`)

  return filepath
}

/**
 * Update Supabase with the found barcodes
 */
async function updateSupabase(results: BarcodeResult[]): Promise<void> {
  const toUpdate = results.filter((r) => r.barcode)

  if (toUpdate.length === 0) {
    console.log("⚠️ No barcodes to update")
    return
  }

  console.log(`\n🔄 Updating ${toUpdate.length} products in Supabase...`)

  let success = 0
  let failed = 0

  for (const result of toUpdate) {
    const { error } = await supabase.from("store_products").update({ barcode: result.barcode }).eq("id", result.id)

    if (error) {
      console.error(`   ❌ Failed to update ID ${result.id}: ${error.message}`)
      failed++
    } else {
      success++
    }
  }

  console.log(`   ✅ Updated: ${success}, Failed: ${failed}`)
}

/**
 * Format duration in human readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Main
 */
async function main() {
  const scriptStart = Date.now()
  const startTime = new Date().toLocaleTimeString()

  console.log("🚀 Pingo Doce Barcode Backfill Script")
  console.log("=====================================")
  console.log(`   Started at: ${startTime}`)
  console.log(`   Mode: ${isDryRun ? "Dry run (CSV only)" : shouldUpdate ? "Update Supabase" : "CSV only"}`)
  if (limit) console.log(`   Limit: ${limit} products`)
  if (offset > 0) console.log(`   Offset: ${offset} (skipping first ${offset} products)`)
  if (skipFailed) console.log(`   Skip failed: enabled`)
  if (isDebug) console.log(`   Debug: enabled (will show window.BV structure)`)
  console.log("")

  // Fetch products
  const products = await fetchProductsWithoutBarcodes()

  if (products.length === 0) {
    console.log("✨ No products to process!")
    return
  }

  // Launch browser
  console.log("\n🌐 Launching browser...")
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  let results: BarcodeResult[] = []

  try {
    // Process products
    console.log("\n🔍 Extracting barcodes...\n")
    results = await processProducts(products, browser)

    // Write CSV
    writeCSV(results)

    // Save failed IDs for future runs
    const failedIds = results.filter((r) => !r.barcode).map((r) => r.id)
    if (failedIds.length > 0) {
      saveFailedIds(failedIds)
    }

    // Update Supabase if requested
    if (shouldUpdate && !isDryRun) {
      await updateSupabase(results)
    } else if (!isDryRun) {
      console.log("\n💡 To update Supabase, run with --update flag")
    }
  } finally {
    await browser.close()
  }

  const endTime = new Date().toLocaleTimeString()
  const totalDuration = formatDuration(Date.now() - scriptStart)

  console.log(`\n✨ Done!`)
  console.log(`   Started: ${startTime}`)
  console.log(`   Finished: ${endTime}`)
  console.log(`   Total duration: ${totalDuration}`)
}

main().catch((error) => {
  console.error("💥 Fatal error:", error)
  process.exit(1)
})
