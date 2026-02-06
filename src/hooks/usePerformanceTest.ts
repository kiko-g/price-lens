"use client"

import { useState, useCallback, useEffect } from "react"
import { TESTABLE_ROUTES, buildTestUrl, type TestableRoute } from "@/lib/performance/routes"

const STORAGE_KEY = "api-performance-metrics"
const TEST_ITERATIONS = 5

export interface RouteMetrics {
  first: number
  avg: number
  min: number
  max: number
  times: number[]
  timestamp: string
  status: number
  error?: string
}

export type PerformanceResults = Record<string, RouteMetrics>

export type ParamOverrides = Record<string, Record<string, string | number | boolean>>

interface TestProgress {
  currentRoute: string | null
  currentIteration: number
  totalRoutes: number
  completedRoutes: number
}

async function measureRequest(path: string): Promise<{ duration: number; status: number; error?: string }> {
  const start = performance.now()
  try {
    const response = await fetch(path, {
      method: "GET",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
    const duration = Math.round(performance.now() - start)
    return { duration, status: response.status }
  } catch (error) {
    const duration = Math.round(performance.now() - start)
    return {
      duration,
      status: 0,
      error: error instanceof Error ? error.message : "Request failed",
    }
  }
}

async function runTestForRoute(path: string): Promise<RouteMetrics> {
  const times: number[] = []
  let lastStatus = 0
  let lastError: string | undefined

  for (let i = 0; i < TEST_ITERATIONS; i++) {
    const result = await measureRequest(path)
    times.push(result.duration)
    lastStatus = result.status
    if (result.error) lastError = result.error
  }

  return {
    first: times[0],
    avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    min: Math.min(...times),
    max: Math.max(...times),
    times,
    timestamp: new Date().toISOString(),
    status: lastStatus,
    error: lastError,
  }
}

function loadFromStorage(): PerformanceResults {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveToStorage(results: PerformanceResults): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
  } catch {
    console.warn("Failed to save performance results to localStorage")
  }
}

export function usePerformanceTest() {
  const [results, setResults] = useState<PerformanceResults>({})
  const [paramOverrides, setParamOverrides] = useState<ParamOverrides>({})
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<TestProgress>({
    currentRoute: null,
    currentIteration: 0,
    totalRoutes: 0,
    completedRoutes: 0,
  })

  useEffect(() => {
    setResults(loadFromStorage())
  }, [])

  const getOverridesForRoute = useCallback(
    (route: TestableRoute): Record<string, string | number | boolean> => {
      return paramOverrides[route.path] ?? {}
    },
    [paramOverrides],
  )

  const updateParamOverride = useCallback(
    (routePath: string, overrides: Record<string, string | number | boolean>) => {
      setParamOverrides((prev) => ({
        ...prev,
        [routePath]: { ...(prev[routePath] ?? {}), ...overrides },
      }))
    },
    [],
  )

  const resolveUrl = useCallback(
    (route: TestableRoute): string => {
      return buildTestUrl(route, getOverridesForRoute(route))
    },
    [getOverridesForRoute],
  )

  const runSingleTest = useCallback(
    async (route: TestableRoute, overrides?: Record<string, string | number | boolean>) => {
      const url = buildTestUrl(route, overrides ?? getOverridesForRoute(route))
      setIsRunning(true)
      setProgress({
        currentRoute: url,
        currentIteration: 0,
        totalRoutes: 1,
        completedRoutes: 0,
      })

      try {
        const metrics = await runTestForRoute(url)
        setResults((prev) => {
          const updated = { ...prev, [url]: metrics }
          saveToStorage(updated)
          return updated
        })
      } finally {
        setIsRunning(false)
        setProgress({
          currentRoute: null,
          currentIteration: 0,
          totalRoutes: 0,
          completedRoutes: 0,
        })
      }
    },
    [getOverridesForRoute],
  )

  const runAllTests = useCallback(async () => {
    setIsRunning(true)
    const routes = TESTABLE_ROUTES
    setProgress({
      currentRoute: null,
      currentIteration: 0,
      totalRoutes: routes.length,
      completedRoutes: 0,
    })

    const newResults: PerformanceResults = {}

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      const url = buildTestUrl(route, paramOverrides[route.path])
      setProgress((prev) => ({
        ...prev,
        currentRoute: url,
        completedRoutes: i,
      }))

      const metrics = await runTestForRoute(url)
      newResults[url] = metrics

      setResults((prev) => {
        const updated = { ...prev, ...newResults }
        saveToStorage(updated)
        return updated
      })
    }

    setIsRunning(false)
    setProgress({
      currentRoute: null,
      currentIteration: 0,
      totalRoutes: 0,
      completedRoutes: routes.length,
    })
  }, [paramOverrides])

  const clearResults = useCallback(() => {
    setResults({})
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const getLastTestTime = useCallback((): string | null => {
    const timestamps = Object.values(results)
      .map((r) => r.timestamp)
      .filter(Boolean)
    if (timestamps.length === 0) return null
    return timestamps.sort().pop() || null
  }, [results])

  return {
    results,
    paramOverrides,
    updateParamOverride,
    isRunning,
    progress,
    runSingleTest,
    runAllTests,
    clearResults,
    getLastTestTime,
    resolveUrl,
    routes: TESTABLE_ROUTES,
  }
}
