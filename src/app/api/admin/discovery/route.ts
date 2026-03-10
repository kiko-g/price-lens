import { NextRequest, NextResponse } from "next/server"
import {
  runDiscovery,
  runAllDiscovery,
  getDiscoveryCoverage,
  getAllStoreConfigs,
  saveDiscoveryRun,
} from "@/lib/discovery"
import { createAdminClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { now } from "@/lib/utils"
import type { DiscoveryRun } from "@/lib/discovery/types"

export const maxDuration = 300 // 5 minutes for sitemap fetching

/**
 * GET /api/admin/discovery
 *
 * Actions:
 * - ?action=status - Get discovery status and coverage for all stores
 * - ?action=run&origin=1 - Run discovery for a specific store
 * - ?action=run&origin=all - Run discovery for all stores
 * - ?action=run&origin=1&dry=true - Dry run (don't insert)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const action = searchParams.get("action") || "status"
    const originParam = searchParams.get("origin")
    const dryRun = searchParams.get("dry") === "true"
    const verbose = searchParams.get("verbose") === "true"
    const maxUrls = searchParams.get("max") ? parseInt(searchParams.get("max")!, 10) : undefined

    if (action === "status") {
      const configs = getAllStoreConfigs()
      const supabase = createAdminClient()

      const [storeStats, triageStats] = await Promise.all([
        Promise.all(
          configs.map(async (config) => {
            const coverage = await getDiscoveryCoverage(config.originId)
            return {
              originId: config.originId,
              name: config.name,
              sitemapIndexUrl: config.sitemapIndexUrl,
              ...coverage,
            }
          }),
        ),
        getTriageStats(supabase, configs),
      ])

      return NextResponse.json({
        stores: storeStats,
        availableOrigins: configs.map((c) => ({ id: c.originId, name: c.name })),
        triage: triageStats,
      })
    }

    if (action === "run") {
      if (!originParam) {
        return NextResponse.json(
          { error: "Missing origin parameter. Use ?origin=1, ?origin=2, or ?origin=all" },
          { status: 400 },
        )
      }

      const options = { dryRun, verbose, maxUrls }

      if (originParam === "all") {
        const startedAt = now()
        const results = await runAllDiscovery(options)

        for (const result of results) {
          const run: DiscoveryRun = {
            origin_id: result.originId,
            discovery_source: result.source,
            status: result.errors.length > 0 && result.urlsNew === 0 ? "failed" : "completed",
            started_at: startedAt,
            completed_at: now(),
            urls_found: result.urlsFound,
            urls_new: result.urlsNew,
            urls_existing: result.urlsExisting,
            urls_invalid: result.urlsInvalid,
            errors: result.errors,
            metadata: { dryRun },
          }
          await saveDiscoveryRun(run).catch(() => {})
        }

        const totalNew = results.reduce((sum, r) => sum + r.urlsNew, 0)
        const totalFound = results.reduce((sum, r) => sum + r.urlsFound, 0)
        const totalVetoed = results.reduce((sum, r) => sum + r.urlsVetoed, 0)

        return NextResponse.json({
          message: dryRun
            ? `Dry run complete. Would discover ${totalNew} new products from ${totalFound} URLs (${totalVetoed} vetoed).`
            : `Discovery complete. Found ${totalNew} new products from ${totalFound} URLs (${totalVetoed} vetoed).`,
          dryRun,
          results,
        })
      }

      // Run for specific store (auto-dispatches to sitemap or category crawl)
      const originId = parseInt(originParam, 10)
      if (isNaN(originId)) {
        return NextResponse.json({ error: "Invalid origin ID" }, { status: 400 })
      }

      const startedAt = now()
      const result = await runDiscovery(originId, options)

      const run: DiscoveryRun = {
        origin_id: result.originId,
        discovery_source: result.source,
        status: result.errors.length > 0 && result.urlsNew === 0 ? "failed" : "completed",
        started_at: startedAt,
        completed_at: now(),
        urls_found: result.urlsFound,
        urls_new: result.urlsNew,
        urls_existing: result.urlsExisting,
        urls_invalid: result.urlsInvalid,
        errors: result.errors,
        metadata: { dryRun },
      }
      await saveDiscoveryRun(run).catch(() => {})

      return NextResponse.json({
        message: dryRun
          ? `Dry run complete for ${result.originName}. Would discover ${result.urlsNew} new products.`
          : `Discovery complete for ${result.originName}. Found ${result.urlsNew} new products.`,
        dryRun,
        result,
      })
    }

    return NextResponse.json({ error: "Invalid action. Use ?action=status or ?action=run" }, { status: 400 })
  } catch (error) {
    console.error("Discovery API error:", error)
    return NextResponse.json(
      { error: "Discovery failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}

/**
 * POST /api/admin/discovery
 *
 * Same as GET but for programmatic triggering
 * Body: { origin: number | "all", dryRun?: boolean, maxUrls?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { origin, dryRun = false, maxUrls, verbose = false } = body

    if (!origin) {
      return NextResponse.json({ error: "Missing origin in body" }, { status: 400 })
    }

    const options = { dryRun, verbose, maxUrls }

    if (origin === "all") {
      const startedAt = now()
      const results = await runAllDiscovery(options)

      for (const result of results) {
        const run: DiscoveryRun = {
          origin_id: result.originId,
          discovery_source: result.source,
          status: result.errors.length > 0 && result.urlsNew === 0 ? "failed" : "completed",
          started_at: startedAt,
          completed_at: now(),
          urls_found: result.urlsFound,
          urls_new: result.urlsNew,
          urls_existing: result.urlsExisting,
          urls_invalid: result.urlsInvalid,
          errors: result.errors,
          metadata: { dryRun },
        }
        await saveDiscoveryRun(run).catch(() => {})
      }

      return NextResponse.json({ results, dryRun })
    }

    const originId = typeof origin === "number" ? origin : parseInt(origin, 10)
    if (isNaN(originId)) {
      return NextResponse.json({ error: "Invalid origin ID" }, { status: 400 })
    }

    const startedAt = now()
    const result = await runDiscovery(originId, options)

    const run: DiscoveryRun = {
      origin_id: result.originId,
      discovery_source: result.source,
      status: result.errors.length > 0 && result.urlsNew === 0 ? "failed" : "completed",
      started_at: startedAt,
      completed_at: now(),
      urls_found: result.urlsFound,
      urls_new: result.urlsNew,
      urls_existing: result.urlsExisting,
      urls_invalid: result.urlsInvalid,
      errors: result.errors,
      metadata: { dryRun },
    }
    await saveDiscoveryRun(run).catch(() => {})

    return NextResponse.json({ result, dryRun })
  } catch (error) {
    console.error("Discovery API error:", error)
    return NextResponse.json(
      { error: "Discovery failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}

async function getTriageStats(supabase: SupabaseClient, configs: { originId: number; name: string }[]) {
  // Count untriaged products and vetoed SKUs per origin in parallel
  const vetoedCountPromises = configs.map((config) =>
    supabase
      .from("vetoed_store_skus")
      .select("*", { count: "exact", head: true })
      .eq("origin_id", config.originId)
      .then((res) => ({ originId: config.originId, count: res.count ?? 0 })),
  )

  const [untriagedRes, ...vetoedCounts] = await Promise.all([
    supabase.from("store_products").select("*", { count: "exact", head: true }).is("priority", null).is("name", null),
    ...vetoedCountPromises,
  ])

  const vetoedByOrigin: Record<number, number> = {}
  for (const { originId, count } of vetoedCounts) {
    vetoedByOrigin[originId] = count
  }

  return {
    untriagedCount: untriagedRes.count ?? 0,
    totalVetoed: vetoedCounts.reduce((sum, v) => sum + v.count, 0),
    vetoedByOrigin,
  }
}
