"use client"

import axios from "axios"
import { useEffect, useState, useRef } from "react"
import { type SupermarketProduct } from "@/types"
import { FrontendStatus } from "@/types/extra"

import { searchTypes, type SortByType, type SearchType } from "@/types/extra"
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams"
import {
  cn,
  defaultCategories,
  defaultCategories3,
  existingCategories,
  existingCategories2,
  existingCategories3,
  getCenteredArray,
} from "@/lib/utils"

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

import { SupermarketProductCard, ProductCardSkeleton } from "@/components/model/SupermarketProductCard"
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

type Props = {
  page?: number
  q?: string
  t?: SearchType
  sort?: SortByType
  essential?: boolean
}

export function SupermarketProductsGrid(props: Props) {
  const {
    page: initPage = 1,
    q: initQuery = "",
    t: initSearchType = "name",
    sort: initSortBy = "price-low-high",
    essential = true,
  } = props

  const limit = 30
  const [page, setPage] = useState(initPage)
  const [categorySelectorOpen, setCategorySelectorOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortByType>(initSortBy)
  const [searchType, setSearchType] = useState<SearchType>(initSearchType)
  const [query, setQuery] = useState(initQuery)
  const [paginationTotal, setPaginationTotal] = useState(50)
  const [pagedCount, setPagedCount] = useState(0)
  const [onlyDiscounted, setOnlyDiscounted] = useState(false)

  const [status, setStatus] = useState(FrontendStatus.Loading)
  const [products, setProducts] = useState<SupermarketProduct[]>([])
  const [categories, setCategories] = useState<Array<{ name: string; selected: boolean }>>(() => {
    const defaultCategorySet = defaultCategories3.length > 0 ? new Set(defaultCategories3) : new Set()
    const uniqueCategories = Array.from(new Set([...existingCategories3, ...defaultCategories3]))
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
    setCategories((prev) => prev.map((cat) => ({ ...cat, selected: defaultCategories3.includes(cat.name) })))
  }

  const updateParams = useUpdateSearchParams()

  const isLoading = status === FrontendStatus.Loading

  async function fetchProducts() {
    setStatus(FrontendStatus.Loading)
    try {
      const { data } = await axios.get("/api/products/get", {
        params: {
          ...(query && { q: query }),
          page,
          limit,
          searchType,
          sort: sortBy,
          categories: categories
            .filter((cat) => cat.selected)
            .map((cat) => cat.name)
            .join(";"),
          onlyDiscounted,
        },
      })
      setProducts(data.data || [])
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

  async function updateProduct(sp: SupermarketProduct): Promise<boolean> {
    if (!sp || !sp.url) return false

    const response = await fetch(`/api/products/replace?url=${sp.url}`)
    const data = await response.json()

    if (response.status === 200) {
      setProducts(products.map((p) => (p.url === sp.url ? (data.product as SupermarketProduct) : p)))
      return true
    } else {
      console.error(data)
      return false
    }
  }

  async function updateProductsInPage() {
    setStatus(FrontendStatus.Loading)
    const urls = products.map((product) => product.url)

    try {
      for (const url of urls) {
        await fetch(`/api/products/replace?url=${url}`)
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
    setSearchType("name")
    page !== 1 ? setPage(1) : fetchProducts()
  }

  const handleScroll = () => {
    const currentScrollY = window.scrollY

    if (currentScrollY < 50) setShowNav(true)
    else if (currentScrollY > lastScrollY.current) {
      // Scrolling down
      setShowNav(false)
    } else if (currentScrollY < lastScrollY.current) {
      // Scrolling up
      setShowNav(true)
    }

    lastScrollY.current = currentScrollY
  }

  useEffect(() => {
    fetchProducts()
  }, [page, sortBy, onlyDiscounted])

  useEffect(() => {
    updateParams({ page, q: query, t: searchType, sort: sortBy, essential: essential.toString() })
  }, [page, query, searchType, sortBy, essential])

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
      <div className="flex w-full flex-col gap-4 p-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid w-full grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: limit }).map((_, index) => (
            <ProductCardSkeleton key={`product-skeleton-${index}`} />
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0 && status === FrontendStatus.Loaded) {
    return (
      <Wrapper>
        <CircleOffIcon className="h-8 w-8" />
        <p>No products found matching your search.</p>
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

        <ul className="flex max-w-md flex-col text-sm">
          <li>
            <strong>You searched for:</strong> "{query}"
          </li>
          <li>
            <strong>Search type:</strong> {searchType}
          </li>
          <li>
            <strong>Page:</strong> {page}
          </li>
          <li>
            <strong>Categories:</strong>{" "}
            {categories
              .filter((cat) => cat.selected)
              .map((cat) => cat.name)
              .join(", ") || "None"}
          </li>
          <li>
            <strong>Sort by:</strong> {sortBy}
          </li>
        </ul>
      </Wrapper>
    )
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <nav
        className={cn(
          "sticky top-[54px] z-50 mx-auto flex w-full flex-col gap-1 border-b bg-white bg-opacity-95 px-4 py-3 backdrop-blur backdrop-filter transition-all duration-300 dark:bg-zinc-950 dark:bg-opacity-95",
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

                <DropdownMenuItem variant="destructive" asChild>
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
              <Popover open={categorySelectorOpen} onOpenChange={setCategorySelectorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categorySelectorOpen}
                    className="min-w-[180px] justify-between"
                  >
                    {selectedCount > 0 ? `Categories (${selectedCount})` : "Select categories"}
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
                <SelectTrigger className="w-auto justify-center rounded-none lg:w-full">
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

        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagedCount)} of {pagedCount} results
          </span>

          <span>
            Page {page}/{paginationTotal}
          </span>
        </div>
      </nav>

      <div className="mb-16 grid w-full grid-cols-2 gap-8 px-4 pt-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 2xl:grid-cols-6">
        {products.map((product, productIdx) => (
          <SupermarketProductCard key={`product-${productIdx}`} sp={product} onUpdate={() => updateProduct(product)} />
        ))}
      </div>

      <div className="flex items-center justify-between p-4">
        <div className="flex w-full flex-col text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagedCount)} of {pagedCount} results
          </span>

          <span>
            Page {page}/{paginationTotal}
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
            <SelectTrigger className="w-auto justify-center rounded-none lg:w-full">
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
      </div>
    </div>
  )
}
