"use client"

import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import type { PerStoreStats } from "@/lib/queries/home-stats"

function formatCount(n: number): string {
  return n.toLocaleString("pt-PT")
}

export function StoreOverviewCards({
  perStore,
  variant = "grid",
  className,
}: {
  perStore: PerStoreStats[]
  variant?: "grid" | "stack"
  className?: string
}) {
  if (perStore.length === 0) return null

  if (variant === "stack") {
    return (
      <div className={cn("flex h-full flex-col gap-4", className)}>
        {perStore.map((store) => (
          <Link
            key={store.originId}
            href={`/products?origin=${store.originId}`}
            className={cn(
              "group hover:bg-foreground/5 dark:hover:bg-foreground/10 bg-foreground/1 dark:bg-foreground/1 flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-center transition-colors",
            )}
          >
            <SupermarketChainBadge originId={store.originId} variant="logo" className="h-4 w-auto" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular-nums">{formatCount(store.total)}</span>
              <span className="text-muted-foreground text-xs">products</span>
            </div>
            {store.onDiscount > 0 && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCount(store.onDiscount)} on sale
              </span>
            )}
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">Stores we track</p>
      <div className="grid flex-1 grid-cols-3 gap-3">
        {perStore.map((store) => (
          <Link
            key={store.originId}
            href={`/products?origin=${store.originId}`}
            className="bg-card/80 group flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-5 text-center backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-md"
          >
            <SupermarketChainBadge originId={store.originId} variant="logo" className="h-5 w-auto" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold tabular-nums">{formatCount(store.total)}</span>
              <span className="text-muted-foreground text-xs">products</span>
            </div>
            {store.onDiscount > 0 && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCount(store.onDiscount)} on sale
              </span>
            )}
            <span className="text-muted-foreground flex items-center gap-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">
              Browse <ArrowRightIcon className="size-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
