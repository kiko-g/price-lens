"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import type { PerStoreStats } from "@/lib/queries/home-stats"

function formatCount(n: number): string {
  return n.toLocaleString("pt-PT")
}

export function ChainQuickFilters({ perStore, className }: { perStore: PerStoreStats[]; className?: string }) {
  if (perStore.length === 0) return null

  return (
    <div className={cn("grid w-full grid-cols-3 gap-1.5 sm:gap-2", className)}>
      {perStore.map((store) => (
        <Link
          key={store.originId}
          href={`/products?origin=${store.originId}`}
          className="bg-card/80 hover:bg-accent flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-2 text-center backdrop-blur-sm transition-colors sm:min-h-0 sm:px-2 sm:py-2.5"
        >
          <SupermarketChainBadge originId={store.originId} variant="logo" className="h-4 w-auto" />
          <div className="flex flex-col items-center">
            <span className="text-xs leading-snug font-bold tabular-nums sm:text-sm">{formatCount(store.total)}</span>
            <span className="text-muted-foreground text-[9px] sm:text-[10px]">products</span>
          </div>
          {store.onDiscount > 0 && (
            <span className="text-[9px] font-semibold leading-tight text-emerald-600 sm:text-[10px] dark:text-emerald-400">
              {formatCount(store.onDiscount)} on sale
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
