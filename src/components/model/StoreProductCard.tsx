"use client"

import Link from "next/link"
import Image from "next/image"
import { Suspense, useState } from "react"
import { type StoreProduct } from "@/types"
import { FrontendStatus } from "@/types/extra"
import { toast } from "sonner"

import { Code } from "@/components/Code"
import { ProductChart } from "@/components/model/ProductChart"
import { resolveSupermarketChain } from "@/components/model/Supermarket"
import { PriorityBadge } from "@/components/model/PriorityBadge"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

import { cn, discountValueToPercentage, formatTimestamptz, imagePlaceholder } from "@/lib/utils"
import {
  ArrowUpRightIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  HeartIcon,
  RefreshCcwIcon,
  ChartSplineIcon,
  CloudAlertIcon,
  ExternalLinkIcon,
  CircleIcon,
  MicroscopeIcon,
} from "lucide-react"

type Props = {
  sp: StoreProduct
  onUpdate?: () => Promise<boolean> | undefined
  onFavorite?: () => Promise<boolean> | undefined
}

async function handleUpdatePriority(storeProductId: number, priority: number | null) {
  try {
    const response = await fetch(`/api/products/store/${storeProductId}/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ priority }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update priority")
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error updating priority:", error)
    throw error
  }
}

export function StoreProductCard({ sp, onUpdate, onFavorite }: Props) {
  const [status, setStatus] = useState<FrontendStatus>(FrontendStatus.Loaded)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [priority, setPriority] = useState(sp?.priority ?? null)

  if (!sp || !sp.url) {
    return null
  }

  if (status === FrontendStatus.Loading) {
    return <ProductCardSkeleton />
  }

  const supermarketChain = resolveSupermarketChain(sp?.origin_id)

  const isPriceNotSet = !sp.price_recommended && !sp.price
  const hasDiscount = sp.price_recommended && sp.price && sp.price_recommended !== sp.price
  const isNormalPrice =
    (!sp.price_recommended && sp.price) || (sp.price_recommended && sp.price && sp.price_recommended === sp.price)

  const categoryText = sp.category
    ? `${sp.category}${sp.category_2 ? ` > ${sp.category_2}` : ""}${sp.category_3 ? ` > ${sp.category_3}` : ""}`
    : null

  return (
    <div className="flex w-full flex-col rounded-lg bg-transparent">
      <div
        className={cn(
          "group relative mb-2 flex items-center justify-between gap-2 overflow-hidden rounded-md border",
          sp.image ? "border-border" : "border-transparent",
        )}
      >
        <Link href={`/supermarket/${sp.id}`} className="h-full w-full">
          {sp.image ? (
            <>
              {!imageLoaded && <div className="aspect-square w-full animate-pulse bg-zinc-100 dark:bg-zinc-800" />}
              <Image
                src={sp.image?.replace(/&sm=fit/g, "")}
                alt={sp.name || "Product Image"}
                width={500}
                height={500}
                className={cn(
                  "aspect-square h-full w-full object-cover object-center transition duration-300 hover:scale-105",
                  !imageLoaded && "hidden",
                )}
                placeholder="blur"
                blurDataURL={imagePlaceholder.productBlur}
                priority={true}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-800" />
          )}
        </Link>

        <div className="absolute top-2 left-2 flex flex-col gap-1">
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

        <div className="absolute top-2 right-2 flex flex-col gap-0.5">
          {sp.pack ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="unit"
                    size="2xs"
                    roundedness="sm"
                    className="line-clamp-3 w-fit max-w-20 text-left tracking-tighter md:line-clamp-1 md:max-w-28"
                  >
                    {sp.pack}
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
                  {sp.pack}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>

        <div className="absolute right-2 bottom-2 flex flex-col items-end gap-0 md:gap-0.5">
          <PriorityBadge priority={priority} />

          <Badge
            size="xs"
            variant="light"
            className="border-muted border opacity-100 transition-opacity duration-300 group-hover:opacity-100"
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
                <Badge
                  variant="boring"
                  size="xs"
                  roundedness="sm"
                  className="text-2xs line-clamp-1 text-left"
                  onClick={() => {
                    navigator.clipboard.writeText(sp.category || sp.category_3 || sp.category_2 || "")
                  }}
                >
                  {sp.category || sp.category_3 || sp.category_2 || "No category"}
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

          <span className="text-primary-500 dark:text-primary-400 mt-1.5 w-full text-sm leading-4 font-semibold">
            {sp.brand ? sp.brand : <span className="text-muted-foreground opacity-30">No Brand</span>}
          </span>

          <h2 className="line-clamp-2 min-h-[44px] w-full text-sm font-medium tracking-tight">
            <Link href={`/supermarket/${sp.id}`} target="_blank" className="hover:underline">
              {sp.name || "Untitled"}
            </Link>
          </h2>
        </div>

        <div className="mt-auto flex w-full flex-1 flex-wrap items-start justify-between gap-2 lg:mt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {hasDiscount ? (
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm line-through">{sp.price_recommended}€</span>
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
                <Button variant="outline" size="icon-sm" className="bg-background">
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

                {process.env.NODE_ENV === "development" && (
                  <>
                    <DropdownMenuSeparator className="[&:not(:has(+*))]:hidden" />
                    {onUpdate && (
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
                    )}
                    <DropdownMenuItem variant="warning" asChild>
                      <Button
                        variant="dropdown-item"
                        onClick={async () => {
                          if (!sp.id) {
                            toast.error("Invalid product", {
                              description: "Product ID is missing",
                            })
                            return
                          }

                          try {
                            const priority = window.prompt("Enter priority (0-5):", "5")
                            const priorityNum = priority ? parseInt(priority) : null
                            if (priorityNum === null || isNaN(priorityNum) || priorityNum < 0 || priorityNum > 5) {
                              toast.error("Invalid priority", {
                                description: "Priority must be a number between 0 and 5",
                              })
                              return
                            }
                            setStatus(FrontendStatus.Loading)
                            await handleUpdatePriority(sp.id, priorityNum)
                            setPriority(priorityNum)
                            setStatus(FrontendStatus.Loaded)
                            toast.success("Priority updated", {
                              description: `Product priority set to ${priorityNum}`,
                            })
                          } catch (error) {
                            setStatus(FrontendStatus.Error)
                            toast.error("Failed to update priority", {
                              description: error instanceof Error ? error.message : "Unknown error occurred",
                            })
                          }
                        }}
                      >
                        Set priority
                        <MicroscopeIcon />
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="warning" asChild>
                      <Button
                        variant="dropdown-item"
                        onClick={async () => {
                          if (!sp.id) {
                            toast.error("Invalid product", {
                              description: "Product ID is missing",
                            })
                            return
                          }

                          try {
                            setStatus(FrontendStatus.Loading)
                            await handleUpdatePriority(sp.id, null)
                            setPriority(null)
                            setStatus(FrontendStatus.Loaded)
                            toast.success("Priority cleared", {
                              description: "Product priority set to default",
                            })
                          } catch (error) {
                            setStatus(FrontendStatus.Error)
                            toast.error("Failed to clear priority", {
                              description: error instanceof Error ? error.message : "Unknown error occurred",
                            })
                          }
                        }}
                      >
                        Clear priority
                        <CircleIcon />
                      </Button>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DrawerSheet title={sp.name}>
              <div className="text-muted-foreground -mt-2 mb-2 flex w-full flex-wrap items-center justify-between gap-1.5 space-x-2 border-b pb-2 text-xs">
                <div className="flex items-center gap-1">
                  <Link href={sp.url} target="_blank">
                    {resolveSupermarketChain(sp?.origin_id)?.logo}
                  </Link>
                  <Button asChild variant="ghost" size="icon-xs" roundedness="sm">
                    <Link href={sp.url} target="_blank">
                      <ExternalLinkIcon />
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <PriorityBadge
                    priority={sp.priority}
                    size="xs"
                    variant="default"
                    className="text-2xs font-semibold"
                  />

                  <Badge variant="secondary" size="2xs" roundedness="sm">
                    {sp.brand}
                  </Badge>

                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="boring" size="2xs" roundedness="sm">
                          {sp.category}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>
                          {sp.category} {sp.category_2 ? `> ${sp.category_2}` : ""}{" "}
                          {sp.category_3 ? `> ${sp.category_3}` : ""}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <Suspense fallback={<div>Loading...</div>}>
                <ProductChart sp={sp} />
              </Suspense>

              <div className="flex w-full justify-between gap-2 pt-2 text-sm">
                <div className="flex w-full justify-end">
                  <span className="text-muted-foreground text-xs">
                    {sp.created_at || sp.updated_at
                      ? `Last updated: ${formatTimestamptz(sp.updated_at)}`
                      : "No update record"}
                  </span>
                </div>
              </div>

              <Accordion type="single" collapsible className="mt-4 hidden w-full border-t md:flex">
                <AccordionItem value="item-1" className="w-full border-0">
                  <AccordionTrigger>Inspect store product data</AccordionTrigger>
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
    <div className="bg-background flex w-full flex-col rounded-lg">
      <div className="relative mb-3 flex items-center justify-between gap-2">
        <div className="border-border bg-muted aspect-square w-full animate-pulse rounded-md border" />
      </div>

      <div className="mb-5 flex flex-col items-start gap-2">
        {/* Category, Brand and Name */}
        <span className="bg-muted h-3 w-16 animate-pulse rounded lg:w-16"></span>
        <span className="bg-muted h-3 w-24 animate-pulse rounded lg:w-24"></span>
        <span className="bg-muted h-3 w-full animate-pulse rounded lg:w-full"></span>
      </div>

      <div className="mb-1 flex w-full items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <span className="bg-muted h-4 w-12 animate-pulse rounded lg:w-12"></span>
          <span className="bg-muted h-4 w-20 animate-pulse rounded lg:w-20"></span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-muted size-6 animate-pulse rounded lg:size-7"></span>
          <span className="bg-muted size-6 animate-pulse rounded lg:size-7"></span>
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="top-4">
        <Button size="icon-sm">
          <ChartSplineIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-x-hidden overflow-y-scroll">
        <SheetHeader>
          <SheetTitle className="text-left">{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>

        <div className="pt-2 pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
