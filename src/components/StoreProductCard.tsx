"use client"

import Link from "next/link"
import Image from "next/image"
import { Suspense, useState } from "react"
import { type StoreProduct } from "@/types"

import { useUser } from "@/hooks/useUser"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useStoreProductCard } from "@/hooks/useStoreProductCard"

import { CodeShowcase } from "@/components/ui/combo/code-showcase"
import { ProductChart } from "@/components/ProductChart"
import { resolveSupermarketChain } from "@/components/Supermarket"
import { PriorityBadge } from "@/components/PriorityBadge"
import { StoreProductCardSkeleton } from "@/components/StoreProductCardSkeleton"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Barcode } from "@/components/ui/combo/barcode"
import { DevBadge } from "@/components/ui/combo/dev-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShareButton } from "@/components/ui/combo/share-button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { cn, discountValueToPercentage, generateProductPath, getShortRelativeTime } from "@/lib/utils"
import { imagePlaceholder } from "@/lib/business/data"
import {
  ArrowUpRightIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  RefreshCcwIcon,
  ChartSplineIcon,
  WifiOffIcon,
  CircleIcon,
  MicroscopeIcon,
  HeartIcon,
  CalendarPlusIcon,
} from "lucide-react"
import { PriceFreshnessInfo } from "./PriceFreshnessInfo"

function resolveImageUrlForCard(image: string, size = 400) {
  const url = new URL(image)
  const p = url.searchParams
  const fieldsToDelete = ["sm", "w", "h", "sw", "sh"]
  fieldsToDelete.forEach((k) => p.delete(k))
  p.set("sw", String(size))
  p.set("sh", String(size))
  p.set("sm", "fit")
  return url.toString()
}

type Props = {
  sp: StoreProduct
  imagePriority?: boolean
  favoritedAt?: string /** When the product was added to favorites (only shown when favorited) */
  showBarcode?: boolean
}

export function StoreProductCard({ sp, imagePriority = false, favoritedAt, showBarcode = false }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const {
    priority,
    isFavorited,
    updateFromSource,
    toggleFavorite,
    promptAndSetPriority,
    clearPriority,
    isUpdating,
    isPriorityPending,
    isFavoritePending,
    hasUpdateError,
  } = useStoreProductCard(sp)

  const { user, profile } = useUser()

  if (!sp || !sp.url) {
    return null
  }

  if (isUpdating) {
    return <StoreProductCardSkeleton />
  }

  const supermarketChain = resolveSupermarketChain(sp?.origin_id)

  const isPriceNotSet = !sp.price_recommended && !sp.price
  const hasDiscount = sp.price_recommended && sp.price && sp.price_recommended !== sp.price
  const isNormalPrice =
    (!sp.price_recommended && sp.price) || (sp.price_recommended && sp.price && sp.price_recommended === sp.price)

  const categoryText = sp.category
    ? `${sp.category}${sp.category_2 ? ` > ${sp.category_2}` : ""}${sp.category_3 ? ` > ${sp.category_3}` : ""}`
    : null

  const isError = hasUpdateError || !sp.available

  return (
    <div className="flex w-full flex-col rounded-lg bg-transparent">
      <div
        className={cn(
          "group relative mb-2 flex items-center justify-between gap-2 overflow-hidden rounded-md border",
          sp.image ? "border-border" : "border-transparent",
        )}
      >
        <Link href={generateProductPath(sp)} className="h-full w-full">
          {sp.image ? (
            <div className="relative aspect-square w-full">
              {!imageLoaded && <div className="bg-background/10 absolute inset-0 z-10 animate-pulse" />}
              <Image
                src={resolveImageUrlForCard(sp.image, 300)}
                alt={sp.name || "Product Image"}
                width={500}
                height={500}
                className={cn(
                  "aspect-square h-full w-full bg-white object-cover object-center transition duration-300",
                  sp.available ? "opacity-100" : "",
                )}
                {...(imagePriority && {
                  placeholder: "blur" as const,
                  blurDataURL: imagePlaceholder.productBlur,
                })}
                priority={imagePriority}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          ) : (
            <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-800" />
          )}
        </Link>

        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {sp.price_per_major_unit && sp.major_unit ? (
            <Badge
              variant="price-per-unit"
              size="xs"
              roundedness="sm"
              className="w-fit opacity-100 transition-opacity duration-300 group-hover:opacity-0"
            >
              {sp.price_per_major_unit}€{sp.major_unit}
            </Badge>
          ) : null}

          {sp.discount ? (
            <Badge
              variant="destructive"
              size="xs"
              roundedness="sm"
              className="w-fit opacity-100 transition-opacity duration-300 group-hover:opacity-0"
            >
              -{discountValueToPercentage(sp.discount)}
            </Badge>
          ) : null}
        </div>

        <div className="absolute top-2 right-2 flex flex-col items-end gap-0">
          {isError ? (
            <span className="bg-destructive flex items-center justify-center rounded p-1">
              <WifiOffIcon className="size-3 text-white" />
            </span>
          ) : (
            <>
              {sp.pack && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="unit"
                        size="2xs"
                        roundedness="sm"
                        className="line-clamp-3 w-fit max-w-20 text-left tracking-tighter opacity-100 transition-opacity duration-300 group-hover:opacity-50 hover:opacity-100 md:line-clamp-1 md:max-w-20"
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
              )}

              <PriorityBadge priority={priority} variant="compact" />
            </>
          )}
        </div>

        {user ? (
          <div className="absolute bottom-2 left-2 z-5 flex items-end gap-0 md:gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              className={cn(
                "bg-background dark:bg-background cursor-pointer disabled:cursor-not-allowed disabled:opacity-100",
                isFavoritePending && "disabled:opacity-50",
              )}
              onClick={toggleFavorite}
              disabled={isFavoritePending || !user}
              title={user ? (isFavorited ? "Remove from favorites" : "Add to favorites") : "Log in to add favorites"}
            >
              <HeartIcon
                className={cn(
                  "h-4 w-4",
                  isFavorited ? "fill-destructive stroke-destructive" : "stroke-foreground fill-none",
                )}
              />
            </Button>
          </div>
        ) : null}

        <div className="absolute right-2 bottom-2 flex flex-col items-end">
          {favoritedAt && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger>
                  <Badge size="2xs" variant="tertiary" className="gap-1">
                    <CalendarPlusIcon className="h-3 w-3" />
                    {getShortRelativeTime(new Date(favoritedAt))}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left" align="end" size="xs" variant="glass">
                  <span>Added to favorites</span>
                  <br />
                  <span className="text-muted-foreground">{new Date(favoritedAt).toLocaleDateString()}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Badge
            size="xs"
            variant="outline-white"
            className="border-muted w-fit max-w-20 opacity-100 transition-opacity duration-300 group-hover:opacity-0"
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

          <div className="mt-1.5 flex items-center justify-between gap-1.5">
            <span className="w-full text-sm leading-4 font-semibold text-blue-600 dark:text-blue-500">
              {sp.brand ? sp.brand : <span className="text-muted-foreground opacity-30">No Brand</span>}
            </span>
          </div>

          <h2 className="line-clamp-2 min-h-[44px] w-full text-sm font-medium tracking-tight">
            <Link href={generateProductPath(sp)} target="_blank" className="hover:underline">
              {sp.name || "Untitled"}
            </Link>
          </h2>
        </div>

        {/* Prices and Actions */}
        <div className="mt-auto flex w-full flex-1 flex-wrap items-start justify-between gap-2 lg:mt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {hasDiscount ? (
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm line-through">{sp.price_recommended}€</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-500">{sp.price.toFixed(2)}€</span>
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
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                    Copy {supermarketChain?.name} URL
                    <CopyIcon />
                  </Button>
                </DropdownMenuItem>
                <ShareButton sp={sp} appearAs="dropdown-menu-item" />
                {user ? (
                  <DropdownMenuItem variant="love" asChild>
                    <Button variant="dropdown-item" onClick={toggleFavorite} disabled={isFavoritePending}>
                      {isFavorited ? "Remove from favorites" : "Add to favorites"}
                      <HeartIcon />
                    </Button>
                  </DropdownMenuItem>
                ) : null}

                {(process.env.NODE_ENV === "development" || profile?.role === "admin") && (
                  <>
                    <DropdownMenuSeparator className="[&:not(:has(+*))]:hidden" />
                    <DropdownMenuLabel className="flex items-center gap-2">
                      Admin tools
                      <DevBadge />
                    </DropdownMenuLabel>

                    <DropdownMenuItem asChild>
                      <Button variant="dropdown-item" onClick={updateFromSource} disabled={isUpdating}>
                        Update from origin ({supermarketChain?.name})
                        <RefreshCcwIcon />
                      </Button>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Button variant="dropdown-item" onClick={promptAndSetPriority} disabled={isPriorityPending}>
                        Set priority
                        <MicroscopeIcon />
                      </Button>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Button variant="dropdown-item" onClick={clearPriority} disabled={isPriorityPending}>
                        Clear priority
                        <CircleIcon />
                      </Button>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DrawerSheet title={sp.name}>
              <div className="text-muted-foreground -mt-1 mb-2 flex w-full items-start justify-between gap-1.5 border-b pb-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  {sp.brand && (
                    <Badge variant="blue" size="xs">
                      {sp.brand}
                    </Badge>
                  )}

                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="boring" size="xs">
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

                  {sp.pack && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant="default"
                            size="xs"
                            className="line-clamp-1 w-fit max-w-36 text-left tracking-tight"
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
                  )}
                </div>

                <div className="flex flex-1 items-center justify-end">
                  {/* Priority Badge unless unavailable */}
                  {isError ? (
                    <span className="bg-destructive flex items-center justify-center rounded-full p-1">
                      <WifiOffIcon className="size-3 text-white" />
                    </span>
                  ) : (
                    <PriorityBadge
                      priority={sp.priority}
                      size="xs"
                      variant="compact"
                      className="text-xs font-semibold"
                    />
                  )}
                </div>
              </div>

              <PriceFreshnessInfo updatedAt={sp.updated_at} priority={sp.priority} className="mb-1" />

              <Suspense fallback={<div>Loading...</div>}>
                <ProductChart sp={sp} samplingMode="efficient" />
              </Suspense>

              <Accordion type="single" collapsible className="mt-2 hidden w-full border-t md:flex">
                <AccordionItem value="item-1" className="w-full border-0">
                  <AccordionTrigger className="py-3">Inspect store product data</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <CodeShowcase code={JSON.stringify(sp, null, 2)} language="json" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </DrawerSheet>
          </div>
        </div>

        {/* Extra Details (Barcode, etc.) */}
        {showBarcode && sp.barcode ? (
          <div className="mt-auto flex w-full flex-1 flex-wrap items-center justify-center gap-2">
            <Barcode value={sp.barcode} height={10} width={1} className="bg-muted mt-2 rounded p-2" />
          </div>
        ) : (
          showBarcode && (
            <div className="mt-auto flex w-full flex-1 flex-wrap items-center justify-center gap-2">
              <Badge variant="destructive" size="xs" roundedness="sm">
                No barcode available
              </Badge>
            </div>
          )
        )}
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
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
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

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild className="top-4">
        <Button size="icon-sm">
          <ChartSplineIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="overflow-x-hidden overflow-y-scroll">
        <DrawerHeader>
          <DrawerTitle className="text-left">{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>

        <div className="max-h-[80vh] px-4 pt-2 pb-4">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}
