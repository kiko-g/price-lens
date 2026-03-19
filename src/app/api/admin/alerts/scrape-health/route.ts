import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { STORE_NAMES } from "@/types/business"
import { ACTIVE_PRIORITIES } from "@/lib/business/priority"

export const maxDuration = 30

const LOOKBACK_HOURS = 2
const SUCCESS_RATE_WARN = 70
const SUCCESS_RATE_CRITICAL = 30
const FRESHNESS_WARN = 40
const FRESHNESS_CRITICAL = 15
const HTTP_403_THRESHOLD = 10

type Severity = "ok" | "warn" | "critical"

interface Alert {
  severity: Severity
  signal: string
  message: string
}

/**
 * Scrape health check — detects anomalies in scraping operations.
 *
 * Signals checked:
 * 1. Overall success rate from scrape_runs (last N hours)
 * 2. Per-origin scrape freshness (% of high-priority products updated recently)
 * 3. HTTP 403 spike per origin (possible anti-bot blocking)
 *
 * When SCRAPE_ALERT_WEBHOOK_URL is set, fires a Discord/Slack-compatible webhook
 * for warn/critical alerts. Works as a Vercel cron target.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const alerts: Alert[] = []
  const now = new Date()
  const lookbackCutoff = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString()
  const freshnessCutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  // --- Signal 1: Overall success rate from scrape_runs ---
  const { data: recentRuns } = await supabase
    .from("scrape_runs")
    .select("total, success, failed")
    .gte("started_at", lookbackCutoff)

  if (recentRuns && recentRuns.length > 0) {
    const totals = recentRuns.reduce(
      (acc, r) => ({ total: acc.total + (r.total ?? 0), success: acc.success + (r.success ?? 0) }),
      { total: 0, success: 0 },
    )
    const rate = totals.total > 0 ? (totals.success / totals.total) * 100 : 0

    if (rate < SUCCESS_RATE_CRITICAL) {
      alerts.push({
        severity: "critical",
        signal: "success_rate",
        message: `Scrape success rate is ${rate.toFixed(1)}% (${totals.success}/${totals.total}) over the last ${LOOKBACK_HOURS}h — below critical threshold of ${SUCCESS_RATE_CRITICAL}%`,
      })
    } else if (rate < SUCCESS_RATE_WARN) {
      alerts.push({
        severity: "warn",
        signal: "success_rate",
        message: `Scrape success rate is ${rate.toFixed(1)}% (${totals.success}/${totals.total}) over the last ${LOOKBACK_HOURS}h — below warning threshold of ${SUCCESS_RATE_WARN}%`,
      })
    }
  } else {
    alerts.push({
      severity: "critical",
      signal: "no_scrape_runs",
      message: `No scrape runs found in the last ${LOOKBACK_HOURS} hours — scheduler may be down`,
    })
  }

  // --- Signal 2: Per-origin freshness for high-priority products ---
  // "Of products with priority >= 3 that should be scraped daily/every 2 days,
  //  what % have been updated in the last 24 hours?"
  const minPriority = Math.min(...ACTIVE_PRIORITIES)
  const originIds = [1, 2, 3]

  for (const originId of originIds) {
    const storeName = STORE_NAMES[originId] ?? `Origin ${originId}`

    const { count: totalHighPri } = await supabase
      .from("store_products")
      .select("id", { count: "exact", head: true })
      .eq("origin_id", originId)
      .eq("available", true)
      .gte("priority", minPriority)

    if (!totalHighPri || totalHighPri < 10) continue

    const { count: freshCount } = await supabase
      .from("store_products")
      .select("id", { count: "exact", head: true })
      .eq("origin_id", originId)
      .eq("available", true)
      .gte("priority", minPriority)
      .gte("updated_at", freshnessCutoff24h)

    const freshRate = ((freshCount ?? 0) / totalHighPri) * 100

    if (freshRate < FRESHNESS_CRITICAL) {
      alerts.push({
        severity: "critical",
        signal: `freshness_${originId}`,
        message: `${storeName}: only ${freshRate.toFixed(1)}% of ${totalHighPri} tracked products updated in last 24h (critical < ${FRESHNESS_CRITICAL}%)`,
      })
    } else if (freshRate < FRESHNESS_WARN) {
      alerts.push({
        severity: "warn",
        signal: `freshness_${originId}`,
        message: `${storeName}: only ${freshRate.toFixed(1)}% of ${totalHighPri} tracked products updated in last 24h (warn < ${FRESHNESS_WARN}%)`,
      })
    }
  }

  // --- Signal 3: HTTP 403 spike per origin (anti-bot detection) ---
  for (const originId of originIds) {
    const storeName = STORE_NAMES[originId] ?? `Origin ${originId}`

    const { count: blocked } = await supabase
      .from("store_products")
      .select("id", { count: "exact", head: true })
      .eq("origin_id", originId)
      .eq("last_http_status", 403)
      .gte("scraped_at", lookbackCutoff)

    if (blocked && blocked >= HTTP_403_THRESHOLD) {
      alerts.push({
        severity: "critical",
        signal: `http_403_${originId}`,
        message: `${storeName}: ${blocked} products returned HTTP 403 in the last ${LOOKBACK_HOURS}h — possible anti-bot blocking`,
      })
    }
  }

  // --- Determine overall severity ---
  const overallSeverity: Severity = alerts.some((a) => a.severity === "critical")
    ? "critical"
    : alerts.some((a) => a.severity === "warn")
      ? "warn"
      : "ok"

  // --- Send webhook if there are alerts ---
  const webhookUrl = process.env.SCRAPE_ALERT_WEBHOOK_URL
  if (webhookUrl && alerts.length > 0) {
    try {
      await sendWebhookAlert(webhookUrl, alerts, overallSeverity)
    } catch (err) {
      console.error("[ScrapeHealth] Webhook failed:", err)
    }
  }

  console.log(`[ScrapeHealth] ${overallSeverity.toUpperCase()}: ${alerts.length} alert(s)`)
  if (alerts.length > 0) {
    for (const a of alerts) {
      console.log(`  [${a.severity}] ${a.message}`)
    }
  }

  return NextResponse.json({
    status: overallSeverity,
    alerts,
    checked_at: now.toISOString(),
    config: {
      lookback_hours: LOOKBACK_HOURS,
      success_rate_warn: SUCCESS_RATE_WARN,
      success_rate_critical: SUCCESS_RATE_CRITICAL,
      freshness_warn: FRESHNESS_WARN,
      freshness_critical: FRESHNESS_CRITICAL,
      http_403_threshold: HTTP_403_THRESHOLD,
    },
  })
}

async function sendWebhookAlert(url: string, alerts: Alert[], severity: Severity) {
  const emoji = severity === "critical" ? "\u{1F6A8}" : "\u26A0\uFE0F"
  const title = `${emoji} Price Lens Scrape Health: ${severity.toUpperCase()}`

  const body = alerts.map((a) => `**[${a.severity.toUpperCase()}]** ${a.message}`).join("\n")

  // Discord-compatible format (also works with many Slack webhooks)
  const payload = {
    content: title,
    embeds: [
      {
        title: "Scrape Health Alert",
        description: body,
        color: severity === "critical" ? 0xff0000 : 0xffa500,
        timestamp: new Date().toISOString(),
      },
    ],
  }

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}
