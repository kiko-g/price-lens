"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import type { StoreProductWithMeta } from "@/lib/queries/store-products/types"
import { SupermarketChain, STORE_NAMES } from "@/types/business"

import { StoreProductCard } from "@/components/products/StoreProductCard"
import { ProductGridWrapper } from "@/components/products/ProductGridWrapper"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { ProductBatchMilestone } from "@/components/products/store-products-showcase/ProductBatchMilestone"
import { BottomPagination, PaginationControls } from "@/components/products/store-products-showcase/PaginationControls"
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
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { fetchDeals, useDeals } from "@/hooks/useDeals"
import { DEFAULT_DEALS_PAGE_LIMIT } from "@/lib/queries/deals-constants"

import { ChevronDownIcon, Loader2Icon, StoreIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const LIMIT = DEFAULT_DEALS_PAGE_LIMIT

/** Uniform height; width is `w-40` on desktop row, `w-full` in the mobile drawer. */
const STORE_CHIP_BASE =
  "inline-flex h-11 items-center gap-2.5 rounded-lg border px-3 text-left text-sm font-medium transition-colors"

const STORE_CHAIN_IDS = [SupermarketChain.Continente, SupermarketChain.Auchan, SupermarketChain.PingoDoce] as const

type StoreFilter = { id: "all" } | { id: string; originId: SupermarketChain; label: string }

const storeFilters: ReadonlyArray<StoreFilter> = [
  { id: "all" },
  {
    id: String(SupermarketChain.Continente),
    label: STORE_NAMES[SupermarketChain.Continente],
    originId: SupermarketChain.Continente,
  },
  {
    id: String(SupermarketChain.Auchan),
    label: STORE_NAMES[SupermarketChain.Auchan],
    originId: SupermarketChain.Auchan,
  },
  {
    id: String(SupermarketChain.PingoDoce),
    label: STORE_NAMES[SupermarketChain.PingoDoce],
    originId: SupermarketChain.PingoDoce,
  },
]

function parseOriginFromSearchParams(searchParams: URLSearchParams): number | undefined {
  const raw = searchParams.get("origin")?.trim()
  if (!raw) return undefined
  const n = parseInt(raw.split(",")[0] ?? "", 10)
  if (isNaN(n)) return undefined
  return STORE_CHAIN_IDS.includes(n as (typeof STORE_CHAIN_IDS)[number]) ? n : undefined
}

function parsePageFromSearchParams(searchParams: URLSearchParams): number {
  const raw = searchParams.get("page")
  const n = raw ? parseInt(raw, 10) : 1
  return isNaN(n) || n < 1 ? 1 : n
}

function applyDealsUrlUpdates(
  pathname: string,
  current: URLSearchParams,
  updates: { page?: number; origin?: number | null },
): string {
  const p = new URLSearchParams(current.toString())
  if (updates.page !== undefined) {
    if (updates.page <= 1) p.delete("page")
    else p.set("page", String(updates.page))
  }
  if (updates.origin !== undefined) {
    if (updates.origin == null) p.delete("origin")
    else p.set("origin", String(updates.origin))
  }
  const qs = p.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

function storeChipVisual(active: boolean, isChain: boolean, fullWidth?: boolean) {
  return cn(
    STORE_CHIP_BASE,
    fullWidth ? "w-full" : "w-40 shrink-0",
    active
      ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/25"
      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
    isChain && "pl-2.5",
  )
}

export function DealsShowcase() {
  const t = useTranslations("deals")
  const tPag = useTranslations("deals.pagination")
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const urlPage = useMemo(() => parsePageFromSearchParams(searchParams), [searchParams])
  const originId = useMemo(() => parseOriginFromSearchParams(searchParams), [searchParams])

  const selectedStoreId = originId != null ? String(originId) : "all"
  const selectedStoreLabel = useMemo(() => {
    if (selectedStoreId === "all") return t("filters.allStores")
    const n = parseInt(selectedStoreId, 10)
    return !isNaN(n) && STORE_NAMES[n] ? STORE_NAMES[n] : t("filters.allStores")
  }, [selectedStoreId, t])

  const [storeDrawerOpen, setStoreDrawerOpen] = useState(false)

  const queryPage = isDesktop ? urlPage : 1
  const {
    data: products,
    pagination,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDeals({
    page: queryPage,
    limit: LIMIT,
    origin: originId,
  })

  const [mobileExtraProducts, setMobileExtraProducts] = useState<StoreProductWithMeta[]>([])
  const [mobilePage, setMobilePage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [mobileHasMore, setMobileHasMore] = useState(true)
  const [showLoadingMoreUi, setShowLoadingMoreUi] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const filterIdentity = useMemo(() => JSON.stringify({ origin: originId ?? "all" }), [originId])
  const prevFilterIdentity = useRef(filterIdentity)
  useEffect(() => {
    if (prevFilterIdentity.current !== filterIdentity) {
      setMobileExtraProducts([])
      setMobilePage(1)
      setMobileHasMore(true)
      prevFilterIdentity.current = filterIdentity
    }
  }, [filterIdentity])

  useEffect(() => {
    if (pagination && mobilePage === 1) {
      setMobileHasMore(pagination.hasNextPage)
    }
  }, [pagination, mobilePage])

  useEffect(() => {
    if (!isLoadingMore) {
      setShowLoadingMoreUi(false)
      return
    }
    const timer = window.setTimeout(() => setShowLoadingMoreUi(true), 220)
    return () => window.clearTimeout(timer)
  }, [isLoadingMore])

  const displayProducts = isDesktop ? products : [...products, ...mobileExtraProducts]

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !mobileHasMore) return
    const nextPage = mobilePage + 1
    setIsLoadingMore(true)
    try {
      const result = await fetchDeals({ page: nextPage, limit: LIMIT, origin: originId })
      setMobileExtraProducts((prev) => [...prev, ...result.data])
      setMobilePage(nextPage)
      setMobileHasMore(result.pagination.hasNextPage)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, mobileHasMore, mobilePage, originId])

  useEffect(() => {
    if (isDesktop || !mobileHasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore && !isLoading) {
          handleLoadMore()
        }
      },
      { rootMargin: "300px" },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isDesktop, mobileHasMore, isLoadingMore, isLoading, handleLoadMore])

  const navigateUrl = useCallback(
    (updates: { page?: number; origin?: number | null }) => {
      const href = applyDealsUrlUpdates(pathname, searchParams, updates)
      router.replace(href, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const handlePageChange = (newPage: number) => {
    navigateUrl({ page: newPage })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleStoreSelect = (storeId: string) => {
    if (storeId === "all") {
      navigateUrl({ page: 1, origin: null })
    } else {
      const n = parseInt(storeId, 10)
      navigateUrl({ page: 1, origin: isNaN(n) ? null : n })
    }
    setStoreDrawerOpen(false)
  }

  const renderStoreChip = (filter: StoreFilter, opts?: { fullWidth?: boolean }) => {
    const label = "label" in filter ? filter.label : t("filters.allStores")
    const active = selectedStoreId === filter.id
    const isChain = "originId" in filter
    return (
      <button
        key={filter.id}
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={() => handleStoreSelect(filter.id)}
        className={storeChipVisual(active, isChain, opts?.fullWidth)}
      >
        {isChain ? (
          <>
            <span
              className="flex size-8 shrink-0 items-center justify-center self-center [&_img]:object-contain"
              aria-hidden
            >
              <SupermarketChainBadge originId={filter.originId} variant="logoSmall" />
            </span>
            <span className="min-w-0 flex-1 truncate leading-tight">{label}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate leading-tight">{label}</span>
        )}
      </button>
    )
  }

  const currentPage = urlPage
  const totalPages = pagination?.totalPages ?? null
  const hasNextPage = pagination?.hasNextPage ?? false
  const hasResults = displayProducts.length > 0
  const showingFrom = hasResults ? (currentPage - 1) * LIMIT + 1 : 0
  const showingTo = isDesktop ? (currentPage - 1) * LIMIT + products.length : displayProducts.length

  const showSkeletons = isLoading && displayProducts.length === 0
  const showOverlay = isFetching && products.length > 0 && !isLoading

  return (
    <div className="max-w-10xl mx-auto w-full px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{t("page.title")}</h1>
        <p className="text-muted-foreground text-sm lg:text-base">{t("page.subtitle")}</p>
      </div>

      {/* Desktop: uniform store chips */}
      <div className="mb-5 hidden flex-wrap gap-2 lg:flex">{storeFilters.map((f) => renderStoreChip(f))}</div>

      {/* Mobile: drawer */}
      <div className="mb-5 lg:hidden">
        <Drawer open={storeDrawerOpen} onOpenChange={setStoreDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-between gap-3 rounded-lg px-3 font-medium"
              aria-label={t("filters.mobileTriggerHint")}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                {originId != null ? (
                  <span className="flex size-8 shrink-0 items-center justify-center [&_img]:object-contain">
                    <SupermarketChainBadge originId={originId} variant="logoSmall" />
                  </span>
                ) : (
                  <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                    <StoreIcon className="size-4" aria-hidden />
                  </span>
                )}
                <span className="truncate">{selectedStoreLabel}</span>
              </span>
              <ChevronDownIcon className="text-muted-foreground size-4 shrink-0 opacity-70" aria-hidden />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>{t("filters.drawerTitle")}</DrawerTitle>
              <DrawerDescription>{t("filters.drawerDescription")}</DrawerDescription>
            </DrawerHeader>
            <div className="flex max-h-[min(60vh,28rem)] flex-col gap-2 overflow-y-auto px-4 pb-2">
              {storeFilters.map((f) => renderStoreChip(f, { fullWidth: true }))}
            </div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button type="button" variant="secondary" className="w-full">
                  {t("filters.drawerClose")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      {isError && (
        <div className="border-destructive/30 bg-destructive/5 mb-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-destructive text-sm font-medium">{t("error.message")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            {t("error.retry")}
          </Button>
        </div>
      )}

      {showSkeletons ? (
        <div className="text-muted-foreground flex flex-col gap-3 py-8 text-center text-sm">
          <Loader2Icon className="mx-auto size-8 animate-spin opacity-60" aria-hidden />
          <span>{t("states.loading")}</span>
        </div>
      ) : !isError && displayProducts.length === 0 ? (
        <EmptyDeals />
      ) : !isError ? (
        <>
          <div className="text-muted-foreground mb-4 hidden w-full items-center justify-between text-sm lg:flex">
            <span>{tPag("showingRange", { from: showingFrom, to: showingTo })}</span>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={hasNextPage}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              namespace="deals.pagination"
            />
          </div>

          <div className="relative">
            {showOverlay && (
              <div className="bg-background/50 absolute inset-0 z-10 flex items-start justify-center pt-16 backdrop-blur-[1px]">
                <Loader2Icon className="text-muted-foreground size-8 animate-spin" aria-hidden />
              </div>
            )}
            <ProductGridWrapper className={cn("w-full", showOverlay && "pointer-events-none opacity-60")}>
              {displayProducts.flatMap((product, idx) => {
                const nodes: ReactNode[] = [
                  <StoreProductCard key={product.id} sp={product} imagePriority={isDesktop ? idx < 20 : idx < 10} />,
                ]
                if (!isDesktop && (idx + 1) % LIMIT === 0 && idx + 1 < displayProducts.length) {
                  nodes.push(
                    <ProductBatchMilestone key={`batch-${idx + 1}`} loaded={idx + 1} namespace="deals.batch" />,
                  )
                }
                return nodes
              })}
            </ProductGridWrapper>
          </div>

          <div className="hidden lg:block">
            <BottomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              showingFrom={showingFrom}
              showingTo={showingTo}
              totalCount={null}
              hasNextPage={hasNextPage}
              onPageChange={handlePageChange}
              namespace="deals.pagination"
            />
          </div>

          <div className="my-6 flex flex-col items-center gap-3 lg:hidden">
            {mobileHasMore ? (
              <>
                <div ref={sentinelRef} className="h-px w-full" aria-hidden />
                {showLoadingMoreUi && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    <span className="text-xs">{t("states.loadingMore")}</span>
                  </div>
                )}
                <p className="text-muted-foreground text-center text-xs">
                  {t("mobile.scrollHint", { count: displayProducts.length })}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-center text-xs">{t("mobile.endOfList")}</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

function EmptyDeals() {
  const t = useTranslations("deals.empty")
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <StoreIcon className="text-muted-foreground mb-4 size-12 opacity-40" aria-hidden />
      <p className="text-muted-foreground max-w-md text-sm text-pretty">{t("all")}</p>
    </div>
  )
}
