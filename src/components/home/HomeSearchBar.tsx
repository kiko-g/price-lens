"use client"

import { SearchIcon, ScanBarcodeIcon } from "lucide-react"
import { SearchContainer } from "@/components/layout/search"
import { BarcodeScanButton } from "@/components/scan"

function formatProductCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k+`
  if (n > 0) return `${n}`
  return ""
}

export function HomeSearchBar({ totalProducts = 0 }: { totalProducts?: number }) {
  const countLabel = formatProductCount(totalProducts)
  const placeholder = countLabel ? `Search ${countLabel} products...` : "Search products..."

  return (
    <div className="flex w-full items-center gap-2.5">
      <div className="relative min-w-0 flex-1">
        <SearchContainer registerKeyboardShortcut={false}>
          <button
            type="button"
            className="bg-card hover:bg-accent/50 relative flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-4 transition-colors md:py-3.5"
            style={{
              boxShadow:
                "0 0 16px color-mix(in oklch, var(--primary) 12%, transparent), 0 0 4px color-mix(in oklch, var(--secondary) 8%, transparent)",
            }}
          >
            <SearchIcon className="text-muted-foreground size-5 shrink-0" />
            <span className="text-muted-foreground flex-1 text-left text-sm">{placeholder}</span>
          </button>
        </SearchContainer>
      </div>

      <BarcodeScanButton>
        <button
          type="button"
          className="bg-card hover:bg-accent/50 flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-4 transition-colors md:py-3.5"
          style={{
            boxShadow:
              "0 0 16px color-mix(in oklch, var(--secondary) 12%, transparent), 0 0 4px color-mix(in oklch, var(--primary) 8%, transparent)",
          }}
        >
          <ScanBarcodeIcon className="sm:text-muted-foreground text-foreground size-5" />
          <span className="sm:text-muted-foreground text-foreground hidden text-sm sm:inline-flex">Scan barcode</span>
          <span className="sm:text-muted-foreground text-foreground inline-flex text-sm sm:hidden">Scan</span>
        </button>
      </BarcodeScanButton>
    </div>
  )
}
