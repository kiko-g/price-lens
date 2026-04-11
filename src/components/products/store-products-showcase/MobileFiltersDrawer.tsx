"use client"

import { useEffect, useRef, useState } from "react"
import { CanonicalCategory } from "@/types"
import { type SearchType, type SortByType } from "@/types/business"
import { PRODUCT_PRIORITY_LEVELS } from "@/lib/business/priority"
import { SORT_OPTIONS_GROUPS, ALL_SORT_LABELS } from "@/lib/business/filters"
import { cn } from "@/lib/utils"
import { getSupermarketChainName } from "@/components/products/SupermarketChainBadge"
import { toCategorySlug, parseCategoryId } from "./url-state"
import { useCanonicalCategories, useFlatCategories, type FlatCategory } from "./CategoryFilter"
import { PriceRangeFilter } from "./FilterControls"

import { useScrollDirection } from "@/hooks/useScrollDirection"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DevBadge } from "@/components/ui/combo/dev-badge"
import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"
import { PriorityBubble } from "@/components/products/PriorityBubble"
import { SearchContainer } from "@/components/layout/search"
import {
  BadgePercentIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  CrownIcon,
  FilterIcon,
  Loader2Icon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

// ============================================================================
// MobileNav
// ============================================================================

interface MobileNavProps {
  query: string
  isSearching: boolean
  loadedCount: number
  totalCount: number | null
  /** When totalCount is unknown (fast pagination), true means more pages may exist */
  hasMoreProducts: boolean
  activeFilterCount: number
  filterParts?: string[]
  onFilterPress: () => void
}

export function MobileNav({
  query,
  isSearching,
  loadedCount,
  totalCount,
  hasMoreProducts,
  activeFilterCount,
  filterParts,
  onFilterPress,
}: MobileNavProps) {
  const scrollDirection = useScrollDirection()
  const hidden = scrollDirection === "down"

  return (
    <div
      className={cn(
        "sticky top-(--header-height) z-50 grid transition-[grid-template-rows] duration-300 ease-in-out lg:hidden",
        hidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
      )}
    >
      <nav className="overflow-hidden">
        <div className="mx-auto flex w-full items-center gap-2 border-b bg-white/95 px-4 py-2.5 backdrop-blur backdrop-filter dark:bg-zinc-950/95">
          <SearchContainer initialQuery={query} registerKeyboardShortcut={false}>
            <button
              type="button"
              className="active:bg-accent flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5"
            >
              {isSearching ? (
                <Loader2Icon className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <SearchIcon className="text-muted-foreground h-4 w-4 shrink-0" />
              )}
              {query ? (
                <span className="text-foreground flex-1 truncate text-left text-sm">{query}</span>
              ) : filterParts && filterParts.length > 0 ? (
                <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                  {filterParts.map((part) => (
                    <span
                      key={part}
                      className="text-muted-foreground shrink-0 rounded border px-1.5 py-0.5 text-xs leading-none"
                    >
                      {part}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-muted-foreground flex-1 truncate text-left text-sm">Search products...</span>
              )}
              {loadedCount > 0 && (
                <span
                  className="text-muted-foreground shrink-0 text-xs tabular-nums"
                  title={
                    totalCount != null
                      ? `${loadedCount} of ${totalCount} products loaded`
                      : hasMoreProducts
                        ? `${loadedCount} products loaded, more available`
                        : `${loadedCount} products loaded`
                  }
                >
                  {totalCount != null
                    ? `${loadedCount}/${totalCount}`
                    : hasMoreProducts
                      ? `${loadedCount}+`
                      : String(loadedCount)}
                </span>
              )}
            </button>
          </SearchContainer>
          <button
            type="button"
            onClick={onFilterPress}
            className="active:bg-accent relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
          >
            <FilterIcon className="text-muted-foreground h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  )
}

// ============================================================================
// Shared sub-view header
// ============================================================================

function SubViewHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 pb-3">
      <button
        type="button"
        onClick={onBack}
        className="active:bg-accent -ml-1 flex h-8 w-8 items-center justify-center rounded-full"
        aria-label="Go back"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  )
}

// ============================================================================
// Summary row (used on the main filters view)
// ============================================================================

function FilterSummaryRow({
  label,
  value,
  onClick,
  isLast,
}: {
  label: string
  value: string
  onClick: () => void
  isLast?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex w-full items-center justify-between py-4", !isLast && "border-b")}
    >
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-muted-foreground text-xs">{value}</span>
      </div>
      <ChevronRightIcon className="text-muted-foreground h-4 w-4 shrink-0" />
    </button>
  )
}

// ============================================================================
// Helper: price range summary text
// ============================================================================

const PRICE_CHIPS = [
  { label: "Under 2€", min: "", max: "2" },
  { label: "2–5€", min: "2", max: "5" },
  { label: "5–10€", min: "5", max: "10" },
  { label: "10€+", min: "10", max: "" },
] as const

function priceRangeSummary(min: string, max: string): string {
  if (!min && !max) return "Any price"
  const chip = PRICE_CHIPS.find((c) => c.min === min && c.max === max)
  if (chip) return chip.label
  if (min && max) return `${min}€ – ${max}€`
  if (min) return `From ${min}€`
  return `Up to ${max}€`
}

// ============================================================================
// Helper: store origin summary text
// ============================================================================

function storeOriginSummary(selectedOrigins: number[]): string {
  if (selectedOrigins.length === 0) return "All stores"
  return selectedOrigins
    .map((id) => getSupermarketChainName(id))
    .filter(Boolean)
    .join(", ")
}

// ============================================================================
// MobileFiltersDrawer
// ============================================================================

type DrawerView = "filters" | "categories" | "sort" | "stores" | "price"

export interface MobileFiltersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeFilterCount: number
  localFilters: {
    searchType: SearchType
    sortBy: SortByType
    origin: string
    orderByPriority: boolean
    onlyAvailable: boolean
    onlyDiscounted: boolean
    priority: string
    source: string
    category: string
    priceMin: string
    priceMax: string
  }
  selectedOrigins: number[]
  selectedPriorities: number[]
  onOriginToggle: (origin: number) => void
  onClearOrigins: () => void
  onPriorityToggle: (level: number) => void
  onClearPriority: () => void
  onCategoryChange: (categorySlug: string) => void
  onSortChange: (sort: SortByType) => void
  onTogglePriorityOrder: () => void
  onToggleAvailable: () => void
  onToggleDiscounted: () => void
  onPriceRangeChange: (min: string, max: string) => void
}

export function MobileFiltersDrawer({
  open,
  onOpenChange,
  activeFilterCount,
  localFilters,
  selectedOrigins,
  selectedPriorities,
  onOriginToggle,
  onClearOrigins,
  onPriorityToggle,
  onClearPriority,
  onCategoryChange,
  onSortChange,
  onTogglePriorityOrder,
  onToggleAvailable,
  onToggleDiscounted,
  onPriceRangeChange,
}: MobileFiltersDrawerProps) {
  const [view, setView] = useState<DrawerView>("filters")
  const { categories } = useCanonicalCategories()
  const flatCategories = useFlatCategories(categories)
  const selectedCatId = parseCategoryId(localFilters.category)
  const selectedCat = flatCategories.find((c) => c.id === selectedCatId)

  useEffect(() => {
    if (!open) setView("filters")
  }, [open])

  const sortLabel = ALL_SORT_LABELS[localFilters.sortBy]?.label ?? "Most Relevant"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85svh] lg:hidden">
        {view === "categories" ? (
          <MobileCategoryPickerView
            categories={categories}
            flatCategories={flatCategories}
            selectedCategorySlug={localFilters.category}
            onSelect={(slug) => {
              onCategoryChange(slug)
              setView("filters")
            }}
            onBack={() => setView("filters")}
          />
        ) : view === "sort" ? (
          <MobileSortPickerView
            currentSort={localFilters.sortBy}
            onSelect={(sort) => {
              onSortChange(sort)
              setView("filters")
            }}
            onBack={() => setView("filters")}
          />
        ) : view === "stores" ? (
          <MobileStorePickerView
            selectedOrigins={selectedOrigins}
            onOriginToggle={onOriginToggle}
            onClearOrigins={onClearOrigins}
            onBack={() => setView("filters")}
          />
        ) : view === "price" ? (
          <MobilePriceRangeView
            priceMin={localFilters.priceMin}
            priceMax={localFilters.priceMax}
            onChange={onPriceRangeChange}
            onBack={() => setView("filters")}
          />
        ) : (
          <MainFiltersView
            sortLabel={sortLabel}
            categorySummary={selectedCat ? selectedCat.breadcrumb : "All categories"}
            storeSummary={storeOriginSummary(selectedOrigins)}
            priceSummary={priceRangeSummary(localFilters.priceMin, localFilters.priceMax)}
            activeFilterCount={activeFilterCount}
            localFilters={localFilters}
            selectedPriorities={selectedPriorities}
            onViewChange={setView}
            onTogglePriorityOrder={onTogglePriorityOrder}
            onToggleAvailable={onToggleAvailable}
            onToggleDiscounted={onToggleDiscounted}
            onPriorityToggle={onPriorityToggle}
            onClearPriority={onClearPriority}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}

// ============================================================================
// Main filters view (summary rows)
// ============================================================================

function MainFiltersView({
  sortLabel,
  categorySummary,
  storeSummary,
  priceSummary,
  activeFilterCount,
  localFilters,
  selectedPriorities,
  onViewChange,
  onTogglePriorityOrder,
  onToggleAvailable,
  onToggleDiscounted,
  onPriorityToggle,
  onClearPriority,
}: {
  sortLabel: string
  categorySummary: string
  storeSummary: string
  priceSummary: string
  activeFilterCount: number
  localFilters: MobileFiltersDrawerProps["localFilters"]
  selectedPriorities: number[]
  onViewChange: (view: DrawerView) => void
  onTogglePriorityOrder: () => void
  onToggleAvailable: () => void
  onToggleDiscounted: () => void
  onPriorityToggle: (level: number) => void
  onClearPriority: () => void
}) {
  const [insidersOpen, setInsidersOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2">
        <h2 className="text-lg font-semibold">Filters & Sort</h2>
        {activeFilterCount > 0 && (
          <span className="text-foreground bg-accent dark:bg-primary/20 rounded-full px-1.5 py-0.5 text-xs font-medium">
            {activeFilterCount} active
          </span>
        )}
      </div>
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto border-t px-4">
        <FilterSummaryRow label="Category" value={categorySummary} onClick={() => onViewChange("categories")} />
        <FilterSummaryRow label="Sort By" value={sortLabel} onClick={() => onViewChange("sort")} />
        <FilterSummaryRow label="Store" value={storeSummary} onClick={() => onViewChange("stores")} />
        <FilterSummaryRow
          label="Price Range"
          value={priceSummary}
          onClick={() => onViewChange("price")}
          isLast={process.env.NODE_ENV !== "development"}
        />

        {/* Insiders (dev only) */}
        {process.env.NODE_ENV === "development" && (
          <div>
            <button
              type="button"
              onClick={() => setInsidersOpen((v) => !v)}
              className="flex w-full items-center justify-between py-4"
            >
              <span className="flex items-center gap-1 text-sm font-semibold">
                Insiders
                <DevBadge />
              </span>
              <ChevronDownIcon
                className={cn("text-muted-foreground h-4 w-4 transition-transform", insidersOpen && "rotate-180")}
              />
            </button>
            {insidersOpen && (
              <div className="flex flex-col gap-3 pb-4">
                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Options</span>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mobile-order-by-priority"
                      checked={localFilters.orderByPriority}
                      onCheckedChange={onTogglePriorityOrder}
                    />
                    <Label
                      htmlFor="mobile-order-by-priority"
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <CrownIcon className="h-4 w-4" />
                      Order by priority
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mobile-only-available"
                      checked={localFilters.onlyAvailable}
                      onCheckedChange={onToggleAvailable}
                    />
                    <Label
                      htmlFor="mobile-only-available"
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <CircleCheckIcon className="h-4 w-4" />
                      Only available
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mobile-only-discounted"
                      checked={localFilters.onlyDiscounted}
                      onCheckedChange={onToggleDiscounted}
                    />
                    <Label
                      htmlFor="mobile-only-discounted"
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <BadgePercentIcon className="h-4 w-4" />
                      Only discounted
                    </Label>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Priority</span>
                    {selectedPriorities.length > 0 && (
                      <button onClick={onClearPriority} className="text-muted-foreground text-xs hover:underline">
                        Clear
                      </button>
                    )}
                  </div>
                  {PRODUCT_PRIORITY_LEVELS.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={`mobile-priority-${level}`}
                        checked={selectedPriorities.includes(level)}
                        onCheckedChange={() => onPriorityToggle(level)}
                      />
                      <Label
                        htmlFor={`mobile-priority-${level}`}
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <PriorityBubble priority={level} size="sm" useDescription />
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Sort Picker sub-view
// ============================================================================

function MobileSortPickerView({
  currentSort,
  onSelect,
  onBack,
}: {
  currentSort: SortByType
  onSelect: (sort: SortByType) => void
  onBack: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title="Sort By" onBack={onBack} />
      <div className="flex-1 overflow-y-auto overscroll-contain px-4">
        <RadioGroup value={currentSort} onValueChange={(v) => onSelect(v as SortByType)} className="gap-0">
          {SORT_OPTIONS_GROUPS.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && "border-border mt-2 border-t pt-2")}>
              <span className="text-muted-foreground mb-1.5 block text-[11px] font-medium tracking-wider uppercase">
                {group.label}
              </span>
              {group.options.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 transition-colors",
                    currentSort === option.value && "bg-accent dark:bg-primary/20",
                  )}
                >
                  <option.icon className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="flex-1 text-[15px]">{option.label}</span>
                  <RadioGroupItem value={option.value} className="shrink-0" />
                </label>
              ))}
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}

// ============================================================================
// Store Picker sub-view
// ============================================================================

const STORE_OPTIONS = [
  { id: 1, Logo: ContinenteSvg },
  { id: 2, Logo: AuchanSvg },
  { id: 3, Logo: PingoDoceSvg },
] as const

function MobileStorePickerView({
  selectedOrigins,
  onOriginToggle,
  onClearOrigins,
  onBack,
}: {
  selectedOrigins: number[]
  onOriginToggle: (origin: number) => void
  onClearOrigins: () => void
  onBack: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="active:bg-accent -ml-1 flex h-8 w-8 items-center justify-center rounded-full"
          aria-label="Go back"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-lg font-semibold">Store</h2>
        {selectedOrigins.length > 0 && (
          <button onClick={onClearOrigins} className="text-muted-foreground text-xs font-medium hover:underline">
            Clear
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4">
        {STORE_OPTIONS.map(({ id, Logo }) => {
          const checked = selectedOrigins.includes(id)
          return (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-3.5 transition-colors",
                checked ? "bg-accent dark:bg-primary/20" : "hover:bg-accent",
              )}
            >
              <Checkbox checked={checked} onCheckedChange={() => onOriginToggle(id)} />
              <Logo className="h-5 min-h-5 w-auto" />
            </label>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Price Range sub-view
// ============================================================================

function MobilePriceRangeView({
  priceMin,
  priceMax,
  onChange,
  onBack,
}: {
  priceMin: string
  priceMax: string
  onChange: (min: string, max: string) => void
  onBack: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title="Price Range" onBack={onBack} />
      <div className="flex-1 overflow-y-auto overscroll-contain px-4">
        <PriceRangeFilter priceMin={priceMin} priceMax={priceMax} onChange={onChange} />
      </div>
    </div>
  )
}

// ============================================================================
// Mobile Category Picker (full-screen drill-down)
// ============================================================================

function categoryContainsId(cat: CanonicalCategory, targetId: number): boolean {
  if (cat.id === targetId) return true
  return cat.children?.some((child) => categoryContainsId(child, targetId)) ?? false
}

function MobileCategoryPickerView({
  categories,
  flatCategories,
  selectedCategorySlug,
  onSelect,
  onBack,
}: {
  categories: CanonicalCategory[]
  flatCategories: FlatCategory[]
  selectedCategorySlug: string
  onSelect: (slug: string) => void
  onBack: () => void
}) {
  const [navStack, setNavStack] = useState<CanonicalCategory[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const listRef = useRef<HTMLDivElement>(null)

  const selectedId = parseCategoryId(selectedCategorySlug)
  const selectedCat = flatCategories.find((c) => c.id === selectedId)

  const currentParent = navStack[navStack.length - 1] ?? null
  const currentItems = currentParent?.children ?? categories
  const title = currentParent?.name ?? "Categories"

  const handleDrillDown = (cat: CanonicalCategory) => {
    setNavStack((prev) => [...prev, cat])
    listRef.current?.scrollTo({ top: 0 })
  }

  const handleGoBack = () => {
    if (navStack.length > 0) {
      setNavStack((prev) => prev.slice(0, -1))
      listRef.current?.scrollTo({ top: 0 })
    } else {
      onBack()
    }
  }

  const handleSelect = (cat: { id: number; name: string } | null) => {
    if (!cat) {
      onSelect("")
      return
    }
    const slug = toCategorySlug(cat.id, cat.name)
    onSelect(cat.id === selectedId ? "" : slug)
  }

  const isSearching = searchQuery.length > 1
  const searchResults = isSearching
    ? flatCategories.filter((c) => {
        const normalize = (s: string) =>
          s
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        return normalize(c.breadcrumb).includes(normalize(searchQuery))
      })
    : []

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={title} onBack={handleGoBack} />

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            inputMode="search"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Current selection banner */}
      {selectedCat && !isSearching && (
        <div className="bg-primary/10 dark:bg-primary/15 mx-4 mb-3 flex items-center justify-between rounded-lg px-3 py-2">
          <span className="text-xs">
            <span className="text-muted-foreground">Selected: </span>
            <span className="font-medium">{selectedCat.breadcrumb}</span>
          </span>
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="text-muted-foreground ml-2 text-xs font-medium hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Category list */}
      <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain">
        {isSearching ? (
          searchResults.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">No categories found.</p>
          ) : (
            searchResults.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id === selectedId ? "" : cat.slug)}
                className={cn(
                  "active:bg-accent flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                  cat.id === selectedId && "bg-accent/50",
                )}
              >
                <CircleCheckIcon
                  className={cn("h-4 w-4 shrink-0", cat.id === selectedId ? "text-primary" : "text-transparent")}
                />
                <span className="flex-1 text-[15px]">
                  {cat.level === 1 ? (
                    <span className="font-medium">{cat.name}</span>
                  ) : (
                    <span>
                      <span className="text-muted-foreground text-xs">
                        {cat.breadcrumb.split(" > ").slice(0, -1).join(" > ")} &gt;{" "}
                      </span>
                      <span className="font-medium">{cat.name}</span>
                    </span>
                  )}
                </span>
              </button>
            ))
          )
        ) : (
          <>
            {/* Root: "All categories" / Drilled: "All in [parent]" */}
            <button
              type="button"
              onClick={() => handleSelect(currentParent)}
              className={cn(
                "active:bg-accent flex w-full items-center gap-3 border-b px-4 py-3.5 text-left transition-colors",
                (!selectedId && !currentParent) || (currentParent && currentParent.id === selectedId)
                  ? "bg-accent/50"
                  : "",
              )}
            >
              <CircleCheckIcon
                className={cn(
                  "h-4 w-4 shrink-0",
                  (!selectedId && !currentParent) || (currentParent && currentParent.id === selectedId)
                    ? "text-primary"
                    : "text-transparent",
                )}
              />
              <span className="flex-1 text-[15px] font-medium">
                {currentParent ? `All in ${currentParent.name}` : "All categories"}
              </span>
            </button>

            {currentItems.map((cat) => {
              const hasChildren = (cat.children?.length ?? 0) > 0
              const containsSelected = selectedId ? categoryContainsId(cat, selectedId) : false
              const isExactMatch = cat.id === selectedId

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => (hasChildren ? handleDrillDown(cat) : handleSelect(cat))}
                  className={cn(
                    "active:bg-accent flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                    isExactMatch && "bg-accent/50",
                  )}
                >
                  {isExactMatch ? (
                    <CircleCheckIcon className="text-primary h-4 w-4 shrink-0" />
                  ) : containsSelected ? (
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                      <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 shrink-0" />
                  )}
                  <span className="flex-1 text-[15px]">{cat.name}</span>
                  {hasChildren && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <span className="text-xs">{cat.children!.length}</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </span>
                  )}
                </button>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
