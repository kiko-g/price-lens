"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { type SupermarketProduct } from "@/types"
import { PageStatus, SupermarketChain } from "@/types/extra"

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

import { resolveSupermarketChain } from "./Supermarket"
import { ProductChart } from "./ProductChart"

import { discountValueToPercentage, imagePlaceholder } from "@/lib/utils"
import {
  ArrowUpRightIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  HeartIcon,
  RefreshCcwIcon,
  ChartSplineIcon,
  CloudAlertIcon,
} from "lucide-react"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "../../lib/utils"

type Props = {
  product: SupermarketProduct
  onUpdate?: () => Promise<boolean> | undefined
}

export function SupermarketProductCard({ product, onUpdate }: Props) {
  const [status, setStatus] = useState<PageStatus>(PageStatus.Loaded)

  if (!product || !product.url) {
    return null
  }

  if (status === PageStatus.Loading) {
    return <ProductCardSkeleton />
  }

  const supermarketChain = resolveSupermarketChain(product)
  const categoryText = product.category
    ? `${product.category}${product.category_2 ? ` > ${product.category_2}` : ""}${product.category_3 ? ` > ${product.category_3}` : ""}`
    : null

  return (
    <div className="flex w-full flex-col rounded-lg bg-white dark:bg-zinc-950">
      <div
        className={cn(
          "group relative mb-3 flex items-center justify-between gap-2 overflow-hidden rounded-md border",
          product.image ? "border-zinc-200 dark:border-zinc-800" : "border-transparent",
        )}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name || "Product Image"}
            width={500}
            height={500}
            className="aspect-square w-full transition duration-300 hover:scale-105"
            placeholder="blur"
            blurDataURL={imagePlaceholder.productBlur}
          />
        ) : (
          <div className="aspect-square w-full" />
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.price_per_major_unit && product.major_unit ? (
            <Badge variant="price-per-unit" size="xs" roundedness="sm" className="w-fit">
              {product.price_per_major_unit}€{product.major_unit}
            </Badge>
          ) : null}

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

        <div className="absolute bottom-2 left-2">{supermarketChain ? supermarketChain.badge : null}</div>

        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="inverted" size="icon-sm" className="shadow-none">
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

              <DropdownMenuSeparator className="[&:not(:has(+*))]:[display:none]" />

              {onUpdate ? (
                <DropdownMenuItem variant="highlight" asChild>
                  <Button
                    variant="dropdown-item"
                    onClick={async () => {
                      setStatus(PageStatus.Loading)
                      const success = await onUpdate()
                      if (success) setStatus(PageStatus.Loaded)
                      else setStatus(PageStatus.Error)
                    }}
                  >
                    Update
                    <RefreshCcwIcon />
                  </Button>
                </DropdownMenuItem>
              ) : null}
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
            {product.brand ? product.brand : <span className="text-muted-foreground opacity-30">No Brand</span>}
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

            {!product.price_recommended && product.price ? (
              <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">{product.price}€</span>
            ) : null}

            {!product.price_recommended && !product.price ? (
              <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">€€€€</span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" disabled>
              <HeartIcon />
            </Button>

            <DrawerSheet title={`${product.name}`}>
              <Tabs defaultValue="details" className="w-full">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <ProductChart product={product} />
                </TabsContent>
                <TabsContent value="technical">
                  <p className="mb-3 text-sm text-muted-foreground">Inspect the collected data about this product.</p>

                  <div className="flex flex-col gap-4 pb-8">
                    <Code code={JSON.stringify(product, null, 2)} language="json" />
                  </div>
                </TabsContent>
              </Tabs>
            </DrawerSheet>
          </div>
        </div>
      </div>
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
            <ChartSplineIcon />
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
          <ChartSplineIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 pt-2">{children}</div>

        <DrawerFooter className="sr-only pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
