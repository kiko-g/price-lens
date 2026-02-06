"use client"

import { useState, useCallback, useEffect } from "react"
import { TESTABLE_ROUTES, type TestableRoute } from "@/lib/performance/routes"

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
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<TestProgress>({
    currentRoute: null,
    currentIteration: 0,
    totalRoutes: 0,
    completedRoutes: 0,
  })

  // load from localStorage on mount
  useEffect(() => {
    setResults(loadFromStorage())
  }, [])

  const runSingleTest = useCallback(async (route: TestableRoute) => {
    setIsRunning(true)
    setProgress({
      currentRoute: route.path,
      currentIteration: 0,
      totalRoutes: 1,
      completedRoutes: 0,
    })

    try {
      const metrics = await runTestForRoute(route.path)
      setResults((prev) => {
        const updated = { ...prev, [route.path]: metrics }
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
  }, [])

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
      setProgress((prev) => ({
        ...prev,
        currentRoute: route.path,
        completedRoutes: i,
      }))

      const metrics = await runTestForRoute(route.path)
      newResults[route.path] = metrics

      // save after each route in case user navigates away
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
  }, [])

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
    isRunning,
    progress,
    runSingleTest,
    runAllTests,
    clearResults,
    getLastTestTime,
    routes: TESTABLE_ROUTES,
  }
}
