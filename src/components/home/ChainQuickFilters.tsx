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
    <div className={cn("grid w-full grid-cols-3 gap-2", className)}>
      {perStore.map((store) => (
        <Link
          key={store.originId}
          href={`/products?origin=${store.originId}`}
          className="bg-card/80 hover:bg-accent flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center backdrop-blur-sm transition-colors"
        >
          <SupermarketChainBadge originId={store.originId} variant="logo" className="h-4 w-auto" />
          <div className="flex flex-col items-center">
            <span className="text-sm leading-snug font-bold tabular-nums">{formatCount(store.total)}</span>
            <span className="text-muted-foreground text-[10px]">products</span>
          </div>
          {store.onDiscount > 0 && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCount(store.onDiscount)} on sale
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
