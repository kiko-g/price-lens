export interface PriorityStats {
  priority: number | null
  total: number
  fresh: number // available=true AND recently scraped
  staleActionable: number // available=true AND needs scraping (we can fix this)
  unavailable: number // available=false (not our problem)
  neverScraped: number // updated_at IS NULL (informational, overlaps with other categories)
  stalenessThresholdHours: number | null
}

export interface CostEstimate {
  dailyScrapes: number
  monthlyScrapes: number
  costPerScrape: number
  estimatedMonthlyCost: number
}

export interface ScheduleOverview {
  cronSchedule: string
  cronDescription: string
  cronFrequencyMinutes: number
  runsPerHour: number
  nextRunEstimate: string | null
  activePriorities: number[]
  priorityStats: PriorityStats[]
  totalProducts: number
  totalTracked: number
  totalStaleActionable: number // Products that need scraping and are available
  totalUnavailable: number // Products that are unavailable (can't be scraped)
  totalDueForScrape: number
  totalPhantomScraped: number // Products that appear scraped (have updated_at) but have no price records
  costEstimate: CostEstimate
}

export interface TimelineProduct {
  id: number
  name: string | null
  priority: number
  origin_id: number | null
  updated_at: string | null
  staleAt: string | null
  hoursUntilStale: number | null
  isStale: boolean
}

export interface TimelineData {
  date: string
  hourlyBuckets: {
    hour: number
    products: TimelineProduct[]
  }[]
}

export interface StaleBreakdown {
  buckets: {
    label: string
    min: number | null
    max: number | null
    count: number
    byPriority: Record<number, number>
  }[]
}

export interface ActivityData {
  windows: {
    label: string
    count: number
    byPriority: Record<number, number>
  }[]
  scrapesPerHour: number
}

export type StalenessStatus = "stale-actionable" | "never-scraped" | "fresh" | "unavailable" | "phantom-scraped"

export interface ProductsByStalenessResponse {
  data: import("@/types").StoreProduct[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface SchedulerTestResult {
  dryRun: boolean
  message: string
  scheduled: number
  wouldSchedule: number
  batches: number
  byPriority: Record<number, number>
  batchWorkerUrl: string
  hasQstashToken: boolean
  nodeEnv: string
  duration: number
  sampleProducts: {
    id: number
    name: string
    priority: number
    urgencyScore: string
    hoursOverdue: string
  }[]
  config: {
    batchSize: number
    maxBatches: number
    activePriorities: number[]
  }
}
