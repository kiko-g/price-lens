import { cn } from "@/lib/utils"
import { SMART_VIEW_PRESETS } from "@/lib/business/filters"
import { type SortByType } from "@/types/business"
import { Input } from "@/components/ui/input"
import { Loader2Icon } from "lucide-react"

const PRICE_RANGE_CHIPS = [
  { label: "Under 2€", min: "", max: "2" },
  { label: "2-5€", min: "2", max: "5" },
  { label: "5-10€", min: "5", max: "10" },
  { label: "10€+", min: "10", max: "" },
] as const

export function PriceRangeFilter({
  priceMin,
  priceMax,
  onChange,
  className,
}: {
  priceMin: string
  priceMax: string
  onChange: (min: string, max: string) => void
  className?: string
}) {
  const activeChipIdx = PRICE_RANGE_CHIPS.findIndex((c) => c.min === priceMin && c.max === priceMax)

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-1.5">
        {PRICE_RANGE_CHIPS.map((chip, idx) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => {
              if (activeChipIdx === idx) onChange("", "")
              else {
                onChange(chip.min, chip.max)
              }
            }}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              activeChipIdx === idx
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground hover:bg-accent border-border",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          className="h-8 max-w-[33%] text-xs md:h-7 md:max-w-full"
          value={priceMin}
          min={0}
          step={0.5}
          onChange={(e) => onChange(e.target.value, priceMax)}
        />
        <span className="text-muted-foreground text-xs">–</span>
        <Input
          type="number"
          placeholder="Max"
          className="h-8 max-w-[33%] text-xs md:h-7 md:max-w-full"
          value={priceMax}
          min={0}
          step={0.5}
          onChange={(e) => onChange(priceMin, e.target.value)}
        />
      </div>
    </div>
  )
}

export function SmartViewPresets({
  urlState,
  isLoading,
  onApply,
}: {
  urlState: { sortBy: SortByType; onlyDiscounted: boolean; priority: string; query: string }
  isLoading?: boolean
  onApply: (params: Record<string, string | number | boolean | null>) => void
}) {
  const isPresetActive = (preset: (typeof SMART_VIEW_PRESETS)[number]) => {
    return Object.entries(preset.params).every(([key, value]) => {
      if (key === "sort") return urlState.sortBy === value
      if (key === "discounted") return urlState.onlyDiscounted === (value === "true")
      if (key === "priority") return urlState.priority === value
      return false
    })
  }

  return (
    <div className="no-scrollbar mb-3 flex h-8 max-h-8 min-h-8 flex-1 gap-2 self-stretch overflow-x-auto">
      {SMART_VIEW_PRESETS.map((preset) => {
        const active = isPresetActive(preset)
        return (
          <button
            key={preset.label}
            onClick={() => {
              if (active) {
                const revert: Record<string, null> = {}
                for (const key of Object.keys(preset.params)) {
                  revert[key] = null
                }
                onApply(revert)
              } else {
                onApply(preset.params as Record<string, string>)
              }
            }}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "from-primary/80 to-secondary/80 text-primary-foreground shadow-primary/25 dark:from-primary/60 dark:to-secondary/60 dark:shadow-primary/15 bg-linear-to-br shadow-none"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:text-foreground dark:bg-muted dark:hover:bg-accent",
            )}
          >
            {active && isLoading ? (
              <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <preset.icon className="h-3.5 w-3.5" />
            )}
            {preset.label}
          </button>
        )
      })}
    </div>
  )
}
