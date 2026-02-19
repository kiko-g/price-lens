"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { STORE_NAMES } from "@/types/business"
import { generateProductPath, popularProducts } from "@/lib/business/product"
import { useRecentSearches } from "@/hooks/useRecentSearches"
import { useLiveSearch } from "@/hooks/useLiveSearch"
import type { StoreProductWithMeta } from "@/hooks/useStoreProducts"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

import { SearchIcon, ClockIcon, XIcon, PackageIcon, ArrowRightIcon, LoaderIcon } from "lucide-react"

interface SearchContentProps {
  onClose: () => void
  autoFocus?: boolean
}

const MAX_LIVE_RESULTS = 7

export function SearchContent({ onClose, autoFocus = true }: SearchContentProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")

  const { searches: recentSearches, addSearch, removeSearch, hasSearches } = useRecentSearches()
  const { results, isLoading, isDebouncing, isEmpty } = useLiveSearch(query, { enabled: true, limit: MAX_LIVE_RESULTS })

  // auto-focus input when mounted
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // small delay to ensure drawer/dialog animation is complete
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  const handleSearch = (searchQuery: string): void => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return

    addSearch(trimmed)
    onClose()
    router.push(`/products?q=${encodeURIComponent(trimmed)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && query.trim()) {
      handleSearch(query)
    }
    if (e.key === "Escape") {
      onClose()
    }
  }

  const handleProductClick = (product: StoreProductWithMeta): void => {
    addSearch(query.trim())
    onClose()
    router.push(generateProductPath(product))
  }

  const handleClearQuery = (): void => {
    setQuery("")
    inputRef.current?.focus()
  }

  const showRecent = !query.trim() && hasSearches
  const showLiveResults = query.trim().length >= 3
  const showPopular = !query.trim() || query.trim().length < 3

  const filteredPopular = popularProducts.filter((p) => p.value.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* search input */}
      <div className="relative flex w-full items-center border-b px-3 py-2">
        <SearchIcon className="text-muted-foreground h-4 w-4 shrink-0" />
        <Input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          placeholder="What product are you looking for?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-10 flex-1 border-0 bg-transparent text-base shadow-none ring-0 focus-visible:ring-0 md:text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={handleClearQuery}
            className="text-muted-foreground hover:text-foreground ml-2 p-1"
            aria-label="Clear search"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
        {(isLoading || isDebouncing) && <LoaderIcon className="text-muted-foreground ml-2 h-4 w-4 animate-spin" />}
      </div>

      <ScrollArea className="w-full flex-1">
        <div className="max-w-full p-2">
          {/* search action */}
          {query.trim() && (
            <SearchItem
              icon={<SearchIcon className="h-4 w-4" />}
              label={`Search for "${query}"`}
              onClick={() => handleSearch(query)}
            />
          )}

          {/* recent searches */}
          {showRecent && (
            <SearchSection title="Recent Searches">
              {recentSearches.map((search) => (
                <SearchItem
                  key={search}
                  icon={<ClockIcon className="h-4 w-4" />}
                  label={search}
                  onClick={() => handleSearch(search)}
                  onRemove={() => removeSearch(search)}
                />
              ))}
            </SearchSection>
          )}

          {/* live results */}
          {showLiveResults && (
            <SearchSection title="Product Results">
              {isLoading ? (
                Array.from({ length: MAX_LIVE_RESULTS }).map((_, index) => <ProductSkeleton key={index} />)
              ) : results.length > 0 ? (
                results.map((product) => (
                  <ProductItem key={product.id} product={product} onClick={() => handleProductClick(product)} />
                ))
              ) : isEmpty ? (
                <p className="text-muted-foreground py-4 text-center text-sm">No products found</p>
              ) : null}
            </SearchSection>
          )}

          {/* popular products */}
          {showPopular && filteredPopular.length > 0 && (
            <SearchSection title="Popular Products">
              {filteredPopular.map((product) => (
                <SearchItem
                  key={product.value}
                  icon={<PackageIcon className="h-4 w-4" />}
                  label={product.label}
                  onClick={() => handleSearch(product.value)}
                />
              ))}
            </SearchSection>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// helper components

function SearchSection({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("mb-2", className)}>
      <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">{title}</p>
      {children}
    </div>
  )
}

interface SearchItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  onRemove?: () => void
}

function SearchItem({ icon, label, onClick, onRemove }: SearchItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
        "focus-visible:bg-accent focus-visible:outline-none",
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label={`Remove ${label} from recent searches`}
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      )}
      {!onRemove && <ArrowRightIcon className="text-muted-foreground h-3.5 w-3.5" />}
    </div>
  )
}

interface ProductItemProps {
  product: StoreProductWithMeta
  onClick: () => void
}

function ProductItem({ product, onClick }: ProductItemProps) {
  const price = product.price
  const pvpr = product.price_recommended ? product.price_recommended : null
  const hasDiscount = product.discount && product.discount > 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors",
        "focus-visible:bg-accent focus-visible:outline-none",
      )}
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name || "Product"}
            fill
            className="object-contain p-1"
            sizes="48px"
            unoptimized={product.image.includes("scene7")}
          />
        ) : (
          <PackageIcon className="text-muted-foreground h-6 w-6" />
        )}
      </div>
      <div className="w-0 flex-1 self-start">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {[product.origin_id ? STORE_NAMES[product.origin_id] : null, product.brand, product.pack]
            .filter(Boolean)
            .join(" • ")}
        </p>
      </div>

      <div className="flex shrink-0 flex-col">
        {hasDiscount ? (
          <>
            <p className="text-base font-semibold text-green-600 tabular-nums">{price.toFixed(2)}€</p>
            {pvpr && <p className="text-muted-foreground text-sm line-through">{pvpr.toFixed(2)}€</p>}
          </>
        ) : (
          <p className="text-base font-semibold tabular-nums">{price.toFixed(2)}€</p>
        )}
      </div>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
      <div className="w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-4 w-12 shrink-0" />
    </div>
  )
}
