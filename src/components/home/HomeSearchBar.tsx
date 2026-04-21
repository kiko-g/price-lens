"use client"

import { useTranslations } from "next-intl"
import { SearchIcon, ScanBarcodeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { SearchContainer } from "@/components/layout/search"
import { BarcodeScanButton } from "@/components/scan"

function formatProductCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k+`
  if (n > 0) return `${n}`
  return ""
}

export function HomeSearchBar({ totalProducts = 0 }: { totalProducts?: number }) {
  const countLabel = formatProductCount(totalProducts)
  const t = useTranslations("home.searchBar")
  const tBottom = useTranslations("layout.bottomNav")
  const placeholder = countLabel ? t("placeholderWithCount", { count: countLabel }) : t("placeholder")

  return (
    <div className="flex w-full items-center gap-2.5">
      <div className="relative min-w-0 flex-1">
        <SearchContainer registerKeyboardShortcut={false}>
          <button
            type="button"
            className="bg-card hover:bg-accent/50 relative flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3.5 transition-colors max-[420px]:py-3 md:gap-3 md:px-4 md:py-3.5"
          >
            <SearchIcon className="text-muted-foreground size-5 shrink-0" />
            <span className="text-muted-foreground flex-1 text-left text-sm">{placeholder}</span>
          </button>
        </SearchContainer>
      </div>

      <BarcodeScanButton>
        <button
          type="button"
          aria-label={t("scanBarcode")}
          className={cn(
            "bg-card hover:bg-accent/50 flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border transition-colors",
            "max-[420px]:size-11 max-[420px]:justify-center max-[420px]:p-0",
            "min-[421px]:px-3.5 min-[421px]:py-3.5",
          )}
        >
          <ScanBarcodeIcon className="sm:text-muted-foreground text-foreground size-5 shrink-0" />
          <span className="text-foreground sm:text-muted-foreground hidden text-sm sm:inline-flex">
            {t("scanBarcode")}
          </span>
          <span className="text-foreground sm:text-muted-foreground inline-flex text-sm max-[420px]:hidden sm:hidden">
            {tBottom("scan")}
          </span>
        </button>
      </BarcodeScanButton>
    </div>
  )
}
