import { describe, it, expect, vi } from "vitest"
import { createTranslator } from "next-intl"

import { BRAND_DEFAULTS, brandPlaceholders, brandSettingsSchema, getBrandText, mergeBrandSettings } from "../brand"
import { applyBrandToMessages, escapeIcu, substituteBrandInString } from "../messages"

import enMessages from "../../../../messages/en.json"
import ptMessages from "../../../../messages/pt.json"

describe("mergeBrandSettings", () => {
  it("returns defaults for null/invalid input", () => {
    expect(mergeBrandSettings(null)).toEqual(BRAND_DEFAULTS)
    expect(mergeBrandSettings("nope")).toEqual(BRAND_DEFAULTS)
  })

  it("overrides only the provided fields and keeps per-locale fallbacks", () => {
    const merged = mergeBrandSettings({ displayName: "Vigia", tagline: { pt: "Novo pulso." } })
    expect(merged.displayName).toBe("Vigia")
    expect(merged.shortName).toBe(BRAND_DEFAULTS.shortName)
    expect(merged.tagline.pt).toBe("Novo pulso.")
    expect(merged.tagline.en).toBe(BRAND_DEFAULTS.tagline.en)
  })

  it("falls back to defaults when the stored row is corrupt", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(mergeBrandSettings({ displayName: "" })).toEqual(BRAND_DEFAULTS)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe("brandSettingsSchema", () => {
  it("rejects a short name longer than 12 chars", () => {
    const result = brandSettingsSchema.safeParse({ ...BRAND_DEFAULTS, shortName: "A".repeat(13) })
    expect(result.success).toBe(false)
  })

  it("trims whitespace", () => {
    const result = brandSettingsSchema.parse({ ...BRAND_DEFAULTS, displayName: "  Lince  " })
    expect(result.displayName).toBe("Lince")
  })
})

describe("getBrandText", () => {
  it("resolves the locale and falls back to pt", () => {
    expect(getBrandText(BRAND_DEFAULTS.tagline, "en")).toBe(BRAND_DEFAULTS.tagline.en)
    expect(getBrandText(BRAND_DEFAULTS.tagline, "fr")).toBe(BRAND_DEFAULTS.tagline.pt)
  })
})

describe("escapeIcu", () => {
  it("escapes apostrophes and braces so ICU parsing survives", () => {
    expect(escapeIcu("L'Éclair")).toBe("L''Éclair")
    expect(escapeIcu("a{b}c")).toBe("a'{'b'}'c")
  })

  it("round-trips through the ICU formatter next-intl uses", () => {
    const msg = substituteBrandInString("Welcome to {brand}, {name}!", { brand: "Ol'{Brand}" })
    const t = createTranslator({ locale: "en", messages: { welcome: msg } })
    expect(t("welcome", { name: "Ana" })).toBe("Welcome to Ol'{Brand}, Ana!")
  })
})

describe("applyBrandToMessages", () => {
  it("substitutes brand placeholders recursively and leaves other args intact", () => {
    const tree = { a: { b: "Hi {brand} ({brandShort}) — © {brandLegal} {year}", c: { d: "{name} on {brand}" } } }
    const out = applyBrandToMessages(
      tree,
      brandPlaceholders({ ...BRAND_DEFAULTS, shortName: "LX", legalName: "Lince Lda" }),
    )
    expect(out.a.b).toBe("Hi Lince (LX) — © Lince Lda {year}")
    expect(out.a.c.d).toBe("{name} on Lince")
  })

  it("leaves unknown placeholders untouched", () => {
    expect(substituteBrandInString("{brand} {other}", { brand: "X" })).toBe("X {other}")
  })

  it("no consumer message keeps the legacy product name hardcoded", () => {
    const flatten = (tree: object): string[] =>
      Object.values(tree).flatMap((v) => (typeof v === "string" ? [v] : flatten(v as object)))
    for (const messages of [enMessages, ptMessages]) {
      const offenders = flatten(messages).filter((s) => /price\s?lens/i.test(s) && !/pricelens\.dev/i.test(s))
      expect(offenders).toEqual([])
    }
  })

  it("every {brand*} placeholder in the message files resolves against the defaults", () => {
    const placeholders = brandPlaceholders(BRAND_DEFAULTS)
    const resolved = applyBrandToMessages(enMessages, placeholders)
    expect(JSON.stringify(resolved)).not.toMatch(/\{brand(Short|Legal)?\}/)
    expect(resolved.onboarding.welcome.title).toBe("Welcome to Lince")
    expect(resolved.layout.footer.rights).toBe("© {year} Lince.")
  })
})
