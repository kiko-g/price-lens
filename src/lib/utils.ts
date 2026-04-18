import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDateTime } from "@/lib/i18n/format"
import type { Locale } from "@/i18n/config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function serializeArray(arr: number[]): string | null {
  if (arr.length === 0) return null
  return arr.join(",")
}

export function isValidJson(json: string) {
  try {
    JSON.parse(json)
    return true
  } catch (error) {
    console.warn(error)
    return false
  }
}

export function now() {
  return new Date().toISOString().replace("Z", "+00:00")
}

export function formatTimestamptz(timestamptz: string | null, locale?: Locale | string) {
  if (!timestamptz) return ""
  return formatDateTime(new Date(timestamptz), locale)
}

export function getDaysBetweenDates(startDate: Date, endDate: Date) {
  const timeDiff = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
}

export function elapsedMsToTimeStr(elapsedMs: number) {
  const hours = Math.floor(elapsedMs / 3600000)
  const minutes = Math.floor((elapsedMs % 3600000) / 60000)
  const seconds = Math.floor((elapsedMs % 60000) / 1000)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

export function getCenteredArray(length: number, page: number, rightmostBoundary: number | null = null) {
  const halfLength = Math.floor(length / 2)
  let start = Math.max(1, page - halfLength)

  if (page <= halfLength) {
    start = 1 // near the start
  }

  if (rightmostBoundary && start + length > rightmostBoundary) {
    start = Math.max(1, rightmostBoundary - length + 1) // near the end
  }

  const array = Array.from({ length }, (_, i) => start + i)
  return array
}
