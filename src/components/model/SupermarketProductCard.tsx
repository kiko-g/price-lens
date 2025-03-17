"use client"

import Link from "next/link"
import Image from "next/image"
import { Suspense, useState } from "react"
import { type SupermarketProduct } from "@/types"
import { FrontendStatus } from "@/types/extra"

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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { resolveSupermarketChain } from "./Supermarket"
import { ProductChart } from "./ProductChart"

import { discountValueToPercentage, formatTimestamptz, imagePlaceholder } from "@/lib/utils"
import {
  ArrowUpRightIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  HeartIcon,
  RefreshCcwIcon,
  ChartSplineIcon,
  CloudAlertIcon,
  PlusIcon,
  ExternalLinkIcon,
  CheckIcon,
  CircleIcon,
  ShoppingBasketIcon,
  SquareXIcon,
} from "lucide-react"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "../../lib/utils"
import { toast } from "sonner"

type Props = {
  sp: SupermarketProduct
  onUpdate?: () => Promise<boolean> | undefined
  onFavorite?: () => Promise<boolean> | undefined
}

async function handleAddToTrackingList(sp: SupermarketProduct) {
  if (sp.is_tracked) return

  try {
    const response = await fetch("/api/products/add", {
      method: "POST",
      body: JSON.stringify({ product: sp }),
    })
    await response.json()
  } catch (error) {
    console.error("Error adding to tracking list:", error)
  }
}

async function handleRemoveFromInflationBasket(sp: SupermarketProduct) {
  if (!sp.is_essential) return

  try {
    const response = await fetch("/api/products/basket/remove", {
      method: "POST",
      body: JSON.stringify({ supermarketProduct: sp }),
    })
    await response.json()
  } catch (error) {
    console.error("Error removing from inflation basket:", error)
  }
}

async function handleAddToInflationBasket(sp: SupermarketProduct) {
  if (sp.is_essential) return

  try {
    const response = await fetch("/api/products/basket/add", {
      method: "POST",
      body: JSON.stringify({ supermarketProduct: sp }),
    })
    await response.json()
  } catch (error) {
    console.error("Error adding to inflation basket:", error)
  }
}

export function SupermarketProductCard({ sp, onUpdate, onFavorite }: Props) {
  const [status, setStatus] = useState<FrontendStatus>(FrontendStatus.Loaded)

  const [isTracked, setIsTracked] = useState(sp.is_tracked ?? false)
  const [isEssential, setIsEssential] = useState(sp.is_essential ?? false)

  if (!sp || !sp.url) {
    return null
  }

  if (status === FrontendStatus.Loading) {
    return <ProductCardSkeleton />
  }

  const supermarketChain = resolveSupermarketChain(sp)

  const isPriceNotSet = !sp.price_recommended && !sp.price
  const hasDiscount = sp.price_recommended && sp.price && sp.price_recommended !== sp.price
  const isNormalPrice =
    (!sp.price_recommended && sp.price) || (sp.price_recommended && sp.price && sp.price_recommended === sp.price)

  const categoryText = sp.category
    ? `${sp.category}${sp.category_2 ? ` > ${sp.category_2}` : ""}${sp.category_3 ? ` > ${sp.category_3}` : ""}`
    : null

  return (
    <div className="flex w-full flex-col rounded-lg bg-white dark:bg-zinc-950">
      <div
        className={cn(
          "group relative mb-2 flex items-center justify-between gap-2 overflow-hidden rounded-md border",
          sp.image ? "border-zinc-200 dark:border-zinc-800" : "border-transparent",
        )}
      >
        <Link href={`/supermarket/${sp.id}`} className="h-full w-full">
          {sp.image ? (
            <Image
              src={sp.image}
              alt={sp.name || "Product Image"}
              width={500}
              height={500}
              className="aspect-square h-full w-full transition duration-300 hover:scale-105"
              placeholder="blur"
              blurDataURL={imagePlaceholder.productBlur}
            />
          ) : (
            <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-800" />
          )}
        </Link>

        <div className="absolute left-2 top-2 flex flex-col gap-1">
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

        <div className="absolute right-2 top-2 flex flex-col gap-1">
          {sp.pack ? (
            <Badge
              variant="unit"
              size="2xs"
              roundedness="sm"
              className="line-clamp-3 w-fit max-w-20 md:line-clamp-1 md:max-w-40"
            >
              {sp.pack}
            </Badge>
          ) : null}
        </div>

        <div className="absolute bottom-2 right-2 flex flex-col gap-1">
          <Badge
            size="xs"
            variant="light"
            className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            {supermarketChain ? supermarketChain.logoSmall : null}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-start">
        <div className="flex w-full flex-col items-start">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" size="xs" roundedness="sm" className="line-clamp-1 text-left text-2xs">
                  {sp.category_3 || sp.category_2 || sp.category || "No category"}
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

          <span className="mt-1.5 w-full text-sm font-semibold leading-4 text-blue-600 dark:text-blue-400">
            {sp.brand ? sp.brand : <span className="text-muted-foreground opacity-30">No Brand</span>}
          </span>

          <h2 className="line-clamp-2 w-full text-sm font-medium tracking-tight">
            <Link href={`/supermarket/${sp.id}`} target="_blank" className="hover:underline">
              {sp.name || "Untitled"}
            </Link>
          </h2>
        </div>

        <div className="mt-auto flex w-full flex-1 flex-wrap items-start justify-between gap-2 lg:mt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {hasDiscount ? (
              <div className="flex flex-col">
                <span className="text-sm text-zinc-500 line-through dark:text-zinc-400">{sp.price_recommended}€</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-500">{sp.price}€</span>
              </div>
            ) : null}

            {isNormalPrice ? (
              <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">{sp.price}€</span>
            ) : null}

            {isPriceNotSet ? <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">€€€€</span> : null}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" className="shadow-none">
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuItem asChild>
                  <Button variant="dropdown-item" asChild>
                    <Link
                      href={sp.url || "#"}
                      target="_blank"
                      className="flex w-full items-center justify-between gap-1"
                    >
                      Open in {supermarketChain?.name}
                      <ArrowUpRightIcon />
                    </Link>
                  </Button>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Button
                    variant="dropdown-item"
                    onClick={() => navigator.clipboard.writeText(sp.url || "")}
                    title={sp.url || ""}
                  >
                    Copy URL
                    <CopyIcon />
                  </Button>
                </DropdownMenuItem>

                {process.env.NODE_ENV === "development" ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Button
                        variant="dropdown-item"
                        disabled={isTracked}
                        onClick={async () => {
                          if (isTracked) return
                          await handleAddToTrackingList(sp)
                          setIsTracked(true)
                          toast.success(`${sp.name}`, {
                            description: `Supermarket product added to tracking list`,
                          })
                        }}
                      >
                        {isTracked ? "Product already tracked" : "Add to tracking list"}
                        {isTracked ? <CheckIcon /> : <PlusIcon />}
                      </Button>
                    </DropdownMenuItem>

                    {isTracked && (
                      <DropdownMenuItem asChild>
                        <Button
                          variant="dropdown-item"
                          onClick={async () => {
                            if (isEssential) {
                              await handleRemoveFromInflationBasket(sp)
                              setIsEssential(false)
                              toast(`${sp.name}`, {
                                description: `Removed product from inflation basket`,
                              })
                            } else {
                              await handleAddToInflationBasket(sp)
                              setIsEssential(true)
                              toast(`${sp.name}`, {
                                description: `Added product to inflation basket`,
                              })
                            }
                          }}
                        >
                          {isEssential ? "Remove from inflation basket" : "Add to inflation basket"}
                          {isEssential ? <SquareXIcon /> : <ShoppingBasketIcon />}
                        </Button>
                      </DropdownMenuItem>
                    )}
                  </>
                ) : null}

                <DropdownMenuSeparator className="[&:not(:has(+*))]:[display:none]" />

                {onFavorite ? (
                  <DropdownMenuItem variant="love" asChild>
                    <Button
                      variant="dropdown-item"
                      onClick={async () => {
                        setStatus(FrontendStatus.Loading)
                        const success = await onFavorite()
                        if (success) setStatus(FrontendStatus.Loaded)
                        else setStatus(FrontendStatus.Error)
                      }}
                    >
                      Add to favorites
                      <HeartIcon />
                    </Button>
                  </DropdownMenuItem>
                ) : null}

                {onUpdate ? (
                  <DropdownMenuItem variant="warning" asChild>
                    <Button
                      variant="dropdown-item"
                      onClick={async () => {
                        setStatus(FrontendStatus.Loading)
                        const success = await onUpdate()
                        if (success) setStatus(FrontendStatus.Loaded)
                        else setStatus(FrontendStatus.Error)
                      }}
                    >
                      Update
                      <RefreshCcwIcon />
                    </Button>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <DrawerSheet title={sp.name}>
              <div className="-mt-2 mb-2 flex w-full items-center justify-between space-x-2 border-b pb-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Link href={sp.url} target="_blank">
                    {resolveSupermarketChain(sp)?.logo}
                  </Link>
                  <Button asChild variant="ghost" size="icon-xs" roundedness="sm">
                    <Link href={sp.url} target="_blank">
                      <ExternalLinkIcon />
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center gap-2 divide-x [&>span:not(:first-child)]:pl-1.5">
                  <span>{sp.brand}</span>
                  <span>{sp.category}</span>
                </div>
              </div>

              <Suspense fallback={<div>Loading...</div>}>
                <ProductChart sp={sp} />
              </Suspense>

              <div className="flex w-full justify-between gap-2 pt-2 text-sm">
                <div className="flex w-full justify-end">
                  <span className="text-xs text-muted-foreground">
                    {sp.created_at || sp.updated_at
                      ? `Last updated: ${formatTimestamptz(sp.updated_at)}`
                      : "No update record"}
                  </span>
                </div>
              </div>

              <Accordion type="single" collapsible className="mt-4 hidden w-full border-t md:flex">
                <AccordionItem value="item-1" className="w-full border-0">
                  <AccordionTrigger>Inspect the collected data</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <Code code={JSON.stringify(sp, null, 2)} language="json" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
        <SheetContent className="overflow-x-hidden overflow-y-scroll">
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
      <DrawerContent className="overflow-y-auto">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 pt-2">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}
