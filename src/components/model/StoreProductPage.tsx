"use client"

import axios from "axios"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { FrontendStatus } from "@/types/extra"
import type { StoreProduct } from "@/types"
import { discountValueToPercentage } from "@/lib/utils"
import {
  Undo2Icon,
  HeartIcon,
  InfoIcon,
  NavigationIcon,
  NavigationOffIcon,
  EllipsisVerticalIcon,
  RefreshCcwIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ShareButton } from "@/components/ui/combo/ShareButton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SkeletonStatusError, SkeletonStatusLoaded } from "@/components/ui/combo/Loading"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { Code } from "@/components/Code"
import { ProductChart } from "@/components/model/ProductChart"
import { resolveSupermarketChain } from "@/components/model/Supermarket"
import { RelatedStoreProducts } from "@/components/model/RelatedStoreProducts"
import { useStoreProduct, useUpdateStoreProduct } from "@/hooks/useProducts"
import { LoadingIcon } from "../icons/LoadingIcon"

export function StoreProductPageById({ id }: { id: string }) {
  const [status, setStatus] = useState<FrontendStatus>(FrontendStatus.Loading)
  const [storeProduct, setStoreProduct] = useState<StoreProduct | null>(null)

  async function fetchProduct(id: string) {
    setStatus(FrontendStatus.Loading)
    const response = await axios.get(`/api/products/store/${id}`)
    setStoreProduct(response.data)
    setStatus(FrontendStatus.Loaded)
  }

  useEffect(() => {
    if (!id) return

    fetchProduct(id as string)
  }, [id])

  if (status === FrontendStatus.Loading) {
    return <StoreProductPageSkeleton />
  }

  if (status === FrontendStatus.Error) {
    return (
      <SkeletonStatusError>
        <p>Error loading store product {id}</p>
      </SkeletonStatusError>
    )
  }

  if (!storeProduct) {
    return (
      <SkeletonStatusLoaded>
        <p>Supermarket product {id} not found</p>
      </SkeletonStatusLoaded>
    )
  }

  return <StoreProductPage sp={storeProduct} />
}

export function StoreProductPage({ sp }: { sp: StoreProduct }) {
  const { data: storeProduct, isLoading } = useStoreProduct(sp.id!.toString())
  const updateStoreProduct = useUpdateStoreProduct()
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)

  if (isLoading) return <p>Loading...</p>
  if (!storeProduct) return <p>No product found.</p>

  const supermarketChain = resolveSupermarketChain(sp?.origin_id)

  const isPriceNotSet = !sp.price_recommended && !sp.price
  const hasDiscount = sp.price_recommended && sp.price && sp.price_recommended !== sp.price
  const isNormalPrice =
    (!sp.price_recommended && sp.price) || (sp.price_recommended && sp.price && sp.price_recommended === sp.price)

  return (
    <div className="mx-auto mb-8 flex w-full max-w-6xl flex-col py-0 lg:py-4">
      <div className="flex w-min">
        <Button variant="ghost" className="mb-2" asChild size="sm">
          <Link href="javascript:history.back()">
            <Undo2Icon className="h-4 w-4" />
            Back to supermarket products
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
          {sp.image ? (
            <Image
              src={sp.image || "/placeholder.svg"}
              alt={sp.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <p className="text-muted-foreground">No image available</p>
            </div>
          )}

          {sp.discount ? (
            <Badge variant="destructive" size="xs" roundedness="sm" className="w-fit">
              -{discountValueToPercentage(sp.discount)}
            </Badge>
          ) : null}
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-2">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="blue">{sp.brand}</Badge>

              {sp.is_tracked ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="success">
                        <NavigationIcon className="h-4 w-4" />
                        Tracked
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      sideOffset={6}
                      alignOffset={-6}
                      size="xs"
                      variant="glass"
                      className="max-w-60"
                    >
                      Prices for this product on this store chain are being tracked by Price Lens.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline-destructive">
                        <NavigationOffIcon className="h-4 w-4" />
                        Not tracked
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      sideOffset={6}
                      alignOffset={-6}
                      size="xs"
                      variant="destructive"
                      className="max-w-60"
                    >
                      <p>Prices for this product on this store chain are NOT being tracked by Price Lens.</p>
                      <p className="mt-2 font-bold">Add to your favorites to request tracking.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* {sp.is_essential ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="retail">Essential</Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      sideOffset={6}
                      alignOffset={-6}
                      size="xs"
                      variant="glass"
                      className="max-w-60"
                    >
                      This product is part of the inflation basket and is considered essential.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary">Non-essential</Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      sideOffset={6}
                      alignOffset={-6}
                      size="xs"
                      variant="glass"
                      className="max-w-60"
                    >
                      This product is not part of the inflation basket and is not considered essential.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )} */}

              <Button variant="outline" size="sm" roundedness="2xl" asChild>
                <Link href={sp.url} target="_blank" rel="noreferrer noopener">
                  {supermarketChain?.logo}
                </Link>
              </Button>
            </div>

            <h1 className="line-clamp-3 text-2xl font-bold md:line-clamp-2">{sp.name}</h1>
            {sp.pack && <p className="text-muted-foreground">{sp.pack}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-xl font-bold text-green-800 dark:text-green-600">{sp.price}€</span>
                <span className="text-base text-zinc-500 line-through dark:text-zinc-400">{sp.price_recommended}€</span>
              </>
            ) : null}

            {isNormalPrice ? (
              <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">{sp.price}€</span>
            ) : null}

            {isPriceNotSet ? <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">€€€€</span> : null}
          </div>

          <div className="flex items-center gap-2">
            {sp.price_per_major_unit && sp.major_unit ? (
              <Badge variant="price-per-unit" size="xs" roundedness="sm" className="w-fit">
                {sp.price_per_major_unit}€{sp.major_unit}
              </Badge>
            ) : null}
            {sp.discount ? (
              <Badge variant="destructive" size="xs" roundedness="sm" className="w-fit">
                -{discountValueToPercentage(sp.discount)}
              </Badge>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <HeartIcon className="h-4 w-4" />
              Add to favorites
            </Button>
            <ShareButton url={sp.url} title={sp.name} description={sp.name} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm">
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Drawer open={isDetailsDrawerOpen} onOpenChange={setIsDetailsDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="dropdown-item" className="flex items-center justify-start gap-2 hover:bg-accent">
                        <InfoIcon className="h-4 w-4" />
                        Store product details
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="overflow-y-auto">
                      <DrawerHeader className="text-left">
                        <DrawerTitle>Details</DrawerTitle>
                        <DrawerDescription>Inspect store product data</DrawerDescription>
                      </DrawerHeader>

                      <div className="max-w-md px-4">
                        <Code code={JSON.stringify(sp, null, 2)} language="json" />
                      </div>
                    </DrawerContent>
                  </Drawer>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Button
                    variant="dropdown-item"
                    className="flex items-center justify-start gap-2 hover:bg-accent"
                    onClick={() => updateStoreProduct.mutate(storeProduct)}
                    disabled={updateStoreProduct.isPending}
                  >
                    {updateStoreProduct.isPending ? <LoadingIcon /> : <RefreshCcwIcon className="h-4 w-4" />}
                    Update from source store
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 flex-1">
            <ProductChart
              sp={sp}
              options={{
                showPricesVariationCard: true,
                showImage: false,
              }}
            />
          </div>
        </div>
      </div>

      <RelatedStoreProducts id={sp.id?.toString() || ""} />
    </div>
  )
}

export function StoreProductPageSkeleton() {
  return (
    <div className="mx-auto mb-8 flex w-full max-w-6xl flex-col py-0 lg:py-4">
      <div className="mb-4 flex w-min">
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg border">
          <Skeleton className="h-full w-full" />
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>

            <Skeleton className="mb-2 h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9" />
          </div>

          <div className="flex-1">
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Skeleton className="h-[200px] w-full" />
      </div>
    </div>
  )
}
