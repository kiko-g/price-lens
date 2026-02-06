export interface TestableRoute {
  path: string
  name: string
  category: "core" | "products" | "prices" | "categories" | "admin"
  description?: string
}

export const TESTABLE_ROUTES: TestableRoute[] = [
  // Core
  { path: "/api", name: "Health Check", category: "core", description: "Basic API health check" },

  // Products
  { path: "/api/products", name: "Search Products", category: "products", description: "Product search endpoint" },
  {
    path: "/api/products/shallow",
    name: "All Products (Shallow)",
    category: "products",
    description: "List all products without full details",
  },
  {
    path: "/api/products/showcase",
    name: "Homepage Showcase",
    category: "products",
    description: "Batch fetch for homepage",
  },
  {
    path: "/api/store_products",
    name: "Store Products Search",
    category: "products",
    description: "Search store-specific products",
  },

  // Prices
  { path: "/api/prices", name: "Paginated Prices", category: "prices", description: "Fetch paginated price data" },

  // Categories
  { path: "/api/categories", name: "Categories List", category: "categories", description: "All categories" },
  {
    path: "/api/categories/canonical",
    name: "Canonical Categories",
    category: "categories",
    description: "Normalized category list",
  },
  {
    path: "/api/categories/hierarchy",
    name: "Category Hierarchy",
    category: "categories",
    description: "Hierarchical category tree",
  },

  // Store Products
  {
    path: "/api/store_products",
    name: "Store Products",
    category: "products",
    description: "Store products with filters",
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
  },
  {
    path: "/api/admin/categories/stats",
    name: "Category Stats",
    category: "admin",
    description: "Category mapping coverage",
  },
  {
    path: "/api/admin/categories/canonical",
    name: "Admin Canonical Categories",
    category: "admin",
    description: "Canonical categories (admin)",
  },
  {
    path: "/api/admin/categories/mappings",
    name: "Category Mappings",
    category: "admin",
    description: "Store to canonical mappings",
  },
  {
    path: "/api/admin/categories/tuples",
    name: "Category Tuples",
    category: "admin",
    description: "Store category tuples",
  },

  // Debug
  { path: "/api/debug", name: "Debug Endpoint", category: "admin", description: "Debug data by priority" },
]

export const CATEGORY_LABELS: Record<TestableRoute["category"], string> = {
  core: "Core",
  products: "Products",
  prices: "Prices",
  categories: "Categories",
  admin: "Admin",
}
