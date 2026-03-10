import { NextRequest, NextResponse } from "next/server"
import { runTriage } from "@/lib/discovery/triage"

export const maxDuration = 300

/**
 * GET /api/admin/discovery/triage
 *
 * Runs triage on untriaged store_products (priority IS NULL, name IS NULL).
 * Designed to be called by a Vercel cron every 6 hours.
 *
 * Query params:
 * - batch: number of products to process (default: 50)
 * - dry: "true" for dry run
 * - verbose: "true" for detailed logging
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const batchSize = searchParams.get("batch") ? parseInt(searchParams.get("batch")!, 10) : undefined
    const dryRun = searchParams.get("dry") === "true"
    const verbose = searchParams.get("verbose") === "true"

    const result = await runTriage({ batchSize, dryRun, verbose })

    return NextResponse.json({
      message: dryRun
        ? `Dry run: would process ${result.processed} products (${result.kept} kept, ${result.vetoed} vetoed)`
        : `Triage complete: ${result.processed} processed, ${result.kept} kept, ${result.vetoed} vetoed, ${result.errors} errors`,
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
