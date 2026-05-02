"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { LAST_BARCODE_LOOKUP_STORAGE_KEY } from "@/lib/barcode-scan-storage"
import { Loader2Icon, ScanBarcodeIcon, SearchIcon } from "lucide-react"

export function BarcodeRouteLoading() {
  const [elapsed, setElapsed] = useState(0)
  const [storedCode, setStoredCode] = useState<string | null>(null)
  const t = useTranslations("products.barcodeNav")

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_BARCODE_LOOKUP_STORAGE_KEY)
      if (raw) setStoredCode(raw)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex min-h-[50dvh] w-full flex-col items-center justify-center gap-5 px-4 py-12 text-center">
      <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
        <ScanBarcodeIcon className="text-primary h-7 w-7" aria-hidden />
      </div>

      <div className="flex max-w-md flex-col items-center gap-2">
        <p className="flex items-center justify-center gap-2 text-lg font-semibold tracking-tight">
          <Loader2Icon className="text-primary h-5 w-5 animate-spin shrink-0" aria-hidden />
          {t("title")}
        </p>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        {storedCode ? (
          <p className="bg-muted/80 mt-1 rounded-md px-3 py-1.5 font-mono text-sm font-medium tracking-tight">{storedCode}</p>
        ) : null}
      </div>

      {elapsed >= 5 && elapsed < 12 && (
        <p className="text-muted-foreground animate-in fade-in slide-in-from-top-1 max-w-sm text-xs">{t("takingLong")}</p>
      )}

      {elapsed >= 12 && (
        <div className="animate-in fade-in slide-in-from-top-1 flex max-w-sm flex-col items-center gap-2">
          <p className="text-muted-foreground text-xs">{t("stillWaiting")}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {storedCode ? (
              <Link
                href={`/products?q=${encodeURIComponent(storedCode)}`}
                className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                <SearchIcon className="h-3 w-3" />
                {t("searchOurs")}
              </Link>
            ) : (
              <Link href="/products" className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline">
                <SearchIcon className="h-3 w-3" />
                {t("browseProducts")}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
