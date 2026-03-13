import { NextRequest, NextResponse } from "next/server"
import { runTriage, runGovernanceAudit } from "@/lib/discovery/triage"

export const maxDuration = 300

/**
 * GET /api/admin/discovery/triage
 *
 * Modes:
 * - (default) Triage: scrape untriaged products, classify, park/keep/veto
 * - ?mode=audit: Re-evaluate parked products against current mappings (no scraping)
 *
 * Query params:
 * - mode: "triage" (default) | "audit"
 * - batch: number of products to process (triage only, default: 50)
 * - scope: "parked" (default) | "full" — audit scope. "full" evaluates ALL products.
 * - dry: "true" for dry run
 * - verbose: "true" for detailed logging
 * - origin: origin ID filter (audit mode only)
 *
 * Audit mode paginates internally (no batch limit) — processes all matching products.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get("mode") || "triage"
    const batchSize = searchParams.get("batch") ? parseInt(searchParams.get("batch")!, 10) : undefined
    const dryRun = searchParams.get("dry") === "true"
    const verbose = searchParams.get("verbose") === "true"
    const originId = searchParams.get("origin") ? parseInt(searchParams.get("origin")!, 10) : undefined

    if (mode === "audit") {
      const scope = (searchParams.get("scope") as "parked" | "full") || "parked"
      const force = searchParams.get("force") === "true"
      const result = await runGovernanceAudit({ dryRun, verbose, originId, scope, force })

      return NextResponse.json({
        message: dryRun
          ? `Dry audit (${scope}): ${result.processed} evaluated (${result.kept} would keep, ${result.vetoed} would veto, ${result.parked} parked)`
          : `Audit (${scope}): ${result.processed} evaluated, ${result.kept} kept, ${result.vetoed} vetoed, ${result.parked} parked`,
        mode: "audit",
        scope,
        dryRun,
        result,
      })
    }

    const result = await runTriage({ batchSize, dryRun, verbose })

    return NextResponse.json({
      message: dryRun
        ? `Dry run: would process ${result.processed} products (${result.kept} kept, ${result.vetoed} vetoed, ${result.parked} parked)`
        : `Triage complete: ${result.processed} processed, ${result.kept} kept, ${result.vetoed} vetoed, ${result.parked} parked, ${result.errors} errors`,
      mode: "triage",
      dryRun,
      result,
    })
  } catch (error) {
    console.error("[Triage API] Error:", error)
    return NextResponse.json(
      { error: "Triage failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
