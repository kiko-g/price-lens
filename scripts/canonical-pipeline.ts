/**
 * Canonical Product Pipeline
 *
 * Incremental, production-safe pipeline that links store_products to
 * trade_items and canonical_products via barcode and OFF enrichment.
 *
 * Usage:
 *   pnpm canonical:run                  # full pipeline (incremental)
 *   pnpm canonical:run --pass1-only     # barcode → trade_item only
 *   pnpm canonical:run --enrich-only    # OFF enrichment only
 *   pnpm canonical:run --pass2-only     # canonical clustering only
 *   pnpm canonical:run --dry-run        # preview without writing
 *   pnpm canonical:run --force-download # re-download OFF CSV even if fresh
 *   pnpm canonical:run --stats          # print current table stats only
 *   pnpm canonical:run --verify         # run integrity checks after pipeline
 */

import * as fs from "fs"
import * as path from "path"

// Load env for standalone script execution
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

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
  runFullPipeline,
  runPass1,
  runEnrichment,
  runPass2,
  getTableCounts,
  logCounts,
  verifyIntegrity,
  type PipelineOptions,
} from "@/lib/canonical/matcher"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

function parseArgs(): {
  pass1Only: boolean
  enrichOnly: boolean
  pass2Only: boolean
  dryRun: boolean
  forceDownload: boolean
  statsOnly: boolean
  verify: boolean
} {
  const args = process.argv.slice(2)
  return {
    pass1Only: args.includes("--pass1-only"),
    enrichOnly: args.includes("--enrich-only"),
    pass2Only: args.includes("--pass2-only"),
    dryRun: args.includes("--dry-run"),
    forceDownload: args.includes("--force-download"),
    statsOnly: args.includes("--stats"),
    verify: args.includes("--verify"),
  }
}

async function verifyConnection(supabase: SupabaseClient): Promise<void> {
  const { count, error } = await supabase.from("store_products").select("id", { count: "exact", head: true })

  if (error) {
    throw new Error(`Cannot connect to database: ${error.message}`)
  }

  if (count === null || count === undefined) {
    throw new Error("Database returned null count -- check credentials and RLS policies")
  }
}

async function verifyTables(supabase: SupabaseClient): Promise<void> {
  const tables = ["trade_items", "canonical_products"] as const

  for (const table of tables) {
    const { error } = await supabase.from(table).select("id", { count: "exact", head: true })
    if (error) {
      throw new Error(
        `Table "${table}" not accessible: ${error.message}. ` + `Run migration 020_canonical_full.sql first.`,
      )
    }
  }
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

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
    console.error("Ensure .env.local or .env.development.local exists with these vars.")
    process.exit(1)
  }

  const { pass1Only, enrichOnly, pass2Only, dryRun, forceDownload, statsOnly, verify } = parseArgs()

  if (dryRun) {
    log("*** DRY RUN MODE -- no writes will be performed ***")
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  log("Verifying database connection...")
  await verifyConnection(supabase)
  await verifyTables(supabase)
  log("Connection OK.")

  const options: PipelineOptions = { dryRun, forceDownload }
  const start = Date.now()

  if (statsOnly) {
    log("Current table statistics:")
    const counts = await getTableCounts(supabase)
    logCounts(counts, log)
    return
  }

  if (pass1Only) {
    log("Running Pass 1 only (barcode → trade_item)")
    const result = await runPass1(supabase, log, options)
    log(`Done. Created: ${result.created}, Linked: ${result.linked}, Unlinked: ${result.unlinked}`)
  } else if (enrichOnly) {
    log("Running OFF enrichment only (trade_item → Open Food Facts)")
    const result = await runEnrichment(supabase, log, options)
    log(
      `Done. Enriched: ${result.enriched}, Not in OFF: ${result.notFound}, ` +
        `Errors: ${result.errors}, Skipped (non-food): ${result.skipped}`,
    )
  } else if (pass2Only) {
    log("Running Pass 2 only (trade_item → canonical_product)")
    const result = await runPass2(supabase, log, options)
    log(`Done. Created: ${result.canonicalsCreated}, Matched: ${result.canonicalsMatched}`)
    if (!dryRun) writeReviewFile(result.lowConfidenceMatches)
  } else {
    const stats = await runFullPipeline(supabase, log, options)
    if (!dryRun) writeReviewFile(stats.lowConfidenceMatches)
  }

  if (verify && !dryRun) {
    log("")
    const result = await verifyIntegrity(supabase, log)
    if (!result.passed) {
      log("INTEGRITY CHECK FAILED — review output above before deploying.")
      process.exit(1)
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  log(`Finished in ${elapsed}s`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
