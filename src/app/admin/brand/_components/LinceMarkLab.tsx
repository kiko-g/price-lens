"use client"

import {
  LINCE_LOGO_FASHIONS,
  LINCE_LOGO_SHAPES,
  LINCE_PULSE_ANIMATIONS,
  LINCE_PULSE_SHAPE_PATTERNS,
  LinceMark,
  getLinceMarkDefaults,
  type LinceMarkOptions,
  type LinceLogoFashion,
  type LinceLogoShape,
  type LincePulseAnimation,
  type LincePulseShapePattern,
} from "@/components/icons/LinceMark"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { MarkPreviewSurface } from "@/app/admin/brand/_components/MarkPreviewSurface"

const SHAPE_LABELS: Record<LinceLogoShape, string> = {
  hunter: "hunter",
  pal: "pal",
  angular: "angular",
  simple: "simple",
  "geometric-1": "geometric-1",
}

const FASHION_LABELS: Record<LinceLogoFashion, string> = {
  filled: "filled (theme)",
  filledWhite: "filledWhite",
  filledInk: "filledInk",
  outlined: "outlined",
  tile: "tile",
}

const PULSE_LABELS: Record<LincePulseShapePattern, string> = {
  none: "none",
  "quarter-circle": "quarter-circle",
  "half-circle": "half-circle",
  "full-circle": "full-circle",
}

const ANIMATION_LABELS: Record<LincePulseAnimation, string> = {
  static: "static",
  animated: "animated",
}

export function LinceMarkLab({
  value,
  onChange,
}: {
  value: LinceMarkOptions
  onChange: (value: LinceMarkOptions) => void
}) {
  const { logoShape, logoFashion, pulseShapePattern, pulseAnimation, monochrome } = value
  const handleShapeChange = (shape: LinceLogoShape) => {
    onChange({ ...getLinceMarkDefaults(shape), monochrome })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Mark · shape, pulse & fashion</CardTitle>
        <CardDescription>
          Explore animal and geometric marks. Shape selection loads its suggested fashion and pulse. Save changes to
          apply the mark across the app, favicon, install icons and shared images.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {(["navy", "paper"] as const).map((theme) => (
            <MarkPreviewSurface
              key={theme}
              theme={theme}
              className="flex min-w-0 flex-col items-center gap-5 border px-2 py-5"
            >
              <span className="text-[11px] tracking-wide uppercase">{theme}</span>
              <LinceMark {...value} className="size-20" />
              <div className="flex w-full flex-wrap items-end justify-around gap-x-3 gap-y-4 pt-2">
                {[16, 24, 28, 32].map((size) => (
                  <div
                    key={size}
                    className="flex flex-col items-center gap-2"
                    aria-label={`${size} pixel ${theme} preview`}
                  >
                    <LinceMark {...value} width={size} height={size} />
                    <span className="text-[11px]">{size}px</span>
                  </div>
                ))}
              </div>
            </MarkPreviewSurface>
          ))}
        </div>

        <PropGroup
          legend="logoShape"
          options={LINCE_LOGO_SHAPES}
          labels={SHAPE_LABELS}
          value={logoShape}
          onChange={handleShapeChange}
        />
        <PropGroup
          legend="logoFashion"
          options={LINCE_LOGO_FASHIONS}
          labels={FASHION_LABELS}
          value={logoFashion}
          onChange={(logoFashion) => onChange({ ...value, logoFashion })}
        />
        <PropGroup
          legend="pulseShapePattern"
          options={LINCE_PULSE_SHAPE_PATTERNS}
          labels={PULSE_LABELS}
          value={pulseShapePattern}
          onChange={(pulseShapePattern) => onChange({ ...value, pulseShapePattern })}
        />
        <PropGroup
          legend="pulseAnimation"
          options={LINCE_PULSE_ANIMATIONS}
          labels={ANIMATION_LABELS}
          value={pulseAnimation}
          onChange={(pulseAnimation) => onChange({ ...value, pulseAnimation })}
          disabled={logoFashion === "tile" || pulseShapePattern === "none"}
        />

        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={monochrome}
            onChange={(event) => onChange({ ...value, monochrome: event.target.checked })}
            className="accent-primary size-4"
          />
          One ink, no glow
        </label>

        {logoFashion === "tile" && <p className="text-muted-foreground text-xs">App tiles omit the outer pulse.</p>}

        <code className="bg-muted block p-2 text-xs leading-relaxed break-words whitespace-pre-wrap">
          {`<LinceMark logoShape="${logoShape}" logoFashion="${logoFashion}" pulseShapePattern="${pulseShapePattern}" pulseAnimation="${pulseAnimation}" monochrome={${monochrome}} />`}
        </code>
      </CardContent>
    </Card>
  )
}

function PropGroup<T extends string>({
  legend,
  options,
  labels,
  value,
  onChange,
  disabled = false,
}: {
  legend: string
  options: readonly T[]
  labels: Record<T, string>
  value: T
  onChange: (next: T) => void
  disabled?: boolean
}) {
  return (
    <fieldset disabled={disabled} className={cn("flex flex-col gap-1.5", disabled && "opacity-50")}>
      <legend className="text-muted-foreground font-mono text-[11px]">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={value === option ? "primary-soft" : "outline"}
            className="min-h-11 px-3 text-xs sm:min-h-9"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {labels[option]}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
