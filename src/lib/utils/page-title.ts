import { SORT_LABELS, STORE_NAMES } from "@/types/business"

export interface PageTitleFilters {
  query?: string
  sortBy?: string
  origins?: number[]
  category?: string
  onlyDiscounted?: boolean
}

/**
 * Builds a dynamic page title based on active filters.
 * Priority: search query > sort (non-default) > store origin > category > discounted
 * Max 2 parts to keep title under 60 characters for SEO.
 */
export function buildPageTitle(filters: PageTitleFilters): string {
  const parts: string[] = []

  // Priority 1: Search query
  if (filters.query) parts.push(`"${filters.query}"`)

  // Priority 2: Sort (only if non-default)
  if (filters.sortBy && filters.sortBy !== "a-z" && SORT_LABELS[filters.sortBy]) {
    parts.push(SORT_LABELS[filters.sortBy])
  }

  // Priority 3: Store origin
  if (parts.length < 2) {
    if (filters.origins?.length === 1) parts.push(STORE_NAMES[filters.origins[0]])
    else if ((filters.origins?.length ?? 0) > 1) parts.push(`${filters.origins!.length} Stores`)
  }

  // Priority 4: Category (only if no search query to avoid cluttering)
  if (filters.category && !filters.query && parts.length < 2) {
    parts.push(filters.category)
  }

  // Priority 5: Discounted flag
  if (filters.onlyDiscounted && parts.length < 2) {
    parts.push("Discounted")
  }

  const suffix = parts.slice(0, 2).join(" - ")
  return suffix ? `${suffix} Products` : "Products"
}
