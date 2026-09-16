import { describe, expect, it } from "vitest"
import sharp from "sharp"
import { LINCE_LOGO_SHAPES, LINCE_LOGO_FASHIONS, getLinceMarkDefaults } from "@/lib/brand/mark"
import { renderBrandMark } from "@/lib/brand/render-mark"

describe("standalone brand assets", () => {
  it.each(LINCE_LOGO_SHAPES)("renders %s in every fashion as a valid, visible PNG", async (logoShape) => {
    for (const logoFashion of LINCE_LOGO_FASHIONS) {
      for (const monochrome of [false, true]) {
        const svg = await renderBrandMark({ ...getLinceMarkDefaults(logoShape), logoFashion, monochrome })
        expect(svg).not.toMatch(/class=|var\(--/)
        if (monochrome) expect(svg).not.toContain("brand-glow")
        const { data, info } = await sharp(Buffer.from(svg))
          .resize(32, 32)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true })
        expect(info.width).toBe(32)
        expect(data.some((value, index) => index % 4 === 3 && value > 0)).toBe(true)
      }
    }
  })

  it("resolves paper ink and produces static, padded PWA tiles", async () => {
    const mark = { ...getLinceMarkDefaults("simple"), monochrome: true }
    expect(await renderBrandMark(mark, { theme: "paper" })).toContain("color:#14181f")
    const svg = await renderBrandMark({ ...mark, pulseAnimation: "animated" }, { tile: true })
    expect(svg).toContain('data-pulse-animation="static"')
    const { channels } = await sharp(Buffer.from(svg)).stats()
    expect(channels[3].min).toBe(255)
  })
})
