import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import {
  REVIEWER_ALLOWED_ADMIN_GETS,
  SIDE_EFFECT_ADMIN_GETS,
  canAccessAdmin,
  canMutateAdmin,
  evaluateReviewerRequest,
  isAdminPath,
  isElevatedApiPath,
  isReviewer,
  normalizePathname,
  requiresRoleCheck,
} from "@/lib/auth/roles"

const params = (qs = "") => new URLSearchParams(qs)

describe("role predicates", () => {
  it("only admin and reviewer can access /admin", () => {
    expect(canAccessAdmin("admin")).toBe(true)
    expect(canAccessAdmin("reviewer")).toBe(true)
    expect(canAccessAdmin("user")).toBe(false)
    expect(canAccessAdmin(null)).toBe(false)
    expect(canAccessAdmin(undefined)).toBe(false)
  })

  it("only admin can mutate", () => {
    expect(canMutateAdmin("admin")).toBe(true)
    expect(canMutateAdmin("reviewer")).toBe(false)
    expect(canMutateAdmin("user")).toBe(false)
  })

  it("identifies reviewer", () => {
    expect(isReviewer("reviewer")).toBe(true)
    expect(isReviewer("admin")).toBe(false)
  })
})

describe("path classification", () => {
  it("normalizes duplicate and trailing slashes", () => {
    expect(normalizePathname("/api/admin/discovery/")).toBe("/api/admin/discovery")
    expect(normalizePathname("//api//admin///discovery//")).toBe("/api/admin/discovery")
    expect(normalizePathname("/")).toBe("/")
  })

  it("matches admin pages and APIs", () => {
    expect(isAdminPath("/admin")).toBe(true)
    expect(isAdminPath("/admin/")).toBe(true)
    expect(isAdminPath("/api/admin/brand/")).toBe(true)
    expect(isAdminPath("/admin/analytics")).toBe(true)
    expect(isAdminPath("/api/admin/brand")).toBe(true)
    expect(isAdminPath("/administrator")).toBe(false)
    expect(isAdminPath("/favorites")).toBe(false)
  })

  it("matches elevated non-admin APIs", () => {
    expect(isElevatedApiPath("/api/prices")).toBe(true)
    expect(isElevatedApiPath("/api/prices/sanitize/42")).toBe(true)
    expect(isElevatedApiPath("/api/store_products/add")).toBe(true)
    expect(isElevatedApiPath("/api/store_products/42/priority")).toBe(true)
    expect(isElevatedApiPath("/api/favorites")).toBe(false)
    expect(isElevatedApiPath("/api/pricesx")).toBe(false)
  })

  it("only requires a role lookup on admin/elevated paths", () => {
    expect(requiresRoleCheck("/admin/analytics")).toBe(true)
    expect(requiresRoleCheck("/api/store_products/1/priority")).toBe(true)
    expect(requiresRoleCheck("/favorites")).toBe(false)
    expect(requiresRoleCheck("/api/favorites")).toBe(false)
    expect(requiresRoleCheck("/profile")).toBe(false)
  })
})

describe("evaluateReviewerRequest — allowed", () => {
  it.each([
    ["GET", "/admin"],
    ["GET", "/admin/analytics"],
    ["GET", "/admin/brand"],
    ["GET", "/api/admin/analytics"],
    ["GET", "/api/admin/brand"],
    ["GET", "/api/admin/data-health"],
    ["GET", "/api/admin/data-health/cohorts"],
    ["GET", "/api/admin/bulk-scrape"],
    ["GET", "/api/admin/bulk-scrape/job-1"],
    ["GET", "/api/admin/canonical-matches"],
    ["GET", "/api/admin/canonical-matches/cleanup"],
    ["GET", "/api/admin/categories/mappings/check"],
    ["GET", "/api/admin/trade-items"],
    ["GET", "/api/admin/prices/duplicates"],
    ["HEAD", "/api/admin/analytics"],
  ])("%s %s", (method, path) => {
    expect(evaluateReviewerRequest(method, path, params())).toEqual({ allowed: true })
  })

  it("allows read-only action params (and the defaults)", () => {
    expect(evaluateReviewerRequest("GET", "/api/admin/discovery", params()).allowed).toBe(true)
    expect(evaluateReviewerRequest("GET", "/api/admin/discovery", params("action=status")).allowed).toBe(true)
    expect(evaluateReviewerRequest("GET", "/api/admin/schedule", params()).allowed).toBe(true)
    for (const action of ["overview", "activity-log", "products-by-staleness", "scrape-runs"]) {
      expect(evaluateReviewerRequest("GET", "/api/admin/schedule", params(`action=${action}&page=2`)).allowed).toBe(
        true,
      )
    }
  })

  it("treats consumer routes like a normal user (RLS scopes them)", () => {
    expect(evaluateReviewerRequest("GET", "/favorites", params()).allowed).toBe(true)
    expect(evaluateReviewerRequest("POST", "/api/favorites", params()).allowed).toBe(true)
    expect(evaluateReviewerRequest("DELETE", "/api/alerts", params()).allowed).toBe(true)
    expect(evaluateReviewerRequest("POST", "/api/lists", params()).allowed).toBe(true)
    expect(evaluateReviewerRequest("POST", "/profile", params()).allowed).toBe(true)
    expect(evaluateReviewerRequest("GET", "/api/store_products/1", params()).allowed).toBe(true)
    expect(evaluateReviewerRequest("GET", "/api/store_products/bulk-priority", params("priority=5")).allowed).toBe(true)
  })
})

describe("evaluateReviewerRequest — denied (fail closed)", () => {
  it.each([
    ["POST", "/api/admin/bulk-scrape"],
    ["PATCH", "/api/admin/bulk-scrape"],
    ["DELETE", "/api/admin/bulk-scrape/job-1"],
    ["PUT", "/api/admin/brand"],
    ["POST", "/api/admin/discovery"],
    ["POST", "/api/admin/analytics/recompute"],
    ["POST", "/api/admin/data-health/recompute"],
    ["POST", "/api/admin/canonical-matches/cleanup"],
    ["DELETE", "/api/admin/canonical-matches"],
    ["POST", "/api/admin/canonical-matches/link"],
    ["DELETE", "/api/admin/canonical-matches/link"],
    ["POST", "/api/admin/categories/canonical"],
    ["PUT", "/api/admin/categories/canonical/1"],
    ["DELETE", "/api/admin/categories/mappings/1"],
    ["POST", "/api/admin/trade-items"],
    ["DELETE", "/api/admin/prices/duplicates"],
    ["POST", "/api/admin/scrapers/test"],
    ["POST", "/api/admin/alerts/price-drops"],
    ["post", "/api/admin/brand"],
  ])("%s %s → denied", (method, path) => {
    expect(evaluateReviewerRequest(method, path, params()).allowed).toBe(false)
  })

  it("denies admin GET routes that are not allowlisted (fail closed for new endpoints)", () => {
    expect(evaluateReviewerRequest("GET", "/api/admin/some-new-route", params()).allowed).toBe(false)
    expect(evaluateReviewerRequest("GET", "/api/admin/bulk-scrape/a/b", params()).allowed).toBe(false)
    expect(evaluateReviewerRequest("GET", "/api/admin", params()).allowed).toBe(false)
  })

  it("cannot be dodged with trailing or duplicate slashes", () => {
    expect(evaluateReviewerRequest("GET", "/api/admin/discovery/", params("action=run")).allowed).toBe(false)
    expect(evaluateReviewerRequest("GET", "/api/admin//discovery", params("action=run")).allowed).toBe(false)
    expect(evaluateReviewerRequest("GET", "/api/admin/cron/", params()).allowed).toBe(false)
    expect(evaluateReviewerRequest("PUT", "/api/prices/", params()).allowed).toBe(false)
    expect(evaluateReviewerRequest("GET", "/api/admin/analytics/", params()).allowed).toBe(true)
  })

  it("denies server-action POSTs to /admin pages", () => {
    expect(evaluateReviewerRequest("POST", "/admin/priorities", params()).allowed).toBe(false)
    expect(evaluateReviewerRequest("POST", "/admin", params()).allowed).toBe(false)
  })

  it.each([
    "/api/admin/cron",
    "/api/admin/scrape/ai-priority",
    "/api/admin/discovery/triage",
    "/api/admin/analytics/compute-worker",
    "/api/admin/data-health/compute-worker",
    "/api/admin/price-stats-worker",
    "/api/admin/scrape-runs/retention-worker",
  ])("GET %s has side effects → denied", (path) => {
    expect(evaluateReviewerRequest("GET", path, params()).allowed).toBe(false)
    expect(evaluateReviewerRequest("GET", path, params("dry=true")).allowed).toBe(false)
  })

  it("denies mutating action params, including dry runs and unknown actions", () => {
    expect(evaluateReviewerRequest("GET", "/api/admin/discovery", params("action=run&origin=all")).allowed).toBe(false)
    expect(evaluateReviewerRequest("GET", "/api/admin/discovery", params("action=run&dry=true")).allowed).toBe(false)
    expect(evaluateReviewerRequest("GET", "/api/admin/discovery", params("action=whatever")).allowed).toBe(false)
    expect(evaluateReviewerRequest("GET", "/api/admin/schedule", params("action=fix-phantom-scraped")).allowed).toBe(
      false,
    )
    expect(
      evaluateReviewerRequest("GET", "/api/admin/schedule", params("action=fix-phantom-scraped&dry=true")).allowed,
    ).toBe(false)
    expect(evaluateReviewerRequest("GET", "/api/admin/schedule", params("action=new-thing")).allowed).toBe(false)
  })

  it("denies elevated non-admin writes", () => {
    expect(evaluateReviewerRequest("PUT", "/api/prices", params()).allowed).toBe(false)
    expect(evaluateReviewerRequest("GET", "/api/prices/sanitize/42", params()).allowed).toBe(false)
    expect(evaluateReviewerRequest("POST", "/api/store_products/add", params()).allowed).toBe(false)
    expect(evaluateReviewerRequest("POST", "/api/store_products/scrape", params()).allowed).toBe(false)
    expect(evaluateReviewerRequest("PATCH", "/api/store_products/bulk-priority", params()).allowed).toBe(false)
    expect(evaluateReviewerRequest("PUT", "/api/store_products/42/priority", params()).allowed).toBe(false)
  })

  it("returns a reason for logging", () => {
    const verdict = evaluateReviewerRequest("PUT", "/api/admin/brand", params())
    expect(verdict.allowed).toBe(false)
    if (!verdict.allowed) expect(verdict.reason).toContain("/api/admin/brand")
  })
})

// ---------------------------------------------------------------------------
// Exhaustiveness: every GET route under src/app/api/admin must be classified.
// ---------------------------------------------------------------------------

const ADMIN_API_DIR = join(process.cwd(), "src/app/api/admin")

function walkRouteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walkRouteFiles(full)
    return entry === "route.ts" ? [full] : []
  })
}

const exportsGet = (source: string): boolean => /export\s+(async\s+function\s+GET\b|const\s+GET\b)/.test(source)

const routePathFor = (file: string): string =>
  "/api/admin/" +
  relative(ADMIN_API_DIR, file)
    .replace(/\/?route\.ts$/, "")
    .replace(/\[([^\]]+)\]/g, ":$1")
    .replace(/\\/g, "/")

describe("admin GET route classification", () => {
  const getRoutes = walkRouteFiles(ADMIN_API_DIR)
    .filter((file) => exportsGet(readFileSync(file, "utf8")))
    .map(routePathFor)
    .map((p) => p.replace(/\/$/, ""))
    .sort()

  it("finds the admin GET routes", () => {
    expect(getRoutes.length).toBeGreaterThan(20)
  })

  it.each(getRoutes)("%s is either allowlisted or a declared side-effect GET", (route) => {
    const allowed = REVIEWER_ALLOWED_ADMIN_GETS.includes(route)
    const sideEffect = SIDE_EFFECT_ADMIN_GETS.includes(route)
    expect(
      allowed || sideEffect,
      `${route} exports GET but is not classified in src/lib/auth/roles.ts — add it to REVIEWER_ALLOWED_ADMIN_GETS (read-only) or SIDE_EFFECT_ADMIN_GETS (writes/triggers)`,
    ).toBe(true)
    expect(allowed && sideEffect, `${route} is in both lists`).toBe(false)
  })

  it("does not classify routes that no longer exist", () => {
    for (const route of [...REVIEWER_ALLOWED_ADMIN_GETS, ...SIDE_EFFECT_ADMIN_GETS]) {
      expect(getRoutes, `${route} is classified but has no GET route file`).toContain(route)
    }
  })

  it("denies every declared side-effect GET for reviewers", () => {
    for (const route of SIDE_EFFECT_ADMIN_GETS) {
      expect(evaluateReviewerRequest("GET", route, params()).allowed).toBe(false)
    }
  })
})
