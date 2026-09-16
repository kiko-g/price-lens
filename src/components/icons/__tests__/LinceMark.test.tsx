/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"

import { LinceMark, LINCE_LOGO_SHAPES } from "@/components/icons/LinceMark"

describe("LinceMark", () => {
  it.each(["simple", "geometric-1"] as const)(
    "renders %s as a flat mark without an outer pulse by default",
    (logoShape) => {
      const { container } = render(<LinceMark logoShape={logoShape} />)
      const svg = container.querySelector("svg")
      expect(svg?.getAttribute("data-logo-fashion")).toBe("filled")
      expect(svg?.getAttribute("data-pulse-shape-pattern")).toBe("none")
      expect(container.querySelector("[data-lince-pulse-waves]")).toBeNull()
      expect(
        container.querySelector(logoShape === "simple" ? "[data-lince-simple]" : "[data-lince-geometric]"),
      ).not.toBeNull()
    },
  )

  it.each(LINCE_LOGO_SHAPES)("removes colored accents and glow from %s in monochrome", (logoShape) => {
    const { container } = render(
      <LinceMark logoShape={logoShape} monochrome pulseShapePattern="quarter-circle" pulseAnimation="animated" />,
    )
    expect(container.querySelector("svg")?.getAttribute("data-monochrome")).toBe("true")
    expect(container.querySelector('[class*="primary"], [class*="drop-shadow"], .lince-hunter-backlight')).toBeNull()
    expect(container.querySelector('[stroke="var(--primary)"]')).toBeNull()
    expect(container.querySelector("[data-lince-pulse-waves]")).not.toBeNull()
    expect(container.querySelectorAll(".lince-pulse-wave.stroke-current")).toHaveLength(3)
  })

  it("keeps monochrome cutout masks unique across simultaneous previews", () => {
    const { container } = render(
      <>
        <LinceMark logoShape="pal" logoFashion="filled" monochrome />
        <LinceMark logoShape="pal" logoFashion="tile" monochrome />
      </>,
    )
    const masks = Array.from(container.querySelectorAll("mask"))
    expect(masks).toHaveLength(2)
    expect(masks[0].id).not.toBe(masks[1].id)
    for (const mask of masks) {
      expect(container.querySelector(`[mask="url(#${mask.id})"]`)).not.toBeNull()
      expect(mask.querySelectorAll("ellipse")).toHaveLength(2)
    }
  })

  it("defaults to hunter outlined with a static quarter-circle pulse", () => {
    const { container } = render(<LinceMark />)
    const svg = container.querySelector("svg")
    expect(svg?.getAttribute("data-logo-shape")).toBe("hunter")
    expect(svg?.getAttribute("data-logo-fashion")).toBe("outlined")
    expect(svg?.getAttribute("data-pulse-shape-pattern")).toBe("quarter-circle")
    expect(svg?.getAttribute("data-pulse-animation")).toBe("static")
    expect(container.querySelector("clipPath")).not.toBeNull()
    expect(container.querySelector("[data-lince-pulse-waves]")).not.toBeNull()
    expect(container.querySelector(".lince-hunter-backlight")).not.toBeNull()
    expect(container.querySelector("[data-lince-pal-eyes]")).toBeNull()
  })

  it("keeps pal and angular silhouettes when requested", () => {
    const pal = render(<LinceMark logoShape="pal" logoFashion="filled" pulseShapePattern="none" />)
    expect(pal.container.querySelector("svg")?.getAttribute("data-logo-shape")).toBe("pal")
    expect(pal.container.querySelector("[data-lince-pal-eyes]")).not.toBeNull()

    const angular = render(<LinceMark logoShape="angular" pulseShapePattern="none" />)
    expect(angular.container.querySelector("svg")?.getAttribute("data-logo-shape")).toBe("angular")
    expect(angular.container.querySelector("[data-lince-pal-eyes]")).toBeNull()
  })

  it("clips radar waves to the requested sector and animates when asked", () => {
    const { container } = render(
      <LinceMark logoFashion="outlined" pulseShapePattern="full-circle" pulseAnimation="animated" />,
    )
    const svg = container.querySelector("svg")
    expect(svg?.getAttribute("data-logo-fashion")).toBe("outlined")
    expect(svg?.getAttribute("data-pulse-shape-pattern")).toBe("full-circle")
    expect(svg?.getAttribute("data-pulse-animation")).toBe("animated")
    expect(container.querySelector("clipPath")).toBeNull()
    expect(container.querySelectorAll(".lince-pulse-wave")).toHaveLength(3)
  })

  it("omits the pulse ring when the pattern is none", () => {
    const { container } = render(<LinceMark pulseShapePattern="none" pulseAnimation="animated" />)
    const svg = container.querySelector("svg")
    expect(svg?.getAttribute("data-pulse-shape-pattern")).toBe("none")
    expect(svg?.getAttribute("data-pulse-animation")).toBe("static")
    expect(container.querySelector("[data-lince-pulse-waves]")).toBeNull()
    expect(container.querySelector("clipPath")).toBeNull()
  })

  it("ignores pulse props on the app-tile fashion", () => {
    const { container } = render(
      <LinceMark logoFashion="tile" pulseShapePattern="quarter-circle" pulseAnimation="animated" />,
    )
    const svg = container.querySelector("svg")
    expect(svg?.getAttribute("data-logo-fashion")).toBe("tile")
    expect(svg?.getAttribute("data-pulse-shape-pattern")).toBe("none")
    expect(container.querySelector("rect")).not.toBeNull()
    expect(container.querySelector("[data-lince-pulse-waves]")).toBeNull()
  })
})
