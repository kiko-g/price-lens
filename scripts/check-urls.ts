import * as fs from "fs"
import * as path from "path"

// Load .env.local manually
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

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Generate datetime string for filenames
function getDateTimeString(): string {
  const now = new Date()
  return now.toISOString().replace(/[:.]/g, "-").slice(0, 19)
}

async function main() {
  const datetime = getDateTimeString()
  const outputDir = path.join(process.cwd(), "scripts", "output")

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log("=== EXPORTING DATA TO CSV ===\n")
  console.log(`Datetime: ${datetime}\n`)

  // ============================================
  // 1. Export ALL store_products from Supabase
  // ============================================
  console.log("Fetching ALL Continente products from Supabase...")

  const allDbProducts: { id: number; url: string }[] = []
  const PAGE_SIZE = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from("store_products")
      .select("id, url")
      .eq("origin_id", 1)
      .not("url", "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error("Error fetching from Supabase:", error.message)
      break
    }

    if (data && data.length > 0) {
      allDbProducts.push(...(data.filter((p) => p.url) as { id: number; url: string }[]))
      offset += PAGE_SIZE
      process.stdout.write(`\r  Fetched ${allDbProducts.length} products...`)

      if (data.length < PAGE_SIZE) {
        hasMore = false
      }
    } else {
      hasMore = false
    }
  }

  console.log(`\n  Total from Supabase: ${allDbProducts.length}`)

  // Write Supabase CSV
  const supabaseCsvPath = path.join(outputDir, `${datetime}_store_products_supabase.csv`)
  const supabaseCsvContent = "id,url\n" + allDbProducts.map((p) => `${p.id},"${p.url}"`).join("\n")
  fs.writeFileSync(supabaseCsvPath, supabaseCsvContent)
  console.log(`  Saved: ${supabaseCsvPath}\n`)

  // ============================================
  // 2. Fetch ALL sitemap URLs
  // ============================================
  console.log("Fetching ALL Continente sitemap URLs...")

  const sitemapIndexUrls = [
    "https://www.continente.pt/sitemap-custom_sitemap_1-product.xml",
    "https://www.continente.pt/sitemap-custom_sitemap_4-product.xml",
    "https://www.continente.pt/sitemap-custom_sitemap_8-product.xml",
    "https://www.continente.pt/sitemap-custom_sitemap_12-product.xml",
    "https://www.continente.pt/sitemap-custom_sitemap_16-product.xml",
  ]

  const allSitemapUrls: string[] = []

  for (const sitemapUrl of sitemapIndexUrls) {
    console.log(`  Fetching ${sitemapUrl}...`)
    const response = await fetch(sitemapUrl)
    const xml = await response.text()
    const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || []
    const urls = matches.map((m) => m.replace(/<\/?loc>/g, ""))
    allSitemapUrls.push(...urls)
    console.log(`    → ${urls.length} URLs`)
  }

  console.log(`  Total from Sitemaps: ${allSitemapUrls.length}`)

  // Write Sitemap CSV
  const sitemapCsvPath = path.join(outputDir, `${datetime}_sitemap_urls.csv`)
  const sitemapCsvContent = "url\n" + allSitemapUrls.map((url) => `"${url}"`).join("\n")
  fs.writeFileSync(sitemapCsvPath, sitemapCsvContent)
  console.log(`  Saved: ${sitemapCsvPath}\n`)

  // ============================================
  // 3. Extract SKUs from URLs
  // ============================================

  // Pattern: URL ends with -{SKU}.html where SKU is a number
  function extractSku(url: string): string | null {
    const match = url.match(/-(\d+)\.html$/)
    return match ? match[1] : null
  }

  console.log("=== EXTRACTING SKUs ===\n")

  // Build SKU maps
  const dbSkuToUrl = new Map<string, string>()
  const dbSkuToId = new Map<string, number>()
  let dbSkuExtractFailed = 0

  for (const p of allDbProducts) {
    const sku = extractSku(p.url)
    if (sku) {
      dbSkuToUrl.set(sku, p.url)
      dbSkuToId.set(sku, p.id)
    } else {
      dbSkuExtractFailed++
    }
  }

  const sitemapSkuToUrl = new Map<string, string>()
  let sitemapSkuExtractFailed = 0

  for (const url of allSitemapUrls) {
    const sku = extractSku(url)
    if (sku) {
      sitemapSkuToUrl.set(sku, url)
    } else {
      sitemapSkuExtractFailed++
    }
  }

  console.log(`  DB URLs with valid SKU:      ${dbSkuToUrl.size.toLocaleString()} (${dbSkuExtractFailed} failed)`)
  console.log(
    `  Sitemap URLs with valid SKU: ${sitemapSkuToUrl.size.toLocaleString()} (${sitemapSkuExtractFailed} failed)`,
  )

  // ============================================
  // 4. Compare by EXACT URL
  // ============================================
  console.log("\n=== COMPARISON BY EXACT URL ===\n")

  const dbUrlSet = new Set(allDbProducts.map((p) => p.url))
  const sitemapUrlSet = new Set(allSitemapUrls)

  let exactInBoth = 0
  let exactOnlyInDb = 0
  let exactOnlyInSitemap = 0

  for (const url of dbUrlSet) {
    if (sitemapUrlSet.has(url)) {
      exactInBoth++
    } else {
      exactOnlyInDb++
    }
  }

  for (const url of sitemapUrlSet) {
    if (!dbUrlSet.has(url)) {
      exactOnlyInSitemap++
    }
  }

  console.log(`  In BOTH (exact URL):    ${exactInBoth.toLocaleString()}`)
  console.log(`  Only in DB:             ${exactOnlyInDb.toLocaleString()}`)
  console.log(`  Only in Sitemap:        ${exactOnlyInSitemap.toLocaleString()}`)

  // ============================================
  // 5. Compare by SKU (the REAL comparison)
  // ============================================
  console.log("\n=== COMPARISON BY SKU (TRUE MATCH) ===\n")

  let skuInBoth = 0
  let skuOnlyInDb = 0
  let skuOnlyInSitemap = 0
  const matchedSkus: { sku: string; dbUrl: string; sitemapUrl: string }[] = []
  const onlyInDbSkus: { sku: string; url: string }[] = []
  const onlyInSitemapSkus: { sku: string; url: string }[] = []

  for (const [sku, dbUrl] of dbSkuToUrl) {
    if (sitemapSkuToUrl.has(sku)) {
      skuInBoth++
      if (matchedSkus.length < 10) {
        matchedSkus.push({ sku, dbUrl, sitemapUrl: sitemapSkuToUrl.get(sku)! })
      }
    } else {
      skuOnlyInDb++
      if (onlyInDbSkus.length < 10) {
        onlyInDbSkus.push({ sku, url: dbUrl })
      }
    }
  }

  for (const [sku, sitemapUrl] of sitemapSkuToUrl) {
    if (!dbSkuToUrl.has(sku)) {
      skuOnlyInSitemap++
      if (onlyInSitemapSkus.length < 10) {
        onlyInSitemapSkus.push({ sku, url: sitemapUrl })
      }
    }
  }

  console.log(`  Supabase SKUs:          ${dbSkuToUrl.size.toLocaleString()}`)
  console.log(`  Sitemap SKUs:           ${sitemapSkuToUrl.size.toLocaleString()}`)
  console.log(`  ─────────────────────────────────`)
  console.log(`  In BOTH (by SKU):       ${skuInBoth.toLocaleString()} ✅`)
  console.log(`  Only in DB:             ${skuOnlyInDb.toLocaleString()}`)
  console.log(`  Only in Sitemap (NEW):  ${skuOnlyInSitemap.toLocaleString()} 🆕`)
  console.log(`  ─────────────────────────────────`)
  console.log(`  DB Coverage (by SKU):   ${((skuInBoth / sitemapSkuToUrl.size) * 100).toFixed(2)}%`)

  // Show sample matches where URL differs but SKU matches
  const urlDiffers = matchedSkus.filter((m) => m.dbUrl !== m.sitemapUrl)
  if (urlDiffers.length > 0) {
    console.log(`\n=== SAMPLE: Same SKU, Different URL ===`)
    for (const m of urlDiffers.slice(0, 5)) {
      console.log(`\n  SKU: ${m.sku}`)
      console.log(`  DB:      ${m.dbUrl}`)
      console.log(`  Sitemap: ${m.sitemapUrl}`)
    }
  }

  // Show sample only in DB
  if (onlyInDbSkus.length > 0) {
    console.log(`\n=== SAMPLE: Only in DB (not in sitemap) ===`)
    for (const s of onlyInDbSkus.slice(0, 5)) {
      console.log(`  SKU ${s.sku}: ${s.url.substring(0, 80)}...`)
    }
  }

  // Show sample only in sitemap (truly new)
  if (onlyInSitemapSkus.length > 0) {
    console.log(`\n=== SAMPLE: Only in Sitemap (truly NEW) ===`)
    for (const s of onlyInSitemapSkus.slice(0, 5)) {
      console.log(`  SKU ${s.sku}: ${s.url.substring(0, 80)}...`)
    }
  }

  // ============================================
  // 6. Export SKU comparison CSV
  // ============================================
  const skuComparisonPath = path.join(outputDir, `${datetime}_sku_comparison.csv`)
  const skuRows = [
    "status,sku,db_url,sitemap_url",
    ...Array.from(dbSkuToUrl.entries()).map(([sku, dbUrl]) => {
      const sitemapUrl = sitemapSkuToUrl.get(sku) || ""
      const status = sitemapUrl ? "BOTH" : "DB_ONLY"
      return `${status},${sku},"${dbUrl}","${sitemapUrl}"`
    }),
    ...Array.from(sitemapSkuToUrl.entries())
      .filter(([sku]) => !dbSkuToUrl.has(sku))
      .map(([sku, sitemapUrl]) => `SITEMAP_ONLY,${sku},"","${sitemapUrl}"`),
  ]
  fs.writeFileSync(skuComparisonPath, skuRows.join("\n"))

  console.log(`\n=== FILES CREATED ===`)
  console.log(`1. ${supabaseCsvPath}`)
  console.log(`2. ${sitemapCsvPath}`)
  console.log(`3. ${skuComparisonPath}`)
  console.log(`\nYou can now compare these files externally for verification.`)
}

main().catch(console.error)
