import type React from "react"
import { useId } from "react"
import { cn } from "@/lib/utils"

export interface GridPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  squares?: Array<[x: number, y: number]>
  strokeDasharray?: string
  className?: string
  variant?: "grid" | "diagonal" | "diagonal-crossed"
  [key: string]: unknown
}

export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = "0",
  squares,
  className,
  variant = "grid",
  ...props
}: GridPatternProps) {
  const id = useId()

  const getPatternPath = () => {
    switch (variant) {
      case "diagonal":
        return `M0 0 L${width} ${height}`
      case "diagonal-crossed":
        return `M0 0 L${width} ${height} M${width} 0 L0 ${height}`
      case "grid":
      default:
        return `M.5 ${height}V.5H${width}`
    }
  }

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/20 stroke-gray-400/20",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={getPatternPath()} fill="none" strokeDasharray={strokeDasharray} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}`}
              width={width - 1}
              height={height - 1}
              x={x * width + 1}
              y={y * height + 1}
            />
          ))}
        </svg>
      )}
    </svg>
  )
}
