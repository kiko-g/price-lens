"use client"

import { useState, type ReactNode } from "react"

import {
  LINCE_LOGO_FASHIONS,
  LINCE_LOGO_SHAPES,
  LINCE_PULSE_ANIMATIONS,
  LINCE_PULSE_SHAPE_PATTERNS,
  LinceMark,
  type LinceLogoFashion,
  type LinceLogoShape,
  type LincePulseAnimation,
  type LincePulseShapePattern,
} from "@/components/icons/LinceMark"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const SHAPE_LABELS: Record<LinceLogoShape, string> = {
  pal: "pal",
  angular: "angular",
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

export function LinceMarkLab() {
  const [logoShape, setLogoShape] = useState<LinceLogoShape>("pal")
  const [logoFashion, setLogoFashion] = useState<LinceLogoFashion>("filled")
  const [pulseShapePattern, setPulseShapePattern] = useState<LincePulseShapePattern>("quarter-circle")
  const [pulseAnimation, setPulseAnimation] = useState<LincePulseAnimation>("static")

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Mark · shape, pulse & fashion</CardTitle>
        <CardDescription>
          Pal is the sellable default (scan-eyes, your-side lynx). Angular is the sharp cut. Pulse and fashion layer on
          either shape.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <PreviewWell label="navy" className="bg-[#0b0f1a]">
            <LinceMark
              logoShape={logoShape}
              logoFashion={logoFashion}
              pulseShapePattern={pulseShapePattern}
              pulseAnimation={pulseAnimation}
              className="size-20"
            />
          </PreviewWell>
          <PreviewWell label="paper" className="bg-[#f6f3ee]">
            <LinceMark
              logoShape={logoShape}
              logoFashion={logoFashion}
              pulseShapePattern={pulseShapePattern}
              pulseAnimation={pulseAnimation}
              className="size-20"
            />
          </PreviewWell>
        </div>

        <PropGroup
          legend="logoShape"
          options={LINCE_LOGO_SHAPES}
          labels={SHAPE_LABELS}
          value={logoShape}
          onChange={setLogoShape}
        />
        <PropGroup
          legend="logoFashion"
          options={LINCE_LOGO_FASHIONS}
          labels={FASHION_LABELS}
          value={logoFashion}
          onChange={setLogoFashion}
        />
        <PropGroup
          legend="pulseShapePattern"
          options={LINCE_PULSE_SHAPE_PATTERNS}
          labels={PULSE_LABELS}
          value={pulseShapePattern}
          onChange={setPulseShapePattern}
        />
        <PropGroup
          legend="pulseAnimation"
          options={LINCE_PULSE_ANIMATIONS}
          labels={ANIMATION_LABELS}
          value={pulseAnimation}
          onChange={setPulseAnimation}
        />

        <code className="bg-muted block overflow-x-auto p-2 text-[11px] leading-relaxed">
          {`<LinceMark logoShape="${logoShape}" logoFashion="${logoFashion}" pulseShapePattern="${pulseShapePattern}" pulseAnimation="${pulseAnimation}" />`}
        </code>
      </CardContent>
    </Card>
  )
}

function PreviewWell({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 border px-2 py-4", className)}>
      {children}
      <span className={cn("text-[10px] tracking-wide uppercase", label === "navy" ? "text-zinc-400" : "text-zinc-600")}>
        {label}
      </span>
    </div>
  )
}

function PropGroup<T extends string>({
  legend,
  options,
  labels,
  value,
  onChange,
}: {
  legend: string
  options: readonly T[]
  labels: Record<T, string>
  value: T
  onChange: (next: T) => void
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-muted-foreground font-mono text-[11px]">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={value === option ? "primary-soft" : "outline"}
            className="h-7 px-2 text-[11px]"
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
