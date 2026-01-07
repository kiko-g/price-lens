"use client"

interface BarcodeProps {
  value: string | null
  width?: number
  height?: number
  displayValue?: boolean
  showMissingValue?: boolean
}

export function Barcode({
  value = "012345678905",
  width = 2,
  height = 60,
  displayValue = true,
  showMissingValue = false,
}: BarcodeProps) {
  if (showMissingValue && !value) {
    return (
      <div className="inline-flex flex-col items-center gap-1">
        <span className="text-muted-foreground font-mono text-xs tracking-wider">No barcode available</span>
      </div>
    )
  }

  if (!value) return null

  // Generate bar pattern from the value
  // Using a simple encoding pattern (each digit creates a bar pattern)
  const generateBars = (val: string) => {
    const patterns = [
      "0001101",
      "0011001",
      "0010011",
      "0111101",
      "0100011",
      "0110001",
      "0101111",
      "0111011",
      "0110111",
      "0001011",
    ]

    let bars = "101" // Start guard

    for (let i = 0; i < val.length; i++) {
      const digit = Number.parseInt(val[i]) || 0
      bars += patterns[digit]
    }

    bars += "101" // End guard

    return bars
  }

  const barPattern = generateBars(value)

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg
        viewBox={`0 0 ${barPattern.length * width} ${height}`}
        className="bg-white"
        style={{ width: `${barPattern.length * width}px`, height: `${height}px` }}
      >
        {barPattern
          .split("")
          .map(
            (bar, index) =>
              bar === "1" && <rect key={index} x={index * width} y={0} width={width} height={height} fill="black" />,
          )}
      </svg>
      {displayValue && <span className="font-mono text-xs tracking-wider">{value}</span>}
    </div>
  )
}
