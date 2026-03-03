/**
 * Backfill Canonical Products
 *
 * Runs the canonical matching pipeline on all existing store_products:
 *   Pass 1:   barcode → trade_item (deterministic)
 *   Pass 1.5: trade_item → Open Food Facts enrichment (rate limited)
 *   Pass 2:   trade_item → canonical_product (OFF-aware clustering)
 *
 * Usage:
 *   pnpm backfill:canonical               # full pipeline
 *   pnpm backfill:canonical --pass1-only   # barcode → trade_item only
 *   pnpm backfill:canonical --enrich-only  # OFF enrichment only
 *   pnpm backfill:canonical --pass2-only   # canonical clustering only
 *
 * Outputs low-confidence matches to scripts/canonical-review.json for manual review.
 */

import * as fs from "fs"
import * as path from "path"

// Load .env.local for standalone script execution
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
import { runFullPipeline, runPass1, runEnrichment, runPass2 } from "@/lib/canonical/matcher"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
  console.error("Ensure .env.local or .env.development.local exists with these vars.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const args = process.argv.slice(2)
const pass1Only = args.includes("--pass1-only")
const enrichOnly = args.includes("--enrich-only")
const pass2Only = args.includes("--pass2-only")

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

async function main() {
  const start = Date.now()
  log("Canonical product backfill starting...")

  if (pass1Only) {
    log("Running Pass 1 only (barcode → trade_item)")
    const result = await runPass1(supabase, log)
    log(`Done. Created: ${result.created}, Linked: ${result.linked}, Unlinked: ${result.unlinked}`)
  } else if (enrichOnly) {
    log("Running OFF enrichment only (trade_item → Open Food Facts)")
    const result = await runEnrichment(supabase, log)
    log(
      `Done. Enriched: ${result.enriched}, Not in OFF: ${result.notFound}, ` +
        `Errors: ${result.errors}, Skipped (non-food): ${result.skipped}`,
    )
  } else if (pass2Only) {
    log("Running Pass 2 only (trade_item → canonical_product)")
    const result = await runPass2(supabase, log)
    log(`Done. Created: ${result.canonicalsCreated}, Matched: ${result.canonicalsMatched}`)
    writeReviewFile(result.lowConfidenceMatches)
  } else {
    const stats = await runFullPipeline(supabase, log)
    writeReviewFile(stats.lowConfidenceMatches)
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  log(`Finished in ${elapsed}s`)
}

function writeReviewFile(
  matches: {
    tradeItemGtin: string
    candidateCanonicalId: number
    candidateCanonicalName: string
    confidence: number
    reasons: string[]
  }[],
) {
  if (matches.length === 0) {
    log("No low-confidence matches to review.")
    return
  }

  const outPath = path.join(process.cwd(), "scripts", "canonical-review.json")
  fs.writeFileSync(outPath, JSON.stringify(matches, null, 2))
  log(`Wrote ${matches.length} low-confidence matches to ${outPath}`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
