"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { discountValueToPercentage } from "@/lib/business/product"
import { formatHoursDuration, PRIORITY_CONFIG, PRIORITY_REFRESH_HOURS } from "@/lib/business/priority"

import type { StoreProduct } from "@/types"
import { RANGES, DateRange } from "@/types/business"
import { useUser } from "@/hooks/useUser"
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle"
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams"
import { useUpdateStoreProduct, useUpdateStoreProductPriority } from "@/hooks/useProducts"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DevBadge } from "@/components/ui/combo/dev-badge"
import { Barcode } from "@/components/ui/combo/barcode"
import { Button } from "@/components/ui/button"
import { ShareButton } from "@/components/ui/combo/share-button"
import { CodeShowcase } from "@/components/ui/combo/code-showcase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { LoadingIcon } from "@/components/icons/LoadingIcon"
import { ProductChart } from "@/components/products/ProductChart"
import { SupermarketChainBadge, getSupermarketChainName } from "@/components/products/SupermarketChainBadge"
import { PriceFreshnessInfo } from "@/components/products/PriceFreshnessInfo"
import { RelatedStoreProducts } from "@/components/products/RelatedStoreProducts"
import { IdenticalStoreProducts } from "@/components/products/IdenticalStoreProducts"

import {
  HeartIcon,
  InfoIcon,
  NavigationOffIcon,
  EllipsisVerticalIcon,
  RefreshCcwIcon,
  MicroscopeIcon,
  CircleIcon,
  AlertTriangleIcon,
} from "lucide-react"

const DEFAULT_PARAMS = {
  range: "Max",
} as const

function resolveImageUrlForPage(image: string, size = 800) {
  const url = new URL(image)
  const p = url.searchParams
  const fieldsToDelete = ["sm", "w", "h", "sw", "sh"]
  fieldsToDelete.forEach((k) => p.delete(k))
  p.set("sw", String(size))
  p.set("sh", String(size))
  p.set("sm", "fit")
  p.set("fit", "crop")
  return url.toString()
}

function FavoriteButton({ storeProduct }: { storeProduct: StoreProduct }) {
  const { user } = useUser()
  const { toggleFavorite, isLoading } = useFavoriteToggle()
  const [isFavorited, setIsFavorited] = useState(storeProduct.is_favorited ?? false)

  const favoriteLoading = isLoading(storeProduct.id ?? 0)

  const handleToggleFavorite = async () => {
    if (!storeProduct.id) return

    const result = await toggleFavorite(storeProduct.id, isFavorited, storeProduct.name)
    if (result.success) {
      setIsFavorited(result.newState)
    }
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" disabled title="Log in to add favorites">
        <HeartIcon className="h-4 w-4" />
        Add to favorites
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleFavorite}
      disabled={favoriteLoading}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <HeartIcon
        className={cn(
          "h-4 w-4",
          isFavorited ? "fill-destructive stroke-destructive" : "stroke-foreground fill-none",
          favoriteLoading && "animate-pulse",
        )}
      />
      {isFavorited ? "Remove from favorites" : "Add to favorites"}
    </Button>
  )
}

export function StoreProductPage({ sp }: { sp: StoreProduct }) {
  const searchParams = useSearchParams()
  const updateParams = useUpdateSearchParams()
  const { profile } = useUser()
  const updateStoreProduct = useUpdateStoreProduct()
  const updatePriority = useUpdateStoreProductPriority()

  const parseRangeParam = (value: string | null): DateRange => {
    if (value && RANGES.includes(value as DateRange)) return value as DateRange
    return DEFAULT_PARAMS.range
  }

  const handleRangeChange = (range: DateRange) => {
    updateParams({ range: range === DEFAULT_PARAMS.range ? null : range })
  }

  const refreshHours = sp.priority !== null ? PRIORITY_REFRESH_HOURS[sp.priority] : null
  const refreshLabel = refreshHours ? formatHoursDuration(refreshHours) : null
  const rangeFromUrl = parseRangeParam(searchParams.get("range"))
  const supermarketName = getSupermarketChainName(sp?.origin_id)
  const storeProductId = sp.id?.toString() || ""
  const isPriceNotSet = !sp.price_recommended && !sp.price
  const hasDiscount = sp.price_recommended && sp.price && sp.price_recommended !== sp.price
  const isPriceRecommendedNotSet = !sp.price_recommended && sp.price
  const isPriceEqualToRecommended = sp.price_recommended && sp.price && sp.price_recommended === sp.price
  const isNormalPrice = isPriceRecommendedNotSet || isPriceEqualToRecommended

  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)

  return (
    <div className="mx-auto mb-8 flex w-full max-w-7xl flex-col py-0 lg:py-4">
      <article className="grid w-full grid-cols-1 gap-3 md:grid-cols-20 md:gap-8">
        <aside className="col-span-1 flex items-start justify-end gap-4 md:col-span-6 md:flex-col md:items-center md:justify-center">
          {/* Product Image */}
          <div className="relative aspect-square w-full max-w-48 overflow-hidden rounded-lg border bg-white md:max-w-full">
            {sp.image ? (
              <Image
                fill
                src={resolveImageUrlForPage(sp.image, 800)}
                alt={sp.name}
                className={cn(
                  "max-h-full max-w-full object-contain object-center",
                  sp.available ? "opacity-100" : "cursor-not-allowed grayscale",
                )}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={true}
              />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}

            {!sp.available && (
              <div className="absolute top-3 left-3 z-10">
                <Badge variant="destructive" size="sm" roundedness="sm" className="w-fit">
                  <AlertTriangleIcon className="h-4 w-4" />
                  Not available
                </Badge>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            {/* Mobile */}
            <Button
              variant="outline"
              size="sm"
              roundedness="2xl"
              asChild
              className="w-fit md:hidden dark:bg-white dark:hover:bg-white/90"
            >
              <Link href={sp.url} target="_blank" rel="noreferrer noopener">
                <SupermarketChainBadge originId={sp?.origin_id} variant="logo" />
              </Link>
            </Button>
            <Barcode
              value={sp.barcode}
              height={20}
              width={1.3}
              showMissingValue
              className="inline-flex rounded-md border px-2 pt-2 pb-1.5 md:hidden"
            />

            {/* Desktop */}
            <Barcode
              value={sp.barcode}
              height={35}
              width={2}
              showMissingValue
              className="hidden md:mt-2 md:inline-flex"
            />
          </div>
        </aside>

        {/* Product Details */}
        <section className="col-span-1 flex flex-col gap-2 md:col-span-14">
          <div>
            {/* Category Badges */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {sp.canonical_category_name || sp.category || sp.category_2 || sp.category_3 ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="boring" size="xs" roundedness="sm" className="w-fit max-w-96">
                        {sp.canonical_category_name || sp.category || "No category"}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      sideOffset={6}
                      alignOffset={-6}
                      size="xs"
                      className="max-w-96"
                    >
                      <span className="mb-1 block text-xs font-medium">Category hierarchy in {supermarketName}:</span>
                      <span className="text-xs font-semibold">
                        {sp.category
                          ? `${sp.category}${sp.category_2 ? ` > ${sp.category_2}` : ""}${sp.category_3 ? ` > ${sp.category_3}` : ""}`
                          : "No category set available"}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>

            {/* Brand, Priority, Supermarket Chain Badges */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {sp.brand && (
                <Link href={`/products?q=${encodeURIComponent(sp.brand)}`} target="_blank">
                  <Badge variant="blue">{sp.brand}</Badge>
                </Link>
              )}

              {sp.priority !== null && sp.priority > 0 ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant={PRIORITY_CONFIG[sp.priority].badgeKind}>Priority {sp.priority}</Badge>
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
                      This product has priority {sp.priority} is checked every {refreshLabel}.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline-destructive">
                        <NavigationOffIcon className="h-4 w-4" />
                        {sp.priority === null ? "Not tracked" : `Priority ${sp.priority}`}
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
                      <p>
                        This product has{" "}
                        {sp.priority === null ? "no tracking priority" : `low tracking priority (${sp.priority}/5)`}.
                      </p>
                      <p className="mt-2 font-bold">Add to your favorites to increase tracking priority.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <Button
                variant="outline"
                size="sm"
                roundedness="2xl"
                asChild
                className="dark:bg-white dark:hover:bg-white/90"
              >
                <Link href={sp.url} target="_blank" rel="noreferrer noopener">
                  <SupermarketChainBadge originId={sp?.origin_id} variant="logo" />
                </Link>
              </Button>
            </div>

            {/* Product Name and Pack size */}
            <h1 className="line-clamp-3 max-w-160 text-2xl font-bold md:line-clamp-2">{sp.name}</h1>
            {sp.pack && <p className="text-muted-foreground line-clamp-3 text-sm md:text-base">{sp.pack}</p>}
          </div>

          {/* Pricing Basic Labels */}
          <div className="flex flex-row flex-wrap items-center gap-2 md:flex-col md:items-start md:justify-start">
            {/* Active Price and PVPR */}
            <div className="flex flex-wrap items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-xl font-bold text-green-700 dark:text-green-600">{sp.price}€</span>
                  <span className="text-muted-foreground text-base line-through">{sp.price_recommended}€</span>
                </>
              ) : null}

              {isNormalPrice ? (
                <span className="text-xl font-bold text-zinc-700 dark:text-zinc-200">{sp.price}€</span>
              ) : null}

              {isPriceNotSet ? <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">€€€€</span> : null}
            </div>

            {/* Price per unit and discount */}
            <div className="flex items-center gap-2">
              {sp.price_per_major_unit && sp.major_unit ? (
                <Badge variant="price-per-unit" size="xs" roundedness="sm" className="w-fit">
                  {sp.price_per_major_unit}€/{sp.major_unit.startsWith("/") ? sp.major_unit.slice(1) : sp.major_unit}
                </Badge>
              ) : null}

              {sp.discount ? (
                <Badge variant="destructive" size="xs" roundedness="sm" className="w-fit">
                  -{discountValueToPercentage(sp.discount)}
                </Badge>
              ) : null}

              <PriceFreshnessInfo updatedAt={sp.updated_at} priority={sp.priority} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FavoriteButton storeProduct={sp} />
            <ShareButton sp={sp} />
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
                      <Button variant="dropdown-item" className="hover:bg-accent flex items-center gap-2 px-2">
                        Store product details
                        <InfoIcon className="-ml-1 h-4 w-4" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="overflow-y-auto">
                      <DrawerHeader className="text-left">
                        <DrawerTitle>Details</DrawerTitle>
                        <DrawerDescription>Inspect store product data</DrawerDescription>
                      </DrawerHeader>

                      <div className="max-w-md px-4">
                        <CodeShowcase code={JSON.stringify(sp, null, 2)} language="json" />
                      </div>
                    </DrawerContent>
                  </Drawer>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Button
                    variant="dropdown-item"
                    className="hover:bg-accent flex items-center gap-2"
                    onClick={() => updateStoreProduct.mutate(sp)}
                    disabled={updateStoreProduct.isPending}
                  >
                    Update from origin ({supermarketName})
                    {updateStoreProduct.isPending ? <LoadingIcon /> : <RefreshCcwIcon className="h-4 w-4" />}
                  </Button>
                </DropdownMenuItem>

                {(process.env.NODE_ENV === "development" || profile?.role === "admin") && (
                  <>
                    <DropdownMenuSeparator className="[&:not(:has(+*))]:hidden" />
                    <DropdownMenuLabel className="flex items-center gap-2">
                      Admin tools <DevBadge />
                    </DropdownMenuLabel>

                    <DropdownMenuItem asChild>
                      <Button
                        variant="dropdown-item"
                        onClick={async () => {
                          if (!sp.id) {
                            toast.error("Invalid product", {
                              description: "Product ID is missing",
                            })
                            return
                          }

                          const priorityStr = window.prompt("Enter priority (0-5):", "5")
                          const priorityNum = priorityStr ? parseInt(priorityStr) : null
                          if (priorityNum === null || isNaN(priorityNum) || priorityNum < 0 || priorityNum > 5) {
                            toast.error("Invalid priority", {
                              description: "Priority must be a number between 0 and 5",
                            })
                            return
                          }

                          updatePriority.mutate({ storeProductId: sp.id, priority: priorityNum })
                        }}
                        disabled={updatePriority.isPending}
                      >
                        Set priority
                        <MicroscopeIcon />
                      </Button>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Button
                        variant="dropdown-item"
                        onClick={async () => {
                          if (!sp.id) {
                            toast.error("Invalid product", {
                              description: "Product ID is missing",
                            })
                            return
                          }

                          updatePriority.mutate({ storeProductId: sp.id, priority: null })
                        }}
                        disabled={updatePriority.isPending}
                      >
                        Clear priority
                        <CircleIcon />
                      </Button>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Price Chart Section - uses compound components for flexible layout */}
          <ProductChart.Root
            sp={sp}
            defaultRange={rangeFromUrl}
            onRangeChange={handleRangeChange}
            samplingMode="efficient"
            className="flex-1"
          >
            <ProductChart.Error />

            {/* Mobile: stacked | lg+: two columns */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
              {/* Left column: Price toggles + Price frequency table */}
              <div className="flex max-w-2xl flex-col gap-3">
                <ProductChart.PricesVariation />
                <ProductChart.PriceTable className="xl:max-h-80 xl:overflow-y-auto" />
              </div>

              {/* Right column: Range selector + Chart */}
              <div className="flex max-w-2xl flex-col gap-2 xl:rounded-lg xl:border xl:px-3 xl:pt-4 xl:pb-0">
                <ProductChart.RangeSelector className="xl:justify-start" />
                <ProductChart.Graph />
              </div>
            </div>
          </ProductChart.Root>
        </section>
      </article>

      <Separator className="mt-4 mb-6 bg-transparent" />
      <IdenticalStoreProducts id={storeProductId} limit={10} />
      <Separator className="my-8" />
      <RelatedStoreProducts id={storeProductId} limit={20} />
    </div>
  )
}
