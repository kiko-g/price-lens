export interface PriorityStats {
  priority: number | null
  total: number
  fresh: number
  staleActionable: number
  unavailable: number
  neverScraped: number
  stalenessThresholdHours: number | null
}

export interface CostEstimate {
  dailyScrapes: number
  monthlyScrapes: number
  costPerScrape: number
  estimatedMonthlyCost: number
}

export type CapacityHealthStatus = "healthy" | "degraded" | "critical"

export interface CapacityAnalysis {
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
  totalStaleActionable: number
  totalUnavailable: number
  totalDueForScrape: number
  totalPhantomScraped: number
  costEstimate: CostEstimate
  capacity: CapacityAnalysis
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
    cronFrequencyMinutes: number
    activePriorities: number[]
  }
  dynamicBatching: {
    backlogSize: number
    dynamicMaxBatches: number
    batchesUsed: number
    reason: "critical-capacity" | "small-backlog" | "scaled"
  }
  capacity: CapacityAnalysis
}
