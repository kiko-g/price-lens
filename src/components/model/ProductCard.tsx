"use client"

import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types"
import { useState } from "react"

import { Code } from "@/components/Code"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { discountValueToPercentage, formatTimestamptz, imagePlaceholder, PageStatus } from "@/lib/utils"
import {
  ArrowUpRightIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  HeartIcon,
  RefreshCcwIcon,
  GlassesIcon,
  CloudAlertIcon,
} from "lucide-react"
import { useMediaQuery } from "@/hooks/useMediaQuery"

export function ProductCard({ product: initialProduct }: { product: Product }) {
  const [product, setProduct] = useState<Product | null>(initialProduct)
  const [status, setStatus] = useState<PageStatus>(PageStatus.Loaded)

  if (!product || !product.url) {
    return null
  }

  if (status === PageStatus.Loading) {
    return <ProductCardSkeleton />
  }

  async function handleUpdateProduct() {
    if (!product || !product.url) return

    setStatus(PageStatus.Loading)
    const response = await fetch(`/api/products/put?url=${product.url}`)
    const data = await response.json()

    if (response.status === 200) {
      setProduct(data.product as Product)
      setStatus(PageStatus.Loaded)
    } else {
      console.error(data)
      setStatus(PageStatus.Error)
    }
  }

  const categoryText = product.category
    ? `${product.category}${product.category_2 ? ` > ${product.category_2}` : ""}${product.category_3 ? ` > ${product.category_3}` : ""}`
    : null

  return (
    <div className="flex w-full flex-col rounded-lg bg-white dark:bg-zinc-950">
      <div className="relative mb-3 flex items-center justify-between gap-2">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name || "Product Image"}
            width={500}
            height={500}
            className="aspect-square w-full rounded-md border border-zinc-200 dark:border-zinc-800"
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

          {status === "error" ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="destructive">
                    <CloudAlertIcon />
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
                  Product may be unavailable or the URL may be invalid.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                <Button
                  variant="dropdown-item"
                  onClick={() => navigator.clipboard.writeText(product.url || "")}
                  title={product.url || ""}
                >
                  Copy URL
                  <CopyIcon />
                </Button>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="warning" asChild>
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
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" size="xs" roundedness="sm" className="line-clamp-1 text-left text-2xs">
                  {product.category_3 || product.category_2 || product.category || "No category"}
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
                {categoryText || "No category set available"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
            {product.brand ? product.brand : <span className="opacity-30">No Brand</span>}
          </span>

          <h2 className="mb-2 line-clamp-2 text-sm font-medium tracking-tight">{product.name || "Untitled"}</h2>
        </div>

        <div className="mt-auto flex w-full flex-1 flex-wrap items-start justify-between gap-2 lg:mt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {product.price_recommended && product.price && product.price_recommended !== product.price ? (
              <div className="flex flex-col">
                <span className="text-sm text-zinc-500 line-through dark:text-zinc-400">
                  {product.price_recommended}€
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-500">{product.price}€</span>
              </div>
            ) : null}

            {!product.price_recommended && product.price && (
              <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">{product.price}€</span>
            )}

            {!product.price_recommended && !product.price && (
              <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">€€€€</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm">
              <HeartIcon />
            </Button>

            <DrawerSheet title={`${product.name}`}>
              <Tabs defaultValue="details" className="w-full">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>
                <TabsContent value="details"></TabsContent>
                <TabsContent value="technical">
                  <Code code={JSON.stringify(product, null, 2)} language="json" options={{ margin: "0" }} />
                </TabsContent>
              </Tabs>
            </DrawerSheet>
          </div>
        </div>
      </div>

      <footer className="mt-2 flex flex-col items-end justify-end gap-0 border-t pt-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {product.created_at || product.updated_at ? formatTimestamptz(product.updated_at) : "No update record"}
        </p>
      </footer>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex w-full flex-col rounded-lg bg-white dark:bg-zinc-950">
      <div className="relative mb-3 flex items-center justify-between gap-2">
        <div className="aspect-square w-full animate-pulse rounded-md border border-zinc-300 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900" />
      </div>

      <div className="mb-2 flex flex-col items-start gap-2">
        <span className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
        <span className="h-4 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
      </div>

      <div className="flex w-full items-end justify-between gap-2">
        <div className="flex flex-col gap-2">
          <span className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
          <span className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-7 w-7 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
          <span className="h-7 w-7 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
        </div>
      </div>

      <footer className="mt-3 flex flex-col items-end justify-end gap-2 border-t pt-2">
        <span className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></span>
      </footer>
    </div>
  )
}

function DrawerSheet({
  children,
  title,
  description,
}: {
  children: React.ReactNode
  title?: string
  description?: string
}) {
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="icon-sm">
            <GlassesIcon />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <div className="pb-4 pt-2">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="default" size="icon-sm">
          <GlassesIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 pt-2">{children}</div>

        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
