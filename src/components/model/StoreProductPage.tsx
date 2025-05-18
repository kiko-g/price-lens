"use client"

import axios from "axios"
import Image from "next/image"
import Link from "next/link"
import { Metadata } from "next"
import { useEffect, useState } from "react"
import { FrontendStatus } from "@/types/extra"
import type { StoreProduct } from "@/types"
import { siteConfig } from "@/lib/config"
import { discountValueToPercentage, formatTimestamptz } from "@/lib/utils"
import { Undo2Icon, HeartIcon, Share2Icon, ExternalLinkIcon, InfoIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShareButton } from "@/components/ui/combo/ShareButton"
import { SkeletonStatusError, SkeletonStatusLoaded, SkeletonStatusLoading } from "@/components/ui/combo/Loading"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { Code } from "../Code"
import { ProductChart } from "./ProductChart"
import { resolveSupermarketChain } from "./Supermarket"

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
    return (
      <SkeletonStatusLoading>
        <p>Loading store product {id}...</p>
      </SkeletonStatusLoading>
    )
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

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 680,
        alt: siteConfig.name,
      },
    ],
  },
}

export function StoreProductPage({ sp }: { sp: StoreProduct }) {
  if (!sp) return null

  const supermarketChain = resolveSupermarketChain(sp)

  const isPriceNotSet = !sp.price_recommended && !sp.price
  const hasDiscount = sp.price_recommended && sp.price && sp.price_recommended !== sp.price
  const isNormalPrice =
    (!sp.price_recommended && sp.price) || (sp.price_recommended && sp.price && sp.price_recommended === sp.price)

  const categoryText = sp.category
    ? `${sp.category}${sp.category_2 ? ` > ${sp.category_2}` : ""}${sp.category_3 ? ` > ${sp.category_3}` : ""}`
    : null

  // Update metadata when product loads
  useEffect(() => {
    if (sp.image) {
      metadata.openGraph!.images = [
        {
          url: sp.image,
          width: 600,
          height: 600,
          alt: sp.name,
        },
      ]
    }
  }, [sp])

  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)

  return (
    <div className="mx-auto mb-8 flex w-full max-w-6xl flex-col px-4 py-4">
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
                      <Badge variant="success">Tracked</Badge>
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
                      <Badge variant="outline-destructive">Not tracked</Badge>
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

              {sp.is_essential ? (
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
              )}
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
            <Drawer open={isDetailsDrawerOpen} onOpenChange={setIsDetailsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon-sm">
                  <InfoIcon />
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
          </div>

          <div className="mb-4 mt-4 flex-1">
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
    </div>
  )
}
