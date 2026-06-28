import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import type { DataHealthHistoryPoint, DataHealthSnapshot } from "@/types/data-health"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/data-health
 * Returns the latest precomputed data health snapshot.
 * ?history=30 returns SLO trend series (last N snapshots).
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const historyParam = req.nextUrl.searchParams.get("history")
    const historyLimit = historyParam ? Math.min(parseInt(historyParam, 10) || 30, 90) : 0

    if (historyLimit > 0) {
      const { data, error } = await supabase
        .from("data_health_snapshots")
        .select("computed_at, data")
        .order("computed_at", { ascending: false })
        .limit(historyLimit)

      if (error) throw new Error(`Query error: ${error.message}`)

      const history: DataHealthHistoryPoint[] = (data ?? []).map((row) => ({
        computed_at: row.computed_at,
        slos: (row.data as { slos?: DataHealthHistoryPoint["slos"] })?.slos ?? [],
      }))

      return NextResponse.json({ history: history.reverse() })
    }

    const { data, error } = await supabase
      .from("data_health_snapshots")
      .select("id, computed_at, duration_ms, triggered_by, data")
      .order("computed_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code === "PGRST116") {
      return NextResponse.json({ error: "No data health snapshot exists yet" }, { status: 404 })
    }

    if (error) throw new Error(`Query error: ${error.message}`)

    return NextResponse.json(data as DataHealthSnapshot)
  } catch (error) {
    console.error("[admin/data-health] GET error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
