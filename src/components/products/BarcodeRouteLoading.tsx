"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Barcode } from "@/components/ui/combo/barcode"
import { readLastBarcodeLookup } from "@/lib/barcode-scan-storage"
import { Loader2Icon, ScanBarcodeIcon, SearchIcon } from "lucide-react"

export function BarcodeRouteLoading() {
  const [elapsed, setElapsed] = useState(0)
  const [code, setCode] = useState<string | null>(() => readLastBarcodeLookup())
  const t = useTranslations("products.barcodeNav")

  useEffect(() => {
    setCode(readLastBarcodeLookup())
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex min-h-[50dvh] w-full flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
        <ScanBarcodeIcon className="text-primary h-7 w-7" aria-hidden />
      </div>

      <div className="flex max-w-md flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <p className="flex items-center justify-center gap-2 text-lg font-semibold tracking-tight">
            <Loader2Icon className="text-primary h-5 w-5 shrink-0 animate-spin" aria-hidden />
            {t("title")}
          </p>
          <p className="text-muted-foreground text-sm">{t("lookingForProducts")}</p>
        </div>

        {code ? (
          <Barcode
            value={code}
            height={32}
            width={1.8}
            className="rounded-md border bg-white p-3 shadow-sm dark:bg-white"
          />
        ) : (
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        )}
      </div>

      {elapsed >= 5 && elapsed < 12 && (
        <p className="text-muted-foreground animate-in fade-in slide-in-from-top-1 max-w-sm text-xs">
          {t("takingLong")}
        </p>
      )}

      {elapsed >= 12 && (
        <div className="animate-in fade-in slide-in-from-top-1 flex max-w-sm flex-col items-center gap-2">
          <p className="text-muted-foreground text-xs">{t("stillWaiting")}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {code ? (
              <Link
                href={`/products?q=${encodeURIComponent(code)}`}
                className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                <SearchIcon className="h-3 w-3" />
                {t("searchOurs")}
              </Link>
            ) : (
              <Link
                href="/products"
                className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
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
