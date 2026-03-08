"use client"

import { SearchIcon, ScanBarcodeIcon } from "lucide-react"
import { SearchContainer } from "@/components/layout/search"
import { BarcodeScanButton } from "@/components/scan"

export function HomeSearchBar() {
  return (
    <div className="flex w-full items-center gap-3">
      <div className="min-w-0 flex-1">
        <SearchContainer registerKeyboardShortcut={false}>
          <button
            type="button"
            className="bg-card hover:bg-accent/50 flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-colors"
          >
            <SearchIcon className="text-muted-foreground size-5 shrink-0" />
            <span className="text-muted-foreground flex-1 text-left text-sm">Search products...</span>
          </button>
        </SearchContainer>
      </div>

      <BarcodeScanButton>
        <button
          type="button"
          className="bg-card hover:bg-accent/50 flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-sm transition-colors"
        >
          <ScanBarcodeIcon className="text-muted-foreground size-5" />
        </button>
      </BarcodeScanButton>
    </div>
  )
}
