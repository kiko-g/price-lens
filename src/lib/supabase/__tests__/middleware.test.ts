import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import type { UserRole } from "@/types"

const state: { user: { id: string } | null; role: UserRole | null } = { user: null, role: null }

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: state.role ? { role: state.role } : null, error: null }),
        }),
      }),
    }),
  }),
}))

import { updateSession } from "@/lib/supabase/middleware"

const ORIGIN = "https://lince.test"

const request = (path: string, method = "GET") => new NextRequest(`${ORIGIN}${path}`, { method })

const signIn = (role: UserRole) => {
  state.user = { id: `user-${role}` }
  state.role = role
}

describe("updateSession role enforcement", () => {
  beforeEach(() => {
    state.user = null
    state.role = null
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    delete process.env.DISABLE_ADMIN_AUTH
    delete process.env.CRON_SECRET
  })

  describe("anonymous", () => {
    it("redirects /admin pages to /login", async () => {
      const res = await updateSession(request("/admin/analytics"))
      expect(res.status).toBe(307)
      expect(new URL(res.headers.get("location")!).pathname).toBe("/login")
    })

    it("401s /api/admin", async () => {
      const res = await updateSession(request("/api/admin/analytics"))
      expect(res.status).toBe(401)
    })
  })

  describe("regular user", () => {
    beforeEach(() => signIn("user"))

    it("is redirected home from /admin", async () => {
      const res = await updateSession(request("/admin/analytics"))
      expect(res.status).toBe(307)
      expect(new URL(res.headers.get("location")!).pathname).toBe("/")
    })

    it("gets 403 on /api/admin GET", async () => {
      const res = await updateSession(request("/api/admin/analytics"))
      expect(res.status).toBe(403)
    })

    it("can load /favorites", async () => {
      const res = await updateSession(request("/favorites"))
      expect(res.status).toBe(200)
    })
  })

  describe("reviewer", () => {
    beforeEach(() => signIn("reviewer"))

    it("can load /admin/analytics", async () => {
      const res = await updateSession(request("/admin/analytics"))
      expect(res.status).toBe(200)
      expect(res.headers.get("location")).toBeNull()
    })

    it("can call GET /api/admin/analytics and GET /api/admin/brand", async () => {
      expect((await updateSession(request("/api/admin/analytics"))).status).toBe(200)
      expect((await updateSession(request("/api/admin/brand"))).status).toBe(200)
    })

    it("can load /favorites and /profile as a signed-in user", async () => {
      expect((await updateSession(request("/favorites"))).status).toBe(200)
      expect((await updateSession(request("/profile"))).status).toBe(200)
      expect((await updateSession(request("/api/favorites", "POST"))).status).toBe(200)
    })

    it.each([
      ["PUT", "/api/admin/brand"],
      ["POST", "/api/admin/bulk-scrape"],
      ["POST", "/api/admin/discovery"],
      ["DELETE", "/api/admin/canonical-matches?id=1"],
      ["POST", "/api/admin/analytics/recompute"],
      ["POST", "/admin/priorities"],
      ["GET", "/api/admin/cron?priority=5"],
      ["GET", "/api/admin/discovery?action=run&origin=all"],
      ["GET", "/api/admin/discovery/triage?batch=80"],
      ["GET", "/api/admin/schedule?action=fix-phantom-scraped"],
      ["GET", "/api/admin/scrape/ai-priority"],
      ["PUT", "/api/prices"],
      ["POST", "/api/store_products/add"],
      ["PUT", "/api/store_products/42/priority"],
    ])("%s %s → 403", async (method, path) => {
      const res = await updateSession(request(path, method))
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toMatch(/read-only/i)
    })
  })

  describe("admin", () => {
    beforeEach(() => signIn("admin"))

    it("keeps full access", async () => {
      expect((await updateSession(request("/admin/analytics"))).status).toBe(200)
      expect((await updateSession(request("/api/admin/brand", "PUT"))).status).toBe(200)
      expect((await updateSession(request("/api/admin/cron?priority=5"))).status).toBe(200)
      expect((await updateSession(request("/api/prices", "PUT"))).status).toBe(200)
    })
  })

  it("cron secret bypass still works on API routes", async () => {
    process.env.CRON_SECRET = "s3cret"
    const req = new NextRequest(`${ORIGIN}/api/admin/analytics/compute-worker`, {
      headers: { authorization: "Bearer s3cret" },
    })
    expect((await updateSession(req)).status).toBe(200)
  })
})
