import { cn } from "@/lib/utils"
import { TriangleIcon, EqualIcon } from "lucide-react"

export function PriceChange({ variation, invertColors }: { variation: number; invertColors?: boolean }) {
  const percentage = variation === 0 ? 0 : (variation * 100).toFixed(1)
  const positiveSign = variation > 0 ? "+" : ""

  const textColor = invertColors
    ? variation < 0
      ? "text-red-500"
      : variation > 0
        ? "text-green-500"
        : "text-muted-foreground"
    : variation < 0
      ? "text-green-500"
      : variation > 0
        ? "text-red-500"
        : "text-muted-foreground"

  const triangleColor = invertColors
    ? variation < 0
      ? "rotate-180 fill-red-500 stroke-red-500"
      : "fill-green-500 stroke-green-500"
    : variation < 0
      ? "rotate-180 fill-green-500 stroke-green-500"
      : "fill-red-500 stroke-red-500"

  return (
    <div className="flex min-w-16 items-center justify-end gap-1">
      <span className={cn(textColor)}>
        {positiveSign}
        {percentage}%
      </span>
      {variation === 0 ? (
        <EqualIcon className="text-muted-foreground h-3 w-3" />
      ) : (
        <TriangleIcon className={cn("h-3 w-3", triangleColor)} />
      )}
    </div>
  )
}
