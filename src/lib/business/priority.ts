import { type BadgeKind } from "@/components/ui/badge"

/**
 * PRIORITY CONFIGURATION
 *
 * Centralized priority-related logic for the scraper scheduler.
 * All priority thresholds, staleness checks, and related utilities live here.
 */

/**
 * Priorities that are actively scheduled (must have non-null value in PRIORITY_REFRESH_HOURS).
 * NOTE: P1/P2 temporarily paused to reduce egress while over Supabase free-tier limit.
 * Restore to [5,4,3,2,1] once billing period resets (~20 Mar 2026).
 */
export const ACTIVE_PRIORITIES = [5, 4] as const

/** Default grace period before showing staleness warning (24 hours) */
export const DEFAULT_STALENESS_LENIENCE_HOURS = 24

/**
 * SCHEDULE CONFIGURATION
 *
 * Defines how often each priority level should be scraped.
 * The scheduler uses these thresholds to determine which products are "stale".
 *
 * Priority 5 (Premium): Daily - high-value products users care most about
 * Priority 4 (High): Every 2 days - important but less critical
 * Priority 3 (Medium): Every 3 days - moderate importance
 * Priority 2 (Low): Weekly - low priority, minimal tracking
 * Priority 1 (Minimal): Bi-weekly - rarely tracked
 * Priority 0: Never scheduled - excluded from tracking
 */
export const PRIORITY_REFRESH_HOURS: Record<number, number | null> = {
  5: 24, // Premium: every 1 day
  4: 48, // High: every 2 days
  3: 72, // Medium: every 3 days
  2: 168, // Low: every 7 days
  1: 336, // Minimal: every 14 days
  0: null, // Never scheduled
}

type PriorityConfig = {
  label: string
  description: string
  explanation: string
  period: string | null
  badgeKind: BadgeKind
  bgClass: string
}

export const PRIORITY_CONFIG: Record<string, PriorityConfig> = {
  null: {
    label: "?",
    description: "Unclassified",
    explanation: "Products that have not been classified yet",
    period: null,
    badgeKind: "gray",
    bgClass: "bg-neutral-500/70 border-neutral-500",
  },
  "0": {
    label: "0",
    description: "Niche",
    explanation: `Untracked`,
    period: null,
    badgeKind: "gray",
    bgClass: "bg-gray-800/70  border-gray-800",
  },
  "1": {
    label: "1",
    description: "Minor",
    explanation: `Tracked every ${formatHoursDuration(PRIORITY_REFRESH_HOURS[1] ?? 0)}`,
    period: formatHoursDuration(PRIORITY_REFRESH_HOURS[1] ?? 0),
    badgeKind: "destructive",
    bgClass: "bg-rose-600/70 border-rose-600",
  },
  "2": {
    label: "2",
    description: "Low",
    explanation: `Tracked every ${formatHoursDuration(PRIORITY_REFRESH_HOURS[2] ?? 0)}`,
    period: formatHoursDuration(PRIORITY_REFRESH_HOURS[2] ?? 0),
    badgeKind: "retail",
    bgClass: "bg-orange-600/70 border-orange-600",
  },
  "3": {
    label: "3",
    description: "Medium",
    explanation: `Tracked every ${formatHoursDuration(PRIORITY_REFRESH_HOURS[3] ?? 0)}`,
    period: formatHoursDuration(PRIORITY_REFRESH_HOURS[3] ?? 0),
    badgeKind: "warning",
    bgClass: "bg-amber-600/70 border-amber-600",
  },
  "4": {
    label: "4",
    description: "Important",
    explanation: `Tracked every ${formatHoursDuration(PRIORITY_REFRESH_HOURS[4] ?? 0)}`,
    period: formatHoursDuration(PRIORITY_REFRESH_HOURS[4] ?? 0),
    badgeKind: "sky",
    bgClass: "bg-sky-600/70 border-sky-600",
  },
  "5": {
    label: "5",
    description: "Essential",
    explanation: `Tracked every ${formatHoursDuration(PRIORITY_REFRESH_HOURS[5] ?? 0)}`,
    period: formatHoursDuration(PRIORITY_REFRESH_HOURS[5] ?? 0),
    badgeKind: "success",
    bgClass: "bg-emerald-700/70 border-emerald-700",
  },
}

export const PRODUCT_PRIORITY_LEVELS = [0, 1, 2, 3, 4, 5] as const
export type ProductPriorityLevel = (typeof PRODUCT_PRIORITY_LEVELS)[number]

export function formatThreshold(hours: number | null): string {
  if (hours === null) return "-"
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return days === 1 ? "1 day" : `${days} days`
}

export type PriceStalenessResult = {
  isStale: boolean
  hoursOverdue: number
  hoursSinceUpdate: number
  expectedRefreshHours: number | null
}

/**
 * Determines if a price is stale based on the product's priority and last update time.
 * A price is considered stale if it hasn't been refreshed within the expected window
 * for its priority level, plus a lenience buffer.
 *
 * @param updatedAt - ISO timestamp of last price update
 * @param priority - Product priority (0-5)
 * @param lenienceHours - Grace period before showing warning (default: 24 hours)
 */
export function getPriceStaleness(
  updatedAt: string | null,
  priority: number | null,
  lenienceHours: number = DEFAULT_STALENESS_LENIENCE_HOURS,
): PriceStalenessResult {
  // No tracking or priority 0 means we can't determine staleness
  if (!updatedAt || priority === null || priority === 0) {
    return { isStale: false, hoursOverdue: 0, hoursSinceUpdate: 0, expectedRefreshHours: null }
  }

  const thresholdHours = PRIORITY_REFRESH_HOURS[priority]
  if (!thresholdHours) {
    return { isStale: false, hoursOverdue: 0, hoursSinceUpdate: 0, expectedRefreshHours: null }
  }

  const effectiveThreshold = thresholdHours + lenienceHours
  const updated = new Date(updatedAt)
  const now = new Date()
  const hoursSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60)
  const hoursOverdue = Math.max(0, hoursSinceUpdate - effectiveThreshold)

  return {
    isStale: hoursSinceUpdate > effectiveThreshold,
    hoursOverdue,
    hoursSinceUpdate,
    expectedRefreshHours: thresholdHours,
  }
}

/**
 * Formats hours into a human-readable duration string.
 * Uses: hours -> days -> weeks -> months (only if >= 90 days)
 */
export function formatHoursDuration(hours: number): string {
  if (hours < 24) {
    const roundedHours = Math.round(hours)
    return `${roundedHours} hour${roundedHours !== 1 ? "s" : ""}`
  }

  const days = hours / 24

  if (days < 7) {
    const roundedDays = Math.round(days)
    return `${roundedDays} day${roundedDays !== 1 ? "s" : ""}`
  }

  if (days < 90) {
    const weeks = Math.round(days / 7)
    return `${weeks} week${weeks !== 1 ? "s" : ""}`
  }

  const months = Math.round(days / 30)
  return `${months} month${months !== 1 ? "s" : ""}`
}

/**
 * CAPACITY CALCULATOR
 *
 * Calculates the system's ability to keep up with scheduled scraping demands.
 * Used to monitor scheduler health and alert when capacity is insufficient.
 */

export type CapacityHealthStatus = "healthy" | "degraded" | "critical"

export type CapacityAnalysis = {
  status: CapacityHealthStatus
  requiredDailyScrapes: number
  availableDailyCapacity: number
  utilizationPercent: number
  deficit: number
  surplusPercent: number
  byPriority: Record<number, { products: number; dailyScrapes: number }>
  config: {
    batchSize: number
    maxBatches: number
    cronFrequencyMinutes: number
    runsPerDay: number
  }
}

/**
 * Calculates the required daily scrapes based on product counts by priority.
 * Each priority has a refresh threshold (hours), so daily scrapes = products / (threshold / 24)
 */
export function calculateRequiredDailyScrapes(productCountsByPriority: Record<number, number>): {
  total: number
  byPriority: Record<number, { products: number; dailyScrapes: number }>
} {
  const byPriority: Record<number, { products: number; dailyScrapes: number }> = {}
  let total = 0

  for (const priority of ACTIVE_PRIORITIES) {
    const productCount = productCountsByPriority[priority] ?? 0
    const refreshHours = PRIORITY_REFRESH_HOURS[priority]

    if (refreshHours && productCount > 0) {
      const dailyScrapes = Math.ceil(productCount / (refreshHours / 24))
      byPriority[priority] = { products: productCount, dailyScrapes }
      total += dailyScrapes
    } else {
      byPriority[priority] = { products: productCount, dailyScrapes: 0 }
    }
  }

  return { total, byPriority }
}

/**
 * Calculates available daily capacity based on scheduler configuration.
 */
export function calculateAvailableDailyCapacity(
  batchSize: number,
  maxBatches: number,
  cronFrequencyMinutes: number,
): number {
  const runsPerDay = (24 * 60) / cronFrequencyMinutes
  return batchSize * maxBatches * runsPerDay
}

/**
 * Analyzes scheduler capacity and returns health status.
 *
 * @param productCountsByPriority - Map of priority level to product count
 * @param batchSize - Products per batch (WORKER_BATCH_SIZE)
 * @param maxBatches - Batches per run (MAX_BATCHES_PER_RUN)
 * @param cronFrequencyMinutes - Cron frequency (CRON_FREQUENCY_MINUTES)
 */
export function analyzeSchedulerCapacity(
  productCountsByPriority: Record<number, number>,
  batchSize: number,
  maxBatches: number,
  cronFrequencyMinutes: number,
): CapacityAnalysis {
  const { total: requiredDailyScrapes, byPriority } = calculateRequiredDailyScrapes(productCountsByPriority)
  const runsPerDay = (24 * 60) / cronFrequencyMinutes
  const availableDailyCapacity = batchSize * maxBatches * runsPerDay

  const utilizationPercent = availableDailyCapacity > 0 ? (requiredDailyScrapes / availableDailyCapacity) * 100 : 0
  const deficit = Math.max(0, requiredDailyScrapes - availableDailyCapacity)
  const surplusPercent =
    availableDailyCapacity > 0 ? ((availableDailyCapacity - requiredDailyScrapes) / availableDailyCapacity) * 100 : 0

  let status: CapacityHealthStatus
  if (utilizationPercent <= 80) {
    status = "healthy"
  } else if (utilizationPercent <= 100) {
    status = "degraded"
  } else {
    status = "critical"
  }

  return {
    status,
    requiredDailyScrapes,
    availableDailyCapacity,
    utilizationPercent: Math.round(utilizationPercent * 10) / 10,
    deficit,
    surplusPercent: Math.round(surplusPercent * 10) / 10,
    byPriority,
    config: {
      batchSize,
      maxBatches,
      cronFrequencyMinutes,
      runsPerDay,
    },
  }
}
