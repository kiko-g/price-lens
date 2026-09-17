import type { UserRole } from "@/types"

/**
 * Role model:
 * - `user`     — regular shopper. Own favorites/alerts/lists/profile only.
 * - `admin`    — full access to /admin and /api/admin (reads and writes).
 * - `reviewer` — shopper + read-only admin. Can open /admin pages and call the
 *                allowlisted read-only admin GET endpoints; everything else on the admin
 *                surface fails closed (403). Used by the branding/product-review agent so
 *                it never runs on the founder's account.
 *
 * This module is pure (no Supabase, no React) so it can run in the edge middleware and
 * be unit-tested exhaustively. `roles.test.ts` also scans `src/app/api/admin/**` and fails
 * if a GET route exists that is not classified below, so new endpoints cannot silently
 * become reachable (or silently break) for reviewers.
 */

export const canAccessAdmin = (role: UserRole | null | undefined): boolean => role === "admin" || role === "reviewer"

export const canMutateAdmin = (role: UserRole | null | undefined): boolean => role === "admin"

export const isReviewer = (role: UserRole | null | undefined): boolean => role === "reviewer"

/** Collapse duplicate and trailing slashes so `/api/admin/discovery/` cannot dodge an exact-match rule. */
export const normalizePathname = (pathname: string): string => {
  const collapsed = pathname.replace(/\/{2,}/g, "/")
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, "") : collapsed
}

export const isAdminPath = (pathname: string): boolean => {
  const p = normalizePathname(pathname)
  return p === "/admin" || p.startsWith("/admin/") || p === "/api/admin" || p.startsWith("/api/admin/")
}

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

/**
 * Admin GET endpoints a reviewer may call. Route-file paths with `[param]` segments are
 * expressed as `:param`. Anything under /api/admin that is not listed here is denied.
 */
export const REVIEWER_ALLOWED_ADMIN_GETS: readonly string[] = [
  "/api/admin/analytics",
  "/api/admin/brand",
  "/api/admin/bulk-scrape",
  "/api/admin/bulk-scrape/:jobId",
  "/api/admin/canonical-matches",
  "/api/admin/canonical-matches/cleanup",
  "/api/admin/canonical-matches/link",
  "/api/admin/canonical-matches/quality",
  "/api/admin/canonical-matches/search",
  "/api/admin/canonical-matches/split-suspects",
  "/api/admin/categories/canonical",
  "/api/admin/categories/canonical/:id",
  "/api/admin/categories/mappings",
  "/api/admin/categories/mappings/:id",
  "/api/admin/categories/mappings/check",
  "/api/admin/categories/stats",
  "/api/admin/categories/tuples",
  "/api/admin/data-health",
  "/api/admin/data-health/cohorts",
  "/api/admin/data-health/successors",
  "/api/admin/debug",
  "/api/admin/discovery",
  "/api/admin/prices/duplicates",
  "/api/admin/schedule",
  "/api/admin/trade-items",
]

/**
 * Admin GET endpoints with side effects (cron targets, manual triggers, outbound alerts).
 * Listed explicitly so the exhaustiveness test can prove every GET route was reviewed.
 */
export const SIDE_EFFECT_ADMIN_GETS: readonly string[] = [
  "/api/admin/alerts/scrape-health",
  "/api/admin/analytics/compute-worker",
  "/api/admin/cron",
  "/api/admin/data-health/compute-worker",
  "/api/admin/discovery/triage",
  "/api/admin/price-stats-worker",
  "/api/admin/scrape/ai-priority",
  "/api/admin/scrape-runs/retention-worker",
]

/**
 * Allowlisted GET endpoints whose behaviour is selected by a query param. Only the listed
 * values are read-only; anything else (including unknown/new actions) is denied.
 */
const READ_ONLY_ACTIONS: Readonly<
  Record<string, { param: string; defaultValue: string; allowed: ReadonlySet<string> }>
> = {
  "/api/admin/discovery": { param: "action", defaultValue: "status", allowed: new Set(["status"]) },
  "/api/admin/schedule": {
    param: "action",
    defaultValue: "overview",
    allowed: new Set(["overview", "activity-log", "products-by-staleness", "scrape-runs"]),
  },
}

/**
 * Mutating routes that live outside /api/admin but are only exposed to elevated (admin) UI:
 * insert price, add/scrape a store product, change priorities. Regular users are not
 * gated here (unchanged behaviour); reviewers are denied so the role cannot write via them.
 */
const ELEVATED_API_PREFIXES: readonly string[] = ["/api/prices", "/api/store_products"]

const ELEVATED_SIDE_EFFECT_GETS: readonly RegExp[] = [/^\/api\/prices\/sanitize\//]

export const isElevatedApiPath = (pathname: string): boolean => {
  const p = normalizePathname(pathname)
  return ELEVATED_API_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))
}

/** True when the middleware must look up `profiles.role` before letting the request through. */
export const requiresRoleCheck = (pathname: string): boolean => isAdminPath(pathname) || isElevatedApiPath(pathname)

/** `/api/admin/bulk-scrape/:jobId` matches `/api/admin/bulk-scrape/abc` (one non-empty segment per param). */
const matchesRoutePattern = (pattern: string, pathname: string): boolean => {
  const patternSegments = pattern.split("/")
  const pathSegments = pathname.split("/")
  if (patternSegments.length !== pathSegments.length) return false
  return patternSegments.every((seg, i) => (seg.startsWith(":") ? pathSegments[i].length > 0 : seg === pathSegments[i]))
}

const findAllowedAdminGet = (pathname: string): string | null =>
  REVIEWER_ALLOWED_ADMIN_GETS.find((pattern) => matchesRoutePattern(pattern, pathname)) ?? null

export type RequestVerdict = { allowed: true } | { allowed: false; reason: string }

const deny = (reason: string): RequestVerdict => ({ allowed: false, reason })
const allow: RequestVerdict = { allowed: true }

/**
 * Decide whether a reviewer may perform this request. Fail closed: on the admin surface
 * only allowlisted read-only GETs (with read-only action params) pass; on the elevated
 * routes only reads pass. Non-admin, non-elevated routes (e.g. /favorites, /api/favorites)
 * are always allowed here — the reviewer behaves like a normal user there and RLS scopes
 * them to their own rows.
 */
export function evaluateReviewerRequest(
  method: string,
  pathname: string,
  searchParams: URLSearchParams,
): RequestVerdict {
  const upper = method.toUpperCase()
  const isRead = READ_METHODS.has(upper)
  const path = normalizePathname(pathname)

  if (isAdminPath(path)) {
    if (!isRead) return deny(`reviewer role is read-only (${upper} ${path})`)

    // /admin/* pages are plain reads; the API surface is allowlisted.
    if (!path.startsWith("/api/")) return allow

    const matched = findAllowedAdminGet(path)
    if (!matched) return deny(`reviewer role cannot call ${path} (not an allowlisted read-only endpoint)`)

    const gate = READ_ONLY_ACTIONS[matched]
    if (gate) {
      const value = searchParams.get(gate.param) ?? gate.defaultValue
      if (!gate.allowed.has(value)) {
        return deny(`reviewer role cannot run ${path}?${gate.param}=${value}`)
      }
    }

    return allow
  }

  if (isElevatedApiPath(path)) {
    if (!isRead) return deny(`reviewer role is read-only (${upper} ${path})`)
    if (ELEVATED_SIDE_EFFECT_GETS.some((re) => re.test(path))) {
      return deny(`reviewer role cannot trigger ${path}`)
    }
  }

  return allow
}
