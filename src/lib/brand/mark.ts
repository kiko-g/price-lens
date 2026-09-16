export const LINCE_LOGO_SHAPES = ["hunter", "pal", "angular", "simple", "geometric-1"] as const
export type LinceLogoShape = (typeof LINCE_LOGO_SHAPES)[number]

export const LINCE_LOGO_FASHIONS = ["filled", "filledWhite", "filledInk", "outlined", "tile"] as const
export type LinceLogoFashion = (typeof LINCE_LOGO_FASHIONS)[number]

export const LINCE_PULSE_SHAPE_PATTERNS = ["none", "quarter-circle", "half-circle", "full-circle"] as const
export type LincePulseShapePattern = (typeof LINCE_PULSE_SHAPE_PATTERNS)[number]

export const LINCE_PULSE_ANIMATIONS = ["static", "animated"] as const
export type LincePulseAnimation = (typeof LINCE_PULSE_ANIMATIONS)[number]

export type LinceMarkOptions = {
  logoShape: LinceLogoShape
  logoFashion: LinceLogoFashion
  pulseShapePattern: LincePulseShapePattern
  pulseAnimation: LincePulseAnimation
  monochrome: boolean
}

export function getLinceMarkDefaults(logoShape: LinceLogoShape = "hunter"): LinceMarkOptions {
  const flat = logoShape === "simple" || logoShape === "geometric-1"
  return {
    logoShape,
    logoFashion: flat ? "filled" : "outlined",
    pulseShapePattern: flat ? "none" : "quarter-circle",
    pulseAnimation: "static",
    monochrome: false,
  }
}
