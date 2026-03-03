/**
 * Analyze OFF Portuguese products vs our trade_items.
 * Streams the full OFF CSV, filters for Portugal-tagged products,
 * and reports overlap with our database.
 *
 * Usage: pnpm tsx scripts/off-analyze-portugal.ts
 */

import * as fs from "fs"
import * as path from "path"
import { createGunzip } from "node:zlib"
import { createInterface } from "node:readline"
import { Readable } from "node:stream"

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

const OFF_CSV_URL = "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

async function fetchAllTradeItems(): Promise<Set<string>> {
  const gtins = new Set<string>()
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data } = await supabase
      .from("trade_items")
      .select("gtin")
      .range(from, from + PAGE - 1)
    if (!data || data.length === 0) break
    for (const row of data) gtins.add(row.gtin)
    from += PAGE
    if (data.length < PAGE) break
  }
  return gtins
}

interface PtProduct {
  code: string
  productName: string
  brands: string
}

async function main() {
  log("Loading our trade_items...")
  const ourGtins = await fetchAllTradeItems()
  log(`Loaded ${ourGtins.size} barcodes from our DB`)

  log(`Downloading OFF CSV...`)
  const res = await fetch(OFF_CSV_URL, {
    headers: { "User-Agent": "PriceLens/1.0 (https://pricelens.pt)" },
    redirect: "follow",
  })
  if (!res.ok || !res.body) throw new Error(`Download failed: HTTP ${res.status}`)

  const gunzip = createGunzip()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readable = Readable.fromWeb(res.body as any)
  readable.pipe(gunzip)
  const rl = createInterface({ input: gunzip, crlfDelay: Infinity })

  let headers: string[] = []
  let codeIdx = -1,
    nameIdx = -1,
    brandsIdx = -1,
    countriesIdx = -1

  let totalLines = 0
  let ptTotal = 0
  let ptMatched = 0
  let ptUnmatched = 0
  const unmatchedSamples: PtProduct[] = []
  const matchedSamples: PtProduct[] = []

  for await (const line of rl) {
    totalLines++

    if (totalLines === 1) {
      headers = line.split("\t")
      codeIdx = headers.indexOf("code")
      nameIdx = headers.indexOf("product_name")
      brandsIdx = headers.indexOf("brands")
      countriesIdx = headers.indexOf("countries_tags")
      if (codeIdx === -1 || countriesIdx === -1) {
        throw new Error(`Missing columns: code=${codeIdx}, countries_tags=${countriesIdx}`)
      }
      continue
    }

    const fields = line.split("\t")
    const countriesTags = fields[countriesIdx] || ""

    if (!countriesTags.includes("en:portugal")) continue

    ptTotal++
    const code = fields[codeIdx] || ""
    const productName = fields[nameIdx] || ""
    const brands = fields[brandsIdx] || ""

    if (ourGtins.has(code)) {
      ptMatched++
      if (matchedSamples.length < 10) {
        matchedSamples.push({ code, productName, brands })
      }
    } else {
      ptUnmatched++
      if (unmatchedSamples.length < 50) {
        unmatchedSamples.push({ code, productName, brands })
      }
    }

    if (ptTotal % 5000 === 0) {
      log(`  Portuguese products so far: ${ptTotal} (${ptMatched} matched, ${ptUnmatched} not in our DB)`)
    }
  }

  log(`\n========== RESULTS ==========`)
  log(`Total OFF products scanned: ${(totalLines - 1).toLocaleString()}`)
  log(`Portuguese products (countries_tags contains en:portugal): ${ptTotal}`)
  log(`  We carry (barcode match):    ${ptMatched} (${((100 * ptMatched) / ptTotal).toFixed(1)}%)`)
  log(`  We DON'T carry:              ${ptUnmatched} (${((100 * ptUnmatched) / ptTotal).toFixed(1)}%)`)

  log(`\n--- Sample MATCHED (we have these) ---`)
  for (const p of matchedSamples) {
    log(`  ${p.code}  ${p.brands.padEnd(20)}  ${p.productName}`)
  }

  log(`\n--- Sample UNMATCHED (OFF has, we don't) ---`)
  for (const p of unmatchedSamples.slice(0, 30)) {
    log(`  ${p.code}  ${p.brands.padEnd(20)}  ${p.productName}`)
  }

  // Check for barcode format mismatches (leading zeros, etc.)
  log(`\n--- Barcode format analysis of unmatched ---`)
  let couldMatchWithPadding = 0
  let couldMatchStripped = 0
  for (const p of unmatchedSamples) {
    // Try adding leading zero
    if (ourGtins.has("0" + p.code)) couldMatchWithPadding++
    // Try stripping leading zero
    if (p.code.startsWith("0") && ourGtins.has(p.code.slice(1))) couldMatchStripped++
  }
  log(`  Of ${unmatchedSamples.length} unmatched samples:`)
  log(`    Would match if we added leading 0 to OFF code: ${couldMatchWithPadding}`)
  log(`    Would match if we stripped leading 0 from OFF code: ${couldMatchStripped}`)

  // Write full unmatched list to file for manual review
  const outPath = path.join(process.cwd(), "scripts", "off-portugal-unmatched.json")
  fs.writeFileSync(outPath, JSON.stringify(unmatchedSamples, null, 2))
  log(`\nWrote ${unmatchedSamples.length} unmatched samples to ${outPath}`)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
