import { describe, expect, it } from "vitest"
import { brandStorageError } from "@/lib/brand/storage-error"

describe("brand storage errors", () => {
  it("explains how to provision missing storage", () => {
    expect(brandStorageError({ code: "42P01" }).message).toContain("20260915222554_app_settings.sql")
    expect(brandStorageError({ code: "PGRST205" }).message).toContain("not set up")
  })

  it("preserves alternate error descriptions and never renders undefined", () => {
    expect(brandStorageError({ error: "Invalid API key" }).message).toContain("Invalid API key")
    expect(brandStorageError({ details: "Connection refused" }).message).toContain("Connection refused")
    for (const error of [undefined, null, {}, { message: "" }]) {
      expect(brandStorageError(error).message).not.toContain("undefined")
      expect(brandStorageError(error).message).toContain("Check the Supabase connection")
    }
  })
})
