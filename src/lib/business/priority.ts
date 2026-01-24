import { type BadgeKind } from "@/components/ui/badge"

/**
 * PRIORITY CONFIGURATION
 *
 * Centralized priority-related logic for the scraper scheduler.
 * All priority thresholds, staleness checks, and related utilities live here.
 */

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
  badgeKind: BadgeKind
  bgClass: string
}

export const PRIORITY_CONFIG: Record<string, PriorityConfig> = {
  null: {
    label: "?",
    description: "Unset",
    badgeKind: "gray",
    bgClass: "bg-neutral-500/70 border-neutral-500",
  },
  "0": {
    label: "0",
    description: "Useless",
    badgeKind: "gray",
    bgClass: "bg-gray-800/70  border-gray-800",
  },
  "1": {
    label: "1",
    description: "Minor",
    badgeKind: "destructive",
    bgClass: "bg-rose-600/70 border-rose-600",
  },
  "2": {
    label: "2",
    description: "Low",
    badgeKind: "retail",
    bgClass: "bg-orange-600/70 border-orange-600",
  },
  "3": {
    label: "3",
    description: "Medium",
    badgeKind: "warning",
    bgClass: "bg-amber-600/70 border-amber-600",
  },
  "4": {
    label: "4",
    description: "Important",
    badgeKind: "sky",
    bgClass: "bg-sky-600/70 border-sky-600",
  },
  "5": {
    label: "5",
    description: "Essential",
    badgeKind: "success",
    bgClass: "bg-emerald-700/70 border-emerald-700",
  },
}

/** Priorities that are actively scheduled (must have non-null value in PRIORITY_REFRESH_HOURS) */
export const ACTIVE_PRIORITIES = [5, 4, 3, 2] as const

/** Default grace period before showing staleness warning (24 hours) */
export const DEFAULT_STALENESS_LENIENCE_HOURS = 24

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
