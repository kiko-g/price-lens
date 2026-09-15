/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"

import { LinceMark } from "@/components/icons/LinceMark"

describe("LinceMark", () => {
  it("defaults to theme-aware filled fashion with a static quarter-circle pulse", () => {
    const { container } = render(<LinceMark />)
    const svg = container.querySelector("svg")
    expect(svg?.getAttribute("data-logo-fashion")).toBe("filled")
    expect(svg?.getAttribute("data-pulse-shape-pattern")).toBe("quarter-circle")
    expect(svg?.getAttribute("data-pulse-animation")).toBe("static")
    expect(container.querySelector("clipPath")).not.toBeNull()
    expect(container.querySelector("[data-lince-pulse-waves]")).not.toBeNull()
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
