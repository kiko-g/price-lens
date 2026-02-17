import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { pingRedis } from "@/lib/kv"
import { withTimeout } from "@/lib/resilience"

/**
 * GET /api/health
 *
 * Returns the health status of external dependencies (Redis, Supabase).
 * Useful for uptime monitoring (e.g. UptimeRobot, Vercel Cron).
 */
export async function GET() {
  const [redis, supabase] = await Promise.all([checkRedis(), checkSupabase()])

  const healthy = redis.ok && supabase.ok
  const status = healthy ? 200 : 503

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: { redis, supabase },
    },
    { status },
  )
}

async function checkRedis() {
  return pingRedis()
}

async function checkSupabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = performance.now()
  try {
    const supabase = createClient()
    const query = supabase.from("store_products").select("id", { count: "exact", head: true }).limit(1)
    const result = await withTimeout(Promise.resolve(query), 5000)
    const latencyMs = Math.round(performance.now() - start)
    if (result.error) {
      return { ok: false, latencyMs, error: result.error.message }
    }
    return { ok: true, latencyMs }
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start)
    return { ok: false, latencyMs, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
