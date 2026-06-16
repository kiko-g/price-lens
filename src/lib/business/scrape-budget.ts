import { CRON_FREQUENCY_MINUTES } from "@/lib/qstash/client"

/** Daily scrape slots — tune against Vercel fluid-compute bill (see ROADMAP §2). */
export const DAILY_SCRAPE_BUDGET = 28_000

export const LANE_SHARES = {
  sla: 0.8,
  healing: 0.1,
  longTail: 0.1,
} as const

export type ScrapeLane = "sla" | "healing" | "long_tail"

export type LaneQuotas = {
  runsPerDay: number
  perRunBudget: number
  sla: number
  healing: number
  longTail: number
}

export function getSchedulerRunsPerDay(cronFrequencyMinutes: number = CRON_FREQUENCY_MINUTES): number {
  return (24 * 60) / cronFrequencyMinutes
}

/** Per scheduler tick (every 30 min → 48 runs/day). */
export function getLaneQuotasPerRun(cronFrequencyMinutes: number = CRON_FREQUENCY_MINUTES): LaneQuotas {
  const runsPerDay = getSchedulerRunsPerDay(cronFrequencyMinutes)
  const perRunBudget = Math.floor(DAILY_SCRAPE_BUDGET / runsPerDay)

  return {
    runsPerDay,
    perRunBudget,
    sla: Math.floor(perRunBudget * LANE_SHARES.sla),
    healing: Math.floor(perRunBudget * LANE_SHARES.healing),
    longTail: Math.floor(perRunBudget * LANE_SHARES.longTail),
  }
}
