import { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"

import type { StoreProduct } from "@/types"
import { useRelatedStoreProducts } from "@/hooks/useProducts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { StoreProductCard } from "@/components/products/StoreProductCard"

import { ArrowLeftIcon, ArrowRightIcon, ChartScatterIcon, SearchXIcon } from "lucide-react"

interface Props {
  id: string
  limit?: number
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[300px] min-w-[220px] flex-[0_0_220px] rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function RelatedStoreProducts({ id, limit = 10 }: Props) {
  const { data: products, isLoading, error } = useRelatedStoreProducts(id, limit)
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", skipSnaps: false })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev()
  const scrollNext = () => emblaApi && emblaApi.scrollNext()

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())
    }

    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    onSelect()

    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi])

  if (error) {
    return (
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-4">
        <p className="text-destructive text-sm">Failed to load related products. Please try again later.</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!products || products.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ChartScatterIcon className="h-5 w-5" />
            Related Products
          </h3>
        </div>

        <Empty className="border-border bg-muted/30 border py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon className="size-5" />
            </EmptyMedia>
            <EmptyTitle>No related products found</EmptyTitle>
            <EmptyDescription>
              We couldn{"'"}t find related products for this item right now. Check back later as our catalog updates
              regularly.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <ChartScatterIcon className="h-5 w-5" />
          Related Products
          <Badge variant="boring" size="xs">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </Badge>
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="sr-only">Previous slide</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={scrollNext}
            disabled={!canScrollNext}
          >
            <ArrowRightIcon className="h-4 w-4" />
            <span className="sr-only">Next slide</span>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {products.map((product: StoreProduct) => (
            <div key={product.id} className="min-w-[220px] flex-[0_0_220px] pl-4 first:pl-0">
              <StoreProductCard sp={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
