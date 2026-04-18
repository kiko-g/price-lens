"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Callout } from "@/components/ui/callout"
import { Skeleton } from "@/components/ui/skeleton"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"

import { BrainIcon, Loader2Icon, SearchIcon } from "lucide-react"

interface OffLookupSkeletonProps {
  barcode: string
}

export function OffLookupSkeleton({ barcode }: OffLookupSkeletonProps) {
  const [elapsed, setElapsed] = useState(0)
  const t = useTranslations("products.offLookup")

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mx-auto mb-8 flex w-full max-w-[1320px] flex-col px-4 pt-4 lg:py-4">
      <div className="mb-4 flex w-full max-w-full flex-col gap-2">
        <Callout variant="info" icon={BrainIcon} className="mb-3 w-full">
          <p className="text-sm">{t("notFoundCallout")}</p>
        </Callout>

        <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
          <Loader2Icon className="text-primary h-4 w-4 animate-spin" />
          <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
            {t.rich("lookingUp", {
              barcode,
              code: (chunks) => <span className="font-mono font-medium">{chunks}</span>,
              icon: () => <OpenFoodFactsIcon className="inline h-4 w-4" />,
            })}
          </p>
        </div>

        {elapsed >= 5 && elapsed < 12 && (
          <p className="text-muted-foreground animate-in fade-in slide-in-from-top-1 text-xs">{t("takingLong")}</p>
        )}

        {elapsed >= 12 && (
          <div className="animate-in fade-in slide-in-from-top-1 flex flex-col gap-1.5">
            <p className="text-muted-foreground text-xs">{t("stillWaiting")}</p>
            <Link
              href={`/products?q=${encodeURIComponent(barcode)}`}
              className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
            >
              <SearchIcon className="h-3 w-3" />
              {t("searchOurs")}
            </Link>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="mb-2 flex items-center gap-1 md:mb-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Desktop skeleton */}
      <div className="hidden w-full grid-cols-20 gap-8 md:grid">
        <div className="col-span-6 flex flex-col items-center">
          <Skeleton className="aspect-8/7 w-full rounded-lg" />
          <Skeleton className="mt-4 h-10 w-48" />
        </div>

        <div className="col-span-14 flex flex-col gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <Skeleton className="h-12 w-44 rounded-lg" />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-16 max-w-md rounded-lg" />
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="flex flex-col gap-2.5 md:hidden">
        <Skeleton className="aspect-6/5 w-full max-w-lg rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-6 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <Skeleton className="h-12 w-44 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  )
}
