"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { type StoreProduct } from "@/types"
import { useUser } from "@/hooks/useUser"
import { useStoreProductCard } from "@/hooks/useStoreProductCard"

import { cn } from "@/lib/utils"
import { imagePlaceholder } from "@/lib/business/data"
import { formatRelativeTime } from "@/lib/business/chart"
import { discountValueToPercentage, generateProductPath } from "@/lib/business/product"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Barcode } from "@/components/ui/combo/barcode"
import { CodeShowcase } from "@/components/ui/combo/code-showcase"
import { DevBadge } from "@/components/ui/combo/dev-badge"
import { DrawerSheet } from "@/components/ui/combo/drawer-sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShareButton } from "@/components/ui/combo/share-button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { PriorityChip } from "@/components/products/PriorityChip"
import { SupermarketChainBadge, getSupermarketChainName } from "@/components/products/SupermarketChainBadge"
import { StoreProductCardSkeleton } from "@/components/products/skeletons/StoreProductCardSkeleton"

import {
  ArrowUpRightIcon,
  EllipsisVerticalIcon,
  RefreshCcwIcon,
  WifiOffIcon,
  CircleIcon,
  MicroscopeIcon,
  HeartIcon,
  CalendarPlusIcon,
  ScaleIcon,
  TriangleAlertIcon,
  ExternalLinkIcon,
} from "lucide-react"

const StoreProductCardDrawerChart = dynamic(
  () => import("@/components/products/StoreProductCardDrawerChart").then((mod) => mod.StoreProductCardDrawerChart),
  { ssr: false, loading: () => <Skeleton className="h-60 w-full rounded-lg" /> },
)

const DISCOUNT_DECIMAL_PLACES = 0

function resolveImageUrlForCard(image: string, size = 300) {
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
  const {
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

  const supermarketName = getSupermarketChainName(sp?.origin_id)
  const supermarketBadge = (
    <span className="flex w-fit items-center justify-center rounded-full bg-white px-1.5 py-0.5">
      <SupermarketChainBadge originId={sp?.origin_id} variant="logoSmall" />
    </span>
  )
  const isPriceNotSet = !sp.price_recommended && !sp.price
  const hasDiscount = sp.price_recommended && sp.price && sp.price_recommended !== sp.price
  const isNormalPrice =
    (!sp.price_recommended && sp.price) || (sp.price_recommended && sp.price && sp.price_recommended === sp.price)

  const categoryText = sp.category
    ? `${sp.category}${sp.category_2 ? ` > ${sp.category_2}` : ""}${sp.category_3 ? ` > ${sp.category_3}` : ""}`
    : null

  const canonicalCategoryPath = (() => {
    if (!sp.canonical_category_name) return null
    const parts: string[] = []
    if (sp.canonical_category_name_3) parts.push(sp.canonical_category_name_3)
    if (sp.canonical_category_name_2) parts.push(sp.canonical_category_name_2)
    parts.push(sp.canonical_category_name)
    return parts.join(" > ")
  })()

  const elevated = process.env.NODE_ENV === "development" || profile?.role === "admin"
  const isError = hasUpdateError || !sp.available

  return (
    <div className="flex h-full w-full flex-col rounded-lg bg-transparent">
      <div
        className={cn(
          "group relative mb-2 flex items-center justify-between gap-2 overflow-hidden rounded-md border",
          sp.image ? "border-border" : "border-transparent",
        )}
      >
        <Link href={generateProductPath(sp)} className="h-full w-full">
          {sp.image ? (
            <div className="relative aspect-7/8 w-full">
              <Image
                src={resolveImageUrlForCard(sp.image, 300)}
                alt={sp.name || "Product Image"}
                width={400}
                height={400}
                unoptimized
                className={cn(
                  "aspect-7/8 h-full w-full bg-white object-cover object-center transition duration-300",
                  sp.available ? "opacity-100" : "",
                )}
                placeholder="blur"
                blurDataURL={imagePlaceholder.productBlur}
                priority={imagePriority}
              />
            </div>
          ) : (
            <div className="aspect-7/8 w-full bg-zinc-100 dark:bg-zinc-800" />
          )}
        </Link>

        <div className="absolute top-1.5 left-1.5 flex flex-col items-start gap-1">
          {sp.price_per_major_unit && sp.major_unit ? (
            <Badge variant="price-per-unit" size="xs" roundedness="sm" className="w-fit lowercase">
              {sp.price_per_major_unit.toFixed(2)}€/
              {sp.major_unit.startsWith("/") ? sp.major_unit.slice(1) : sp.major_unit}
            </Badge>
          ) : null}
        </div>

        <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
          {isError ? (
            <Badge variant="destructive" size="sm" roundedness="sm">
              <TriangleAlertIcon />
            </Badge>
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
                    <TooltipContent side="right" align="start" sideOffset={6} alignOffset={-6}>
                      {sp.pack}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          )}
        </div>

        {user ? (
          <div className="absolute bottom-1.5 left-1.5 z-5 flex items-end gap-0 md:gap-1">
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

        <div className="absolute right-1.5 bottom-1.5 flex flex-col items-end">
          {favoritedAt && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    size="2xs"
                    variant="tertiary"
                    className="gap-1 opacity-100 transition-opacity duration-300 group-hover:opacity-0"
                  >
                    <CalendarPlusIcon className="h-3 w-3" />
                    {formatRelativeTime(new Date(favoritedAt), "short")}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left" align="end">
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
            <SupermarketChainBadge originId={sp?.origin_id} variant="logoSmall" />
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-start">
        <div className="flex w-full flex-col items-start">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                {sp.canonical_category_name ? (
                  <Badge
                    variant="glass-primary"
                    size="xs"
                    roundedness="sm"
                    className="text-2xs line-clamp-1 text-left"
                    onClick={() => {
                      if (sp.canonical_category_name) navigator.clipboard.writeText(sp.canonical_category_name)
                    }}
                  >
                    {sp.canonical_category_name}
                  </Badge>
                ) : (
                  <Badge
                    variant="boring"
                    size="xs"
                    roundedness="sm"
                    className="text-2xs line-clamp-1 text-left"
                    onClick={() => {
                      if (sp.category) navigator.clipboard.writeText(sp.category)
                    }}
                  >
                    {sp.category}
                  </Badge>
                )}
              </TooltipTrigger>

              <TooltipContent side="right" align="start" sideOffset={6} alignOffset={-6}>
                {canonicalCategoryPath ? (
                  <div className="flex flex-col gap-0">
                    <span className="block font-medium">Hierarchy</span>
                    <span className="font-semibold">{canonicalCategoryPath}</span>
                    {categoryText && (
                      <>
                        <span className="mt-4 mb-1 flex items-center gap-1 font-medium">
                          Original hierarchy in {supermarketBadge}
                        </span>
                        <span className="font-bold">{categoryText}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-0">
                    <span className="mb-0 flex items-center gap-1 font-medium">
                      Original hierarchy in {supermarketBadge}
                    </span>
                    <span className="font-bold">{categoryText || "No category available"}</span>
                  </div>
                )}
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
          <div className="items-ce flex flex-wrap justify-between gap-2">
            {hasDiscount && sp.discount ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm line-through">{sp.price_recommended}€</span>
                  <Badge
                    variant="destructive"
                    size="2xs"
                    roundedness="sm"
                    className="w-fit opacity-100 transition-opacity duration-300 group-hover:opacity-0"
                  >
                    -{discountValueToPercentage(sp.discount, DISCOUNT_DECIMAL_PLACES)}
                  </Badge>
                </div>
                <span className="text-lg font-bold text-green-600 dark:text-green-500">{sp.price.toFixed(2)}€</span>
              </div>
            ) : null}

            {isNormalPrice ? (
              <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">{sp.price}€</span>
            ) : null}

            {isPriceNotSet ? <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">--.--€</span> : null}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" className="bg-background">
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="min-w-48" align="end">
                {/* Actions in dropdown menu */}
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Button variant="dropdown-item" asChild>
                    <Link
                      href={sp.url || "#"}
                      target="_blank"
                      className="flex w-full items-center justify-between gap-1"
                    >
                      <span className="flex items-center gap-1">Open product page</span>
                      <ArrowUpRightIcon />
                    </Link>
                  </Button>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Button variant="dropdown-item" asChild>
                    <Link
                      href={sp.url || "#"}
                      target="_blank"
                      className="flex w-full items-center justify-between gap-1"
                    >
                      Open in {supermarketName}
                      <ExternalLinkIcon />
                    </Link>
                  </Button>
                </DropdownMenuItem>

                <ShareButton sp={sp} appearAs="dropdown-menu-item" />

                {user && (
                  <DropdownMenuItem variant="love" asChild>
                    <Button variant="dropdown-item" onClick={toggleFavorite} disabled={isFavoritePending}>
                      {isFavorited ? "Remove from favorites" : "Add to favorites"}
                      <HeartIcon />
                    </Button>
                  </DropdownMenuItem>
                )}

                {/* Compare page link if sp.barcode is available */}
                {sp.barcode && (
                  <DropdownMenuItem variant="hype" asChild>
                    <Button variant="dropdown-item" asChild>
                      <Link href={`/compare?barcode=${sp.barcode}`}>
                        <span className="mr-2">Compare in other stores</span>
                        <ScaleIcon />
                      </Link>
                    </Button>
                  </DropdownMenuItem>
                )}

                {/* Admin tools in dropdown menu */}
                {elevated && (
                  <DropdownMenuItem asChild>
                    <Button variant="dropdown-item" onClick={updateFromSource} disabled={isUpdating}>
                      <span className="flex items-center gap-1">
                        Update from {supermarketName}
                        <DevBadge />
                      </span>
                      <RefreshCcwIcon />
                    </Button>
                  </DropdownMenuItem>
                )}

                {elevated && (
                  <DropdownMenuItem asChild>
                    <Button variant="dropdown-item" onClick={promptAndSetPriority} disabled={isPriorityPending}>
                      <span className="flex items-center gap-1">
                        Set priority
                        <DevBadge />
                      </span>
                      <MicroscopeIcon />
                    </Button>
                  </DropdownMenuItem>
                )}

                {elevated && (
                  <DropdownMenuItem asChild>
                    <Button variant="dropdown-item" onClick={clearPriority} disabled={isPriorityPending}>
                      <span className="flex items-center gap-1">
                        Clear priority
                        <DevBadge />
                      </span>
                      <CircleIcon />
                    </Button>
                  </DropdownMenuItem>
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
                        <TooltipContent side="right" align="start" sideOffset={6} alignOffset={-6}>
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
                    <PriorityChip
                      priority={sp.priority}
                      size="xs"
                      variant="compact"
                      className="text-xs font-semibold"
                    />
                  )}
                </div>
              </div>

              <StoreProductCardDrawerChart sp={sp} />

              <Accordion
                type="single"
                collapsible
                className="mt-6 hidden w-full border-t md:flex"
                defaultValue="view-json-data"
              >
                <AccordionItem value="view-json-data" className="w-full border-0">
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
