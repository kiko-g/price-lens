"use client"

type ProductBatchMilestoneProps = {
  /** Running count at this break (e.g. 20, 40) */
  loaded: number
}

/**
 * Full-width row inside the product grid (use with col-span-full) between batches
 * of `limit` items on mobile: in document flow, not a fixed overlay.
 */
export function ProductBatchMilestone({ loaded }: ProductBatchMilestoneProps) {
  return (
    <div className="col-span-full flex items-center gap-3 py-2 sm:gap-4">
      <div className="bg-border h-px min-w-0 flex-1" />
      <span
        className="text-muted-foreground shrink-0 text-[11px] font-medium tabular-nums"
        title={`${loaded} products loaded so far`}
      >
        {loaded} products
      </span>
      <div className="bg-border h-px min-w-0 flex-1" />
    </div>
  )
}
