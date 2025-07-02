"use client"

import axios from "axios"
import { useEffect, useState, useRef } from "react"
import { type StoreProduct } from "@/types"
import { FrontendStatus } from "@/types/extra"

import { searchTypes, type SortByType, type SearchType } from "@/types/extra"
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams"
import { cn, defaultCategories, existingCategories, getCenteredArray } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

import { StoreProductCard, ProductCardSkeleton } from "@/components/model/StoreProductCard"
import { Wrapper } from "@/components/SectionWrapper"

import {
  ArrowDownAZ,
  ArrowDownAZIcon,
  ArrowDownWideNarrowIcon,
  ArrowUpAZ,
  ArrowUpAZIcon,
  ArrowUpWideNarrowIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  CircleIcon,
  CircleOffIcon,
  DeleteIcon,
  EllipsisVerticalIcon,
  RefreshCcwIcon,
  SearchIcon,
} from "lucide-react"
import { useProducts } from "@/hooks/useProducts"
import { resolveSupermarketChain } from "./Supermarket"

type Props = {
  page?: number
  q?: string
  t?: SearchType
  sort?: SortByType
  essential?: boolean
  originId?: string | null
}

export function StoreProductsGrid(props: Props) {
  const {
    page: initPage = 1,
    q: initQuery = "",
    t: initSearchType = "any",
    sort: initSortBy = "a-z",
    essential = false,
    originId: initOriginId = null,
  } = props

  const limit = 30
  const [page, setPage] = useState(initPage)
  const [categorySelectorOpen, setCategorySelectorOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortByType>(initSortBy)
  const [originId, setOriginId] = useState<string | null>(initOriginId)
  const [searchType, setSearchType] = useState<SearchType>(initSearchType)
  const [query, setQuery] = useState(initQuery)
  const [paginationTotal, setPaginationTotal] = useState(50)
  const [pagedCount, setPagedCount] = useState(0)
  const [onlyDiscounted, setOnlyDiscounted] = useState(false)

  const [status, setStatus] = useState(FrontendStatus.Loading)
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([])
  const [categories, setCategories] = useState<Array<{ name: string; selected: boolean }>>(() => {
    const defaultCategorySet = defaultCategories.length > 0 ? new Set(defaultCategories) : new Set()
    const uniqueCategories = Array.from(new Set([...existingCategories, ...defaultCategories]))

    if (essential) {
      uniqueCategories.sort((a, b) => {
        const aIsDefault = defaultCategorySet.has(a)
        const bIsDefault = defaultCategorySet.has(b)
        if (aIsDefault && !bIsDefault) return -1
        if (!aIsDefault && bIsDefault) return 1
        return a.localeCompare(b)
      })
    }

    return uniqueCategories.map((name) => ({
      name,
      selected: essential ? defaultCategorySet.has(name) : false,
    }))
  })

  const [showNav, setShowNav] = useState(true)
  const lastScrollY = useRef(0)

  const selectedCount = categories.filter((cat) => cat.selected).length

  const toggleCategory = (categoryName: string) => {
    setCategories((prev) => prev.map((cat) => (cat.name === categoryName ? { ...cat, selected: !cat.selected } : cat)))
  }

  const selectAllCategories = () => {
    setCategories((prev) => prev.map((cat) => ({ ...cat, selected: true })))
  }

  const clearCategories = () => {
    setCategories((prev) => prev.map((cat) => ({ ...cat, selected: false })))
  }

  const selectDefaultCategories = () => {
    setCategories((prev) => prev.map((cat) => ({ ...cat, selected: defaultCategories.includes(cat.name) })))
  }

  const updateParams = useUpdateSearchParams()

  const isLoading = status === FrontendStatus.Loading

  async function fetchProducts() {
    setStatus(FrontendStatus.Loading)
    try {
      const { data } = await axios.get("/api/products/store", {
        params: {
          ...(query && { q: query }),
          page,
          limit,
          searchType,
          sort: sortBy,
          onlyDiscounted,
          ...(originId !== null ? { originId: originId.toString() } : {}),
          ...(query === ""
            ? {
                categories: categories
                  .filter((cat) => cat.selected)
                  .map((cat) => cat.name)
                  .join(";"),
              }
            : {}),
        },
      })
      setStoreProducts(data.data || [])
      setPagedCount(data.pagination.pagedCount || 0)
      setPaginationTotal(data.pagination.totalPages || 50)
    } catch (err) {
      setPage(1)
      setStatus(FrontendStatus.Error)
      console.error("Failed to fetch products:", err)
    } finally {
      setStatus(FrontendStatus.Loaded)
    }
  }

  async function updateProduct(sp: StoreProduct): Promise<boolean> {
    if (!sp || !sp.url) return false

    const response = await axios.post(`/api/products/store`, {
      storeProduct: sp,
    })
    const data = response.data
    const newProduct = data.data

    if (response.status === 200 && newProduct) {
      setStoreProducts((currentProducts) => currentProducts.map((p) => (p.url === sp.url ? newProduct : p)))
      return true
    } else {
      console.error("Failed to update product:", data)
      return false
    }
  }

  async function updateProductsInPage() {
    setStatus(FrontendStatus.Loading)

    try {
      for (const sp of storeProducts) {
        await axios.post(`/api/products/store`, {
          storeProduct: sp,
        })
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      await fetchProducts()
    } catch (err) {
      console.warn("Failed to update products:", err)
    } finally {
      setStatus(FrontendStatus.Loaded)
    }
  }

  function handleSubmit() {
    setPage(1)
    if (page === 1) fetchProducts()
  }

  function handleNextPage() {
    setPage((p) => p + 1)
  }

  function handlePrevPage() {
    setPage((p) => p - 1)
  }

  function handlePageChange(value: string) {
    setPage(parseInt(value))
  }

  function clearSearch() {
    setQuery("")
    setSearchType("any")
    page !== 1 ? setPage(1) : fetchProducts()
  }

  const handleScroll = () => {
    const currentScrollY = window.scrollY

    if (currentScrollY < 50) setShowNav(true)
    else if (currentScrollY > lastScrollY.current) setShowNav(false)
    else if (currentScrollY < lastScrollY.current) setShowNav(true)

    lastScrollY.current = currentScrollY
  }

  useEffect(() => {
    fetchProducts()
  }, [page, sortBy, onlyDiscounted, originId])

  useEffect(() => {
    updateParams({ page, q: query, t: searchType, sort: sortBy, essential: essential.toString(), originId })
  }, [page, query, searchType, sortBy, essential, originId])

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  if (status === FrontendStatus.Error) {
    return (
      <Wrapper status={FrontendStatus.Error}>
        <CircleOffIcon className="h-6 w-6" />
        <p>Error fetching products. Please try again.</p>
        <Button
          variant="default"
          onClick={() => {
            location.reload()
          }}
        >
          <span>Try again</span>
          <RefreshCcwIcon />
        </Button>
      </Wrapper>
    )
  }

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-3 p-4">
        <Skeleton className="h-10 w-full border border-border" />
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-3 w-48 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <div className="grid w-full grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-6 2xl:grid-cols-6">
          {Array.from({ length: limit }).map((_, index) => (
            <ProductCardSkeleton key={`product-skeleton-${index}`} />
          ))}
        </div>
      </div>
    )
  }

  if (storeProducts.length === 0 && status === FrontendStatus.Loaded) {
    return (
      <Wrapper>
        <CircleOffIcon className="h-8 w-8" />
        <div className="flex flex-col items-start justify-start">
          <p>No products found matching your search.</p>
          <p>Your search parameters:</p>

          <ul className="flex max-w-md list-disc flex-col pl-4 text-sm">
            {query !== "" && (
              <li>
                <strong>Query:</strong> "{query}"
              </li>
            )}
            <li>
              <strong>Search type:</strong> {searchType}
            </li>
            <li>
              <strong>Page:</strong> {page}
            </li>
            <li>
              <strong>Sort by:</strong> {sortBy}
            </li>
            {originId !== null && (
              <li>
                <strong>Store:</strong> {resolveSupermarketChain(parseInt(originId))?.name}
              </li>
            )}
            <li>
              <strong>Categories ({categories.filter((cat) => cat.selected).length})</strong>:{" "}
              <span className="text-muted-foreground">
                {categories
                  .filter((cat) => cat.selected)
                  .map((cat) => cat.name)
                  .join(", ") || "None"}
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-2 flex w-full items-center justify-center gap-2">
          <Button variant="outline">Return home</Button>
          <Button
            variant="default"
            onClick={() => {
              updateParams(null)
              location.reload()
            }}
          >
            <span>Clear search</span>
            <DeleteIcon />
          </Button>
        </div>
      </Wrapper>
    )
  }

  return (
    <div className="flex w-full flex-col gap-0">
      <nav
        className={cn(
          "sticky top-[54px] z-50 mx-auto flex w-full flex-col gap-0 border-b bg-white bg-opacity-95 px-4 py-3 backdrop-blur backdrop-filter transition-all duration-300 dark:bg-zinc-950 dark:bg-opacity-95",
          showNav ? "translate-y-0" : "top-0 -translate-y-full",
        )}
      >
        <div className="flex w-full flex-col items-end justify-between gap-2 md:gap-6 lg:flex-row lg:items-center">
          <div className="flex w-full max-w-lg flex-1 gap-2">
            <div className="relative w-full">
              <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-8"
                value={query}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") handleSubmit()
                }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value
                  if (typeof value === "string") setQuery(value)
                }}
              />
              <Select value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
                <SelectTrigger className="absolute right-2 top-1/2 flex h-4 w-auto -translate-y-1/2 items-center justify-center border-0 py-2 pl-1 pr-0 text-xs text-muted-foreground shadow-none transition hover:bg-black/5 dark:hover:bg-white/5">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Search by</SelectLabel>
                    {searchTypes.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuItem asChild>
                  <Button variant="dropdown-item" onClick={() => setOnlyDiscounted(!onlyDiscounted)}>
                    Only discounted
                    {onlyDiscounted ? <CheckIcon className="h-4 w-4" /> : <CircleIcon className="h-4 w-4" />}
                  </Button>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem variant="default" asChild>
                  <Button variant="dropdown-item" onClick={clearSearch}>
                    Clear search
                    <DeleteIcon />
                  </Button>
                </DropdownMenuItem>

                {process.env.NODE_ENV === "development" && (
                  <DropdownMenuItem variant="warning" asChild>
                    <Button variant="dropdown-item" onClick={updateProductsInPage} disabled={isLoading}>
                      Update products in page
                      <RefreshCcwIcon className={isLoading ? "animate-spin" : ""} />
                    </Button>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex w-full flex-wrap gap-2 md:w-auto">
            <div className="flex flex-1 gap-2">
              {/*  Categories Dialog */}

              {/*  Categories Selector */}
              <Popover open={categorySelectorOpen} onOpenChange={setCategorySelectorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categorySelectorOpen}
                    className="min-w-[150px] justify-between"
                  >
                    {selectedCount > 0 ? `Categories (${selectedCount})` : "Categories"}
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search category..." className="border-0 focus:ring-0" />
                    <CommandList>
                      <CommandEmpty>No categories found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-96">
                          <div className="mb-1 flex justify-start gap-1.5 border-b px-0.5 py-1.5">
                            <button
                              onClick={selectDefaultCategories}
                              className="flex rounded-md bg-gradient-to-r from-blue-600/40 to-indigo-500/40 px-1.5 py-0.5 text-xs text-primary-foreground text-white hover:opacity-80"
                            >
                              Select essential
                            </button>

                            <button
                              onClick={selectAllCategories}
                              className="flex rounded-md bg-muted px-1.5 py-0.5 text-xs text-primary hover:opacity-80"
                            >
                              Select all
                            </button>

                            <button
                              onClick={clearCategories}
                              className="flex rounded-md bg-muted px-1.5 py-0.5 text-xs text-primary hover:opacity-80"
                            >
                              Clear
                            </button>
                          </div>

                          {categories.map((category) => (
                            <CommandItem
                              key={category.name}
                              value={category.name}
                              onSelect={() => toggleCategory(category.name)}
                              className="flex items-center justify-between"
                            >
                              <span>{category.name}</span>
                              <div
                                className={cn(
                                  "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  category.selected ? "bg-primary text-primary-foreground" : "opacity-50",
                                )}
                              >
                                {category.selected && <CheckIcon className="h-3 w-3" />}
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Store Origin Filter */}
              <Select value={originId ?? "0"} onValueChange={(value) => setOriginId(value === "0" ? null : value)}>
                <SelectTrigger className="min-w-[120px] font-medium">
                  <SelectValue placeholder="Store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Store</SelectLabel>
                    <SelectItem value="0">All stores</SelectItem>
                    <SelectItem value="1">Continente</SelectItem>
                    <SelectItem value="2">Auchan</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* Sort Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start lg:w-[120px]">
                    {sortBy === "a-z" && <ArrowDownAZIcon className="mr-2 h-4 w-4" />}
                    {sortBy === "z-a" && <ArrowUpAZIcon className="mr-2 h-4 w-4" />}
                    {sortBy === "price-low-high" && <ArrowUpWideNarrowIcon className="mr-2 h-4 w-4" />}
                    {sortBy === "price-high-low" && <ArrowDownWideNarrowIcon className="mr-2 h-4 w-4" />}
                    {sortBy === "only-nulls" && <CircleOffIcon className="mr-2 h-4 w-4" />}
                    Sort by
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("a-z")}>
                    <ArrowDownAZ className="mr-2 h-4 w-4" />
                    Name A-Z
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("z-a")}>
                    <ArrowUpAZ className="mr-2 h-4 w-4" />
                    Name Z-A
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-high-low")}>
                    <ArrowUpWideNarrowIcon className="mr-2 h-4 w-4" />
                    Price: High to Low
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-low-high")}>
                    <ArrowDownWideNarrowIcon className="mr-2 h-4 w-4" />
                    Price: Low to High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("only-nulls")}>
                    <CircleOffIcon className="mr-2 h-4 w-4" />
                    Invalid products
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="isolate flex flex-1 -space-x-px">
              <Button
                variant="outline"
                className="rounded-r-none focus:z-10"
                onClick={handlePrevPage}
                disabled={page === 1}
              >
                Prev
              </Button>

              <Select value={page.toString()} onValueChange={handlePageChange}>
                <SelectTrigger className="w-auto justify-center rounded-none font-medium lg:w-full">
                  <SelectValue placeholder={page} />
                </SelectTrigger>
                <SelectContent>
                  {getCenteredArray(Math.min(paginationTotal, 50), page, paginationTotal ? paginationTotal : null).map(
                    (num: number) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>

              <Button variant="outline" className="rounded-l-none focus:z-10" onClick={handleNextPage}>
                Next
              </Button>
            </div>

            <Button variant="default" disabled={isLoading} onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </div>

        <div className="mt-2 flex w-full flex-col items-end justify-end text-xs text-muted-foreground lg:mt-1 lg:flex-row lg:items-center lg:justify-between">
          <span className="order-2 lg:order-1">
            Showing <span className="font-semibold text-foreground">{page * limit - limit + 1}</span> to{" "}
            <span className="font-semibold text-foreground">{Math.min(page * limit, pagedCount)}</span> of{" "}
            <span className="font-semibold text-foreground">{pagedCount}</span> results
          </span>

          <span className="order-1 lg:order-2">
            Page <span className="font-semibold text-foreground">{page}</span> of{" "}
            <span className="font-semibold text-foreground">{paginationTotal}</span>
          </span>
        </div>
      </nav>

      <div className="grid w-full grid-cols-2 gap-8 border-b px-4 pb-16 pt-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-6 2xl:grid-cols-6">
        {storeProducts.map((product, productIdx) => (
          <StoreProductCard key={`product-${productIdx}`} sp={product} onUpdate={() => updateProduct(product)} />
        ))}
      </div>

      <div className="flex items-center justify-between p-4">
        <div className="flex w-full flex-col text-sm text-muted-foreground">
          <span>
            Showing <span className="font-semibold text-foreground">{page * limit - limit + 1}</span> to{" "}
            <span className="font-semibold text-foreground">{Math.min(page * limit, pagedCount)}</span> of{" "}
            <span className="font-semibold text-foreground">{pagedCount}</span> results
          </span>
        </div>

        <div className="isolate flex flex-1 -space-x-px">
          <Button
            variant="outline"
            className="rounded-r-none focus:z-10"
            onClick={handlePrevPage}
            disabled={page === 1}
          >
            Prev
          </Button>

          <Select value={page.toString()} onValueChange={handlePageChange}>
            <SelectTrigger className="w-auto justify-center rounded-none font-medium lg:w-full">
              <SelectValue placeholder={page} />
            </SelectTrigger>
            <SelectContent>
              {getCenteredArray(Math.min(paginationTotal, 50), page, paginationTotal ? paginationTotal : null).map(
                (num: number) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} of {paginationTotal}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <Button variant="outline" className="rounded-l-none focus:z-10" onClick={handleNextPage}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
