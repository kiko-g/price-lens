import { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"

import type { StoreProduct } from "@/types"
import { useRelatedStoreProducts } from "@/hooks/useProducts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorStateView, EmptyStateView } from "@/components/ui/combo/state-views"
import { StoreProductCard } from "@/components/products/StoreProductCard"
import { StoreProductCardSkeleton } from "@/components/products/skeletons/StoreProductCardSkeleton"

import { ArrowLeftIcon, ArrowRightIcon, ChartScatterIcon } from "lucide-react"

const SKELETON_COUNT = 6
const SLIDE_CLASS = "min-w-0 shrink-0 pl-4 basis-[46%] sm:basis-2/5 md:basis-1/3 lg:basis-1/5 xl:basis-1/6"

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

      <div className="overflow-hidden">
        <div className="-ml-4 flex">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className={SLIDE_CLASS}>
              <StoreProductCardSkeleton />
            </div>
          ))}
        </div>
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
    return <ErrorStateView error={error} title="Failed to load related products" />
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!products || products.length === 0) {
    return (
      <div className="animate-fade-in-fast min-h-[200px] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ChartScatterIcon className="h-5 w-5" />
            Related Products
          </h3>
        </div>

        <EmptyStateView
          title="No related products found"
          message="We couldn't find related products for this item right now. Check back later as our catalog updates regularly."
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in-fast space-y-4">
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
        <div className="-ml-4 flex">
          {products.map((product: StoreProduct) => (
            <div key={product.id} className={SLIDE_CLASS}>
              <StoreProductCard sp={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
