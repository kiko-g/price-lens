import type { StoreProduct } from "@/types"
import { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { useRelatedStoreProducts } from "@/hooks/useProducts"

import { Button } from "@/components/ui/button"
import { StoreProductCard } from "@/components/model/StoreProductCard"

import { ArrowLeftIcon, ArrowRightIcon, Loader2Icon } from "lucide-react"

interface RelatedStoreProductsProps {
  id: string
  limit?: number
  title?: string
}

export function RelatedStoreProducts({ id, limit = 8 }: RelatedStoreProductsProps) {
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p>Failed to load related products. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">Related Products</h3>
        {!isLoading && products.length > 0 && (
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
        )}
      </div>

      {isLoading ? (
        <div className="flex h-[300px] items-center justify-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border p-4 text-center text-muted-foreground">
          <p>No related products found.</p>
        </div>
      ) : (
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {products.map((product: StoreProduct) => (
              <div key={product.id} className="min-w-[220px] flex-[0_0_220px] pl-4 first:pl-0">
                <StoreProductCard key={product.id} sp={product} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
