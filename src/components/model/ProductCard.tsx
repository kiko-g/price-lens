"use client"

import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { cn, discountValueToPercentage, formatTimestamptz, imagePlaceholder } from "@/lib/utils"
import { ArrowUpRightIcon, CopyIcon, EllipsisVerticalIcon, RefreshCcwIcon } from "lucide-react"

export function ProductCard({ product: initialProduct }: { product: Product }) {
  const [product, setProduct] = useState<Product | null>(initialProduct)
  const [isFetching, setIsFetching] = useState(false)

  if (!product || !product.url) {
    return null
  }

  if (isFetching) {
    return <ProductCardSkeleton />
  }

  async function handleUpdateProduct() {
    if (!product || !product.url) return

    setIsFetching(true)
    const response = await fetch(`/api/products/put?url=${product.url}`)
    const data = await response.json()
    setProduct(data.product as Product)
    setIsFetching(false)
  }

  const categoryText = `${product.category}${product.category_2 ? ` > ${product.category_2}` : ""}${product.category_3 ? ` > ${product.category_3}` : ""}`

  return (
    <div className="flex w-full flex-col rounded-lg border bg-white p-4 dark:bg-zinc-950">
      <div className="relative mb-3 flex items-center justify-between gap-2">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name || "Product Image"}
            width={100}
            height={100}
            className="aspect-square w-full rounded-md border"
            placeholder="blur"
            blurDataURL={imagePlaceholder.productBlur}
          />
        ) : (
          <div className="aspect-square w-full rounded-md bg-zinc-100 dark:bg-zinc-900" />
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.price_per_major_unit && product.major_unit && (
            <Badge variant="price-per-unit" size="xs" roundedness="sm" className="w-fit">
              {product.price_per_major_unit}€{product.major_unit}
            </Badge>
          )}

          {product.discount ? (
            <Badge variant="destructive" size="xs" roundedness="sm" className="w-fit">
              -{discountValueToPercentage(product.discount)}
            </Badge>
          ) : null}
        </div>

        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default-inverted" size="icon-sm" className="shadow-none">
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuItem asChild>
                <Button variant="dropdown-item" asChild>
                  <Link
                    href={product.url || "#"}
                    target="_blank"
                    className="flex w-full items-center justify-between gap-1"
                  >
                    Open in new tab
                    <ArrowUpRightIcon />
                  </Link>
                </Button>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Button variant="dropdown-item" onClick={() => navigator.clipboard.writeText(product.url || "")}>
                  Copy URL
                  <CopyIcon />
                </Button>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Button variant="dropdown-item" onClick={handleUpdateProduct}>
                  Update
                  <RefreshCcwIcon />
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-start">
        <div className="flex flex-col items-start">
          {categoryText && (
            <Badge variant="secondary" size="xs" roundedness="sm" className="text-2xs">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger>
                    {product.category_3 || product.category_2 || product.category || "No category"}
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    sideOffset={6}
                    alignOffset={-6}
                    size="xs"
                    variant="glass"
                    className="max-w-52"
                  >
                    {categoryText}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Badge>
          )}

          <span className="mt-1 text-sm font-medium capitalize tracking-tight text-zinc-500 dark:text-zinc-400">
            {product.brand ? product.brand : <span className="opacity-30">No Brand</span>}
          </span>

          <h2 className="max-w-full truncate text-sm font-medium tracking-tight">{product.name || "Untitled"}</h2>
        </div>

        <div className="mt-1 flex w-full flex-wrap items-center justify-between gap-2 lg:mt-2">
          {product.price_recommended && product.price && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "text-sm font-medium",
                  product.price_recommended !== product.price && "line-through opacity-50",
                )}
              >
                {product.price_recommended}€
              </span>
              <span className="text-sm font-medium text-green-600 dark:text-green-500">{product.price}€</span>
            </div>
          )}

          {!product.price_recommended && product.price && (
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{product.price}€</span>
          )}

          {!product.price_recommended && !product.price && (
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">€€€€</span>
          )}
        </div>
      </div>

      <footer className="mt-3 flex flex-col items-end justify-end gap-0 border-t pt-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {product.created_at || product.updated_at ? formatTimestamptz(product.updated_at) : "No update record"}
        </p>
      </footer>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex w-full flex-col rounded-lg border bg-white p-4 dark:bg-zinc-950">
      <div className="relative mb-3 flex items-center justify-between gap-2">
        <div className="aspect-square w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-900" />
      </div>

      <div className="mb-2 flex flex-col items-start gap-2">
        <span className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
        <span className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
      </div>

      <div className="flex items-center gap-2">
        <span className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
        <span className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
      </div>

      <footer className="mt-3 flex flex-col items-end justify-end gap-2 border-t pt-2">
        <span className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
      </footer>
    </div>
  )
}
