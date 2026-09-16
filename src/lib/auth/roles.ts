import type { UserRole } from "@/types"

/**
 * Role model:
 * - `user`     — regular shopper. Own favorites/alerts/lists/profile only.
 * - `admin`    — full access to /admin and /api/admin (reads and writes).
 * - `reviewer` — shopper + read-only admin. Can open /admin pages and call read-only
 *                admin GET endpoints, but every mutation fails closed (403). Used by the
 *                branding/product-review agent so it never runs on the founder's account.
 *
 * This module is pure (no Supabase, no React) so it can run in the edge middleware and
 * be unit-tested exhaustively.
 */

export const canAccessAdmin = (role: UserRole | null | undefined): boolean => role === "admin" || role === "reviewer"

export const canMutateAdmin = (role: UserRole | null | undefined): boolean => role === "admin"

export const isReviewer = (role: UserRole | null | undefined): boolean => role === "reviewer"

export const isAdminPath = (pathname: string): boolean =>
  pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin")

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

/**
 * GET endpoints under /api/admin that have side effects (cron targets and manual triggers).
 * A reviewer must never reach these even though they are technically GET.
 */
const SIDE_EFFECT_ADMIN_GETS: readonly string[] = [
  "/api/admin/cron",
  "/api/admin/scrape/ai-priority",
  "/api/admin/discovery/triage",
  "/api/admin/analytics/compute-worker",
  "/api/admin/data-health/compute-worker",
  "/api/admin/price-stats-worker",
  "/api/admin/scrape-runs/retention-worker",
]

/**
 * GET endpoints whose behaviour is selected by a query param. Only the listed values are
 * read-only; anything else (including unknown/new actions) is denied for reviewers.
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

export const isElevatedApiPath = (pathname: string): boolean =>
  ELEVATED_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

/** True when the middleware must look up `profiles.role` before letting the request through. */
export const requiresRoleCheck = (pathname: string): boolean => isAdminPath(pathname) || isElevatedApiPath(pathname)

export type RequestVerdict = { allowed: true } | { allowed: false; reason: string }

const deny = (reason: string): RequestVerdict => ({ allowed: false, reason })
const allow: RequestVerdict = { allowed: true }

/**
 * Decide whether a reviewer may perform this request. Fail closed: anything that is not a
 * known read-only request on an admin/elevated route is denied. Non-admin, non-elevated
 * routes (e.g. /favorites, /api/favorites) are always allowed here — the reviewer behaves
 * like a normal user there and RLS scopes them to their own rows.
 */
export function evaluateReviewerRequest(
  method: string,
  pathname: string,
  searchParams: URLSearchParams,
): RequestVerdict {
  const upper = method.toUpperCase()
  const isRead = READ_METHODS.has(upper)

  if (isAdminPath(pathname)) {
    if (!isRead) return deny(`reviewer role is read-only (${upper} ${pathname})`)

    if (SIDE_EFFECT_ADMIN_GETS.includes(pathname)) {
      return deny(`reviewer role cannot trigger ${pathname}`)
    }

    const gate = READ_ONLY_ACTIONS[pathname]
    if (gate) {
      const value = searchParams.get(gate.param) ?? gate.defaultValue
      if (!gate.allowed.has(value)) {
        return deny(`reviewer role cannot run ${pathname}?${gate.param}=${value}`)
      }
    }

    return allow
  }

  if (isElevatedApiPath(pathname)) {
    if (!isRead) return deny(`reviewer role is read-only (${upper} ${pathname})`)
    if (ELEVATED_SIDE_EFFECT_GETS.some((re) => re.test(pathname))) {
      return deny(`reviewer role cannot trigger ${pathname}`)
    }
  }

  return allow
}
