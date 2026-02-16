import Link from "next/link"

import { cn } from "@/lib/utils"
import type { StoreProduct } from "@/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { ChevronRightIcon } from "lucide-react"

type CategorySegment = {
  name: string
  href?: string
}

function buildSegments(sp: StoreProduct): CategorySegment[] {
  if (sp.canonical_category_name) {
    const segments: CategorySegment[] = []
    if (sp.canonical_category_name_3) {
      segments.push({
        name: sp.canonical_category_name_3,
        href: sp.canonical_parent_id_2 ? `/products?category=${sp.canonical_parent_id_2}` : undefined,
      })
    }
    if (sp.canonical_category_name_2) {
      segments.push({
        name: sp.canonical_category_name_2,
        href: sp.canonical_parent_id ? `/products?category=${sp.canonical_parent_id}` : undefined,
      })
    }
    segments.push({
      name: sp.canonical_category_name,
      href: sp.canonical_category_id ? `/products?category=${sp.canonical_category_id}` : undefined,
    })
    return segments
  }

  // fallback to raw store categories (no links)
  const segments: CategorySegment[] = []
  if (sp.category) segments.push({ name: sp.category })
  if (sp.category_2) segments.push({ name: sp.category_2 })
  if (sp.category_3) segments.push({ name: sp.category_3 })
  return segments
}

function buildOriginalCategoryText(sp: StoreProduct): string | null {
  if (!sp.category) return null
  return `${sp.category}${sp.category_2 ? ` > ${sp.category_2}` : ""}${sp.category_3 ? ` > ${sp.category_3}` : ""}`
}

interface CategoryBreadcrumbProps {
  sp: StoreProduct
  className?: string
}

export function CategoryBreadcrumb({ sp, className }: CategoryBreadcrumbProps) {
  const segments = buildSegments(sp)
  if (segments.length === 0) return null

  const originalCategoryText = buildOriginalCategoryText(sp)
  const hasCanonical = !!sp.canonical_category_name

  return (
    <nav aria-label="Product category" className={cn("flex items-center gap-1 overflow-hidden", className)}>
      <ol className="flex items-center gap-0.5 overflow-hidden text-xs md:text-sm">
        {segments.map((segment, i) => (
          <li key={i} className="flex items-center gap-0.5">
            {i > 0 && <ChevronRightIcon className="text-muted-foreground h-3 w-3 shrink-0" />}
            {i === segments.length - 1 && hasCanonical && originalCategoryText ? (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BreadcrumbSegment segment={segment} isLast={true} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" sideOffset={6}>
                    <div className="flex flex-col gap-0">
                      <span className="mb-1 flex items-center gap-1 text-xs font-medium">
                        Original hierarchy in{" "}
                        <span className="inline-flex items-center justify-center rounded-full bg-white px-1.5 py-0.5">
                          <SupermarketChainBadge originId={sp.origin_id} variant="logoSmall" />
                        </span>
                      </span>
                      <span className="font-bold">{originalCategoryText}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <BreadcrumbSegment segment={segment} isLast={i === segments.length - 1} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function BreadcrumbSegment({ segment, isLast }: { segment: CategorySegment; isLast: boolean }) {
  const baseClass = cn(
    "truncate transition-colors hover:underline",
    isLast ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
  )

  if (segment.href) {
    return (
      <Link href={segment.href} className={baseClass}>
        {segment.name}
      </Link>
    )
  }

  return <span className={baseClass}>{segment.name}</span>
}
