"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { discountValueToPercentage } from "@/lib/business/product"
import { formatHoursDuration, PRIORITY_CONFIG, PRIORITY_REFRESH_HOURS } from "@/lib/business/priority"

import type { StoreProduct } from "@/types"
import { RANGES, DateRange } from "@/types/business"
import { useUser } from "@/hooks/useUser"
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle"
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams"
import { useSetProductPriority } from "@/hooks/useSetProductPriority"
import { useUpdateStoreProduct } from "@/hooks/useProducts"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DevBadge } from "@/components/ui/combo/dev-badge"
import { Barcode } from "@/components/ui/combo/barcode"
import { Button } from "@/components/ui/button"
import { ShareButton } from "@/components/ui/combo/share-button"
import { CodeShowcase } from "@/components/ui/combo/code-showcase"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DrawerSheet } from "@/components/ui/combo/drawer-sheet"

import { LoadingIcon } from "@/components/icons/LoadingIcon"
import { ProductChart } from "@/components/products/ProductChart"
import { PriorityScore } from "@/components/products/PriorityScore"
import { SupermarketChainBadge, getSupermarketChainName } from "@/components/products/SupermarketChainBadge"
import { PriceFreshnessInfo } from "@/components/products/PriceFreshnessInfo"
import { RelatedStoreProducts } from "@/components/products/RelatedStoreProducts"
import { IdenticalProductsCompare } from "@/components/products/IdenticalProductsCompare"

import {
  HeartIcon,
  NavigationOffIcon,
  EllipsisVerticalIcon,
  RefreshCcwIcon,
  MicroscopeIcon,
  CircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  PickaxeIcon,
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
  const { promptAndSetPriority, clearPriority, isPending: isPriorityPending } = useSetProductPriority(sp.id)

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

  const supermarketBadge = (
    <span className="flex w-fit items-center justify-center rounded-full bg-white px-1.5 py-0.5">
      <SupermarketChainBadge originId={sp?.origin_id} variant="logoSmall" />
    </span>
  )

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

  return (
    <div className="mx-auto mb-8 flex w-full max-w-[1320px] flex-col py-0 lg:py-4">
      <article className="grid w-full grid-cols-1 gap-3 md:grid-cols-20 md:gap-8">
        <aside className="col-span-1 grid grid-cols-7 gap-3 md:col-span-6 md:flex md:flex-col md:items-center">
          {/* Product Image - takes 3/7 columns on mobile */}
          <div className="relative col-span-3 aspect-square w-full overflow-hidden rounded-lg border bg-white md:col-span-1 md:max-w-full">
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

          <div className="hidden md:mt-2 md:inline-flex md:w-full md:items-center md:justify-between md:gap-2">
            {/* Desktop Barcode */}
            <Barcode value={sp.barcode} height={35} width={2} showMissingValue />
            <PriorityScore priority={sp.priority} size="sm" showDescription />
          </div>

          {/* Mobile header info - takes 4/7 columns */}
          <div className="col-span-4 flex flex-col items-start gap-2 md:hidden">
            {/* Mobile: Category Badge */}
            <div className="flex flex-wrap items-center gap-2 md:hidden">
              {sp.canonical_category_name ? (
                <Badge
                  variant="glass-primary"
                  size="xs"
                  roundedness="sm"
                  className="w-fit max-w-96"
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
                  className="w-fit max-w-96"
                  onClick={() => {
                    if (sp.category) navigator.clipboard.writeText(sp.category)
                  }}
                >
                  {sp.category}
                </Badge>
              )}
            </div>

            {/* Mobile: Brand, Priority Badges and Barcode */}
            <div className="flex flex-col items-start gap-2 md:hidden">
              {sp.brand && (
                <Badge variant="blue" size="sm" roundedness="sm">
                  {sp.brand}
                </Badge>
              )}

              {sp.priority !== null && sp.priority > 0 ? (
                <Badge variant={PRIORITY_CONFIG[sp.priority].badgeKind} size="sm" roundedness="sm">
                  Priority {sp.priority}
                </Badge>
              ) : (
                <Badge variant="destructive" size="sm" roundedness="sm">
                  <NavigationOffIcon className="h-4 w-4" />
                  Untracked product
                </Badge>
              )}
            </div>

            <PriorityScore priority={0} size="sm" showDescription />

            <Button
              variant="outline"
              size="sm"
              roundedness="2xl"
              asChild
              className="mt-3 w-fit dark:bg-white dark:hover:bg-white/90"
            >
              {/* Link to store product page */}
              <Link href={sp.url} target="_blank" rel="noreferrer noopener">
                <SupermarketChainBadge originId={sp?.origin_id} variant="logo" />
              </Link>
            </Button>
          </div>
        </aside>

        {/* Product Details */}
        <section className="col-span-1 flex flex-col gap-2 md:col-span-14">
          <div>
            {/* Category Badges */}
            <div className="mb-2 hidden md:flex md:flex-wrap md:items-center md:gap-2">
              {sp.canonical_category_name || sp.category || sp.category_2 || sp.category_3 ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      {sp.canonical_category_name ? (
                        <Badge
                          variant="glass-primary"
                          size="xs"
                          roundedness="sm"
                          className="w-fit max-w-96"
                          onClick={() => {
                            if (sp.canonical_category_name) navigator.clipboard.writeText(sp.canonical_category_name)
                          }}
                        >
                          <InfoIcon className="h-4 w-4" />
                          {sp.canonical_category_name}
                        </Badge>
                      ) : (
                        <Badge
                          variant="boring"
                          size="xs"
                          roundedness="sm"
                          className="w-fit max-w-96"
                          onClick={() => {
                            if (sp.category) navigator.clipboard.writeText(sp.category)
                          }}
                        >
                          <InfoIcon className="h-4 w-4" />
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
              ) : null}
            </div>

            {/* Brand, Priority, Supermarket Chain Badges */}
            <div className="mb-0 hidden md:mb-2 md:flex md:flex-wrap md:items-center md:gap-2">
              {sp.brand && (
                <Link href={`/products?q=${encodeURIComponent(sp.brand)}`} target="_blank">
                  <Badge variant="blue">{sp.brand}</Badge>
                </Link>
              )}

              {sp.priority !== null && sp.priority > 0 ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant={PRIORITY_CONFIG[sp.priority].badgeKind}>
                        <PickaxeIcon />
                        <span>Priority {sp.priority}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start" sideOffset={6} alignOffset={-6}>
                      This product has priority {sp.priority} is checked every {refreshLabel}.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline-destructive">
                        <PickaxeIcon />
                        Untracked
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start" sideOffset={6} alignOffset={-6}>
                      <p className="font-semibold">Untracked (priority: {sp.priority})</p>
                      This product is not being tracked. Add it to your favorites to increase tracking priority.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <Link
                href={sp.url}
                target="_blank"
                rel="noreferrer noopener"
                className="border-border hidden rounded-full border px-2 py-0.5 md:inline-flex dark:border-transparent dark:bg-white dark:hover:bg-white/90"
              >
                <SupermarketChainBadge originId={sp?.origin_id} variant="logo" />
              </Link>
            </div>

            {/* Product Name and Pack size */}
            <div className="flex flex-col gap-0">
              <h1 className="line-clamp-3 max-w-160 text-xl leading-5 font-bold md:line-clamp-2 xl:text-2xl xl:leading-6">
                {sp.name}
              </h1>
              {sp.pack && <p className="text-muted-foreground line-clamp-3 text-sm md:text-base">{sp.pack}</p>}
            </div>
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

              {isPriceNotSet ? (
                <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">--.--€</span>
              ) : null}
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

          <div className="mb-1.5 flex flex-wrap items-center gap-2">
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
                  <DrawerSheet
                    title="Details"
                    description="Inspect store product data"
                    trigger={
                      <Button variant="dropdown-item" className="hover:bg-accent flex items-center gap-2 px-2">
                        Store product details
                        <InfoIcon className="-ml-1 h-4 w-4" />
                      </Button>
                    }
                  >
                    <div className="max-w-md">
                      <CodeShowcase code={JSON.stringify(sp, null, 2)} language="json" />
                    </div>
                  </DrawerSheet>
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
          </div>

          {/* Price Chart Section - uses compound components for flexible layout */}
          <ProductChart.Root
            sp={sp}
            defaultRange={rangeFromUrl}
            onRangeChange={handleRangeChange}
            samplingMode="efficient"
            className="flex-1"
          >
            <ProductChart.NotTracked />
            {sp.priority != null && sp.priority > 0 && (
              <>
                <ProductChart.NoData />
                <ProductChart.Error />

                <ProductChart.ChartContent>
                  {/* Mobile: stacked | lg+: two columns */}
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
                    {/* Left column: Price toggles + Price frequency table */}
                    <div className="order-2 -mt-8 flex max-w-2xl flex-col gap-3 xl:order-1 xl:mt-0">
                      <ProductChart.PricesVariation showFreshnessInfo={false} />
                      <ProductChart.PriceTable className="max-h-60 min-w-100 xl:max-h-75 xl:max-w-full" scrollable />
                    </div>

                    {/* Right column: Range selector + Chart */}
                    <div className="xl:dark:bg-foreground/2 xl:bg-foreground/2 order-1 flex h-fit max-w-xl flex-col gap-2 xl:order-2 xl:rounded-lg xl:px-2 xl:pt-3 xl:pb-0">
                      <ProductChart.RangeSelector className="xl:justify-start" />
                      <ProductChart.Graph />
                    </div>
                  </div>
                </ProductChart.ChartContent>
              </>
            )}
          </ProductChart.Root>
        </section>
      </article>

      <Separator className="mt-8 mb-4" />
      <IdenticalProductsCompare currentProduct={sp} />
      <Separator className="mt-8 mb-4" />
      <RelatedStoreProducts id={storeProductId} limit={20} />
    </div>
  )
}
