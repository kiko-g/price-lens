"use client"

import { useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PrioritySource } from "@/types"
import { SupermarketChain, type StoreProductsQueryParams } from "@/hooks/useStoreProducts"
import { type SearchType, type SortByType, DEFAULT_BROWSE_SORT } from "@/types/business"
import { buildPageTitle } from "@/lib/business/page-title"

export const FILTER_DEBOUNCE_MS = 500

/**
 * Single source of truth for URL filter parameters.
 * - `key`: The URL search param name
 * - `default`: The default value (omitted from URL when matched)
 */
export const FILTER_CONFIG = {
  page: { key: "page", default: 1 },
  sortBy: { key: "sort", default: DEFAULT_BROWSE_SORT },
  origin: { key: "origin", default: "" },
  searchType: { key: "t", default: "any" },
  query: { key: "q", default: "" },
  orderByPriority: { key: "priority_order", default: false },
  onlyAvailable: { key: "available", default: true },
  onlyDiscounted: { key: "discounted", default: false },
  priority: { key: "priority", default: "" },
  source: { key: "source", default: "" },
  category: { key: "category", default: "" },
  priceMin: { key: "price_min", default: "" },
  priceMax: { key: "price_max", default: "" },
  brand: { key: "brand", default: "" },
} as const

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function toCategorySlug(id: number, name: string): string {
  return `${id}-${toSlug(name)}`
}

export function parseCategoryId(slug: string): number | null {
  if (!slug) return null
  const match = slug.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

export function parseArrayParam(param: string | null): number[] {
  if (!param) return []
  return param
    .split(",")
    .map((v) => parseInt(v, 10))
    .filter((v) => !isNaN(v))
}

const URL_KEY_DEFAULTS = Object.fromEntries(
  Object.values(FILTER_CONFIG).map(({ key, default: def }) => [key, def]),
) as Record<string, string | number | boolean>

export function useUrlState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlState = useMemo(
    () => ({
      page: parseInt(searchParams.get(FILTER_CONFIG.page.key) ?? String(FILTER_CONFIG.page.default), 10),
      sortBy: (searchParams.get(FILTER_CONFIG.sortBy.key) ?? FILTER_CONFIG.sortBy.default) as SortByType,
      origin: searchParams.get(FILTER_CONFIG.origin.key) ?? FILTER_CONFIG.origin.default,
      searchType: (searchParams.get(FILTER_CONFIG.searchType.key) ?? FILTER_CONFIG.searchType.default) as SearchType,
      query: searchParams.get(FILTER_CONFIG.query.key) ?? FILTER_CONFIG.query.default,
      orderByPriority: searchParams.get(FILTER_CONFIG.orderByPriority.key) === "true",
      onlyAvailable: searchParams.get(FILTER_CONFIG.onlyAvailable.key) !== "false",
      onlyDiscounted: searchParams.get(FILTER_CONFIG.onlyDiscounted.key) === "true",
      priority: searchParams.get(FILTER_CONFIG.priority.key) ?? FILTER_CONFIG.priority.default,
      source: searchParams.get(FILTER_CONFIG.source.key) ?? FILTER_CONFIG.source.default,
      category: searchParams.get(FILTER_CONFIG.category.key) ?? FILTER_CONFIG.category.default,
      priceMin: searchParams.get(FILTER_CONFIG.priceMin.key) ?? FILTER_CONFIG.priceMin.default,
      priceMax: searchParams.get(FILTER_CONFIG.priceMax.key) ?? FILTER_CONFIG.priceMax.default,
      brand: searchParams.get(FILTER_CONFIG.brand.key) ?? FILTER_CONFIG.brand.default,
    }),
    [searchParams],
  )

  const updateUrl = useCallback(
    (updates: Record<string, string | number | boolean | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        const defaultValue = URL_KEY_DEFAULTS[key]
        const shouldRemove = value === undefined || value === null || value === defaultValue

        if (shouldRemove) {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      }

      const queryString = params.toString()
      router.push(queryString ? `?${queryString}` : window.location.pathname, { scroll: false })
    },
    [searchParams, router],
  )

  const pageTitle = useMemo(
    () =>
      buildPageTitle({
        query: urlState.query,
        sortBy: urlState.sortBy,
        origins: parseArrayParam(urlState.origin),
        onlyDiscounted: urlState.onlyDiscounted,
      }),
    [urlState.query, urlState.sortBy, urlState.origin, urlState.onlyDiscounted],
  )

  return { urlState, updateUrl, pageTitle }
}

export function buildQueryParams(
  urlState: ReturnType<typeof useUrlState>["urlState"],
  limit: number,
): StoreProductsQueryParams {
  const params: StoreProductsQueryParams = {
    pagination: { page: urlState.page, limit },
    sort: {
      sortBy: urlState.sortBy,
      prioritizeByPriority: urlState.orderByPriority,
    },
    flags: {
      excludeEmptyNames: true,
      onlyAvailable: urlState.onlyAvailable,
      onlyDiscounted: urlState.onlyDiscounted,
    },
  }

  if (urlState.query) {
    params.search = { query: urlState.query, searchIn: urlState.searchType }
  }

  if (urlState.origin) {
    const originIds = urlState.origin
      .split(",")
      .map((v) => parseInt(v, 10))
      .filter((v) => !isNaN(v)) as SupermarketChain[]

    if (originIds.length === 1) {
      params.origin = { originIds: originIds[0] }
    } else if (originIds.length > 1) {
      params.origin = { originIds }
    }
  }

  if (urlState.priority) {
    const priorityValues = urlState.priority
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => !isNaN(v) && v >= 0 && v <= 5)

    if (priorityValues.length > 0) {
      params.priority = { values: priorityValues }
    }
  }

  if (urlState.source) {
    const sourceValues = urlState.source
      .split(",")
      .map((v) => v.trim())
      .filter((v): v is PrioritySource => v === "ai" || v === "manual")

    if (sourceValues.length > 0) {
      params.source = { values: sourceValues }
    }
  }

  if (urlState.category) {
    const categoryId = parseCategoryId(urlState.category)
    if (categoryId && categoryId > 0) {
      params.canonicalCategory = { categoryId }
    }
  }

  const priceMin = urlState.priceMin ? parseFloat(urlState.priceMin) : undefined
  const priceMax = urlState.priceMax ? parseFloat(urlState.priceMax) : undefined
  if ((priceMin != null && !isNaN(priceMin)) || (priceMax != null && !isNaN(priceMax))) {
    params.priceRange = {
      ...(priceMin != null && !isNaN(priceMin) ? { min: priceMin } : {}),
      ...(priceMax != null && !isNaN(priceMax) ? { max: priceMax } : {}),
    }
  }

  if (urlState.brand.trim()) {
    const names = urlState.brand
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (names.length > 0) {
      params.brand = { names }
    }
  }

  return params
}
