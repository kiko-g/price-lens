export type ParamType = "string" | "number" | "boolean" | "select"

export interface RouteParam {
  name: string
  type: ParamType
  default: string | number | boolean
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
}

export interface TestableRoute {
  path: string
  name: string
  category: "core" | "products" | "prices" | "categories" | "admin"
  description?: string
  pathParams?: Record<string, string>
  queryParams?: RouteParam[]
}

function formatDateToday(): string {
  return new Date().toISOString().slice(0, 10)
}

const SORT_OPTIONS = [
  { value: "a-z", label: "A to Z" },
  { value: "z-a", label: "Z to A" },
  { value: "price-low-high", label: "Cheapest" },
  { value: "price-high-low", label: "Expensive" },
  { value: "created-newest", label: "Newest First" },
  { value: "created-oldest", label: "Oldest First" },
  { value: "updated-newest", label: "Recently Updated" },
  { value: "updated-oldest", label: "Least Recently" },
  { value: "only-nulls", label: "Invalid products" },
]

const SEARCH_TYPE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "name", label: "Name" },
  { value: "brand", label: "Brand" },
  { value: "url", label: "URL" },
  { value: "category", label: "Category" },
]

const FORMAT_OPTIONS = [
  { value: "tree", label: "Tree" },
  { value: "flat", label: "Flat" },
]

const SCHEDULE_ACTION_OPTIONS = [
  { value: "overview", label: "Overview" },
  { value: "timeline", label: "Timeline" },
]

export const TESTABLE_ROUTES: TestableRoute[] = [
  // Core
  {
    path: "/api",
    name: "Health Check",
    category: "core",
    description: "Basic API health check",
  },

  // Products
  {
    path: "/api/store_products",
    name: "Store Products Search",
    category: "products",
    description: "Search store-specific products",
    queryParams: [
      { name: "page", type: "number", default: 1, placeholder: "Page" },
      { name: "limit", type: "number", default: 36, placeholder: "Limit" },
      { name: "origin", type: "number", default: 1, placeholder: "Origin (1-3)" },
      { name: "sort", type: "select", default: "updated-newest", options: SORT_OPTIONS },
      { name: "searchType", type: "select", default: "any", options: SEARCH_TYPE_OPTIONS },
      { name: "q", type: "string", default: "", placeholder: "Search query" },
      { name: "orderByPriority", type: "boolean", default: true },
      { name: "onlyDiscounted", type: "boolean", default: false },
    ],
  },
  {
    path: "/api/store_products/[id]",
    name: "Store Product by ID",
    category: "products",
    description: "Single store product",
    pathParams: { id: "16023" },
  },
  {
    path: "/api/store_products/[id]/cross-store",
    name: "Cross-Store Products",
    category: "products",
    description: "Same product across stores",
    pathParams: { id: "16023" },
    queryParams: [{ name: "limit", type: "number", default: 10, placeholder: "Limit" }],
  },
  {
    path: "/api/store_products/[id]/related",
    name: "Related Products",
    category: "products",
    description: "Related store products",
    pathParams: { id: "16023" },
    queryParams: [{ name: "limit", type: "number", default: 10, placeholder: "Limit" }],
  },

  // Prices
  {
    path: "/api/prices",
    name: "Paginated Prices",
    category: "prices",
    description: "Fetch paginated price data",
    queryParams: [
      { name: "page", type: "number", default: 1, placeholder: "Page" },
      { name: "limit", type: "number", default: 50, placeholder: "Limit" },
    ],
  },
  {
    path: "/api/prices/[store_product_id]",
    name: "Prices for Product",
    category: "prices",
    description: "Price points for a product",
    pathParams: { store_product_id: "16023" },
    queryParams: [{ name: "analytics", type: "boolean", default: false }],
  },

  // Categories
  {
    path: "/api/categories",
    name: "Categories List",
    category: "categories",
    description: "All categories",
    queryParams: [
      { name: "category_1", type: "string", default: "", placeholder: "Category 1" },
      { name: "category_2", type: "string", default: "", placeholder: "Category 2" },
      { name: "category_3", type: "string", default: "", placeholder: "Category 3" },
    ],
  },
  {
    path: "/api/categories/canonical",
    name: "Canonical Categories",
    category: "categories",
    description: "Normalized category list",
    queryParams: [{ name: "format", type: "select", default: "tree", options: FORMAT_OPTIONS }],
  },
  {
    path: "/api/categories/hierarchy",
    name: "Category Hierarchy",
    category: "categories",
    description: "Hierarchical category tree",
    queryParams: [
      { name: "category", type: "string", default: "", placeholder: "Category" },
      { name: "category_2", type: "string", default: "", placeholder: "Category 2" },
    ],
  },

  // Admin
  {
    path: "/api/admin/overview",
    name: "Admin Overview",
    category: "admin",
    description: "Dashboard KPIs and metrics",
  },
  {
    path: "/api/admin/schedule",
    name: "Schedule Overview",
    category: "admin",
    description: "Scraping schedule data",
    queryParams: [
      { name: "action", type: "select", default: "overview", options: SCHEDULE_ACTION_OPTIONS },
      { name: "date", type: "string", default: formatDateToday(), placeholder: "YYYY-MM-DD" },
    ],
  },
  {
    path: "/api/admin/categories/stats",
    name: "Category Stats",
    category: "admin",
    description: "Category mapping coverage",
    queryParams: [{ name: "refresh", type: "boolean", default: false }],
  },
  {
    path: "/api/admin/categories/canonical",
    name: "Admin Canonical Categories",
    category: "admin",
    description: "Canonical categories (admin)",
    queryParams: [{ name: "format", type: "select", default: "tree", options: FORMAT_OPTIONS }],
  },
  {
    path: "/api/admin/categories/canonical/[id]",
    name: "Canonical Category by ID",
    category: "admin",
    description: "Single canonical category",
    pathParams: { id: "1" },
  },
  {
    path: "/api/admin/categories/mappings",
    name: "Category Mappings",
    category: "admin",
    description: "Store to canonical mappings",
    queryParams: [
      { name: "limit", type: "number", default: 50, placeholder: "Limit" },
      { name: "offset", type: "number", default: 0, placeholder: "Offset" },
    ],
  },
  {
    path: "/api/admin/categories/mappings/[id]",
    name: "Category Mapping by ID",
    category: "admin",
    description: "Single category mapping",
    pathParams: { id: "1" },
  },
  {
    path: "/api/admin/categories/tuples",
    name: "Category Tuples",
    category: "admin",
    description: "Store category tuples",
    queryParams: [
      { name: "limit", type: "number", default: 50, placeholder: "Limit" },
      { name: "offset", type: "number", default: 0, placeholder: "Offset" },
    ],
  },
  {
    path: "/api/admin/prices/duplicates",
    name: "Price Duplicates",
    category: "admin",
    description: "Duplicate price point stats",
  },
  {
    path: "/api/admin/debug",
    name: "Debug Endpoint",
    category: "admin",
    description: "Debug data by priority",
  },
  {
    path: "/api/admin/discovery",
    name: "Discovery Status",
    category: "admin",
    description: "Sitemap discovery status",
    queryParams: [
      { name: "action", type: "select", default: "status", options: [{ value: "status", label: "Status" }] },
    ],
  },
  {
    path: "/api/admin/bulk-scrape",
    name: "Bulk Scrape Jobs",
    category: "admin",
    description: "List active bulk scrape jobs",
    queryParams: [{ name: "action", type: "select", default: "jobs", options: [{ value: "jobs", label: "Jobs" }] }],
  },
  {
    path: "/api/admin/scrape/ai-priority",
    name: "AI Priority Classifier",
    category: "admin",
    description: "Fetch unprioritized products",
    queryParams: [{ name: "batchSize", type: "number", default: 10, placeholder: "Batch size" }],
  },
  {
    path: "/api/admin/bulk-scrape/[jobId]",
    name: "Bulk Scrape Job Status",
    category: "admin",
    description: "Single bulk scrape job (404 expected for placeholder jobId)",
    pathParams: { jobId: "test" },
  },
]

export interface ExcludedRoute {
  path: string
  reason: string
}

export const EXCLUDED_ROUTES: ExcludedRoute[] = [
  { path: "/api/admin/cron", reason: "Triggers QStash scrape jobs" },
  { path: "/api/favorites", reason: "Auth required" },
  { path: "/api/favorites/count/[user_id]", reason: "Auth required" },
  { path: "/api/favorites/check/[store_product_id]", reason: "Auth required" },
  { path: "/api/scrape/scheduler", reason: "Cron worker" },
  { path: "/api/scrape/batch-worker", reason: "Cron worker" },
  { path: "/api/scrape/worker", reason: "Cron worker" },
  { path: "/api/store_products/bulk-priority", reason: "Dev only" },
  { path: "/api/og/products", reason: "OG image generation" },
]

export const CATEGORY_ORDER: TestableRoute["category"][] = ["core", "products", "prices", "categories", "admin"]

export const CATEGORY_LABELS: Record<TestableRoute["category"], string> = {
  core: "Core",
  products: "Products",
  prices: "Prices",
  categories: "Categories",
  admin: "Admin",
}

export function buildTestUrl(route: TestableRoute, overrides?: Record<string, string | number | boolean>): string {
  let url = route.path

  const pathParams = { ...route.pathParams, ...pickPathOverrides(overrides, route) }
  for (const [key, value] of Object.entries(pathParams)) {
    url = url.replace(`[${key}]`, String(value))
  }

  const queryParams = mergeQueryParams(route.queryParams ?? [], overrides)
  if (queryParams.length > 0) {
    const search = new URLSearchParams()
    for (const { name, value } of queryParams) {
      if (value !== "" && value !== undefined) {
        search.set(name, String(value))
      }
    }
    const qs = search.toString()
    if (qs) url += `?${qs}`
  }

  return url
}

function pickPathOverrides(
  overrides: Record<string, string | number | boolean> | undefined,
  route: TestableRoute,
): Record<string, string> {
  if (!overrides) return {}
  const pathParamNames = Object.keys(route.pathParams ?? {})
  const result: Record<string, string> = {}
  for (const name of pathParamNames) {
    if (name in overrides) result[name] = String(overrides[name])
  }
  return result
}

function mergeQueryParams(
  params: RouteParam[],
  overrides: Record<string, string | number | boolean> | undefined,
): { name: string; value: string | number | boolean }[] {
  return params.map((p) => {
    const value = overrides && p.name in overrides ? overrides[p.name] : p.default
    return { name: p.name, value }
  })
}
